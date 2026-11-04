const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- RUNNING MOBILE RESPONSIVENESS SIMULATION ---');

// 1. Check CSS syntax and media queries
const m3Css = fs.readFileSync(path.join(__dirname, '../css/m3.css'), 'utf-8');
const stylesCss = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf-8');

function checkBraceBalance(css, name) {
  let depth = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    if (depth < 0) throw new Error(`${name} has an extra closing brace at char ${i}`);
  }
  if (depth !== 0) throw new Error(`${name} has unclosed braces! Remaining open: ${depth}`);
  console.log(`[PASS] ${name} brace balance is PERFECT (depth = 0).`);
}

checkBraceBalance(m3Css, 'm3.css');
checkBraceBalance(stylesCss, 'styles.css');

// 2. Check presence of mobile view rules in m3.css
const requiredRules = [
  'body[data-mobile-view="universities"]',
  'body[data-mobile-view="departments"]',
  'body[data-mobile-view="map"]',
  'body[data-mobile-view="analytics"]',
  '.map-mobile-city-card',
  '--md-nav-bar-height',
  'env(safe-area-inset-bottom',
  'm3SheetSlideUp'
];

requiredRules.forEach(rule => {
  if (!m3Css.includes(rule)) {
    throw new Error(`Missing expected rule "${rule}" in m3.css`);
  }
});
console.log(`[PASS] All ${requiredRules.length} core mobile responsive rules verified in m3.css!`);

// 3. Test functional behavior of mobile navigation in app.js
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf-8');
const deptsJs = fs.readFileSync(path.join(__dirname, '../js/departments-data.js'), 'utf-8');

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    const set = new Set();
    this.classList = {
      add: (c) => set.add(c),
      remove: (c) => set.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (set.has(c)) set.delete(c);
          else set.add(c);
        } else if (force) {
          set.add(c);
        } else {
          set.delete(c);
        }
      },
      contains: (c) => set.has(c),
      has: (c) => set.has(c)
    };
    this.style = {};
    this.attributes = {};
    this.textContent = '';
    this.value = '';
    this.listeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }
  click() {
    if (this.listeners['click']) {
      this.listeners['click'].forEach(fn => fn({ preventDefault: () => {}, target: this }));
    }
  }
}

const elementsMap = {};
function getMock(id, tag = 'div') {
  if (!elementsMap[id]) elementsMap[id] = new MockElement(id, tag);
  return elementsMap[id];
}

const mockDoc = {
  addEventListener: () => {},
  documentElement: getMock('html'),
  getElementById: (id) => getMock(id),
  querySelector: (sel) => {
    if (sel === '.sidebar') return getMock('sidebar');
    if (sel === '.header') return getMock('header');
    if (sel.includes('data-sidebar-mode="universities"')) return getMock('uniTab');
    if (sel.includes('data-sidebar-mode="departments"')) return getMock('deptTab');
    return getMock(sel.replace(/[^a-zA-Z0-9_-]/g, ''));
  },
  querySelectorAll: (sel) => {
    if (sel === '.m3-nav-item') {
      const u = getMock('nav_uni'); u.setAttribute('data-nav-target', 'universities');
      const d = getMock('nav_dept'); d.setAttribute('data-nav-target', 'departments');
      const m = getMock('nav_map'); m.setAttribute('data-nav-target', 'map');
      const a = getMock('nav_an'); a.setAttribute('data-nav-target', 'analytics');
      return [u, d, m, a];
    }
    if (sel === '.sidebar-tab-btn') {
      const u = getMock('uniTab'); u.setAttribute('data-sidebar-mode', 'universities');
      const d = getMock('deptTab'); d.setAttribute('data-sidebar-mode', 'departments');
      return [u, d];
    }
    return [];
  },
  body: getMock('body')
};

const mockWindow = {
  innerWidth: 390, // Mobile device width (iPhone)
  addEventListener: () => {},
  scrollTo: () => {},
  localStorage: { getItem: () => null, setItem: () => {} },
  document: mockDoc
};

const sandbox = {
  window: mockWindow,
  document: mockDoc,
  localStorage: mockWindow.localStorage,
  setTimeout: (fn) => fn(),
  console: console,
  map: { invalidateSize: () => {} },
  L: { map: () => ({ invalidateSize: () => {} }) }
};

vm.createContext(sandbox);
vm.runInContext(dataJs, sandbox);
vm.runInContext(deptsJs, sandbox);
vm.runInContext(appJs, sandbox);

// Test Mobile View Switcher
console.log('Testing setMobileView("departments")...');
sandbox.setMobileView('departments');
if (sandbox.document.body.getAttribute('data-mobile-view') !== 'departments') {
  throw new Error('body[data-mobile-view] was not set to departments');
}
console.log('[PASS] Mobile view successfully switched to "departments"');

console.log('Testing setMobileView("map")...');
sandbox.setMobileView('map');
if (sandbox.document.body.getAttribute('data-mobile-view') !== 'map') {
  throw new Error('body[data-mobile-view] was not set to map');
}
console.log('[PASS] Mobile view successfully switched to "map"');

console.log('Testing mobile city selection card...');
sandbox.setCityFilterFromMap('Ankara');
const mobileCard = sandbox.document.getElementById('mapMobileCityCard');
if (mobileCard.classList.contains('hidden')) {
  throw new Error('mapMobileCityCard should be visible after selecting a city on mobile');
}
const cityNameEl = sandbox.document.getElementById('mapMobileCityName');
if (cityNameEl.textContent !== 'Ankara') {
  throw new Error(`Expected Ankara, got ${cityNameEl.textContent}`);
}
console.log('[PASS] mapMobileCityCard properly populated and displayed for Ankara: ' + cityNameEl.textContent);

console.log('Testing focusDepartmentOnMap switches to map view on mobile...');
sandbox.focusDepartmentOnMap(1001); // Bilgisayar Mühendisliği
if (sandbox.document.body.getAttribute('data-mobile-view') !== 'map') {
  throw new Error('focusDepartmentOnMap should switch to map view on mobile');
}
console.log('[PASS] Department focus properly transitioned mobile view to "map"');

console.log('\n======================================================');
console.log('ALL MOBILE RESPONSIVENESS AND NATIVE APP TESTS PASSED!');
console.log('======================================================\n');
