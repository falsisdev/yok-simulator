// State Management
let universities = [];
let departmentCatalog = [];
let departmentByIdMap = new Map();
let baseUniDeptsMap = new Map();   // uniId (number) -> Set(deptId)
let closedDeptsByUni = new Map();  // uniId (number) -> Set(deptId)
let addedDeptsByUni = new Map();   // uniId (number) -> Set(deptId)
let customDepartments = [];        // Array of { id, name, scoreType, degree, category, isCustom: true }

// Faculty State Management
let baseUniFacultiesMap = new Map();       // uniId -> Array<{ id, name, type }>
let baseUniDeptToFacultyMap = new Map();   // uniId -> Map(deptId -> facId)
let disabledFacultiesByUni = new Map();    // uniId -> Set(facId)
let deptFacultyOverridesByUni = new Map(); // uniId -> Map(deptId -> facId)
let customFacultiesByUni = new Map();      // uniId -> Array<{ id, name, type, isCustom: true }>
let addedDeptFacultyMap = new Map();       // uniId -> Map(deptId -> facId)
let uniModalDeptViewMode = 'faculty';      // 'faculty' | 'flat'
let currentUniModalFacultyFilter = 'all';  // 'all' | facId

// Sidebar & University Filter State
let sidebarMode = 'universities';  // 'universities' | 'departments'
let currentFilter = 'all';         // 'all' | 'Devlet' | 'Vakıf'
let currentStatusFilter = 'all';   // 'all' | 'kept' | 'removed'
let currentRegion = 'all';
let currentCity = null;
let currentFocus = 'all';
let currentEra = 'all';
let currentSort = 'name';
let searchQuery = '';

// Department Sidebar Filter State
let deptSearchQuery = '';
let currentDeptDegree = 'all';     // 'all' | 'Lisans' | 'Önlisans'
let currentDeptScore = 'all';      // 'all' | 'SAY' | 'EA' | 'SÖZ' | 'DİL' | 'TYT'
let currentDeptCategory = 'all';
let currentDeptSort = 'name';

// Modal State
let currentModalUniId = null;
let currentUniModalTab = 'depts';  // 'depts' | 'add' | 'info'
let currentModalDeptId = null;
let showAllCitiesInRanking = false;

const STORAGE_KEY = 'ideal_uni_removed_ids_v2';
const LEGACY_STORAGE_KEY = 'ideal_uni_removed_ids_v1';
const DEPT_STORAGE_KEY = 'ideal_uni_dept_state_v1';
const DEPT_FACULTY_STORAGE_KEY = 'ideal_uni_dept_faculty_state_v1';
const THEME_KEY = 'ideal_uni_theme';
const CURRENT_YEAR = new Date().getFullYear();

const ERA_DEFINITIONS = [
  { id: '1933-1981', label: '1453–1981 · Osmanlı & Cumhuriyet Köklü Dönem', min: 0, max: 1981, color: '#06b6d4' },
  { id: '1982-1991', label: '1982–1991 · YÖK & 1. Kuruluş Dalgası', min: 1982, max: 1991, color: '#3b82f6' },
  { id: '1992-2005', label: '1992–2005 · 1992 Atılımı & Vakıf Yükselişi', min: 1992, max: 2005, color: '#6366f1' },
  { id: '2006-2010', label: '2006–2010 · "Her İle Üniversite" Dalgası', min: 2006, max: 2010, color: '#8b5cf6' },
  { id: '2011+',     label: '2011 ve Sonrası · Uzmanlaşma & Yeni Nesil', min: 2011, max: 9999, color: '#ec4899' }
];

const SCORE_COLORS = {
  'SAY': '#3b82f6',
  'EA':  '#a855f7',
  'SÖZ': '#f59e0b',
  'DİL': '#ec4899',
  'TYT': '#06b6d4'
};

const FALLBACK_LOGO_URI = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M22 10v6M2 10l10-5 10 5-10 5z'/%3E%3Cpath d='M6 12v5c3 3 9 3 12 0v-5'/%3E%3C/svg%3E";

function handleLogoError(imgEl) {
  if (!imgEl) return;
  imgEl.onerror = null;
  imgEl.src = FALLBACK_LOGO_URI;
}

// DOM Elements
const universityListEl = document.getElementById('universityList');
const sidebarTabBtns = document.querySelectorAll('.sidebar-tab-btn');
const uniControlsSection = document.getElementById('uniControlsSection');
const deptControlsSection = document.getElementById('deptControlsSection');
const sidebarUniTabCount = document.getElementById('sidebarUniTabCount');
const sidebarDeptTabCount = document.getElementById('sidebarDeptTabCount');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const segmentBtns = document.querySelectorAll('.segment-btn');
const statusPills = document.querySelectorAll('.status-pill');
const regionFilterEl = document.getElementById('regionFilter');
const cityFilterEl = document.getElementById('cityFilter');
const focusFilterEl = document.getElementById('focusFilter');
const eraFilterEl = document.getElementById('eraFilter');
const sortOrderEl = document.getElementById('sortOrder');
const presetChips = document.querySelectorAll('.preset-chip');
const themeToggleBtn = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');
const openDeptReformModalBtn = document.getElementById('openDeptReformModalBtn');
const filteredCountText = document.getElementById('filteredCountText');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const resetFiltersSep = document.getElementById('resetFiltersSep');
const keepFilteredBtn = document.getElementById('keepFilteredBtn');
const removeFilteredBtn = document.getElementById('removeFilteredBtn');
const cityFilterBanner = document.getElementById('cityFilterBanner');
const cityFilterText = document.getElementById('cityFilterText');
const clearCityFilterBtn = document.getElementById('clearCityFilterBtn');
const toggleAllCitiesBtn = document.getElementById('toggleAllCitiesBtn');

// Department Sidebar Controls
const deptSearchInput = document.getElementById('deptSearchInput');
const clearDeptSearchBtn = document.getElementById('clearDeptSearchBtn');
const deptDegreeBtns = document.querySelectorAll('.dept-degree-btn');
const scorePills = document.querySelectorAll('.score-pill');
const deptCategoryFilterEl = document.getElementById('deptCategoryFilter');
const deptSortOrderEl = document.getElementById('deptSortOrder');
const filteredDeptCountText = document.getElementById('filteredDeptCountText');
const resetDeptFiltersBtn = document.getElementById('resetDeptFiltersBtn');
const openCreateCustomDeptBtn = document.getElementById('openCreateCustomDeptBtn');

// Map Department Focus Banner
const mapDeptFocusBanner = document.getElementById('mapDeptFocusBanner');
const mapDeptFocusText = document.getElementById('mapDeptFocusText');
const manageFocusedDeptBtn = document.getElementById('manageFocusedDeptBtn');
const clearMapDeptFocusBtn = document.getElementById('clearMapDeptFocusBtn');

// Stats DOM
const totalCountEl = document.getElementById('totalCount');
const totalCatalogBadgeEl = document.getElementById('totalCatalogBadge');
const totalSubTextEl = document.getElementById('totalSubText');
const keptCountEl = document.getElementById('keptCount');
const removedCountEl = document.getElementById('removedCount');
const activeDeptBranchesCountEl = document.getElementById('activeDeptBranchesCount');
const baseDeptBranchesRefEl = document.getElementById('baseDeptBranchesRef');
const activeDeptPctBadgeEl = document.getElementById('activeDeptPctBadge');
const deptDeltaSubEl = document.getElementById('deptDeltaSub');

// Faculty Stats DOM
const activeFacultiesCountEl = document.getElementById('activeFacultiesCount');
const baseFacultiesRefEl = document.getElementById('baseFacultiesRef');
const activeFacultyPctBadgeEl = document.getElementById('activeFacultyPctBadge');
const facultyDeltaSubEl = document.getElementById('facultyDeltaSub');

const activeLisansCountEl = document.getElementById('activeLisansCount');
const activeOnlisansRefEl = document.getElementById('activeOnlisansRef');
const lisansShareBadgeEl = document.getElementById('lisansShareBadge');
const activeUniqueDeptsSubEl = document.getElementById('activeUniqueDeptsSub');
const stateCountEl = document.getElementById('stateCount');
const foundationCountRefEl = document.getElementById('foundationCountRef');
const foundationCountEl = document.getElementById('foundationCount');
const activeCitiesCountEl = document.getElementById('activeCitiesCount');
const researchCountEl = document.getElementById('researchCount');
const avgFoundedYearEl = document.getElementById('avgFoundedYear');
const oldestActiveSubEl = document.getElementById('oldestActiveSub');

const keptPercentBadge = document.getElementById('keptPercentBadge');
const removedPercentBadge = document.getElementById('removedPercentBadge');
const stateShareBadge = document.getElementById('stateShareBadge');
const emptyCitiesBadge = document.getElementById('emptyCitiesBadge');
const researchPercentBadge = document.getElementById('researchPercentBadge');

const keptProgressBar = document.getElementById('keptProgressBar');
const removedProgressBar = document.getElementById('removedProgressBar');
const cityCoverageBar = document.getElementById('cityCoverageBar');
const stateRemovedSub = document.getElementById('stateRemovedSub');

// University Modal DOM
const modal = document.getElementById('uniModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalLogo = document.getElementById('modalLogo');
const modalTitle = document.getElementById('modalTitle');
const modalQuickMeta = document.getElementById('modalQuickMeta');
const modalType = document.getElementById('modalType');
const modalResearchBadge = document.getElementById('modalResearchBadge');
const modalFocusBadge = document.getElementById('modalFocusBadge');
const modalStatusBadge = document.getElementById('modalStatusBadge');
const modalCity = document.getElementById('modalCity');
const modalRegion = document.getElementById('modalRegion');
const modalFounded = document.getElementById('modalFounded');
const modalCityStats = document.getElementById('modalCityStats');
const modalSameCityTitle = document.getElementById('modalSameCityTitle');
const modalSameCityList = document.getElementById('modalSameCityList');
const modalFilterCityBtn = document.getElementById('modalFilterCityBtn');
const modalWebsite = document.getElementById('modalWebsite');
const modalToggleStatusBtn = document.getElementById('modalToggleStatusBtn');
const modalUniDeptsCountBadge = document.getElementById('modalUniDeptsCountBadge');

const uniModalTabBtns = document.querySelectorAll('[data-uni-tab]');
const uniModalTabDepts = document.getElementById('uniModalTabDepts');
const uniModalTabAdd = document.getElementById('uniModalTabAdd');
const uniModalTabInfo = document.getElementById('uniModalTabInfo');

// Faculty View & Creation DOM
const uniViewFacultyBtn = document.getElementById('uniViewFacultyBtn');
const uniViewFlatBtn = document.getElementById('uniViewFlatBtn');
const uniModalFacultyFilter = document.getElementById('uniModalFacultyFilter');
const openNewFacultyPanelBtn = document.getElementById('openNewFacultyPanelBtn');
const newFacultyPanel = document.getElementById('newFacultyPanel');
const closeNewFacultyPanelBtn = document.getElementById('closeNewFacultyPanelBtn');
const newFacultyNameInput = document.getElementById('newFacultyNameInput');
const newFacultyTypeSelect = document.getElementById('newFacultyTypeSelect');
const submitCreateFacultyBtn = document.getElementById('submitCreateFacultyBtn');
const uniModalAddTargetFaculty = document.getElementById('uniModalAddTargetFaculty');

const uniDeptSummaryBar = document.getElementById('uniDeptSummaryBar');
const uniModalDeptSearch = document.getElementById('uniModalDeptSearch');
const uniModalDegreeFilter = document.getElementById('uniModalDegreeFilter');
const uniModalScoreFilter = document.getElementById('uniModalScoreFilter');
const uniModalStatusFilter = document.getElementById('uniModalStatusFilter');
const uniModalFilteredDeptCount = document.getElementById('uniModalFilteredDeptCount');
const uniModalOpenFilteredDeptsBtn = document.getElementById('uniModalOpenFilteredDeptsBtn');
const uniModalCloseFilteredDeptsBtn = document.getElementById('uniModalCloseFilteredDeptsBtn');
const uniModalResetDeptsBtn = document.getElementById('uniModalResetDeptsBtn');
const uniModalDeptList = document.getElementById('uniModalDeptList');

const uniModalAddSearch = document.getElementById('uniModalAddSearch');
const uniModalAddDegreeFilter = document.getElementById('uniModalAddDegreeFilter');
const uniModalAddScoreFilter = document.getElementById('uniModalAddScoreFilter');
const uniModalAddCategoryFilter = document.getElementById('uniModalAddCategoryFilter');
const uniModalAddAvailableCount = document.getElementById('uniModalAddAvailableCount');
const uniModalAddAllFilteredBtn = document.getElementById('uniModalAddAllFilteredBtn');
const uniModalAddDeptList = document.getElementById('uniModalAddDeptList');

// National Department Modal DOM
const deptModal = document.getElementById('deptModal');
const closeDeptModalBtn = document.getElementById('closeDeptModalBtn');
const deptModalDegreeBadge = document.getElementById('deptModalDegreeBadge');
const deptModalScoreBadge = document.getElementById('deptModalScoreBadge');
const deptModalCategoryBadge = document.getElementById('deptModalCategoryBadge');
const deptModalTitle = document.getElementById('deptModalTitle');
const deptModalSubtitle = document.getElementById('deptModalSubtitle');
const deptModalFocusMapBtn = document.getElementById('deptModalFocusMapBtn');
const deptModalSummaryBar = document.getElementById('deptModalSummaryBar');
const deptModalUniSearch = document.getElementById('deptModalUniSearch');
const deptModalUniStateFilter = document.getElementById('deptModalUniStateFilter');
const deptModalUniTypeFilter = document.getElementById('deptModalUniTypeFilter');
const deptModalUniCountText = document.getElementById('deptModalUniCountText');
const deptModalOpenInFilteredBtn = document.getElementById('deptModalOpenInFilteredBtn');
const deptModalCloseInFilteredBtn = document.getElementById('deptModalCloseInFilteredBtn');
const deptModalUniList = document.getElementById('deptModalUniList');

// Reform & Custom Department Modal DOM
const reformModal = document.getElementById('reformModal');
const closeReformModalBtn = document.getElementById('closeReformModalBtn');
const reformTabBtns = document.querySelectorAll('[data-reform-tab]');
const reformTabScenarios = document.getElementById('reformTabScenarios');
const reformTabFaculties = document.getElementById('reformTabFaculties');
const reformTabCustom = document.getElementById('reformTabCustom');
const createCustomDeptForm = document.getElementById('createCustomDeptForm');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadUniversitiesAndDepartmentsState();
  populateCitySelectOptions();
  initMap();
  setupEventListeners();
  updateUI();
});

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function loadUniversitiesAndDepartmentsState() {
  let savedRemovedIds = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) savedRemovedIds = JSON.parse(raw);
  } catch (e) {
    savedRemovedIds = [];
  }

  const removedSet = new Set(savedRemovedIds);
  universities = universitiesData.map(uni => ({
    ...uni,
    removed: removedSet.has(uni.id)
  }));

  // Initialize Base Catalog, Departments & Faculties
  const rawCatalog = (typeof window !== 'undefined' && window.DEPARTMENT_CATALOG) ? window.DEPARTMENT_CATALOG : [];
  const rawUniMap = (typeof window !== 'undefined' && window.UNI_DEPARTMENTS_MAP) ? window.UNI_DEPARTMENTS_MAP : {};
  const rawFacMap = (typeof window !== 'undefined' && window.UNI_FACULTIES_MAP) ? window.UNI_FACULTIES_MAP : {};

  baseUniDeptsMap.clear();
  closedDeptsByUni.clear();
  addedDeptsByUni.clear();

  baseUniFacultiesMap.clear();
  baseUniDeptToFacultyMap.clear();
  disabledFacultiesByUni.clear();
  deptFacultyOverridesByUni.clear();
  customFacultiesByUni.clear();
  addedDeptFacultyMap.clear();

  universities.forEach(u => {
    const uId = u.id;
    // Departments
    const arr = rawUniMap[String(uId)] || [];
    baseUniDeptsMap.set(uId, new Set(arr));
    closedDeptsByUni.set(uId, new Set());
    addedDeptsByUni.set(uId, new Set());

    // Faculties
    const facEntry = rawFacMap[String(uId)] || { faculties: [], deptToFaculty: {} };
    baseUniFacultiesMap.set(uId, facEntry.faculties || []);
    const d2f = new Map();
    if (facEntry.deptToFaculty) {
      Object.entries(facEntry.deptToFaculty).forEach(([dStr, fId]) => {
        d2f.set(Number(dStr), fId);
      });
    }
    baseUniDeptToFacultyMap.set(uId, d2f);
    disabledFacultiesByUni.set(uId, new Set());
    deptFacultyOverridesByUni.set(uId, new Map());
    customFacultiesByUni.set(uId, []);
    addedDeptFacultyMap.set(uId, new Map());
  });

  // Load saved department deltas, custom departments & faculties
  customDepartments = [];
  try {
    const rawState = localStorage.getItem(DEPT_FACULTY_STORAGE_KEY) || localStorage.getItem(DEPT_STORAGE_KEY);
    if (rawState) {
      const parsed = JSON.parse(rawState);
      if (Array.isArray(parsed.customDepartments)) {
        customDepartments = parsed.customDepartments;
      }
      if (parsed.closedByUni && typeof parsed.closedByUni === 'object') {
        Object.entries(parsed.closedByUni).forEach(([uIdStr, deptArr]) => {
          const uId = Number(uIdStr);
          if (closedDeptsByUni.has(uId) && Array.isArray(deptArr)) {
            closedDeptsByUni.set(uId, new Set(deptArr));
          }
        });
      }
      if (parsed.addedByUni && typeof parsed.addedByUni === 'object') {
        Object.entries(parsed.addedByUni).forEach(([uIdStr, items]) => {
          const uId = Number(uIdStr);
          if (addedDeptsByUni.has(uId) && Array.isArray(items)) {
            items.forEach(item => {
              const dId = typeof item === 'object' ? item.deptId : item;
              const fId = typeof item === 'object' ? item.facultyId : null;
              addedDeptsByUni.get(uId).add(dId);
              if (fId) {
                addedDeptFacultyMap.get(uId).set(dId, fId);
              }
            });
          }
        });
      }
      if (parsed.disabledFacultiesByUni && typeof parsed.disabledFacultiesByUni === 'object') {
        Object.entries(parsed.disabledFacultiesByUni).forEach(([uIdStr, fArr]) => {
          const uId = Number(uIdStr);
          if (disabledFacultiesByUni.has(uId) && Array.isArray(fArr)) {
            disabledFacultiesByUni.set(uId, new Set(fArr));
          }
        });
      }
      if (parsed.deptFacultyOverridesByUni && typeof parsed.deptFacultyOverridesByUni === 'object') {
        Object.entries(parsed.deptFacultyOverridesByUni).forEach(([uIdStr, ovObj]) => {
          const uId = Number(uIdStr);
          if (deptFacultyOverridesByUni.has(uId) && typeof ovObj === 'object') {
            Object.entries(ovObj).forEach(([dStr, targetFId]) => {
              deptFacultyOverridesByUni.get(uId).set(Number(dStr), targetFId);
            });
          }
        });
      }
      if (parsed.customFacultiesByUni && typeof parsed.customFacultiesByUni === 'object') {
        Object.entries(parsed.customFacultiesByUni).forEach(([uIdStr, facArr]) => {
          const uId = Number(uIdStr);
          if (customFacultiesByUni.has(uId) && Array.isArray(facArr)) {
            customFacultiesByUni.set(uId, facArr);
          }
        });
      }
    }
  } catch (e) {
    // Ignore parse error
  }

  rebuildDepartmentCatalogIndex(rawCatalog);
}

function rebuildDepartmentCatalogIndex(rawCatalogOverride) {
  const baseCatalog = rawCatalogOverride || ((typeof window !== 'undefined' && window.DEPARTMENT_CATALOG) ? window.DEPARTMENT_CATALOG : []);
  departmentCatalog = [...baseCatalog, ...customDepartments].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  departmentByIdMap.clear();
  departmentCatalog.forEach(d => {
    departmentByIdMap.set(d.id, d);
  });

  // Update degree button counts
  const lisansCount = departmentCatalog.filter(d => d.degree === 'Lisans').length;
  const onlisansCount = departmentCatalog.filter(d => d.degree === 'Önlisans').length;
  deptDegreeBtns.forEach(btn => {
    const deg = btn.getAttribute('data-degree');
    if (deg === 'all') btn.textContent = `Tümü (${departmentCatalog.length})`;
    else if (deg === 'Lisans') btn.textContent = `Lisans (${lisansCount})`;
    else if (deg === 'Önlisans') btn.textContent = `Önlisans (${onlisansCount})`;
  });
}

function saveUniversitiesState() {
  try {
    const removedIds = universities.filter(u => u.removed).map(u => u.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(removedIds));

    const closedObj = {};
    closedDeptsByUni.forEach((set, uId) => {
      if (set.size > 0) closedObj[uId] = Array.from(set);
    });

    const addedObj = {};
    addedDeptsByUni.forEach((set, uId) => {
      if (set.size > 0) {
        addedObj[uId] = Array.from(set).map(dId => ({
          deptId: dId,
          facultyId: addedDeptFacultyMap.get(uId)?.get(dId) || null
        }));
      }
    });

    const disabledFacsObj = {};
    disabledFacultiesByUni.forEach((set, uId) => {
      if (set.size > 0) disabledFacsObj[uId] = Array.from(set);
    });

    const overridesObj = {};
    deptFacultyOverridesByUni.forEach((map, uId) => {
      if (map.size > 0) overridesObj[uId] = Object.fromEntries(map);
    });

    const customFacsObj = {};
    customFacultiesByUni.forEach((arr, uId) => {
      if (arr.length > 0) customFacsObj[uId] = arr;
    });

    localStorage.setItem(DEPT_FACULTY_STORAGE_KEY, JSON.stringify({
      customDepartments,
      closedByUni: closedObj,
      addedByUni: addedObj,
      disabledFacultiesByUni: disabledFacsObj,
      deptFacultyOverridesByUni: overridesObj,
      customFacultiesByUni: customFacsObj
    }));
  } catch (e) {
    // Ignore storage quota errors
  }
}

// ============================================================================
// FACULTY & DEPARTMENT HELPER FUNCTIONS
// ============================================================================
function getUniFaculties(uniId) {
  const uId = Number(uniId);
  const base = baseUniFacultiesMap.get(uId) || [];
  const custom = customFacultiesByUni.get(uId) || [];
  return [...base, ...custom];
}

function getFacultyById(uniId, facId) {
  const facs = getUniFaculties(uniId);
  return facs.find(f => f.id === facId) || null;
}

function getDeptEffectiveFaculty(uniId, deptId) {
  const uId = Number(uniId);
  const dId = Number(deptId);
  const override = deptFacultyOverridesByUni.get(uId)?.get(dId);
  if (override) return override;
  const addedFac = addedDeptFacultyMap.get(uId)?.get(dId);
  if (addedFac) return addedFac;
  const baseFac = baseUniDeptToFacultyMap.get(uId)?.get(dId);
  if (baseFac) return baseFac;
  const allFacs = getUniFaculties(uId);
  return allFacs.length > 0 ? allFacs[0].id : 'fac_1';
}

function isFacultyActive(uniId, facId) {
  const uId = Number(uniId);
  const u = universities.find(x => x.id === uId);
  if (!u || u.removed) return false;
  return !disabledFacultiesByUni.get(uId)?.has(facId);
}

function getDepartmentById(deptId) {
  return departmentByIdMap.get(Number(deptId)) || null;
}

function getDepartmentStateInUni(uniId, deptId) {
  const uId = Number(uniId);
  const dId = Number(deptId);
  const baseSet = baseUniDeptsMap.get(uId) || new Set();
  const closedSet = closedDeptsByUni.get(uId) || new Set();
  const addedSet = addedDeptsByUni.get(uId) || new Set();

  const hasOriginal = baseSet.has(dId);
  const isAdded = addedSet.has(dId);
  const isExplicitClosed = closedSet.has(dId);
  const isPresent = hasOriginal || isAdded;

  // Faculty Cascade Check:
  const effFacId = getDeptEffectiveFaculty(uId, dId);
  const facDisabled = !isFacultyActive(uId, effFacId);
  const isCascadeClosed = isPresent && !isExplicitClosed && facDisabled;

  const isClosed = isExplicitClosed || isCascadeClosed;
  const isActive = isPresent && !isClosed;

  return {
    hasOriginal,
    isAdded,
    isClosed,
    isExplicitClosed,
    isCascadeClosed,
    isPresent,
    isActive,
    effectiveFacultyId: effFacId
  };
}

function getUniDepartmentList(uniId) {
  const uId = Number(uniId);
  const baseSet = baseUniDeptsMap.get(uId) || new Set();
  const closedSet = closedDeptsByUni.get(uId) || new Set();
  const addedSet = addedDeptsByUni.get(uId) || new Set();

  const allIds = new Set([...baseSet, ...addedSet]);
  const result = [];
  allIds.forEach(dId => {
    const dept = departmentByIdMap.get(dId);
    if (!dept) return;
    const st = getDepartmentStateInUni(uId, dId);
    const effFac = getFacultyById(uId, st.effectiveFacultyId);
    const originalFacId = baseUniDeptToFacultyMap.get(uId)?.get(dId);
    const originalFac = originalFacId ? getFacultyById(uId, originalFacId) : null;
    const isTransferred = deptFacultyOverridesByUni.get(uId)?.has(dId) || false;

    result.push({
      ...dept,
      hasOriginal: st.hasOriginal,
      isAdded: st.isAdded,
      isClosed: st.isClosed,
      isExplicitClosed: st.isExplicitClosed,
      isCascadeClosed: st.isCascadeClosed,
      isActive: st.isActive,
      effectiveFacultyId: st.effectiveFacultyId,
      faculty: effFac,
      originalFaculty: originalFac,
      isTransferred
    });
  });

  result.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  return result;
}

function getUniDepartmentSummary(uniId) {
  const uId = Number(uniId);
  const depts = getUniDepartmentList(uId);
  const facs = getUniFaculties(uId);

  let active = 0;
  let closed = 0;
  let addedActive = 0;
  let lisansActive = 0;
  let onlisansActive = 0;

  depts.forEach(d => {
    if (d.isActive) {
      active++;
      if (d.isAdded) addedActive++;
      if (d.degree === 'Lisans') lisansActive++;
      else onlisansActive++;
    } else {
      closed++;
    }
  });

  const activeFaculties = facs.filter(f => isFacultyActive(uId, f.id)).length;

  return {
    baseTotal: baseUniDeptsMap.get(uId)?.size || 0,
    total: depts.length,
    active,
    closed,
    addedActive,
    lisansActive,
    onlisansActive,
    totalFaculties: facs.length,
    activeFaculties,
    closedFaculties: facs.length - activeFaculties
  };
}

// Smart matching for assigning a department to the best available faculty
function resolveBestFacultyForDept(uniId, dept) {
  const uId = Number(uniId);
  const facs = getUniFaculties(uId);
  if (facs.length === 0) return 'fac_1';

  const dName = (dept.name || '').toLocaleLowerCase('tr');
  const dCat = (dept.category || '').toLocaleLowerCase('tr');

  // If Önlisans, prefer MYO
  if (dept.degree === 'Önlisans') {
    const myo = facs.find(f => f.type === 'MYO' || f.name.toLocaleLowerCase('tr').includes('meslek'));
    if (myo) return myo.id;
  }

  // Engineering / Architecture
  if (dCat.includes('mühendis') || dCat.includes('mimarlık') || dName.includes('mühendis')) {
    const ef = facs.find(f => {
      const fn = f.name.toLocaleLowerCase('tr');
      return fn.includes('mühendis') || fn.includes('mimarlık') || fn.includes('teknoloji') || fn.includes('elektrik') || fn.includes('bilgisayar');
    });
    if (ef) return ef.id;
  }

  // Medicine / Health
  if (dCat.includes('sağlık') || dCat.includes('tıp') || dName.includes('tıp') || dName.includes('diş') || dName.includes('eczac')) {
    const hf = facs.find(f => {
      const fn = f.name.toLocaleLowerCase('tr');
      return fn.includes('tıp') || fn.includes('sağlık') || fn.includes('diş') || fn.includes('eczac');
    });
    if (hf) return hf.id;
  }

  // Law
  if (dCat.includes('hukuk') || dName.includes('hukuk') || dName.includes('adalet')) {
    const lf = facs.find(f => f.name.toLocaleLowerCase('tr').includes('hukuk'));
    if (lf) return lf.id;
  }

  // Business / Economics
  if (dCat.includes('iktisat') || dCat.includes('idari') || dName.includes('işletme') || dName.includes('iktisat')) {
    const bf = facs.find(f => {
      const fn = f.name.toLocaleLowerCase('tr');
      return fn.includes('iktisad') || fn.includes('idari') || fn.includes('işletme') || fn.includes('ekonomi');
    });
    if (bf) return bf.id;
  }

  // Education
  if (dCat.includes('eğitim') || dName.includes('öğretmen')) {
    const edf = facs.find(f => f.name.toLocaleLowerCase('tr').includes('eğitim'));
    if (edf) return edf.id;
  }

  // Fallback: first active faculty or first faculty
  const activeFac = facs.find(f => isFacultyActive(uId, f.id));
  return activeFac ? activeFac.id : facs[0].id;
}

// Faculty Activation & Cascade Logic
function toggleFacultyStatus(uniId, facId, forceState) {
  const uId = Number(uniId);
  const disabledSet = disabledFacultiesByUni.get(uId) || new Set();
  const isCurrentlyDisabled = disabledSet.has(facId);

  const shouldBeDisabled = forceState !== undefined ? !forceState : !isCurrentlyDisabled;
  if (shouldBeDisabled) {
    disabledSet.add(facId);
  } else {
    disabledSet.delete(facId);
  }
  disabledFacultiesByUni.set(uId, disabledSet);

  // If opening a faculty in a removed university, reactivate the university
  const uni = universities.find(u => u.id === uId);
  if (!shouldBeDisabled && uni && uni.removed) {
    uni.removed = false;
  } else {
    syncUniStatusWithDepartments(uId);
  }

  saveUniversitiesState();
  updateUI();

  const fac = getFacultyById(uId, facId);
  const facName = fac ? fac.name : 'Fakülte';
  showToast(shouldBeDisabled
    ? `"${facName}" kapatıldı (bağlı tüm bölümler pasife alındı)`
    : `"${facName}" tekrar açıldı`
  );

  if (uni && currentModalUniId === uId) {
    syncModalState(uni);
  }
}

// Transfer Department between Faculties in a University
function transferDeptToFaculty(uniId, deptId, targetFacId) {
  const uId = Number(uniId);
  const dId = Number(deptId);
  const dept = getDepartmentById(dId);

  if (targetFacId === 'NEW') {
    // Open new faculty panel with pre-fill
    if (newFacultyPanel) newFacultyPanel.classList.remove('hidden');
    if (newFacultyNameInput) {
      newFacultyNameInput.value = `${dept ? dept.name : 'Yeni'} Fakültesi`;
      newFacultyNameInput.focus();
    }
    return;
  }

  const fac = getFacultyById(uId, targetFacId);
  if (!fac) return;

  deptFacultyOverridesByUni.get(uId).set(dId, targetFacId);
  if (addedDeptFacultyMap.get(uId)?.has(dId)) {
    addedDeptFacultyMap.get(uId).set(dId, targetFacId);
  }

  const isTargetActive = isFacultyActive(uId, targetFacId);
  syncUniStatusWithDepartments(uId);
  saveUniversitiesState();
  updateUI();

  const uni = universities.find(u => u.id === uId);
  if (uni && currentModalUniId === uId) {
    syncModalState(uni);
  }

  showToast(`"${dept ? dept.name : dId}" bölümü "${fac.name}" bünyesine aktarıldı ${!isTargetActive ? '(Fakülte şu an kapalı)' : ''}`);
}

// Create Brand-New Custom Faculty in a University
function handleCreateCustomFaculty(uniId) {
  const uId = Number(uniId);
  const name = (newFacultyNameInput ? newFacultyNameInput.value : '').trim();
  const type = (newFacultyTypeSelect ? newFacultyTypeSelect.value : 'Fakülte');

  if (!name) {
    showToast('Lütfen geçerli bir fakülte veya birim adı girin');
    return;
  }

  const newFacId = `cust_fac_${Date.now()}`;
  const newFac = {
    id: newFacId,
    name,
    type,
    isCustom: true
  };

  const customArr = customFacultiesByUni.get(uId) || [];
  customArr.push(newFac);
  customFacultiesByUni.set(uId, customArr);

  if (newFacultyPanel) newFacultyPanel.classList.add('hidden');
  if (newFacultyNameInput) newFacultyNameInput.value = '';

  saveUniversitiesState();
  updateUI();

  const uni = universities.find(u => u.id === uId);
  if (uni && currentModalUniId === uId) {
    syncModalState(uni);
  }

  showToast(`"${name}" (${type}) ${uni ? uni.name : ''} bünyesinde kuruldu`);
}

// Delete Custom Faculty in a University
function handleDeleteCustomFaculty(uniId, facId) {
  const uId = Number(uniId);
  const fac = getFacultyById(uId, facId);
  if (!fac || !fac.isCustom) return;

  // Reassign any departments in this faculty to the first faculty
  const allFacs = getUniFaculties(uId).filter(f => f.id !== facId);
  const fallbackFacId = allFacs.length > 0 ? allFacs[0].id : 'fac_1';

  deptFacultyOverridesByUni.get(uId)?.forEach((targetFId, dId) => {
    if (targetFId === facId) {
      deptFacultyOverridesByUni.get(uId).set(dId, fallbackFacId);
    }
  });

  addedDeptFacultyMap.get(uId)?.forEach((targetFId, dId) => {
    if (targetFId === facId) {
      addedDeptFacultyMap.get(uId).set(dId, fallbackFacId);
    }
  });

  const customArr = (customFacultiesByUni.get(uId) || []).filter(f => f.id !== facId);
  customFacultiesByUni.set(uId, customArr);
  disabledFacultiesByUni.get(uId)?.delete(facId);

  syncUniStatusWithDepartments(uId);
  saveUniversitiesState();
  updateUI();

  const uni = universities.find(u => u.id === uId);
  if (uni && currentModalUniId === uId) {
    syncModalState(uni);
  }

  showToast(`"${fac.name}" silindi, bünyesindeki bölümler varsayılan fakülteye aktarıldı`);
}

function getNationalDepartmentStats(deptId) {
  const dId = Number(deptId);
  let originalUniCount = 0;
  let activeUniCount = 0;
  let closedUniCount = 0;
  let addedUniCount = 0;
  const activeCities = new Set();

  universities.forEach(u => {
    const st = getDepartmentStateInUni(u.id, dId);
    if (st.hasOriginal) originalUniCount++;
    if (st.isPresent) {
      if (st.isActive && !u.removed) {
        activeUniCount++;
        activeCities.add(u.city);
        if (st.isAdded) addedUniCount++;
      } else {
        closedUniCount++;
      }
    }
  });

  return {
    originalUniCount,
    activeUniCount,
    closedUniCount,
    addedUniCount,
    activeCityCount: activeCities.size
  };
}

// Synchronize University active/removed status when its departments change
function syncUniStatusWithDepartments(uniId) {
  const uni = universities.find(u => u.id === Number(uniId));
  if (!uni) return;
  const summary = getUniDepartmentSummary(uni.id);
  if (summary.active === 0 && !uni.removed) {
    uni.removed = true;
  } else if (summary.active > 0 && uni.removed) {
    uni.removed = false;
  }
}

function toggleDepartmentInUni(uniId, deptId, skipUIUpdate = false) {
  const uId = Number(uniId);
  const dId = Number(deptId);
  const uni = universities.find(u => u.id === uId);
  if (!uni) return;

  const baseSet = baseUniDeptsMap.get(uId) || new Set();
  const closedSet = closedDeptsByUni.get(uId) || new Set();
  const addedSet = addedDeptsByUni.get(uId) || new Set();

  const isPresent = baseSet.has(dId) || addedSet.has(dId);
  if (!isPresent) {
    // Opening a department in a university where it never existed
    addedSet.add(dId);
    closedSet.delete(dId);
    uni.removed = false;
  } else {
    if (closedSet.has(dId)) {
      closedSet.delete(dId);
      uni.removed = false;
    } else {
      closedSet.add(dId);
      syncUniStatusWithDepartments(uId);
    }
  }

  if (!skipUIUpdate) {
    clearActivePresetHighlight();
    updateUI();
  }
}

function setDepartmentActiveInUni(uniId, deptId, shouldBeActive, skipUIUpdate = false) {
  const uId = Number(uniId);
  const dId = Number(deptId);
  const uni = universities.find(u => u.id === uId);
  if (!uni) return;

  const baseSet = baseUniDeptsMap.get(uId) || new Set();
  const closedSet = closedDeptsByUni.get(uId) || new Set();
  const addedSet = addedDeptsByUni.get(uId) || new Set();

  if (shouldBeActive) {
    if (!baseSet.has(dId)) {
      addedSet.add(dId);
    }
    closedSet.delete(dId);
    uni.removed = false;
  } else {
    if (baseSet.has(dId) || addedSet.has(dId)) {
      closedSet.add(dId);
    }
    syncUniStatusWithDepartments(uId);
  }

  if (!skipUIUpdate) {
    clearActivePresetHighlight();
    updateUI();
  }
}

function getAllUniqueCities() {
  const citySet = new Set(universities.map(u => u.city));
  return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'tr'));
}

function populateCitySelectOptions() {
  if (!cityFilterEl) return;
  const cities = getAllUniqueCities();
  const currentVal = currentCity || 'all';

  let html = `<option value="all">Tüm İller (81 İl)</option>`;
  cities.forEach(city => {
    const cityUnis = universities.filter(u => u.city === city);
    const activeCount = cityUnis.filter(u => !u.removed).length;
    const selectedAttr = currentVal === city ? 'selected' : '';
    html += `<option value="${city}" ${selectedAttr}>${city} (${activeCount}/${cityUnis.length})</option>`;
  });
  cityFilterEl.innerHTML = html;
}

function setupEventListeners() {
  // Sidebar Mode Tabs (Universities vs Departments)
  sidebarTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sidebarMode = btn.getAttribute('data-sidebar-mode');
      uniControlsSection.classList.toggle('hidden', sidebarMode !== 'universities');
      deptControlsSection.classList.toggle('hidden', sidebarMode !== 'departments');
      renderSidebarList();
    });
  });

  // University Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLocaleLowerCase('tr');
    clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
    renderSidebarList();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderSidebarList();
  });

  // Type Segmented Control
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderSidebarList();
    });
  });

  // Status Pills
  statusPills.forEach(pill => {
    pill.addEventListener('click', () => {
      statusPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentStatusFilter = pill.getAttribute('data-status');
      renderSidebarList();
    });
  });

  // Region Filter
  regionFilterEl.addEventListener('change', (e) => {
    currentRegion = e.target.value;
    renderSidebarList();
    renderCharts();
  });

  // City Filter Dropdown
  cityFilterEl.addEventListener('change', (e) => {
    const val = e.target.value;
    setCityFilter(val === 'all' ? null : val, true);
  });

  // Focus / Profile Filter
  focusFilterEl.addEventListener('change', (e) => {
    currentFocus = e.target.value;
    renderSidebarList();
    renderCharts();
  });

  // Era Filter
  eraFilterEl.addEventListener('change', (e) => {
    currentEra = e.target.value;
    renderSidebarList();
    renderCharts();
  });

  // Sort Order
  sortOrderEl.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderSidebarList();
  });

  // Clear City Filter Banner
  clearCityFilterBtn.addEventListener('click', () => {
    setCityFilter(null, true);
  });

  // Reset University Filters
  resetFiltersBtn.addEventListener('click', () => {
    resetAllFilters();
  });

  // Bulk Keep / Remove Filtered Universities
  keepFilteredBtn.addEventListener('click', () => {
    const filtered = getFilteredUniversities();
    if (!filtered.length) return;
    filtered.forEach(u => {
      u.removed = false;
      const summary = getUniDepartmentSummary(u.id);
      if (summary.active === 0) {
        closedDeptsByUni.get(u.id).clear();
      }
    });
    clearActivePresetHighlight();
    updateUI();
    showToast(`Listelenen ${filtered.length} üniversite korundu`);
  });

  removeFilteredBtn.addEventListener('click', () => {
    const filtered = getFilteredUniversities();
    if (!filtered.length) return;
    filtered.forEach(u => { u.removed = true; });
    clearActivePresetHighlight();
    updateUI();
    showToast(`Listelenen ${filtered.length} üniversite kaldırıldı`);
  });

  // Department Sidebar Search & Filters
  deptSearchInput.addEventListener('input', (e) => {
    deptSearchQuery = e.target.value.trim().toLocaleLowerCase('tr');
    clearDeptSearchBtn.classList.toggle('hidden', deptSearchQuery.length === 0);
    renderSidebarList();
  });

  clearDeptSearchBtn.addEventListener('click', () => {
    deptSearchInput.value = '';
    deptSearchQuery = '';
    clearDeptSearchBtn.classList.add('hidden');
    renderSidebarList();
  });

  deptDegreeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      deptDegreeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDeptDegree = btn.getAttribute('data-degree');
      renderSidebarList();
    });
  });

  scorePills.forEach(pill => {
    pill.addEventListener('click', () => {
      scorePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentDeptScore = pill.getAttribute('data-score');
      renderSidebarList();
    });
  });

  deptCategoryFilterEl.addEventListener('change', (e) => {
    currentDeptCategory = e.target.value;
    renderSidebarList();
    renderCharts();
  });

  deptSortOrderEl.addEventListener('change', (e) => {
    currentDeptSort = e.target.value;
    renderSidebarList();
  });

  resetDeptFiltersBtn.addEventListener('click', () => {
    resetDepartmentFilters();
  });

  // Map Department Focus Banner Controls
  clearMapDeptFocusBtn.addEventListener('click', () => {
    clearDepartmentMapFocus();
  });

  manageFocusedDeptBtn.addEventListener('click', () => {
    const focusedId = typeof getMapDepartmentFocus === 'function' ? getMapDepartmentFocus() : null;
    if (focusedId !== null) {
      openDepartmentModal(focusedId);
    }
  });

  // Preset Scenarios
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const preset = chip.getAttribute('data-preset');
      applyPreset(preset);
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Toggle All 81 Cities in Ranking Panel
  if (toggleAllCitiesBtn) {
    toggleAllCitiesBtn.addEventListener('click', () => {
      showAllCitiesInRanking = !showAllCitiesInRanking;
      toggleAllCitiesBtn.textContent = showAllCitiesInRanking
        ? 'İlk 12 İli Göster'
        : '81 İlin Tamamını Göster';
      renderCityRanking();
    });
  }

  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    if (typeof setMapTheme === 'function') {
      setMapTheme(next);
    }
  });

  // Export Scenario JSON
  exportBtn.addEventListener('click', exportScenarioJSON);

  // Open Macro Reform & Custom Department Modal
  openDeptReformModalBtn.addEventListener('click', () => {
    openReformModal('scenarios');
  });

  openCreateCustomDeptBtn.addEventListener('click', () => {
    openReformModal('custom');
  });

  // University Modal Events
  closeModalBtn.addEventListener('click', closeModal);
  closeDeptModalBtn.addEventListener('click', closeDeptModal);
  closeReformModalBtn.addEventListener('click', closeReformModal);

  window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
    if (e.target === deptModal) closeDeptModal();
    if (e.target === reformModal) closeReformModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal.style.display === 'flex') closeModal();
      if (deptModal.style.display === 'flex') closeDeptModal();
      if (reformModal.style.display === 'flex') closeReformModal();
    }
  });

  // University Modal Internal Tabs
  uniModalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-uni-tab');
      switchUniModalTab(tab);
    });
  });

  modalToggleStatusBtn.addEventListener('click', () => {
    if (currentModalUniId !== null) {
      toggleUniversity(currentModalUniId);
      const uni = universities.find(u => u.id === currentModalUniId);
      if (uni) syncModalState(uni);
    }
  });

  modalFilterCityBtn.addEventListener('click', () => {
    if (currentModalUniId !== null) {
      const uni = universities.find(u => u.id === currentModalUniId);
      if (uni) {
        closeModal();
        setCityFilter(uni.city, true);
      }
    }
  });

  // University Modal Department Tab Filters & Bulk Actions
  if (uniViewFacultyBtn) {
    uniViewFacultyBtn.addEventListener('click', () => {
      uniModalDeptViewMode = 'faculty';
      uniViewFacultyBtn.classList.add('active');
      uniViewFlatBtn.classList.remove('active');
      if (currentModalUniId !== null) renderUniModalDepartments(currentModalUniId);
    });
  }

  if (uniViewFlatBtn) {
    uniViewFlatBtn.addEventListener('click', () => {
      uniModalDeptViewMode = 'flat';
      uniViewFlatBtn.classList.add('active');
      uniViewFacultyBtn.classList.remove('active');
      if (currentModalUniId !== null) renderUniModalDepartments(currentModalUniId);
    });
  }

  if (uniModalFacultyFilter) {
    uniModalFacultyFilter.addEventListener('change', () => {
      currentUniModalFacultyFilter = uniModalFacultyFilter.value;
      if (currentModalUniId !== null) renderUniModalDepartments(currentModalUniId);
    });
  }

  if (openNewFacultyPanelBtn) {
    openNewFacultyPanelBtn.addEventListener('click', () => {
      if (newFacultyPanel) {
        newFacultyPanel.classList.toggle('hidden');
        if (!newFacultyPanel.classList.contains('hidden') && newFacultyNameInput) {
          newFacultyNameInput.focus();
        }
      }
    });
  }

  if (closeNewFacultyPanelBtn) {
    closeNewFacultyPanelBtn.addEventListener('click', () => {
      if (newFacultyPanel) newFacultyPanel.classList.add('hidden');
    });
  }

  if (submitCreateFacultyBtn) {
    submitCreateFacultyBtn.addEventListener('click', () => {
      if (currentModalUniId !== null) {
        handleCreateCustomFaculty(currentModalUniId);
      }
    });
  }

  [uniModalDeptSearch, uniModalDegreeFilter, uniModalScoreFilter, uniModalStatusFilter].forEach(el => {
    if (!el) return;
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
      if (currentModalUniId !== null) renderUniModalDepartments(currentModalUniId);
    });
  });

  uniModalOpenFilteredDeptsBtn.addEventListener('click', () => {
    if (currentModalUniId === null) return;
    const list = getFilteredUniModalDepartments(currentModalUniId);
    list.forEach(d => setDepartmentActiveInUni(currentModalUniId, d.id, true, true));
    clearActivePresetHighlight();
    updateUI();
    syncModalState(universities.find(u => u.id === currentModalUniId));
    showToast(`${list.length} bölüm aktif edildi`);
  });

  uniModalCloseFilteredDeptsBtn.addEventListener('click', () => {
    if (currentModalUniId === null) return;
    const list = getFilteredUniModalDepartments(currentModalUniId);
    list.forEach(d => setDepartmentActiveInUni(currentModalUniId, d.id, false, true));
    clearActivePresetHighlight();
    updateUI();
    syncModalState(universities.find(u => u.id === currentModalUniId));
    showToast(`${list.length} bölüm kapatıldı`);
  });

  uniModalResetDeptsBtn.addEventListener('click', () => {
    if (currentModalUniId === null) return;
    closedDeptsByUni.get(currentModalUniId).clear();
    addedDeptsByUni.get(currentModalUniId).clear();
    disabledFacultiesByUni.get(currentModalUniId).clear();
    deptFacultyOverridesByUni.get(currentModalUniId).clear();
    customFacultiesByUni.set(currentModalUniId, []);
    addedDeptFacultyMap.get(currentModalUniId).clear();
    const uni = universities.find(u => u.id === currentModalUniId);
    if (uni) uni.removed = false;
    updateUI();
    if (uni) syncModalState(uni);
    showToast('Üniversitenin fakülte ve bölümleri YÖK orijinal yapısına sıfırlandı');
  });

  // University Modal Add-New-Department Tab Filters & Bulk Actions
  [uniModalAddSearch, uniModalAddDegreeFilter, uniModalAddScoreFilter, uniModalAddCategoryFilter].forEach(el => {
    if (!el) return;
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
      if (currentModalUniId !== null) renderUniModalAddCatalog(currentModalUniId);
    });
  });

  uniModalAddAllFilteredBtn.addEventListener('click', () => {
    if (currentModalUniId === null) return;
    const available = getFilteredAddableDepartmentsForUni(currentModalUniId);
    if (!available.length) return;
    const targetFacChoice = uniModalAddTargetFaculty ? uniModalAddTargetFaculty.value : 'auto';
    available.forEach(d => {
      let fId = targetFacChoice;
      if (fId === 'auto') fId = resolveBestFacultyForDept(currentModalUniId, d);
      if (fId && fId !== 'auto') addedDeptFacultyMap.get(currentModalUniId).set(d.id, fId);
      setDepartmentActiveInUni(currentModalUniId, d.id, true, true);
    });
    clearActivePresetHighlight();
    updateUI();
    syncModalState(universities.find(u => u.id === currentModalUniId));
    showToast(`${available.length} yeni bölüm bu üniversiteye açıldı`);
  });

  // National Department Modal Events
  deptModalFocusMapBtn.addEventListener('click', () => {
    if (currentModalDeptId !== null) {
      focusDepartmentOnMap(currentModalDeptId);
      closeDeptModal();
    }
  });

  document.querySelectorAll('[data-dept-macro]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentModalDeptId === null) return;
      const rule = btn.getAttribute('data-dept-macro');
      applySingleDepartmentMacroRule(currentModalDeptId, rule);
    });
  });

  [deptModalUniSearch, deptModalUniStateFilter, deptModalUniTypeFilter].forEach(el => {
    if (!el) return;
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
      if (currentModalDeptId !== null) renderDeptModalUniversities(currentModalDeptId);
    });
  });

  deptModalOpenInFilteredBtn.addEventListener('click', () => {
    if (currentModalDeptId === null) return;
    const list = getFilteredUniversitiesForDeptModal(currentModalDeptId);
    list.forEach(u => setDepartmentActiveInUni(u.id, currentModalDeptId, true, true));
    updateUI();
    syncDeptModalState(currentModalDeptId);
    showToast(`Seçili bölüm ${list.length} üniversitede açıldı`);
  });

  deptModalCloseInFilteredBtn.addEventListener('click', () => {
    if (currentModalDeptId === null) return;
    const list = getFilteredUniversitiesForDeptModal(currentModalDeptId);
    list.forEach(u => setDepartmentActiveInUni(u.id, currentModalDeptId, false, true));
    updateUI();
    syncDeptModalState(currentModalDeptId);
    showToast(`Seçili bölüm ${list.length} üniversitede kapatıldı`);
  });

  // Macro Reform & Custom Department Modal Events
  reformTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-reform-tab');
      switchReformModalTab(tab);
    });
  });

  document.querySelectorAll('[data-macro-scenario]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-macro-scenario');
      applyNationalDepartmentScenario(scenario);
    });
  });

  if (createCustomDeptForm) {
    createCustomDeptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCreateCustomDepartment();
    });
  }

  // Material 3 Mobile Navigation Bar Controller (< 840px)
  const m3NavItems = document.querySelectorAll('.m3-nav-item');
  m3NavItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-nav-target');
      m3NavItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      if (target === 'universities') {
        const uTab = document.querySelector('[data-sidebar-mode="universities"]');
        if (uTab) uTab.click();
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (target === 'departments') {
        const dTab = document.querySelector('[data-sidebar-mode="departments"]');
        if (dTab) dTab.click();
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (target === 'map') {
        const mapSection = document.querySelector('.map-wrapper') || document.querySelector('.main-content');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setTimeout(() => {
          if (typeof map !== 'undefined' && map && typeof map.invalidateSize === 'function') {
            map.invalidateSize();
          }
        }, 300);
      } else if (target === 'analytics') {
        const statsSection = document.querySelector('.stats-grid') || document.querySelector('.charts-panel');
        if (statsSection) {
          statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Material 3 Header Elevation on Scroll
  const headerEl = document.querySelector('.header');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        headerEl.classList.add('is-scrolled');
      } else {
        headerEl.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }
}

// Map Focus on a Specific Department
function focusDepartmentOnMap(deptId) {
  const dept = getDepartmentById(deptId);
  if (!dept) return;

  if (typeof setMapDepartmentFocus === 'function') {
    setMapDepartmentFocus(dept.id);
  }

  const stats = getNationalDepartmentStats(dept.id);
  mapDeptFocusText.textContent = `Bölüm Odağı: ${dept.name} (${dept.scoreType} · ${dept.degree}) — ${stats.activeUniCount} Üni. / ${stats.activeCityCount} İlde Aktif`;
  mapDeptFocusBanner.classList.remove('hidden');
  renderSidebarList();
  showToast(`Harita "${dept.name}" bölümünün dağılımına odaklandı`);
}

function clearDepartmentMapFocus() {
  if (typeof setMapDepartmentFocus === 'function') {
    setMapDepartmentFocus(null);
  }
  mapDeptFocusBanner.classList.add('hidden');
  renderSidebarList();
}

// Called from map.js when a province polygon/label is clicked
function setCityFilterFromMap(cityName) {
  setCityFilter(cityName, false);
}

function setCityFilter(cityName, syncToMap = true) {
  currentCity = cityName || null;

  if (cityFilterEl) {
    cityFilterEl.value = currentCity || 'all';
  }

  if (currentCity) {
    const cityUnis = universities.filter(u => u.city.toLocaleLowerCase('tr') === currentCity.toLocaleLowerCase('tr'));
    const activeCount = cityUnis.filter(u => !u.removed).length;
    cityFilterText.textContent = `Seçili İl: ${currentCity} (${activeCount} / ${cityUnis.length} Aktif)`;
    cityFilterBanner.classList.remove('hidden');
  } else {
    cityFilterBanner.classList.add('hidden');
  }

  if (syncToMap && typeof setMapSelectedCity === 'function') {
    setMapSelectedCity(currentCity);
  }

  renderSidebarList();
  renderCityRanking();
}

function resetAllFilters() {
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  currentFilter = 'all';
  segmentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'all'));
  currentStatusFilter = 'all';
  statusPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-status') === 'all'));
  currentRegion = 'all';
  regionFilterEl.value = 'all';
  currentFocus = 'all';
  focusFilterEl.value = 'all';
  currentEra = 'all';
  eraFilterEl.value = 'all';
  currentSort = 'name';
  sortOrderEl.value = 'name';
  setCityFilter(null, true);
  renderCharts();
}

function resetDepartmentFilters() {
  deptSearchQuery = '';
  deptSearchInput.value = '';
  clearDeptSearchBtn.classList.add('hidden');
  currentDeptDegree = 'all';
  deptDegreeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-degree') === 'all'));
  currentDeptScore = 'all';
  scorePills.forEach(p => p.classList.toggle('active', p.getAttribute('data-score') === 'all'));
  currentDeptCategory = 'all';
  deptCategoryFilterEl.value = 'all';
  currentDeptSort = 'name';
  deptSortOrderEl.value = 'name';
  renderSidebarList();
  renderCharts();
}

function applyPreset(preset) {
  if (preset === 'all') {
    universities.forEach(u => {
      u.removed = false;
      const summary = getUniDepartmentSummary(u.id);
      if (summary.active === 0) closedDeptsByUni.get(u.id).clear();
    });
    showToast('203 üniversitenin tamamı aktif edildi');
  } else if (preset === 'none') {
    universities.forEach(u => { u.removed = true; });
    showToast('Tüm üniversiteler pasif duruma getirildi');
  } else if (preset === 'state_only') {
    universities.forEach(u => { u.removed = (u.type !== 'Devlet'); });
    const count = universities.filter(u => !u.removed).length;
    showToast(`Sadece ${count} Devlet üniversitesi korundu`);
  } else if (preset === 'foundation_only') {
    universities.forEach(u => { u.removed = (u.type !== 'Vakıf'); });
    const count = universities.filter(u => !u.removed).length;
    showToast(`Sadece ${count} Vakıf üniversitesi korundu`);
  } else if (preset === 'research_only') {
    universities.forEach(u => { u.removed = !u.isResearch; });
    showToast('YÖK kapsamındaki 23 Araştırma Üniversitesi korundu');
  } else if (preset === 'pre_1993') {
    universities.forEach(u => { u.removed = (u.founded > 1992); });
    const count = universities.filter(u => !u.removed).length;
    showToast(`1992 ve öncesinde kurulan ${count} köklü üniversite korundu`);
  } else if (preset === 'tech_research') {
    universities.forEach(u => {
      u.removed = !(u.isResearch || u.focus === 'Teknik & Bilim');
    });
    const count = universities.filter(u => !u.removed).length;
    showToast(`Teknik, Bilim ve Araştırma odaklı ${count} üniversite korundu`);
  } else if (preset === 'one_per_city') {
    const keepersByCity = {};
    universities.forEach(u => {
      const city = u.city;
      if (!keepersByCity[city]) {
        keepersByCity[city] = u;
      } else {
        const current = keepersByCity[city];
        if (u.type === 'Devlet' && current.type !== 'Devlet') {
          keepersByCity[city] = u;
        } else if (u.type === current.type) {
          if (u.founded < current.founded) {
            keepersByCity[city] = u;
          } else if (u.founded === current.founded) {
            const uStartsWithCity = u.name.toLocaleLowerCase('tr').startsWith(city.toLocaleLowerCase('tr'));
            const curStartsWithCity = current.name.toLocaleLowerCase('tr').startsWith(city.toLocaleLowerCase('tr'));
            if (uStartsWithCity && !curStartsWithCity) {
              keepersByCity[city] = u;
            }
          }
        }
      }
    });
    const keepIds = new Set(Object.values(keepersByCity).map(u => u.id));
    universities.forEach(u => {
      u.removed = !keepIds.has(u.id);
    });
    showToast(`81 ilin her birinde en köklü 1 merkez üniversite (${keepIds.size} kurum) korundu`);
  }

  updateUI();
}

function clearActivePresetHighlight() {
  presetChips.forEach(c => c.classList.remove('active'));
}

function matchesEra(uni, eraId) {
  if (eraId === 'all') return true;
  const def = ERA_DEFINITIONS.find(e => e.id === eraId);
  if (!def) return true;
  return uni.founded >= def.min && uni.founded <= def.max;
}

function getFilteredUniversities() {
  let filtered = universities.filter(uni => {
    const q = searchQuery;
    const matchesSearch = !q ||
      uni.name.toLocaleLowerCase('tr').includes(q) ||
      uni.city.toLocaleLowerCase('tr').includes(q) ||
      (uni.district && uni.district.toLocaleLowerCase('tr').includes(q)) ||
      uni.region.toLocaleLowerCase('tr').includes(q) ||
      (uni.focus && uni.focus.toLocaleLowerCase('tr').includes(q)) ||
      String(uni.founded).includes(q);

    const matchesType = currentFilter === 'all' || uni.type === currentFilter;
    const matchesStatus = currentStatusFilter === 'all' ||
      (currentStatusFilter === 'kept' && !uni.removed) ||
      (currentStatusFilter === 'removed' && uni.removed);
    const matchesRegion = currentRegion === 'all' || uni.region === currentRegion;
    const matchesCity = !currentCity || uni.city.toLocaleLowerCase('tr') === currentCity.toLocaleLowerCase('tr');
    const matchesFocus = currentFocus === 'all' ||
      (currentFocus === 'research' ? uni.isResearch : uni.focus === currentFocus);
    const matchesEraFilter = matchesEra(uni, currentEra);

    return matchesSearch && matchesType && matchesStatus && matchesRegion && matchesCity && matchesFocus && matchesEraFilter;
  });

  filtered.sort((a, b) => {
    if (currentSort === 'name') {
      return a.name.localeCompare(b.name, 'tr');
    } else if (currentSort === 'city') {
      const c = a.city.localeCompare(b.city, 'tr');
      return c !== 0 ? c : a.name.localeCompare(b.name, 'tr');
    } else if (currentSort === 'oldest') {
      return a.founded - b.founded || a.name.localeCompare(b.name, 'tr');
    } else if (currentSort === 'newest') {
      return b.founded - a.founded || a.name.localeCompare(b.name, 'tr');
    } else if (currentSort === 'depts_desc') {
      const sa = a.removed ? 0 : getUniDepartmentSummary(a.id).active;
      const sb = b.removed ? 0 : getUniDepartmentSummary(b.id).active;
      return sb - sa || a.name.localeCompare(b.name, 'tr');
    }
    return 0;
  });

  return filtered;
}

function getFilteredDepartments() {
  const q = deptSearchQuery;
  let filtered = departmentCatalog.filter(dept => {
    const matchesSearch = !q ||
      dept.name.toLocaleLowerCase('tr').includes(q) ||
      dept.category.toLocaleLowerCase('tr').includes(q) ||
      dept.scoreType.toLocaleLowerCase('tr').includes(q);
    const matchesDegree = currentDeptDegree === 'all' || dept.degree === currentDeptDegree;
    const matchesScore = currentDeptScore === 'all' || dept.scoreType === currentDeptScore;
    const matchesCategory = currentDeptCategory === 'all' || dept.category === currentDeptCategory;
    return matchesSearch && matchesDegree && matchesScore && matchesCategory;
  });

  const statsCache = new Map();
  filtered.forEach(d => statsCache.set(d.id, getNationalDepartmentStats(d.id)));

  filtered.sort((a, b) => {
    if (currentDeptSort === 'name') {
      return a.name.localeCompare(b.name, 'tr');
    }
    const sa = statsCache.get(a.id);
    const sb = statsCache.get(b.id);
    if (currentDeptSort === 'most_active') {
      return sb.activeUniCount - sa.activeUniCount || a.name.localeCompare(b.name, 'tr');
    }
    if (currentDeptSort === 'least_active') {
      return sa.activeUniCount - sb.activeUniCount || a.name.localeCompare(b.name, 'tr');
    }
    if (currentDeptSort === 'most_closed') {
      return sb.closedUniCount - sa.closedUniCount || a.name.localeCompare(b.name, 'tr');
    }
    if (currentDeptSort === 'most_added') {
      return sb.addedUniCount - sa.addedUniCount || a.name.localeCompare(b.name, 'tr');
    }
    return 0;
  });

  return { filtered, statsCache };
}

function renderSidebarList() {
  if (sidebarMode === 'departments') {
    renderDepartmentsSidebarList();
  } else {
    renderUniversityList();
  }
}

// Render Sidebar University List
function renderUniversityList() {
  const filtered = getFilteredUniversities();
  const activeInFiltered = filtered.filter(u => !u.removed).length;

  filteredCountText.textContent = `${filtered.length} kurum (${activeInFiltered} aktif)`;

  const hasAnyFilter = searchQuery !== '' ||
    currentFilter !== 'all' ||
    currentStatusFilter !== 'all' ||
    currentRegion !== 'all' ||
    currentCity !== null ||
    currentFocus !== 'all' ||
    currentEra !== 'all';

  resetFiltersBtn.classList.toggle('hidden', !hasAnyFilter);
  if (resetFiltersSep) {
    resetFiltersSep.style.display = hasAnyFilter ? 'inline' : 'none';
  }

  universityListEl.innerHTML = '';

  if (filtered.length === 0) {
    universityListEl.innerHTML = `
      <div class="empty-state">
        <p>Seçilen kriterlere uygun üniversite bulunamadı.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetAllFilters()">Tüm Filtreleri Sıfırla</button>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(uni => {
    const item = document.createElement('div');
    item.className = `uni-item ${uni.removed ? 'removed' : ''}`;
    item.setAttribute('role', 'listitem');
    item.onclick = (e) => {
      if (!e.target.closest('.action-btn')) {
        openModal(uni);
      }
    };

    const deptSum = getUniDepartmentSummary(uni.id);
    const activeDeptDisplay = uni.removed ? 0 : deptSum.active;
    const addedBadge = deptSum.addedActive > 0
      ? `<span class="uni-badge badge-added-mini" title="Yeni açılan bölüm sayısı">+${deptSum.addedActive} Yeni</span>`
      : '';

    const typeBadgeClass = uni.type === 'Devlet' ? 'badge-state' : 'badge-foundation';
    const researchTag = uni.isResearch
      ? `<span class="uni-badge badge-research-mini" title="YÖK Araştırma Üniversitesi">Araştırma</span>`
      : '';
    const locationLabel = uni.district ? `${uni.city} · ${uni.district}` : uni.city;

    const actionIcon = uni.removed
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    item.innerHTML = `
      <div class="uni-logo-box">
        <img src="${uni.logo}" alt="${uni.name}" class="uni-logo" loading="lazy" onerror="handleLogoError(this)">
      </div>
      <div class="uni-info">
        <div class="uni-name" title="${uni.name}">${uni.name}</div>
        <div class="uni-meta">
          <span class="uni-location">${locationLabel}</span>
          <span>•</span>
          <span>${uni.founded}</span>
          <span class="uni-badge ${typeBadgeClass}">${uni.type}</span>
          ${researchTag}
          <span class="uni-badge badge-dept-count" title="Aktif / Toplam Bölüm (${deptSum.lisansActive} Lisans, ${deptSum.onlisansActive} Önlisans)">${activeDeptDisplay}/${deptSum.total} Bölüm</span>
          ${addedBadge}
        </div>
      </div>
      <button class="action-btn" onclick="toggleUniversity(${uni.id})" title="${uni.removed ? 'Sisteme Geri Ekle' : 'Sistemden Kaldır'}" aria-label="${uni.removed ? 'Geri Ekle' : 'Kaldır'}">
        ${actionIcon}
      </button>
    `;

    fragment.appendChild(item);
  });

  universityListEl.appendChild(fragment);
}

// Render Sidebar National Departments List
function renderDepartmentsSidebarList() {
  const { filtered, statsCache } = getFilteredDepartments();
  filteredDeptCountText.textContent = `${filtered.length} bölüm listeleniyor`;

  const hasDeptFilter = deptSearchQuery !== '' ||
    currentDeptDegree !== 'all' ||
    currentDeptScore !== 'all' ||
    currentDeptCategory !== 'all';

  resetDeptFiltersBtn.classList.toggle('hidden', !hasDeptFilter);
  universityListEl.innerHTML = '';

  if (filtered.length === 0) {
    universityListEl.innerHTML = `
      <div class="empty-state">
        <p>Seçilen kriterlere uygun bölüm bulunamadı.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetDepartmentFilters()">Bölüm Filtrelerini Sıfırla</button>
      </div>
    `;
    return;
  }

  const focusedMapDeptId = typeof getMapDepartmentFocus === 'function' ? getMapDepartmentFocus() : null;
  const fragment = document.createDocumentFragment();

  filtered.forEach(dept => {
    const stats = statsCache.get(dept.id);
    const isMapFocused = focusedMapDeptId === dept.id;
    const item = document.createElement('div');
    item.className = `uni-item dept-sidebar-item ${stats.activeUniCount === 0 ? 'removed' : ''} ${isMapFocused ? 'focused-dept-item' : ''}`;
    item.setAttribute('role', 'listitem');

    item.onclick = (e) => {
      if (!e.target.closest('.dept-map-btn')) {
        openDepartmentModal(dept.id);
      }
    };

    const scoreColor = SCORE_COLORS[dept.scoreType] || '#3b82f6';
    const customTag = dept.isCustom ? `<span class="uni-badge badge-added-mini">Özel Bölüm</span>` : '';
    const addedTag = stats.addedUniCount > 0 ? `<span class="uni-badge badge-added-mini">+${stats.addedUniCount} Yeni</span>` : '';
    const closedTag = stats.closedUniCount > 0 ? `<span class="uni-badge badge-closed-mini">-${stats.closedUniCount} Kapalı</span>` : '';

    item.innerHTML = `
      <div class="dept-score-box" style="border-color:${scoreColor}44; color:${scoreColor};">
        <span class="dept-score-code">${dept.scoreType}</span>
        <small class="dept-degree-mini">${dept.degree === 'Lisans' ? 'LİS' : 'ÖNL'}</small>
      </div>
      <div class="uni-info">
        <div class="uni-name" title="${dept.name}">${dept.name}</div>
        <div class="uni-meta">
          <span class="uni-location">${stats.activeUniCount} Üni. (${stats.activeCityCount} İl)</span>
          <span>•</span>
          <span>${dept.category}</span>
          ${customTag}
          ${addedTag}
          ${closedTag}
        </div>
      </div>
      <button class="action-btn dept-map-btn ${isMapFocused ? 'active-map-focus' : ''}" onclick="focusDepartmentOnMap(${dept.id})" title="Haritada Dağılımını Göster">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
      </button>
    `;

    fragment.appendChild(item);
  });

  universityListEl.appendChild(fragment);
}

// Toggle Individual University
function toggleUniversity(id) {
  const uni = universities.find(u => u.id === id);
  if (uni) {
    uni.removed = !uni.removed;
    if (!uni.removed) {
      // If re-opening a university where all departments were manually closed, re-open its base departments
      const sum = getUniDepartmentSummary(uni.id);
      if (sum.active === 0) {
        closedDeptsByUni.get(uni.id).clear();
      }
    }
    clearActivePresetHighlight();
    updateUI();
  }
}

// Update KPI Strip
function updateStats() {
  const total = universities.length;
  const totalState = universities.filter(u => u.type === 'Devlet').length;
  const totalFoundation = universities.filter(u => u.type === 'Vakıf').length;
  const totalResearch = universities.filter(u => u.isResearch).length;

  const activeUnis = universities.filter(u => !u.removed);
  const kept = activeUnis.length;
  const removed = total - kept;

  const stateActive = activeUnis.filter(u => u.type === 'Devlet').length;
  const foundationActive = activeUnis.filter(u => u.type === 'Vakıf').length;
  const researchActive = activeUnis.filter(u => u.isResearch).length;

  const keptPct = total > 0 ? Math.round((kept / total) * 100) : 0;
  const removedPct = total > 0 ? Math.round((removed / total) * 100) : 0;
  const stateShare = kept > 0 ? Math.round((stateActive / kept) * 100) : 0;
  const researchPct = totalResearch > 0 ? Math.round((researchActive / totalResearch) * 100) : 0;

  // Calculate Department Branch Metrics across all 203 universities
  let baseBranchesTotal = 0;
  let activeBranchesTotal = 0;
  let closedBranchesTotal = 0;
  let addedBranchesTotal = 0;
  let lisansActiveBranches = 0;
  let onlisansActiveBranches = 0;
  const activeUniqueDeptIds = new Set();

  universities.forEach(u => {
    const baseSet = baseUniDeptsMap.get(u.id) || new Set();
    const closedSet = closedDeptsByUni.get(u.id) || new Set();
    const addedSet = addedDeptsByUni.get(u.id) || new Set();
    baseBranchesTotal += baseSet.size;

    const allIds = new Set([...baseSet, ...addedSet]);
    allIds.forEach(dId => {
      const dept = departmentByIdMap.get(dId);
      if (!dept) return;
      const isBranchActive = !u.removed && !closedSet.has(dId);
      if (isBranchActive) {
        activeBranchesTotal++;
        activeUniqueDeptIds.add(dId);
        if (addedSet.has(dId)) addedBranchesTotal++;
        if (dept.degree === 'Lisans') lisansActiveBranches++;
        else onlisansActiveBranches++;
      } else if (baseSet.has(dId)) {
        closedBranchesTotal++;
      }
    });
  });

  const activeDeptPct = baseBranchesTotal > 0 ? Math.round((activeBranchesTotal / baseBranchesTotal) * 100) : 0;
  const lisansSharePct = activeBranchesTotal > 0 ? Math.round((lisansActiveBranches / activeBranchesTotal) * 100) : 0;

  // All 81 provinces coverage
  const allCities = new Set(universities.map(u => u.city));
  const activeCities = new Set(activeUnis.map(u => u.city));
  const totalCityCount = allCities.size; // 81
  const activeCityCount = activeCities.size;
  const emptyCityCount = totalCityCount - activeCityCount;
  const cityCoveragePct = totalCityCount > 0 ? Math.round((activeCityCount / totalCityCount) * 100) : 0;

  if (kept > 0) {
    const sumYear = activeUnis.reduce((acc, u) => acc + u.founded, 0);
    const avgYear = Math.round(sumYear / kept);
    const minFounded = Math.min(...activeUnis.map(u => u.founded));
    if (avgFoundedYearEl) avgFoundedYearEl.textContent = avgYear;
    if (oldestActiveSubEl) oldestActiveSubEl.innerHTML = `En köklü: ${minFounded} · Ort. <span id="avgFoundedYear">${avgYear}</span>`;
  } else {
    if (oldestActiveSubEl) oldestActiveSubEl.textContent = 'Aktif kurum yok';
  }

  totalCountEl.textContent = total;
  if (totalCatalogBadgeEl) totalCatalogBadgeEl.textContent = `${departmentCatalog.length} Bölüm`;
  if (totalSubTextEl) totalSubTextEl.textContent = `${totalState} Devlet · ${totalFoundation} Vakıf`;
  if (sidebarUniTabCount) sidebarUniTabCount.textContent = `${kept}/${total}`;
  if (sidebarDeptTabCount) sidebarDeptTabCount.textContent = `${activeUniqueDeptIds.size}/${departmentCatalog.length}`;

  keptCountEl.textContent = kept;
  removedCountEl.textContent = removed;

  if (activeDeptBranchesCountEl) activeDeptBranchesCountEl.textContent = activeBranchesTotal.toLocaleString('tr-TR');
  if (baseDeptBranchesRefEl) baseDeptBranchesRefEl.textContent = `/ ${baseBranchesTotal.toLocaleString('tr-TR')}`;
  if (activeDeptPctBadgeEl) activeDeptPctBadgeEl.textContent = `${activeDeptPct}%`;
  if (deptDeltaSubEl) deptDeltaSubEl.textContent = `${closedBranchesTotal.toLocaleString('tr-TR')} kapalı · +${addedBranchesTotal.toLocaleString('tr-TR')} yeni`;

  // Faculty Statistics
  let totalBaseFaculties = 0;
  let activeFacultiesTotal = 0;
  let disabledFacultiesTotal = 0;
  let customFacultiesTotal = 0;

  universities.forEach(u => {
    const baseFacs = baseUniFacultiesMap.get(u.id) || [];
    const customFacs = customFacultiesByUni.get(u.id) || [];
    const disabledSet = disabledFacultiesByUni.get(u.id) || new Set();

    totalBaseFaculties += baseFacs.length;
    customFacultiesTotal += customFacs.length;
    disabledFacultiesTotal += disabledSet.size;

    const allFacs = [...baseFacs, ...customFacs];
    allFacs.forEach(f => {
      if (isFacultyActive(u.id, f.id)) {
        activeFacultiesTotal++;
      }
    });
  });

  const activeFacPct = totalBaseFaculties > 0 ? Math.round((activeFacultiesTotal / totalBaseFaculties) * 100) : 100;
  if (activeFacultiesCountEl) activeFacultiesCountEl.textContent = activeFacultiesTotal.toLocaleString('tr-TR');
  if (baseFacultiesRefEl) baseFacultiesRefEl.textContent = `/ ${totalBaseFaculties.toLocaleString('tr-TR')}`;
  if (activeFacultyPctBadgeEl) activeFacultyPctBadgeEl.textContent = `${activeFacPct}%`;
  if (facultyDeltaSubEl) facultyDeltaSubEl.textContent = `${disabledFacultiesTotal} pasif · +${customFacultiesTotal} yeni`;

  if (activeLisansCountEl) activeLisansCountEl.textContent = `${lisansActiveBranches.toLocaleString('tr-TR')} L`;
  if (activeOnlisansRefEl) activeOnlisansRefEl.textContent = `· ${onlisansActiveBranches.toLocaleString('tr-TR')} ÖL`;
  if (lisansShareBadgeEl) lisansShareBadgeEl.textContent = `${lisansSharePct}% Lisans`;
  if (activeUniqueDeptsSubEl) activeUniqueDeptsSubEl.textContent = `${activeUniqueDeptIds.size} / ${departmentCatalog.length} farklı bölüm aktif`;

  stateCountEl.textContent = stateActive;
  if (foundationCountRefEl) foundationCountRefEl.textContent = `D · ${foundationActive} V`;
  if (foundationCountEl) foundationCountEl.textContent = foundationActive;
  activeCitiesCountEl.textContent = activeCityCount;
  if (researchCountEl) researchCountEl.textContent = researchActive;

  keptPercentBadge.textContent = `${keptPct}%`;
  removedPercentBadge.textContent = `${removedPct}%`;
  stateShareBadge.textContent = `${stateShare}% D`;
  emptyCitiesBadge.textContent = emptyCityCount === 0 ? '81 İl Tam' : `${emptyCityCount} İl Boş`;
  emptyCitiesBadge.className = `stat-pill ${emptyCityCount === 0 ? 'success' : 'danger'}`;
  if (researchPercentBadge) researchPercentBadge.textContent = `${researchPct}%`;

  keptProgressBar.style.width = `${keptPct}%`;
  removedProgressBar.style.width = `${removedPct}%`;
  cityCoverageBar.style.width = `${cityCoveragePct}%`;

  stateRemovedSub.textContent = `${totalState - stateActive} D · ${totalFoundation - foundationActive} V kaldırıldı`;

  if (currentCity) {
    const cityUnis = universities.filter(u => u.city.toLocaleLowerCase('tr') === currentCity.toLocaleLowerCase('tr'));
    const activeInCity = cityUnis.filter(u => !u.removed).length;
    cityFilterText.textContent = `Seçili İl: ${currentCity} (${activeInCity} / ${cityUnis.length} Aktif)`;
  }

  // Update Map Department Focus Banner if active
  const focusedMapDeptId = typeof getMapDepartmentFocus === 'function' ? getMapDepartmentFocus() : null;
  if (focusedMapDeptId !== null) {
    const dept = getDepartmentById(focusedMapDeptId);
    if (dept) {
      const st = getNationalDepartmentStats(dept.id);
      mapDeptFocusText.textContent = `Bölüm Odağı: ${dept.name} (${dept.scoreType} · ${dept.degree}) — ${st.activeUniCount} Üni. / ${st.activeCityCount} İlde Aktif`;
    }
  }
}

// Render All Analytical Charts
function renderCharts() {
  renderRegionChart();
  renderTypeAndFocusCharts();
  renderDeptCategoryAndScoreCharts();
  renderEraChart();
  renderCityRanking();
}

function renderRegionChart() {
  const regionChartEl = document.getElementById('regionChart');
  if (!regionChartEl) return;

  const regionsOrder = [
    'Marmara', 'İç Anadolu', 'Ege', 'Akdeniz',
    'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu'
  ];

  const statsByRegion = {};
  regionsOrder.forEach(r => {
    statsByRegion[r] = { total: 0, active: 0, state: 0, foundation: 0 };
  });

  universities.forEach(u => {
    const r = u.region;
    if (!statsByRegion[r]) {
      statsByRegion[r] = { total: 0, active: 0, state: 0, foundation: 0 };
    }
    statsByRegion[r].total++;
    if (!u.removed) {
      statsByRegion[r].active++;
      if (u.type === 'Devlet') statsByRegion[r].state++;
      else statsByRegion[r].foundation++;
    }
  });

  const maxTotal = Math.max(...Object.values(statsByRegion).map(s => s.total), 1);
  regionChartEl.innerHTML = '';

  regionsOrder.forEach(region => {
    const s = statsByRegion[region];
    if (!s || s.total === 0) return;

    const widthPct = (s.active / maxTotal) * 100;
    const totalWidthPct = (s.total / maxTotal) * 100;
    const keptRatio = Math.round((s.active / s.total) * 100);
    const isFilteredRegion = currentRegion === region;

    const item = document.createElement('div');
    item.className = `bar-item interactive-row ${isFilteredRegion ? 'selected-row' : ''}`;
    item.title = `${region}: Filtrelemek için tıklayın (${s.state} Devlet, ${s.foundation} Vakıf aktif)`;
    item.onclick = () => {
      currentRegion = currentRegion === region ? 'all' : region;
      regionFilterEl.value = currentRegion;
      renderSidebarList();
      renderCharts();
    };

    item.innerHTML = `
      <div class="bar-label">${region}</div>
      <div class="bar-track" title="Toplam: ${s.total} | Aktif: ${s.active} (${s.state} D · ${s.foundation} V)">
        <div class="bar-ghost" style="width: ${totalWidthPct}%"></div>
        <div class="bar-fill" style="width: ${widthPct}%"></div>
      </div>
      <div class="bar-value">
        <strong>${s.active}</strong><span class="bar-total">/${s.total}</span>
        <span class="bar-pct">(%${keptRatio})</span>
      </div>
    `;
    regionChartEl.appendChild(item);
  });
}

function renderTypeAndFocusCharts() {
  const activeUnis = universities.filter(u => !u.removed);
  const stateCount = activeUnis.filter(u => u.type === 'Devlet').length;
  const foundationCount = activeUnis.filter(u => u.type === 'Vakıf').length;
  const totalState = universities.filter(u => u.type === 'Devlet').length;
  const totalFoundation = universities.filter(u => u.type === 'Vakıf').length;
  const totalActive = activeUnis.length;

  const statePercentage = totalActive > 0 ? Math.round((stateCount / totalActive) * 100) : 0;

  const circleEl = document.getElementById('stateCircle');
  const percentageEl = document.getElementById('statePercentage');
  const legendStateVal = document.getElementById('legendStateVal');
  const legendFoundationVal = document.getElementById('legendFoundationVal');
  const avgPerCityVal = document.getElementById('avgPerCityVal');
  const top3ShareVal = document.getElementById('top3ShareVal');

  if (circleEl && percentageEl) {
    circleEl.setAttribute('stroke-dasharray', `${statePercentage}, 100`);
    percentageEl.textContent = `${statePercentage}%`;
  }

  if (legendStateVal && legendFoundationVal) {
    legendStateVal.textContent = `${stateCount} / ${totalState}`;
    legendFoundationVal.textContent = `${foundationCount} / ${totalFoundation}`;
  }

  const activeCities = new Set(activeUnis.map(u => u.city)).size;
  if (avgPerCityVal) {
    avgPerCityVal.textContent = activeCities > 0 ? (totalActive / activeCities).toFixed(2) : '0.00';
  }

  if (top3ShareVal) {
    const top3Active = activeUnis.filter(u =>
      u.city === 'İstanbul' || u.city === 'Ankara' || u.city === 'İzmir'
    ).length;
    const top3Pct = totalActive > 0 ? ((top3Active / totalActive) * 100).toFixed(1) : '0.0';
    top3ShareVal.textContent = `%${top3Pct} (${top3Active})`;
  }

  const focusChartEl = document.getElementById('focusChart');
  if (!focusChartEl) return;

  const focusGroups = [
    { key: 'research', label: 'YÖK Araştırma Üni.', color: '#06b6d4', match: u => u.isResearch },
    { key: 'Teknik & Bilim', label: 'Teknik & Bilim Odaklı', color: '#3b82f6', match: u => u.focus === 'Teknik & Bilim' },
    { key: 'Sağlık & Tıp', label: 'Sağlık & Tıp Odaklı', color: '#10b981', match: u => u.focus === 'Sağlık & Tıp' },
    { key: 'Sanat & Sosyal', label: 'Sanat & Sosyal Odaklı', color: '#f59e0b', match: u => u.focus === 'Sanat & Sosyal' },
    { key: 'Kapsamlı', label: 'Kapsamlı Üniversiteler', color: '#6366f1', match: u => u.focus === 'Kapsamlı' }
  ];

  focusChartEl.innerHTML = focusGroups.map(g => {
    const allInGroup = universities.filter(g.match).length;
    const activeInGroup = activeUnis.filter(g.match).length;
    const pct = allInGroup > 0 ? Math.round((activeInGroup / allInGroup) * 100) : 0;
    const isSelected = currentFocus === g.key;

    return `
      <div class="focus-chip-card ${isSelected ? 'selected' : ''}" data-focus-key="${g.key}" title="Filtrelemek için tıklayın">
        <div class="focus-chip-top">
          <span class="focus-dot" style="background:${g.color}"></span>
          <span class="focus-name">${g.label}</span>
        </div>
        <div class="focus-chip-stats">
          <strong>${activeInGroup}</strong><span>/${allInGroup}</span>
          <small>%${pct}</small>
        </div>
      </div>
    `;
  }).join('');

  focusChartEl.querySelectorAll('.focus-chip-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-focus-key');
      currentFocus = currentFocus === key ? 'all' : key;
      focusFilterEl.value = currentFocus;
      renderSidebarList();
      renderCharts();
    });
  });
}

function renderDeptCategoryAndScoreCharts() {
  const catChartEl = document.getElementById('deptCategoryChart');
  const scoreChartEl = document.getElementById('deptScoreChart');
  const movementFooterEl = document.getElementById('deptMovementFooter');
  if (!catChartEl || !scoreChartEl) return;

  const categoriesOrder = [
    'Mühendislik & Mimarlık',
    'Sağlık & Tıp Bilimleri',
    'Hukuk, İktisat & İdari Bilimler',
    'Eğitim & Öğretmenlik',
    'Temel Bilimler & Tarım',
    'Sosyal, Beşeri, Dil & Sanat',
    'Teknik & Bilişim (Önlisans)',
    'Sağlık Hizmetleri (Önlisans)',
    'Meslek Yüksekokulu (Önlisans)'
  ];

  const catStats = {};
  categoriesOrder.forEach(c => { catStats[c] = { base: 0, active: 0 }; });

  const scoreOrder = ['SAY', 'EA', 'SÖZ', 'DİL', 'TYT'];
  const scoreStats = {};
  scoreOrder.forEach(s => { scoreStats[s] = { base: 0, active: 0 }; });

  let totalClosedBranches = 0;
  let totalAddedBranches = 0;

  universities.forEach(u => {
    const baseSet = baseUniDeptsMap.get(u.id) || new Set();
    const closedSet = closedDeptsByUni.get(u.id) || new Set();
    const addedSet = addedDeptsByUni.get(u.id) || new Set();

    baseSet.forEach(dId => {
      const d = departmentByIdMap.get(dId);
      if (!d) return;
      if (catStats[d.category]) catStats[d.category].base++;
      if (scoreStats[d.scoreType]) scoreStats[d.scoreType].base++;
    });

    const allIds = new Set([...baseSet, ...addedSet]);
    allIds.forEach(dId => {
      const d = departmentByIdMap.get(dId);
      if (!d) return;
      const isBranchActive = !u.removed && !closedSet.has(dId);
      if (isBranchActive) {
        if (catStats[d.category]) catStats[d.category].active++;
        if (scoreStats[d.scoreType]) scoreStats[d.scoreType].active++;
        if (addedSet.has(dId)) totalAddedBranches++;
      } else if (baseSet.has(dId)) {
        totalClosedBranches++;
      }
    });
  });

  // Render Academic Category Bars
  const maxCatVal = Math.max(...Object.values(catStats).map(s => Math.max(s.base, s.active)), 1);
  catChartEl.innerHTML = '';

  categoriesOrder.forEach(cat => {
    const s = catStats[cat];
    if (!s) return;
    const widthPct = Math.min(100, (s.active / maxCatVal) * 100);
    const baseWidthPct = Math.min(100, (s.base / maxCatVal) * 100);
    const ratio = s.base > 0 ? Math.round((s.active / s.base) * 100) : 100;
    const isSelected = currentDeptCategory === cat && sidebarMode === 'departments';

    const row = document.createElement('div');
    row.className = `bar-item interactive-row ${isSelected ? 'selected-row' : ''}`;
    row.title = `${cat}: Bölümler sekmesinde filtrelemek için tıklayın`;
    row.onclick = () => {
      sidebarTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-sidebar-mode') === 'departments'));
      sidebarMode = 'departments';
      uniControlsSection.classList.add('hidden');
      deptControlsSection.classList.remove('hidden');
      currentDeptCategory = currentDeptCategory === cat ? 'all' : cat;
      deptCategoryFilterEl.value = currentDeptCategory;
      renderSidebarList();
      renderCharts();
    };

    row.innerHTML = `
      <div class="bar-label era-label">${cat}</div>
      <div class="bar-track">
        <div class="bar-ghost" style="width: ${baseWidthPct}%"></div>
        <div class="bar-fill" style="width: ${widthPct}%"></div>
      </div>
      <div class="bar-value">
        <strong>${s.active}</strong><span class="bar-total">/${s.base}</span>
        <span class="bar-pct">(%${ratio})</span>
      </div>
    `;
    catChartEl.appendChild(row);
  });

  // Render Score Type Bars
  const scoreLabels = {
    'SAY': 'SAY · Sayısal (Lisans)',
    'EA':  'EA · Eşit Ağırlık (Lisans)',
    'SÖZ': 'SÖZ · Sözel (Lisans)',
    'DİL': 'DİL · Yabancı Dil (Lisans)',
    'TYT': 'TYT · Önlisans (2 Yıllık MYO)'
  };
  const maxScoreVal = Math.max(...Object.values(scoreStats).map(s => Math.max(s.base, s.active)), 1);
  scoreChartEl.innerHTML = '';

  scoreOrder.forEach(sc => {
    const s = scoreStats[sc];
    const widthPct = Math.min(100, (s.active / maxScoreVal) * 100);
    const baseWidthPct = Math.min(100, (s.base / maxScoreVal) * 100);
    const ratio = s.base > 0 ? Math.round((s.active / s.base) * 100) : 100;
    const isSelected = currentDeptScore === sc && sidebarMode === 'departments';
    const color = SCORE_COLORS[sc] || '#3b82f6';

    const row = document.createElement('div');
    row.className = `bar-item interactive-row ${isSelected ? 'selected-row' : ''}`;
    row.onclick = () => {
      sidebarTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-sidebar-mode') === 'departments'));
      sidebarMode = 'departments';
      uniControlsSection.classList.add('hidden');
      deptControlsSection.classList.remove('hidden');
      currentDeptScore = currentDeptScore === sc ? 'all' : sc;
      scorePills.forEach(p => p.classList.toggle('active', p.getAttribute('data-score') === currentDeptScore));
      renderSidebarList();
      renderCharts();
    };

    row.innerHTML = `
      <div class="bar-label era-label">${scoreLabels[sc]}</div>
      <div class="bar-track">
        <div class="bar-ghost" style="width: ${baseWidthPct}%"></div>
        <div class="bar-fill" style="width: ${widthPct}%; background: ${color};"></div>
      </div>
      <div class="bar-value">
        <strong>${s.active}</strong><span class="bar-total">/${s.base}</span>
        <span class="bar-pct">(%${ratio})</span>
      </div>
    `;
    scoreChartEl.appendChild(row);
  });

  if (movementFooterEl) {
    movementFooterEl.innerHTML = `
      <div class="era-stat-pill">
        <span>Kapatılan Bölüm Şubesi</span>
        <strong style="color:var(--accent-danger)">-${totalClosedBranches.toLocaleString('tr-TR')} Şube</strong>
      </div>
      <div class="era-stat-pill">
        <span>Yeni Açılan Bölüm Şubesi</span>
        <strong style="color:var(--accent-success)">+${totalAddedBranches.toLocaleString('tr-TR')} Şube</strong>
      </div>
      <div class="era-stat-pill">
        <span>Özel Tanımlanan Bölüm</span>
        <strong style="color:var(--accent-cyan)">${customDepartments.length} Bölüm</strong>
      </div>
    `;
  }
}

function renderEraChart() {
  const eraChartEl = document.getElementById('eraChart');
  const eraFooterEl = document.getElementById('eraSummaryFooter');
  if (!eraChartEl) return;

  const eraStats = ERA_DEFINITIONS.map(era => {
    const allInEra = universities.filter(u => u.founded >= era.min && u.founded <= era.max);
    const activeInEra = allInEra.filter(u => !u.removed);
    return {
      ...era,
      total: allInEra.length,
      active: activeInEra.length,
      stateActive: activeInEra.filter(u => u.type === 'Devlet').length,
      foundationActive: activeInEra.filter(u => u.type === 'Vakıf').length
    };
  });

  const maxTotal = Math.max(...eraStats.map(e => e.total), 1);
  eraChartEl.innerHTML = '';

  eraStats.forEach(e => {
    const widthPct = (e.active / maxTotal) * 100;
    const totalWidthPct = (e.total / maxTotal) * 100;
    const keptPct = e.total > 0 ? Math.round((e.active / e.total) * 100) : 0;
    const isSelected = currentEra === e.id;

    const row = document.createElement('div');
    row.className = `bar-item interactive-row ${isSelected ? 'selected-row' : ''}`;
    row.title = `${e.label} (${e.stateActive} Devlet, ${e.foundationActive} Vakıf aktif) — Filtrelemek için tıklayın`;
    row.onclick = () => {
      currentEra = currentEra === e.id ? 'all' : e.id;
      eraFilterEl.value = currentEra;
      renderSidebarList();
      renderCharts();
    };

    row.innerHTML = `
      <div class="bar-label era-label">${e.label}</div>
      <div class="bar-track">
        <div class="bar-ghost" style="width: ${totalWidthPct}%"></div>
        <div class="bar-fill" style="width: ${widthPct}%; background: ${e.color};"></div>
      </div>
      <div class="bar-value">
        <strong>${e.active}</strong><span class="bar-total">/${e.total}</span>
        <span class="bar-pct">(%${keptPct})</span>
      </div>
    `;
    eraChartEl.appendChild(row);
  });

  if (eraFooterEl) {
    const activeUnis = universities.filter(u => !u.removed);
    const pre2006Active = activeUnis.filter(u => u.founded <= 2005).length;
    const post2006Active = activeUnis.filter(u => u.founded >= 2006).length;
    const historicalRootCount = activeUnis.filter(u => u.founded < 1933).length;

    eraFooterEl.innerHTML = `
      <div class="era-stat-pill">
        <span>2006 Öncesi Aktif</span>
        <strong>${pre2006Active} Kurum</strong>
      </div>
      <div class="era-stat-pill">
        <span>2006 ve Sonrası Aktif</span>
        <strong>${post2006Active} Kurum</strong>
      </div>
      <div class="era-stat-pill">
        <span>1933 Öncesi Köklü Kurum</span>
        <strong>${historicalRootCount} Kurum</strong>
      </div>
    `;
  }
}

function renderCityRanking() {
  const container = document.getElementById('cityRankingList');
  if (!container) return;

  const cities = getAllUniqueCities();
  const cityData = cities.map(city => {
    const cityUnis = universities.filter(u => u.city === city);
    const activeUnis = cityUnis.filter(u => !u.removed);
    let activeDepts = 0;
    activeUnis.forEach(u => { activeDepts += getUniDepartmentSummary(u.id).active; });
    return {
      city,
      total: cityUnis.length,
      active: activeUnis.length,
      activeDepts,
      state: activeUnis.filter(u => u.type === 'Devlet').length,
      foundation: activeUnis.filter(u => u.type === 'Vakıf').length,
      research: activeUnis.filter(u => u.isResearch).length
    };
  });

  cityData.sort((a, b) => b.active - a.active || b.activeDepts - a.activeDepts || a.city.localeCompare(b.city, 'tr'));

  const displayed = showAllCitiesInRanking ? cityData : cityData.slice(0, 12);
  const maxTotal = Math.max(...cityData.map(c => c.total), 1);

  container.innerHTML = displayed.map((c, idx) => {
    const isSelected = currentCity && currentCity.toLocaleLowerCase('tr') === c.city.toLocaleLowerCase('tr');
    const barPct = Math.max(4, Math.round((c.active / maxTotal) * 100));
    const researchBadge = c.research > 0
      ? `<span class="city-rank-tag research" title="${c.research} Araştırma Üniversitesi">${c.research} Araş.</span>`
      : '';

    return `
      <div class="city-rank-row ${isSelected ? 'selected' : ''} ${c.active === 0 ? 'empty-city' : ''}" data-city="${c.city}">
        <span class="city-rank-num">${idx + 1}</span>
        <div class="city-rank-main">
          <div class="city-rank-top">
            <strong class="city-rank-name">${c.city}</strong>
            <div class="city-rank-tags">
              ${researchBadge}
              <span class="city-rank-tag state">${c.state} D</span>
              ${c.foundation > 0 ? `<span class="city-rank-tag foundation">${c.foundation} V</span>` : ''}
              <span class="city-rank-tag depts">${c.activeDepts} Böl.</span>
            </div>
          </div>
          <div class="city-rank-bar-wrap">
            <div class="city-rank-bar" style="width:${barPct}%"></div>
          </div>
        </div>
        <div class="city-rank-count">
          <strong>${c.active}</strong><span>/${c.total}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.city-rank-row').forEach(row => {
    row.addEventListener('click', () => {
      const city = row.getAttribute('data-city');
      const nextCity = (currentCity && currentCity.toLocaleLowerCase('tr') === city.toLocaleLowerCase('tr')) ? null : city;
      setCityFilter(nextCity, true);
    });
  });
}

// Master UI Refresh
function updateUI() {
  saveUniversitiesState();
  populateCitySelectOptions();
  updateStats();
  renderSidebarList();
  updateMap();
  renderCharts();
}

// ============================================================================
// UNIVERSITY MODAL LOGIC (Manage University & Its Departments)
// ============================================================================
function openModal(uni) {
  currentModalUniId = uni.id;
  uniModalDeptSearch.value = '';
  uniModalAddSearch.value = '';
  switchUniModalTab('depts');
  syncModalState(uni);
  modal.style.display = 'flex';
}

function switchUniModalTab(tabName) {
  currentUniModalTab = tabName;
  uniModalTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-uni-tab') === tabName));
  uniModalTabDepts.classList.toggle('hidden', tabName !== 'depts');
  uniModalTabAdd.classList.toggle('hidden', tabName !== 'add');
  uniModalTabInfo.classList.toggle('hidden', tabName !== 'info');

  if (currentModalUniId !== null) {
    if (tabName === 'depts') renderUniModalDepartments(currentModalUniId);
    if (tabName === 'add') renderUniModalAddCatalog(currentModalUniId);
  }
}

function syncModalState(uni) {
  modalLogo.onerror = () => handleLogoError(modalLogo);
  modalLogo.src = uni.logo;
  modalTitle.textContent = uni.name;

  const age = Math.max(1, CURRENT_YEAR - uni.founded);
  const loc = uni.district ? `${uni.city} (${uni.district})` : uni.city;
  if (modalQuickMeta) {
    modalQuickMeta.textContent = `${loc} · ${uni.region} · Kuruluş: ${uni.founded} (${age} yıllık)`;
  }

  modalType.textContent = `${uni.type} Üniversitesi`;
  modalType.className = `badge ${uni.type === 'Devlet' ? 'badge-state' : 'badge-foundation'}`;

  if (modalResearchBadge) {
    modalResearchBadge.classList.toggle('hidden', !uni.isResearch);
  }
  if (modalFocusBadge) {
    modalFocusBadge.textContent = uni.focus || 'Kapsamlı';
  }

  modalStatusBadge.textContent = uni.removed ? 'Kaldırıldı (Pasif)' : 'Korunuyor (Aktif)';
  modalStatusBadge.className = `badge ${uni.removed ? 'badge-removed' : 'badge-kept'}`;

  const deptSum = getUniDepartmentSummary(uni.id);
  if (modalUniDeptsCountBadge) {
    modalUniDeptsCountBadge.textContent = `${uni.removed ? 0 : deptSum.active}/${deptSum.total}`;
  }

  if (uniDeptSummaryBar) {
    uniDeptSummaryBar.innerHTML = `
      <div class="dept-sum-item"><span>Aktif Bölüm</span><strong style="color:var(--accent-success)">${uni.removed ? 0 : deptSum.active}</strong></div>
      <div class="dept-sum-item"><span>Kapatılan</span><strong style="color:var(--accent-danger)">${deptSum.closed}</strong></div>
      <div class="dept-sum-item"><span>Yeni Açılan</span><strong style="color:var(--accent-cyan)">+${deptSum.addedActive}</strong></div>
      <div class="dept-sum-item"><span>Fakülte &amp; MYO</span><strong style="color:var(--accent-purple)">${uni.removed ? 0 : deptSum.activeFaculties} / ${deptSum.totalFaculties} Aktif</strong></div>
      <div class="dept-sum-item"><span>Lisans / Önlisans</span><strong>${deptSum.lisansActive} L · ${deptSum.onlisansActive} ÖL</strong></div>
    `;
  }

  // Update View Mode Buttons
  if (uniViewFacultyBtn && uniViewFlatBtn) {
    uniViewFacultyBtn.classList.toggle('active', uniModalDeptViewMode === 'faculty');
    uniViewFlatBtn.classList.toggle('active', uniModalDeptViewMode === 'flat');
  }

  // Populate Faculty Filter dropdown
  if (uniModalFacultyFilter) {
    const allFacs = getUniFaculties(uni.id);
    const depts = getUniDepartmentList(uni.id);
    let facHtml = `<option value="all" ${currentUniModalFacultyFilter === 'all' ? 'selected' : ''}>Tüm Fakülte ve Birimler (${depts.length} Bölüm)</option>`;
    allFacs.forEach(f => {
      const fDepts = depts.filter(d => d.effectiveFacultyId === f.id);
      const activeF = fDepts.filter(d => d.isActive).length;
      const isSel = currentUniModalFacultyFilter === f.id ? 'selected' : '';
      facHtml += `<option value="${f.id}" ${isSel}>${f.name} (${activeF}/${fDepts.length} Aktif)</option>`;
    });
    uniModalFacultyFilter.innerHTML = facHtml;
  }

  // Populate Add Target Faculty dropdown
  if (uniModalAddTargetFaculty) {
    const allFacs = getUniFaculties(uni.id);
    let targetHtml = `<option value="auto">Hedef Fakülte: Otomatik (En Uygun Birim)</option>`;
    allFacs.forEach(f => {
      targetHtml += `<option value="${f.id}">Hedefe Ata: ${f.name} (${f.type})</option>`;
    });
    uniModalAddTargetFaculty.innerHTML = targetHtml;
  }

  modalCity.textContent = loc;
  modalRegion.textContent = uni.region;
  modalFounded.textContent = `${uni.founded} (${age} yıllık)`;

  const sameCityUnis = universities.filter(u => u.city === uni.city);
  const activeSameCity = sameCityUnis.filter(u => !u.removed).length;
  if (modalCityStats) {
    modalCityStats.textContent = `${activeSameCity} / ${sameCityUnis.length} Kurum Aktif`;
  }

  if (modalSameCityTitle && modalSameCityList) {
    modalSameCityTitle.textContent = `${uni.city} İlindeki Üniversiteler (${sameCityUnis.length})`;
    modalSameCityList.innerHTML = sameCityUnis
      .sort((a, b) => a.founded - b.founded || a.name.localeCompare(b.name, 'tr'))
      .map(other => {
        const isCurrent = other.id === uni.id;
        return `
          <button class="same-city-chip ${isCurrent ? 'current' : ''} ${other.removed ? 'removed' : ''}" data-uni-id="${other.id}" title="${other.name} (${other.founded})">
            <img src="${other.logo}" alt="" class="same-city-chip-logo" onerror="this.style.display='none'">
            <span>${other.name}</span>
          </button>
        `;
      }).join('');

    modalSameCityList.querySelectorAll('.same-city-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = Number(btn.getAttribute('data-uni-id'));
        const targetUni = universities.find(u => u.id === targetId);
        if (targetUni) {
          currentModalUniId = targetUni.id;
          syncModalState(targetUni);
        }
      });
    });
  }

  modalWebsite.href = uni.website;
  modalToggleStatusBtn.textContent = uni.removed ? 'Üniversiteyi Geri Aç' : 'Üniversiteyi Kaldır';
  modalToggleStatusBtn.className = `btn btn-sm btn-toggle-status ${uni.removed ? 'is-removed' : 'is-kept'}`;

  if (currentUniModalTab === 'depts') renderUniModalDepartments(uni.id);
  if (currentUniModalTab === 'add') renderUniModalAddCatalog(uni.id);
}

function getFilteredUniModalDepartments(uniId) {
  const allDepts = getUniDepartmentList(uniId);
  const q = (uniModalDeptSearch ? uniModalDeptSearch.value : '').trim().toLocaleLowerCase('tr');
  const deg = uniModalDegreeFilter ? uniModalDegreeFilter.value : 'all';
  const sc = uniModalScoreFilter ? uniModalScoreFilter.value : 'all';
  const st = uniModalStatusFilter ? uniModalStatusFilter.value : 'all';
  const facFilter = currentUniModalFacultyFilter || 'all';

  return allDepts.filter(d => {
    const matchQ = !q || d.name.toLocaleLowerCase('tr').includes(q) || d.category.toLocaleLowerCase('tr').includes(q);
    const matchDeg = deg === 'all' || d.degree === deg;
    const matchSc = sc === 'all' || d.scoreType === sc;
    const matchSt = st === 'all' ||
      (st === 'active' && d.isActive) ||
      (st === 'closed' && d.isClosed) ||
      (st === 'added' && d.isAdded);
    const matchFac = facFilter === 'all' || d.effectiveFacultyId === facFilter;
    return matchQ && matchDeg && matchSc && matchSt && matchFac;
  });
}

function renderUniModalDepartments(uniId) {
  const uId = Number(uniId);
  const list = getFilteredUniModalDepartments(uId);
  const allFaculties = getUniFaculties(uId);
  uniModalFilteredDeptCount.textContent = `${list.length} bölüm listeleniyor`;

  if (list.length === 0) {
    uniModalDeptList.innerHTML = `<div class="empty-state"><p>Bu filtreye uygun bölüm bulunamadı.</p></div>`;
    return;
  }

  if (uniModalDeptViewMode === 'faculty') {
    // Group departments by effective faculty
    const grouped = new Map();
    // Pre-populate with all faculties in this university that match faculty filter
    allFaculties.forEach(f => {
      if (currentUniModalFacultyFilter === 'all' || currentUniModalFacultyFilter === f.id) {
        grouped.set(f.id, []);
      }
    });

    list.forEach(d => {
      if (!grouped.has(d.effectiveFacultyId)) {
        grouped.set(d.effectiveFacultyId, []);
      }
      grouped.get(d.effectiveFacultyId).push(d);
    });

    let html = '';
    grouped.forEach((deptsInFac, fId) => {
      // If filtering by search/degree/etc., skip empty faculties unless they explicitly match
      if (deptsInFac.length === 0 && (uniModalDeptSearch.value || uniModalDegreeFilter.value !== 'all' || uniModalScoreFilter.value !== 'all' || uniModalStatusFilter.value !== 'all')) {
        return;
      }

      const f = getFacultyById(uId, fId) || { id: fId, name: 'Genel Birim', type: 'Fakülte' };
      const isFacActive = isFacultyActive(uId, f.id);
      const activeDeptsCount = deptsInFac.filter(d => d.isActive).length;
      const typeBadgeClass = f.type === 'MYO' ? 'myo' : (f.isCustom ? 'custom' : '');

      html += `
        <div class="faculty-accordion-group ${!isFacActive ? 'is-closed-faculty' : ''}" data-faculty-id="${f.id}">
          <div class="faculty-accordion-header" data-fac-toggle-collapse="${f.id}">
            <div class="faculty-title-wrap">
              <span class="faculty-chevron">&#9660;</span>
              <span class="faculty-badge-type ${typeBadgeClass}">${f.type}</span>
              ${f.isCustom ? '<span class="dept-transferred-tag">Özel Kuruldu</span>' : ''}
              <strong class="faculty-name" title="${f.name}">${f.name}</strong>
              <span class="faculty-count-pill">${activeDeptsCount} / ${deptsInFac.length} Aktif</span>
            </div>
            <div class="faculty-header-actions" onclick="event.stopPropagation()">
              <button class="btn-fac-action primary" data-add-to-faculty="${f.id}" title="Bu fakülteye katalogdan yeni bölüm aç">+ Bölüm Ekle</button>
              <button class="btn-fac-toggle-state ${isFacActive ? 'active' : 'inactive'}" data-toggle-faculty-id="${f.id}" title="${isFacActive ? 'Fakülteyi ve bağlı tüm bölümleri kapat' : 'Fakülteyi ve bağlı bölümleri aç'}">
                ${isFacActive ? 'Fakülteyi Kapat' : 'Fakülteyi Aç'}
              </button>
              ${f.isCustom ? `<button class="btn-fac-action danger" data-delete-faculty-id="${f.id}" title="Bu özel fakülteyi sil">&times;</button>` : ''}
            </div>
          </div>
          <div class="faculty-accordion-body" id="fac_body_${f.id}">
            ${deptsInFac.length === 0 ? '<div class="empty-fac-subtext">Bu fakültede şu an açık/eklenmiş bölüm yok. "+ Bölüm Ekle" butonuyla yeni bölüm açabilirsiniz.</div>' : ''}
            ${deptsInFac.map(d => renderDeptRowHtml(uId, d, allFaculties, f)).join('')}
          </div>
        </div>
      `;
    });

    uniModalDeptList.innerHTML = html || `<div class="empty-state"><p>Bu filtreye uygun fakülte veya bölüm bulunamadı.</p></div>`;
  } else {
    // Flat List View
    uniModalDeptList.innerHTML = list.map(d => {
      const curFac = d.faculty || getFacultyById(uId, d.effectiveFacultyId);
      return renderDeptRowHtml(uId, d, allFaculties, curFac);
    }).join('');
  }

  attachDeptListEventListeners(uId);
}

function renderDeptRowHtml(uniId, d, allFaculties, currentFac) {
  const scoreColor = SCORE_COLORS[d.scoreType] || '#3b82f6';
  let stateBadge = '';
  if (d.isAdded) {
    stateBadge = `<span class="uni-badge badge-added-mini">Yeni Açıldı</span>`;
  } else if (d.isCascadeClosed) {
    stateBadge = `<span class="dept-cascade-closed-tag">Fakülte Pasif</span>`;
  } else if (d.isExplicitClosed) {
    stateBadge = `<span class="uni-badge badge-closed-mini">Kapatıldı</span>`;
  } else {
    stateBadge = `<span class="uni-badge badge-kept">Açık</span>`;
  }

  const transferredTag = d.isTransferred
    ? `<span class="dept-transferred-tag" title="Orijinal Fakülte: ${d.originalFaculty ? d.originalFaculty.name : ''}">⇄ Aktarıldı</span>`
    : '';

  const facultyOptions = allFaculties.map(f => {
    const isSelected = f.id === d.effectiveFacultyId ? 'selected' : '';
    return `<option value="${f.id}" ${isSelected}>${f.name} (${f.type})</option>`;
  }).join('');

  return `
    <div class="modal-dept-row ${d.isClosed ? 'closed-dept-row' : ''}">
      <div class="modal-dept-main">
        <span class="dept-pill-score" style="background:${scoreColor}22; color:${scoreColor}">${d.scoreType}</span>
        <span class="dept-pill-degree">${d.degree}</span>
        <strong class="modal-dept-name">${d.name}</strong>
        <span class="modal-dept-cat">${d.category}</span>
        ${stateBadge}
        ${transferredTag}
      </div>
      <div class="dept-faculty-wrap">
        <select class="dept-faculty-select" data-dept-transfer-id="${d.id}" title="Bu bölümü başka bir fakülteye aktar">
          ${facultyOptions}
          <option value="NEW">+ Yeni Fakülte Kurup Oraya Aktar...</option>
        </select>
      </div>
      <div class="modal-dept-actions">
        <button class="btn-dept-toggle ${d.isClosed ? 'open-btn' : 'close-btn-mini'}" data-toggle-dept-id="${d.id}">
          ${d.isClosed ? 'Bölümü Aç' : 'Bölümü Kapat'}
        </button>
      </div>
    </div>
  `;
}

function attachDeptListEventListeners(uniId) {
  // Accordion Header Toggle
  uniModalDeptList.querySelectorAll('[data-fac-toggle-collapse]').forEach(header => {
    header.addEventListener('click', () => {
      const group = header.closest('.faculty-accordion-group');
      if (group) group.classList.toggle('collapsed');
    });
  });

  // Toggle Faculty Status
  uniModalDeptList.querySelectorAll('[data-toggle-faculty-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const facId = btn.getAttribute('data-toggle-faculty-id');
      toggleFacultyStatus(uniId, facId);
    });
  });

  // Delete Custom Faculty
  uniModalDeptList.querySelectorAll('[data-delete-faculty-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const facId = btn.getAttribute('data-delete-faculty-id');
      handleDeleteCustomFaculty(uniId, facId);
    });
  });

  // Add Department targeting this specific Faculty
  uniModalDeptList.querySelectorAll('[data-add-to-faculty]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const facId = btn.getAttribute('data-add-to-faculty');
      if (uniModalAddTargetFaculty) {
        uniModalAddTargetFaculty.value = facId;
      }
      switchUniModalTab('add');
    });
  });

  // Transfer Department between Faculties
  uniModalDeptList.querySelectorAll('[data-dept-transfer-id]').forEach(select => {
    select.addEventListener('change', () => {
      const dId = Number(select.getAttribute('data-dept-transfer-id'));
      const targetFacId = select.value;
      transferDeptToFaculty(uniId, dId, targetFacId);
    });
  });

  // Toggle Department Active / Closed
  uniModalDeptList.querySelectorAll('[data-toggle-dept-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dId = Number(btn.getAttribute('data-toggle-dept-id'));
      toggleDepartmentInUni(uniId, dId);
      const uni = universities.find(u => u.id === uniId);
      if (uni) syncModalState(uni);
    });
  });
}

function getFilteredAddableDepartmentsForUni(uniId) {
  const uId = Number(uniId);
  const baseSet = baseUniDeptsMap.get(uId) || new Set();
  const addedSet = addedDeptsByUni.get(uId) || new Set();
  const q = (uniModalAddSearch ? uniModalAddSearch.value : '').trim().toLocaleLowerCase('tr');
  const deg = uniModalAddDegreeFilter ? uniModalAddDegreeFilter.value : 'all';
  const sc = uniModalAddScoreFilter ? uniModalAddScoreFilter.value : 'all';
  const cat = uniModalAddCategoryFilter ? uniModalAddCategoryFilter.value : 'all';

  return departmentCatalog.filter(d => {
    if (baseSet.has(d.id) || addedSet.has(d.id)) return false;
    const matchQ = !q || d.name.toLocaleLowerCase('tr').includes(q) || d.category.toLocaleLowerCase('tr').includes(q);
    const matchDeg = deg === 'all' || d.degree === deg;
    const matchSc = sc === 'all' || d.scoreType === sc;
    const matchCat = cat === 'all' || d.category === cat;
    return matchQ && matchDeg && matchSc && matchCat;
  });
}

function renderUniModalAddCatalog(uniId) {
  const uId = Number(uniId);
  const available = getFilteredAddableDepartmentsForUni(uId);
  uniModalAddAvailableCount.textContent = `${available.length} açılabilir bölüm bulundu`;

  const slice = available.slice(0, 150);
  if (slice.length === 0) {
    uniModalAddDeptList.innerHTML = `<div class="empty-state"><p>Aradığınız kriterde eklenecek başka bölüm bulunamadı.</p></div>`;
    return;
  }

  uniModalAddDeptList.innerHTML = slice.map(d => {
    const scoreColor = SCORE_COLORS[d.scoreType] || '#3b82f6';
    return `
      <div class="modal-dept-row">
        <div class="modal-dept-main">
          <span class="dept-pill-score" style="background:${scoreColor}22; color:${scoreColor}">${d.scoreType}</span>
          <span class="dept-pill-degree">${d.degree}</span>
          <strong class="modal-dept-name">${d.name}</strong>
          <span class="modal-dept-cat">${d.category}</span>
        </div>
        <div class="modal-dept-actions">
          <button class="btn-dept-toggle open-btn" data-add-dept-id="${d.id}">
            + Bu Üniversiteye Aç
          </button>
        </div>
      </div>
    `;
  }).join('');

  uniModalAddDeptList.querySelectorAll('[data-add-dept-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dId = Number(btn.getAttribute('data-add-dept-id'));
      const dept = getDepartmentById(dId);

      // Determine target faculty
      let targetFacId = uniModalAddTargetFaculty ? uniModalAddTargetFaculty.value : 'auto';
      if (targetFacId === 'auto' && dept) {
        targetFacId = resolveBestFacultyForDept(uId, dept);
      }
      if (targetFacId && targetFacId !== 'auto') {
        addedDeptFacultyMap.get(uId).set(dId, targetFacId);
      }

      setDepartmentActiveInUni(uId, dId, true);
      const uni = universities.find(u => u.id === uId);
      if (uni) syncModalState(uni);
      const assignedFac = getFacultyById(uId, targetFacId);
      if (dept && uni) {
        showToast(`"${dept.name}" bölümü ${uni.name} bünyesinde (${assignedFac ? assignedFac.name : 'Fakülte'}) açıldı`);
      }
    });
  });
}

function closeModal() {
  modal.style.display = 'none';
  currentModalUniId = null;
}

// ============================================================================
// NATIONAL DEPARTMENT MODAL LOGIC (Manage 1 Department Across All 203 Unis)
// ============================================================================
function openDepartmentModal(deptId) {
  currentModalDeptId = Number(deptId);
  deptModalUniSearch.value = '';
  deptModalUniStateFilter.value = 'all';
  deptModalUniTypeFilter.value = 'all';
  syncDeptModalState(currentModalDeptId);
  deptModal.style.display = 'flex';
}

function syncDeptModalState(deptId) {
  const dept = getDepartmentById(deptId);
  if (!dept) return;

  const stats = getNationalDepartmentStats(dept.id);
  deptModalDegreeBadge.textContent = dept.degree;
  deptModalScoreBadge.textContent = dept.scoreType;
  deptModalCategoryBadge.textContent = dept.category;
  deptModalTitle.textContent = dept.name;
  deptModalSubtitle.textContent = `Türkiye genelinde ${stats.activeUniCount} üniversitede ve ${stats.activeCityCount} ilde aktif`;

  deptModalSummaryBar.innerHTML = `
    <div class="dept-sum-item"><span>Aktif Üniversite</span><strong style="color:var(--accent-success)">${stats.activeUniCount} Kurum</strong></div>
    <div class="dept-sum-item"><span>YÖK Başlangıç</span><strong>${stats.originalUniCount} Kurum</strong></div>
    <div class="dept-sum-item"><span>Kapatılan</span><strong style="color:var(--accent-danger)">${stats.closedUniCount} Kurum</strong></div>
    <div class="dept-sum-item"><span>Yeni Açılan</span><strong style="color:var(--accent-cyan)">+${stats.addedUniCount} Kurum</strong></div>
    <div class="dept-sum-item"><span>Bulunduğu İl</span><strong>${stats.activeCityCount} / 81 İl</strong></div>
  `;

  renderDeptModalUniversities(dept.id);
}

function getFilteredUniversitiesForDeptModal(deptId) {
  const dId = Number(deptId);
  const q = (deptModalUniSearch ? deptModalUniSearch.value : '').trim().toLocaleLowerCase('tr');
  const stateFilter = deptModalUniStateFilter ? deptModalUniStateFilter.value : 'all';
  const typeFilter = deptModalUniTypeFilter ? deptModalUniTypeFilter.value : 'all';

  return universities.filter(u => {
    const matchQ = !q || u.name.toLocaleLowerCase('tr').includes(q) || u.city.toLocaleLowerCase('tr').includes(q);
    const matchType = typeFilter === 'all' ||
      (typeFilter === 'research' ? u.isResearch : u.type === typeFilter);

    const st = getDepartmentStateInUni(u.id, dId);
    const isEffectivelyActive = st.isActive && !u.removed;

    let matchState = true;
    if (stateFilter === 'active') matchState = isEffectivelyActive;
    else if (stateFilter === 'closed') matchState = st.isPresent && !isEffectivelyActive;
    else if (stateFilter === 'added') matchState = st.isAdded && isEffectivelyActive;
    else if (stateFilter === 'not_present') matchState = !st.isPresent;

    return matchQ && matchType && matchState;
  });
}

function renderDeptModalUniversities(deptId) {
  const dId = Number(deptId);
  const list = getFilteredUniversitiesForDeptModal(dId);
  deptModalUniCountText.textContent = `${list.length} üniversite listeleniyor`;

  if (list.length === 0) {
    deptModalUniList.innerHTML = `<div class="empty-state"><p>Seçilen kriterlere uygun üniversite bulunamadı.</p></div>`;
    return;
  }

  deptModalUniList.innerHTML = list.map(u => {
    const st = getDepartmentStateInUni(u.id, dId);
    const isEffectivelyActive = st.isActive && !u.removed;

    let badgeHtml = '';
    if (isEffectivelyActive) {
      badgeHtml = st.isAdded
        ? `<span class="uni-badge badge-added-mini">Yeni Açıldı</span>`
        : `<span class="uni-badge badge-kept">Mevcut &amp; Açık</span>`;
    } else if (st.isPresent) {
      badgeHtml = `<span class="uni-badge badge-closed-mini">Kapatıldı</span>`;
    } else {
      badgeHtml = `<span class="uni-badge badge-focus-mini">Bu Bölüm Yok</span>`;
    }

    return `
      <div class="modal-dept-row ${!isEffectivelyActive ? 'closed-dept-row' : ''}">
        <div class="modal-dept-main">
          <img src="${u.logo}" alt="" class="same-city-chip-logo" onerror="handleLogoError(this)">
          <strong class="modal-dept-name">${u.name}</strong>
          <span class="modal-dept-cat">${u.city} · ${u.type} · ${u.founded}</span>
          ${u.isResearch ? `<span class="uni-badge badge-research-mini">Araştırma</span>` : ''}
          ${badgeHtml}
        </div>
        <div class="modal-dept-actions">
          <button class="btn-dept-toggle ${isEffectivelyActive ? 'close-btn-mini' : 'open-btn'}" data-dept-uni-id="${u.id}">
            ${isEffectivelyActive ? 'Bu Üniversitede Kapat' : (st.isPresent ? 'Geri Aç' : '+ Yeni Bölüm Olarak Aç')}
          </button>
        </div>
      </div>
    `;
  }).join('');

  deptModalUniList.querySelectorAll('[data-dept-uni-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const uId = Number(btn.getAttribute('data-dept-uni-id'));
      const st = getDepartmentStateInUni(uId, dId);
      const isEffectivelyActive = st.isActive && !universities.find(u => u.id === uId).removed;
      setDepartmentActiveInUni(uId, dId, !isEffectivelyActive);
      syncDeptModalState(dId);
    });
  });
}

function applySingleDepartmentMacroRule(deptId, rule) {
  const dId = Number(deptId);
  const dept = getDepartmentById(dId);
  if (!dept) return;

  if (rule === 'keep_research') {
    universities.forEach(u => {
      const st = getDepartmentStateInUni(u.id, dId);
      if (st.isPresent) {
        setDepartmentActiveInUni(u.id, dId, u.isResearch, true);
      }
    });
    showToast(`"${dept.name}" sadece Araştırma Üniversitelerinde korundu`);
  } else if (rule === 'keep_pre1993') {
    universities.forEach(u => {
      const st = getDepartmentStateInUni(u.id, dId);
      if (st.isPresent) {
        setDepartmentActiveInUni(u.id, dId, u.founded <= 1992, true);
      }
    });
    showToast(`"${dept.name}" sadece 1992 ve öncesi köklü üniversitelerde korundu`);
  } else if (rule === 'keep_state') {
    universities.forEach(u => {
      const st = getDepartmentStateInUni(u.id, dId);
      if (st.isPresent) {
        setDepartmentActiveInUni(u.id, dId, u.type === 'Devlet', true);
      }
    });
    showToast(`"${dept.name}" sadece Devlet üniversitelerinde korundu`);
  } else if (rule === 'open_all_research') {
    universities.filter(u => u.isResearch).forEach(u => {
      setDepartmentActiveInUni(u.id, dId, true, true);
    });
    showToast(`"${dept.name}" 23 Araştırma Üniversitesinin tamamında açıldı`);
  } else if (rule === 'open_all_tech') {
    universities.filter(u => u.isResearch || u.focus === 'Teknik & Bilim').forEach(u => {
      setDepartmentActiveInUni(u.id, dId, true, true);
    });
    showToast(`"${dept.name}" tüm Teknik ve Araştırma üniversitelerinde açıldı`);
  } else if (rule === 'open_all_state') {
    universities.filter(u => u.type === 'Devlet').forEach(u => {
      setDepartmentActiveInUni(u.id, dId, true, true);
    });
    showToast(`"${dept.name}" 130 Devlet üniversitesinin tamamında açıldı`);
  } else if (rule === 'close_everywhere') {
    universities.forEach(u => {
      const st = getDepartmentStateInUni(u.id, dId);
      if (st.isPresent) setDepartmentActiveInUni(u.id, dId, false, true);
    });
    showToast(`"${dept.name}" Türkiye genelinde tüm üniversitelerde kapatıldı`);
  } else if (rule === 'reset_dept') {
    universities.forEach(u => {
      closedDeptsByUni.get(u.id).delete(dId);
      addedDeptsByUni.get(u.id).delete(dId);
    });
    showToast(`"${dept.name}" orijinal YÖK dağılımına sıfırlandı`);
  }

  updateUI();
  syncDeptModalState(dId);
}

function closeDeptModal() {
  deptModal.style.display = 'none';
  currentModalDeptId = null;
}

// ============================================================================
// MACRO REFORM SCENARIOS & CUSTOM DEPARTMENT CREATOR
// ============================================================================
function openReformModal(tab = 'scenarios') {
  switchReformModalTab(tab);
  reformModal.style.display = 'flex';
}

function switchReformModalTab(tab) {
  reformTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-reform-tab') === tab));
  if (reformTabScenarios) reformTabScenarios.classList.toggle('hidden', tab !== 'scenarios');
  if (reformTabFaculties) reformTabFaculties.classList.toggle('hidden', tab !== 'faculties');
  if (reformTabCustom) reformTabCustom.classList.toggle('hidden', tab !== 'custom');
}

function closeReformModal() {
  reformModal.style.display = 'none';
}

function applyNationalDepartmentScenario(scenario) {
  if (scenario === 'med_law_consolidation') {
    const targetDepts = departmentCatalog.filter(d =>
      d.name === 'Tıp' || d.name === 'Hukuk' || d.name === 'Diş Hekimliği' || d.name === 'Eczacılık'
    );
    universities.forEach(u => {
      const allow = u.isResearch || u.founded <= 1992;
      targetDepts.forEach(d => {
        const st = getDepartmentStateInUni(u.id, d.id);
        if (st.isPresent && !allow) {
          setDepartmentActiveInUni(u.id, d.id, false, true);
        } else if (st.hasOriginal && allow) {
          setDepartmentActiveInUni(u.id, d.id, true, true);
        }
      });
    });
    showToast('Tıp, Hukuk, Diş Hekimliği ve Eczacılık sadece köklü ve araştırma üniversitelerinde korundu');
  } else if (scenario === 'tech_pure_say') {
    universities.filter(u => u.focus === 'Teknik & Bilim').forEach(u => {
      const list = getUniDepartmentList(u.id);
      list.forEach(d => {
        const keep = d.scoreType === 'SAY' || d.category === 'Teknik & Bilişim (Önlisans)';
        setDepartmentActiveInUni(u.id, d.id, keep, true);
      });
    });
    showToast('Teknik üniversitelerde sadece SAY ve Teknik/Mühendislik bölümleri korundu');
  } else if (scenario === 'ai_cyber_expansion') {
    const strategicNames = [
      'Yapay Zeka Mühendisliği',
      'Yapay Zeka ve Veri Mühendisliği',
      'Yazılım Mühendisliği',
      'Siber Güvenlik Mühendisliği',
      'Bilgisayar Mühendisliği'
    ];
    const strategicDepts = departmentCatalog.filter(d =>
      strategicNames.some(sn => d.name.toLocaleLowerCase('tr') === sn.toLocaleLowerCase('tr'))
    );
    universities.filter(u => u.isResearch || u.focus === 'Teknik & Bilim').forEach(u => {
      strategicDepts.forEach(d => {
        setDepartmentActiveInUni(u.id, d.id, true, true);
      });
    });
    showToast('Yapay Zeka, Yazılım ve Siber Güvenlik bölümleri 40 Araştırma ve Teknik üniversitenin tamamında açıldı');
  } else if (scenario === 'research_lisans_only') {
    universities.filter(u => u.isResearch).forEach(u => {
      const list = getUniDepartmentList(u.id);
      list.forEach(d => {
        if (d.degree === 'Önlisans') {
          setDepartmentActiveInUni(u.id, d.id, false, true);
        }
      });
    });
    showToast('23 Araştırma Üniversitesindeki Önlisans (MYO) programları kapatılarak %100 Lisans modeline geçildi');
  } else if (scenario === 'social_consolidation') {
    const targetNames = ['İşletme', 'İktisat', 'İlahiyat', 'İslami İlimler', 'Kamu Yönetimi', 'Siyaset Bilimi ve Kamu Yönetimi'];
    const targetDepts = departmentCatalog.filter(d =>
      targetNames.some(tn => d.name.toLocaleLowerCase('tr') === tn.toLocaleLowerCase('tr'))
    );
    universities.forEach(u => {
      const allow = u.isResearch || (u.type === 'Devlet' && u.founded <= 1992);
      targetDepts.forEach(d => {
        const st = getDepartmentStateInUni(u.id, d.id);
        if (st.isPresent && !allow) {
          setDepartmentActiveInUni(u.id, d.id, false, true);
        }
      });
    });
    showToast('İşletme, İktisat, Kamu Yönetimi ve İlahiyat bölümleri köklü ve araştırma üniversitelerinde konsolide edildi');
  } else if (scenario === 'tech_faculties_pure') {
    let closedCount = 0;
    universities.filter(u => u.focus === 'Teknik & Bilim').forEach(u => {
      const facs = getUniFaculties(u.id);
      facs.forEach(f => {
        const fn = f.name.toLocaleLowerCase('tr');
        if (fn.includes('iktisad') || fn.includes('idari') || fn.includes('eğitim') || fn.includes('ilahiyat') || fn.includes('sosyal') || fn.includes('edebiyat')) {
          disabledFacultiesByUni.get(u.id).add(f.id);
          closedCount++;
        }
      });
      syncUniStatusWithDepartments(u.id);
    });
    showToast(`Teknik üniversitelerdeki ${closedCount} uyumsuz fakülte kapatılarak kurumlar saf teknik/mühendislik odaklı yapıldı`);
  } else if (scenario === 'ai_faculty_initiative') {
    universities.filter(u => u.isResearch).forEach(u => {
      const facs = getUniFaculties(u.id);
      let aiFac = facs.find(f => f.name.includes('Yapay Zeka') || f.name.includes('Bilişim'));
      if (!aiFac) {
        aiFac = {
          id: `cust_fac_ai_${Date.now()}_${u.id}`,
          name: 'Yapay Zeka ve Bilişim Teknolojileri Fakültesi',
          type: 'Fakülte',
          isCustom: true
        };
        const customArr = customFacultiesByUni.get(u.id) || [];
        customArr.push(aiFac);
        customFacultiesByUni.set(u.id, customArr);
      }
      disabledFacultiesByUni.get(u.id).delete(aiFac.id);

      // Transfer AI & Computer departments
      const list = getUniDepartmentList(u.id);
      list.forEach(d => {
        const dn = d.name.toLocaleLowerCase('tr');
        if (dn.includes('bilgisayar') || dn.includes('yapay zeka') || dn.includes('yazılım') || dn.includes('siber') || dn.includes('bilişim')) {
          deptFacultyOverridesByUni.get(u.id).set(d.id, aiFac.id);
        }
      });
      syncUniStatusWithDepartments(u.id);
    });
    showToast(`23 Araştırma Üniversitesinde Yapay Zeka ve Bilişim Fakültesi kurularak bölümler aktarıldı`);
  } else if (scenario === 'reset_all_faculties') {
    universities.forEach(u => {
      disabledFacultiesByUni.get(u.id).clear();
      deptFacultyOverridesByUni.get(u.id).clear();
      customFacultiesByUni.set(u.id, []);
      addedDeptFacultyMap.get(u.id).clear();
    });
    showToast('Tüm fakülte organizasyonları ve bölüm aktarımları YÖK varsayılanına sıfırlandı');
  } else if (scenario === 'reset_all_depts') {
    universities.forEach(u => {
      closedDeptsByUni.get(u.id).clear();
      addedDeptsByUni.get(u.id).clear();
      u.removed = false;
    });
    showToast('Tüm üniversite ve bölüm değişiklikleri YÖK orijinal verisine sıfırlandı');
  }

  saveUniversitiesState();
  updateUI();
  closeReformModal();
}

function handleCreateCustomDepartment() {
  const nameInput = document.getElementById('customDeptName');
  const degreeSelect = document.getElementById('customDeptDegree');
  const scoreSelect = document.getElementById('customDeptScore');
  const catSelect = document.getElementById('customDeptCategory');
  const targetSelect = document.getElementById('customDeptTarget');

  const name = nameInput.value.trim();
  if (!name) return;

  const existing = departmentCatalog.find(d => d.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'));
  if (existing) {
    showToast('Bu isimde bir bölüm zaten katalogda mevcut!');
    return;
  }

  const newId = 90001 + customDepartments.length + Math.floor(Math.random() * 1000);
  const degree = degreeSelect.value;
  const scoreType = degree === 'Önlisans' ? 'TYT' : scoreSelect.value;
  const category = catSelect.value;
  const target = targetSelect.value;

  const newDept = {
    id: newId,
    name,
    degree,
    scoreType,
    category,
    isCustom: true
  };

  customDepartments.push(newDept);
  rebuildDepartmentCatalogIndex();

  let targetUnis = [];
  if (target === 'research') targetUnis = universities.filter(u => u.isResearch);
  else if (target === 'tech_research') targetUnis = universities.filter(u => u.isResearch || u.focus === 'Teknik & Bilim');
  else if (target === 'state') targetUnis = universities.filter(u => u.type === 'Devlet');
  else if (target === 'all') targetUnis = universities;

  targetUnis.forEach(u => {
    setDepartmentActiveInUni(u.id, newId, true, true);
  });

  nameInput.value = '';
  closeReformModal();

  // Switch sidebar to Departments tab and focus the new department
  sidebarTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-sidebar-mode') === 'departments'));
  sidebarMode = 'departments';
  uniControlsSection.classList.add('hidden');
  deptControlsSection.classList.remove('hidden');

  updateUI();
  focusDepartmentOnMap(newId);
  showToast(`"${name}" özel bölümü oluşturuldu ve ${targetUnis.length} üniversitede açıldı!`);
}

// Export Scenario as JSON
function exportScenarioJSON() {
  const kept = universities.filter(u => !u.removed);
  const removed = universities.filter(u => u.removed);
  const allCities = new Set(universities.map(u => u.city));
  const activeCities = new Set(kept.map(u => u.city));

  const payload = {
    title: 'İdeal Üniversite ve Bölüm Sistemi Senaryosu',
    exportedAt: new Date().toISOString(),
    summary: {
      totalUniversities: universities.length,
      keptUniversities: kept.length,
      removedUniversities: removed.length,
      coveredCities: activeCities.size,
      totalCities: allCities.size,
      totalCatalogDepartments: departmentCatalog.length,
      customDepartmentsCount: customDepartments.length
    },
    customDepartments,
    keptUniversities: kept.map(u => {
      const depts = getUniDepartmentList(u.id);
      return {
        id: u.id,
        name: u.name,
        city: u.city,
        district: u.district || null,
        region: u.region,
        type: u.type,
        founded: u.founded,
        isResearch: u.isResearch,
        focus: u.focus,
        activeDepartmentsCount: depts.filter(d => d.isActive).length,
        addedDepartments: depts.filter(d => d.isAdded && d.isActive).map(d => d.name),
        closedDepartments: depts.filter(d => d.isClosed).map(d => d.name)
      };
    }),
    removedUniversities: removed.map(u => ({
      id: u.id, name: u.name, city: u.city, region: u.region, type: u.type, founded: u.founded
    }))
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ideal-universite-ve-bolum-senaryosu-${kept.length}-kurum.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Üniversite ve bölüm senaryosu JSON olarak indirildi');
}

// Toast Notification Helper
let toastTimeout = null;
function showToast(message) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 2800);
}
