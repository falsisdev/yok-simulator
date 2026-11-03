const fs = require('fs');
const vm = require('vm');

console.log('--- RUNNING FUNCTIONAL VERIFICATION OF FACULTY SIMULATION ---');

// Mock browser environment
const domElements = new Map();
function makeMockElement(id) {
  return {
    id,
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    textContent: '',
    innerHTML: '',
    value: '',
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null
  };
}

const mockDocument = {
  getElementById: (id) => {
    if (!domElements.has(id)) {
      domElements.set(id, makeMockElement(id));
    }
    return domElements.get(id);
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (tag) => makeMockElement(tag),
  createDocumentFragment: () => ({ appendChild: () => {} }),
  documentElement: { setAttribute: () => {} },
  addEventListener: () => {}
};

const localStorageStore = new Map();
const mockLocalStorage = {
  getItem: (k) => localStorageStore.get(k) || null,
  setItem: (k, v) => localStorageStore.set(k, String(v)),
  removeItem: (k) => localStorageStore.delete(k),
  clear: () => localStorageStore.clear()
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  fetch: () => {},
  Date,
  updateMap: () => {},
  initMap: () => {},
  showToast: () => {},
  renderSidebarList: () => {},
  renderCharts: () => {}
};
sandbox.window = sandbox;

// Load files
const dataCode = fs.readFileSync('js/data.js', 'utf8');
const deptDataCode = fs.readFileSync('js/departments-data.js', 'utf8');
const appCode = fs.readFileSync('js/app.js', 'utf8');

const ctx = vm.createContext(sandbox);

vm.runInContext(dataCode, ctx);
vm.runInContext(deptDataCode, ctx);
vm.runInContext(appCode, ctx);

function run(code) {
  return vm.runInContext(code, ctx);
}

// Initialize state
run('loadUniversitiesAndDepartmentsState()');

const unis = run('universities');
const catalog = run('departmentCatalog');
console.log(`Loaded universities: ${unis.length}`);
console.log(`Loaded catalog departments: ${catalog.length}`);

// Test 1: Find YTU
const ytu = unis.find(u => u.name.includes('Yıldız'));
if (!ytu) throw new Error('YTU not found in universities list');
console.log(`[PASS] Found YTU: id=${ytu.id}, name=${ytu.name}`);

// Test 2: YTU Faculties
const ytuFacs = run(`getUniFaculties(${ytu.id})`);
console.log(`[PASS] YTU total faculties: ${ytuFacs.length}`);
const kmFac = ytuFacs.find(f => f.name.includes('Kimya-Metalurji'));
const eeFac = ytuFacs.find(f => f.name.includes('Elektrik-Elektronik'));
if (!kmFac || !eeFac) throw new Error('Kimya-Metalurji or Elektrik-Elektronik faculty missing in YTU');
console.log(`[PASS] Found Kimya-Metalurji (${kmFac.id}) and Elektrik-Elektronik (${eeFac.id}) in YTU`);

// Test 3: Check departments initially in Kimya-Metalurji
const depts = run(`getUniDepartmentList(${ytu.id})`);
const kmDepts = depts.filter(d => d.effectiveFacultyId === kmFac.id);
console.log(`[PASS] Departments in YTU Kimya-Metalurji: ${kmDepts.map(d => d.name).join(', ')}`);
const metalurji = kmDepts.find(d => d.name.includes('Metalurji'));
if (!metalurji) throw new Error('Metalurji ve Malzeme Mühendisliği missing in Kimya-Metalurji');

// Test 4: Transfer department (Metalurji from Kimya-Metalurji to Elektrik-Elektronik)
console.log(`Transferring "${metalurji.name}" (${metalurji.id}) to Elektrik-Elektronik...`);
run(`transferDeptToFaculty(${ytu.id}, ${metalurji.id}, '${eeFac.id}')`);

const metalurjiStateAfterTransfer = run(`getDepartmentStateInUni(${ytu.id}, ${metalurji.id})`);
if (metalurjiStateAfterTransfer.effectiveFacultyId !== eeFac.id) {
  throw new Error(`Transfer failed: effective faculty is ${metalurjiStateAfterTransfer.effectiveFacultyId}, expected ${eeFac.id}`);
}
console.log(`[PASS] Department successfully transferred to Elektrik-Elektronik!`);

// Test 5: Cascade Closing
// Now close Kimya-Metalurji Faculty!
console.log(`Closing Kimya-Metalurji Faculty in YTU...`);
run(`toggleFacultyStatus(${ytu.id}, '${kmFac.id}', false)`); // force close

// Departments remaining in Kimya-Metalurji should now be cascade-closed
const biyo = kmDepts.find(d => d.name.includes('Biyomühendislik'));
const biyoState = run(`getDepartmentStateInUni(${ytu.id}, ${biyo.id})`);
if (biyoState.isActive) {
  throw new Error(`Cascade close failed: Biyomühendislik should be inactive when Kimya-Metalurji is closed!`);
}
if (!biyoState.isCascadeClosed) {
  throw new Error(`Biyomühendislik isCascadeClosed should be true!`);
}
console.log(`[PASS] Biyomühendislik is cascade-closed as expected.`);

// The transferred department (Metalurji in Elektrik-Elektronik) MUST REMAIN ACTIVE!
const metalurjiStateAfterFacClose = run(`getDepartmentStateInUni(${ytu.id}, ${metalurji.id})`);
if (!metalurjiStateAfterFacClose.isActive) {
  throw new Error(`Transferred department became inactive, but its new faculty (Elektrik-Elektronik) is still active!`);
}
console.log(`[PASS] Transferred Metalurji department remained ACTIVE in Elektrik-Elektronik while Kimya-Metalurji is closed!`);

// Test 6: Re-opening Kimya-Metalurji restores its departments
console.log(`Re-opening Kimya-Metalurji Faculty...`);
run(`toggleFacultyStatus(${ytu.id}, '${kmFac.id}', true)`); // force open
const biyoStateAfterReopen = run(`getDepartmentStateInUni(${ytu.id}, ${biyo.id})`);
if (!biyoStateAfterReopen.isActive) {
  throw new Error(`Biyomühendislik did not restore when faculty reopened!`);
}
console.log(`[PASS] Biyomühendislik restored to ACTIVE upon faculty reopen.`);

// Test 7: Custom Faculty Creation
console.log(`Testing custom faculty creation in YTU...`);
run(`
  newFacultyNameInput.value = 'Kuantum ve İleri Teknolojiler Fakültesi';
  newFacultyTypeSelect.value = 'Fakülte';
  handleCreateCustomFaculty(${ytu.id});
`);

const ytuFacsAfterCustom = run(`getUniFaculties(${ytu.id})`);
const customFac = ytuFacsAfterCustom.find(f => f.name.includes('Kuantum'));
if (!customFac || !customFac.isCustom) throw new Error('Custom faculty creation failed');
console.log(`[PASS] Created custom faculty: ${customFac.name} (${customFac.id})`);

// Transfer department to the custom faculty
run(`transferDeptToFaculty(${ytu.id}, ${metalurji.id}, '${customFac.id}')`);
const metalurjiInCustom = run(`getDepartmentStateInUni(${ytu.id}, ${metalurji.id})`);
if (metalurjiInCustom.effectiveFacultyId !== customFac.id) throw new Error('Transfer to custom faculty failed');
console.log(`[PASS] Transferred department into newly created custom faculty.`);

// Test 8: State persistence & reload
run('saveUniversitiesState()');
const savedRaw = localStorageStore.get('ideal_uni_dept_faculty_state_v1');
if (!savedRaw) throw new Error('ideal_uni_dept_faculty_state_v1 missing in localStorage');
console.log(`[PASS] State saved to localStorage. Size: ${savedRaw.length} bytes.`);

// Reload state and verify custom faculty and override are preserved
run('loadUniversitiesAndDepartmentsState()');
const reloadedMetalurji = run(`getDepartmentStateInUni(${ytu.id}, ${metalurji.id})`);
if (reloadedMetalurji.effectiveFacultyId !== customFac.id) {
  throw new Error('Override lost after state reload');
}
console.log(`[PASS] State perfectly restored after reload!`);

// Test 9: Macro Reform Scenarios
console.log(`Testing macro scenario: tech_faculties_pure...`);
run(`applyNationalDepartmentScenario('tech_faculties_pure')`);
const ytuFacsAfterPure = run(`getUniFaculties(${ytu.id})`);
const iibfFac = ytuFacsAfterPure.find(f => f.name.includes('İktisadi ve İdari'));
if (iibfFac && run(`isFacultyActive(${ytu.id}, '${iibfFac.id}')`)) {
  throw new Error('İİBF should be disabled in YTU after tech_faculties_pure');
}
console.log(`[PASS] Macro scenario "tech_faculties_pure" disabled non-tech faculties in technical universities.`);

console.log(`Testing macro scenario: reset_all_faculties...`);
run(`applyNationalDepartmentScenario('reset_all_faculties')`);
const iibfAfterReset = ytuFacsAfterPure.find(f => f.name.includes('İktisadi ve İdari'));
if (iibfAfterReset && !run(`isFacultyActive(${ytu.id}, '${iibfAfterReset.id}')`)) {
  throw new Error('İİBF should be active again after reset_all_faculties');
}
console.log(`[PASS] "reset_all_faculties" successfully restored all faculties to YÖK defaults.`);

console.log('\n======================================================');
console.log('ALL FUNCTIONAL SIMULATION TESTS PASSED WITH 100% SUCCESS!');
console.log('======================================================\n');
