let map;
let geojsonLayer;
let cityLabelsLayer;
let currentSelectedCity = null;
let currentMapMode = 'count'; // 'count' | 'type' | 'pruned' | 'research'
let showCityLabels = true;
let focusedDepartmentId = null; // null or department ID

const CITY_NAME_MAP = {
  'Afyon': 'Afyonkarahisar',
  'Zonguldak': 'Zonguldak'
};

function getGeoJSONData() {
  if (typeof window !== 'undefined' && window.TURKEY_GEOJSON) {
    return window.TURKEY_GEOJSON;
  }
  if (typeof TURKEY_GEOJSON !== 'undefined') {
    return TURKEY_GEOJSON;
  }
  if (typeof turkeyGeoJSON !== 'undefined') {
    return turkeyGeoJSON;
  }
  return null;
}

function normalizeGeoCityName(rawName) {
  return CITY_NAME_MAP[rawName] || rawName;
}

function setMapTheme() {
  if (!map) return;
  if (geojsonLayer) {
    geojsonLayer.setStyle(featureStyle);
  }
}

function setMapDepartmentFocus(deptId) {
  focusedDepartmentId = deptId || null;
  updateMap();
}

function getMapDepartmentFocus() {
  return focusedDepartmentId;
}

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  map = L.map('map', {
    center: [39.05, 35.3],
    zoom: 6,
    minZoom: 5,
    maxZoom: 9,
    zoomControl: true,
    attributionControl: false
  });

  const geoData = getGeoJSONData();
  if (geoData) {
    geojsonLayer = L.geoJson(geoData, {
      style: featureStyle,
      onEachFeature: onEachFeature
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds(), { padding: [14, 14] });
  }

  cityLabelsLayer = L.layerGroup().addTo(map);

  setTimeout(() => {
    if (map) {
      map.invalidateSize();
      if (geojsonLayer) {
        map.fitBounds(geojsonLayer.getBounds(), { padding: [14, 14] });
      }
    }
  }, 100);

  // Bind Map Mode Tabs
  const modeBtns = document.querySelectorAll('.map-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMapMode = btn.getAttribute('data-map-mode');
      if (focusedDepartmentId !== null && typeof clearDepartmentMapFocus === 'function') {
        clearDepartmentMapFocus();
      } else {
        updateMap();
      }
    });
  });

  // Bind City Labels Toggle Button
  const toggleLabelsBtn = document.getElementById('toggleMapLabelsBtn');
  if (toggleLabelsBtn) {
    toggleLabelsBtn.addEventListener('click', () => {
      showCityLabels = !showCityLabels;
      toggleLabelsBtn.classList.toggle('active', showCityLabels);
      renderCityLabels();
    });
  }

  renderMapLegend();
  renderCityLabels();
}

function getCityStats(cityName) {
  if (typeof universities === 'undefined') {
    return {
      total: 0, active: 0, removed: 0, state: 0, foundation: 0,
      researchTotal: 0, researchActive: 0, oldestYear: null, oldestName: null,
      deptActiveTotal: 0, deptBaseTotal: 0,
      focusedDeptActive: 0, focusedDeptTotal: 0, focusedDeptAdded: 0
    };
  }
  const cityUnis = universities.filter(u => u.city.toLocaleLowerCase('tr') === cityName.toLocaleLowerCase('tr'));
  const activeUnis = cityUnis.filter(u => !u.removed);
  const stateCount = activeUnis.filter(u => u.type === 'Devlet').length;
  const foundationCount = activeUnis.filter(u => u.type === 'Vakıf').length;
  const researchTotal = cityUnis.filter(u => u.isResearch).length;
  const researchActive = activeUnis.filter(u => u.isResearch).length;

  let oldestYear = null;
  let oldestName = null;
  const pool = activeUnis.length > 0 ? activeUnis : cityUnis;
  pool.forEach(u => {
    if (oldestYear === null || u.founded < oldestYear) {
      oldestYear = u.founded;
      oldestName = u.name;
    }
  });

  let deptActiveTotal = 0;
  let deptBaseTotal = 0;
  let focusedDeptActive = 0;
  let focusedDeptTotal = 0;
  let focusedDeptAdded = 0;

  if (typeof getUniDepartmentSummary === 'function') {
    cityUnis.forEach(u => {
      const s = getUniDepartmentSummary(u.id);
      deptBaseTotal += s.total;
      if (!u.removed) {
        deptActiveTotal += s.active;
      }
      if (focusedDepartmentId !== null && typeof getDepartmentStateInUni === 'function') {
        const st = getDepartmentStateInUni(u.id, focusedDepartmentId);
        if (st.hasOriginal || st.isAdded) {
          focusedDeptTotal++;
          if (st.isActive && !u.removed) {
            focusedDeptActive++;
            if (st.isAdded) focusedDeptAdded++;
          }
        }
      }
    });
  }

  return {
    total: cityUnis.length,
    active: activeUnis.length,
    removed: cityUnis.length - activeUnis.length,
    state: stateCount,
    foundation: foundationCount,
    researchTotal,
    researchActive,
    oldestYear,
    oldestName,
    deptActiveTotal,
    deptBaseTotal,
    focusedDeptActive,
    focusedDeptTotal,
    focusedDeptAdded
  };
}

function getFillColor(stats) {
  // Department Focus Mode overrides fill color
  if (focusedDepartmentId !== null) {
    const d = stats.focusedDeptActive;
    if (d === 0) {
      return stats.focusedDeptTotal > 0 ? '#7f1d1d' : '#1e293b'; // Closed vs Never had
    }
    if (d >= 8) return '#0891b2';
    if (d >= 4) return '#06b6d4';
    if (d >= 2) return '#22d3ee';
    return '#0e7490'; // 1 university in province has this department active
  }

  if (currentMapMode === 'count') {
    const d = stats.active;
    if (d === 0) return '#ef4444';   // Red alert: 0 active universities
    if (d > 20)  return '#1d4ed8';
    if (d > 8)   return '#2563eb';
    if (d > 4)   return '#3b82f6';
    if (d > 2)   return '#60a5fa';
    if (d > 1)   return '#93c5fd';
    return '#1e3a8a';                // 1 university
  }

  if (currentMapMode === 'type') {
    if (stats.active === 0) return '#ef4444';
    if (stats.foundation === 0) return '#2563eb'; // Pure State
    if (stats.state === 0) return '#9333ea';      // Pure Foundation
    if (stats.foundation >= stats.state) return '#a855f7'; // Foundation majority
    return '#6366f1';                             // Mixed (State + Foundation)
  }

  if (currentMapMode === 'pruned') {
    if (stats.total === 0) return '#334155';
    const prunedRatio = stats.removed / stats.total;
    if (prunedRatio === 0) return '#10b981';      // 0% removed (intact)
    if (prunedRatio < 0.35) return '#fbbf24';     // Lightly pruned
    if (prunedRatio < 0.70) return '#f97316';     // Moderately pruned
    if (prunedRatio < 1.0)  return '#ef4444';     // Heavily pruned
    return '#7f1d1d';                             // 100% removed
  }

  if (currentMapMode === 'research') {
    if (stats.active === 0) return '#ef4444';
    if (stats.researchActive >= 3) return '#0891b2'; // Major research hub (İstanbul, Ankara, İzmir)
    if (stats.researchActive >= 1) return '#06b6d4'; // Has active Research University
    if (stats.oldestYear && stats.oldestYear <= 1992) return '#3b82f6'; // Pre-1993 established province
    return '#1e293b'; // Newer regional university province
  }

  return '#3b82f6';
}

function featureStyle(feature) {
  const cityName = normalizeGeoCityName(feature.properties.name);
  const stats = getCityStats(cityName);
  const isSelected = currentSelectedCity && currentSelectedCity.toLocaleLowerCase('tr') === cityName.toLocaleLowerCase('tr');
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  const isEmpty = focusedDepartmentId !== null ? stats.focusedDeptActive === 0 : stats.active === 0;

  return {
    fillColor: getFillColor(stats),
    weight: isSelected ? 2.8 : 1.2,
    opacity: 1,
    color: isSelected ? '#38bdf8' : (isLight ? '#94a3b8' : '#334155'),
    fillOpacity: isSelected ? 0.92 : (isEmpty ? 0.48 : 0.82)
  };
}

function buildTooltipHtml(cityName, stats) {
  if (focusedDepartmentId !== null && typeof getDepartmentById === 'function') {
    const dept = getDepartmentById(focusedDepartmentId);
    const deptName = dept ? dept.name : 'Seçili Bölüm';
    const badgeColor = stats.focusedDeptActive > 0 ? '#22d3ee' : '#94a3b8';
    const addedNote = stats.focusedDeptAdded > 0
      ? `<div style="display:flex; justify-content:space-between; gap:12px;">
           <span style="color:#94a3b8;">Yeni Açılan:</span>
           <strong style="color:#10b981;">+${stats.focusedDeptAdded} Kurum</strong>
         </div>`
      : '';

    return `
      <div style="min-width: 195px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:5px; border-bottom:1px solid rgba(148,163,184,0.2); padding-bottom:4px;">
          <strong style="font-size:0.9rem;">${cityName}</strong>
          <span style="font-size:0.72rem; font-weight:700; color:${badgeColor};">${stats.focusedDeptActive} / ${stats.focusedDeptTotal} Üni.</span>
        </div>
        <div style="font-size:0.74rem; color:#38bdf8; font-weight:600; margin-bottom:4px;">${deptName}</div>
        <div style="display:flex; flex-direction:column; gap:2px; font-size:0.76rem;">
          <div style="display:flex; justify-content:space-between; gap:12px;">
            <span style="color:#94a3b8;">İldeki Toplam Üni:</span>
            <strong>${stats.active} / ${stats.total} Aktif</strong>
          </div>
          ${addedNote}
        </div>
      </div>
    `;
  }

  const statusColor = stats.active === 0 ? '#ef4444' : '#10b981';
  const prunedPct = stats.total > 0 ? Math.round((stats.removed / stats.total) * 100) : 0;
  const researchRow = stats.researchTotal > 0
    ? `<div style="display:flex; justify-content:space-between; gap:12px;">
         <span style="color:#94a3b8;">Araştırma Üni:</span>
         <strong style="color:#22d3ee;">${stats.researchActive} / ${stats.researchTotal}</strong>
       </div>`
    : '';
  const oldestRow = stats.oldestYear
    ? `<div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(148,163,184,0.16); font-size:0.72rem; color:#94a3b8;">
         En Köklü Kuruluş: <strong style="color:#e2e8f0;">${stats.oldestYear}</strong>
       </div>`
    : '';

  return `
    <div style="min-width: 190px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:5px; border-bottom:1px solid rgba(148,163,184,0.2); padding-bottom:4px;">
        <strong style="font-size:0.9rem;">${cityName}</strong>
        <span style="font-size:0.72rem; font-weight:700; color:${statusColor};">${stats.active} / ${stats.total} Üni.</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:2px; font-size:0.77rem;">
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span style="color:#94a3b8;">Devlet / Vakıf:</span>
          <strong>${stats.state} D · ${stats.foundation} V</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span style="color:#94a3b8;">Aktif Bölüm Şubesi:</span>
          <strong style="color:#38bdf8;">${stats.deptActiveTotal} / ${stats.deptBaseTotal}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span style="color:#94a3b8;">Kaldırılan Üni:</span>
          <strong>${stats.removed} (%${prunedPct})</strong>
        </div>
        ${researchRow}
        ${oldestRow}
      </div>
    </div>
  `;
}

function onEachFeature(feature, layer) {
  const cityName = normalizeGeoCityName(feature.properties.name);
  const stats = getCityStats(cityName);

  layer.bindTooltip(buildTooltipHtml(cityName, stats), {
    sticky: true,
    className: 'custom-tooltip',
    direction: 'top',
    offset: [0, -8]
  });

  layer.on({
    mouseover: function (e) {
      const target = e.target;
      target.setStyle({
        weight: 2.5,
        color: '#f8fafc',
        fillOpacity: 0.94
      });
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        target.bringToFront();
      }
    },
    mouseout: function (e) {
      geojsonLayer.resetStyle(e.target);
    },
    click: function () {
      selectCityFromMap(cityName);
    }
  });
}

function selectCityFromMap(cityName) {
  if (currentSelectedCity && currentSelectedCity.toLocaleLowerCase('tr') === cityName.toLocaleLowerCase('tr')) {
    currentSelectedCity = null;
  } else {
    currentSelectedCity = cityName;
  }

  if (typeof setCityFilterFromMap === 'function') {
    setCityFilterFromMap(currentSelectedCity);
  }
  updateMap();
}

function clearMapCitySelection() {
  currentSelectedCity = null;
  updateMap();
}

function setMapSelectedCity(cityName) {
  currentSelectedCity = cityName || null;
  updateMap();
}

function renderCityLabels() {
  if (!cityLabelsLayer || !geojsonLayer) return;
  cityLabelsLayer.clearLayers();
  if (!showCityLabels) return;

  geojsonLayer.eachLayer(layer => {
    if (!layer.feature || !layer.getBounds) return;
    const cityName = normalizeGeoCityName(layer.feature.properties.name);
    const center = layer.getBounds().getCenter();
    if (!center) return;

    const stats = getCityStats(cityName);
    const isSelected = currentSelectedCity && currentSelectedCity.toLocaleLowerCase('tr') === cityName.toLocaleLowerCase('tr');

    const pillNumber = focusedDepartmentId !== null ? stats.focusedDeptActive : stats.active;
    const isZero = focusedDepartmentId !== null
      ? (stats.focusedDeptTotal > 0 && stats.focusedDeptActive === 0)
      : stats.active === 0;
    const isMuted = focusedDepartmentId !== null && stats.focusedDeptTotal === 0 && stats.focusedDeptActive === 0;
    const isHub = focusedDepartmentId !== null
      ? stats.focusedDeptActive >= 2
      : (stats.active >= 4 || stats.researchActive > 0);

    const shortName = cityName === 'Afyonkarahisar' ? 'Afyon'
      : cityName === 'Kahramanmaraş' ? 'K.Maraş'
      : cityName;

    const icon = L.divIcon({
      className: 'city-map-label-icon',
      html: `
        <div class="city-map-pill ${isSelected ? 'selected' : ''} ${isZero ? 'zero' : ''} ${isMuted ? 'muted-pill' : ''} ${isHub ? 'hub' : ''}">
          <span class="city-pill-name">${shortName}</span>
          <span class="city-pill-count">${pillNumber}</span>
        </div>
      `,
      iconSize: [76, 20],
      iconAnchor: [38, 10]
    });

    const marker = L.marker(center, { icon, interactive: true });
    marker.on('click', () => selectCityFromMap(cityName));
    cityLabelsLayer.addLayer(marker);
  });
}

function renderMapLegend() {
  const legendEl = document.getElementById('mapLegend');
  if (!legendEl) return;

  if (focusedDepartmentId !== null) {
    legendEl.innerHTML = `
      <span class="legend-item"><i style="background:#1e293b"></i> 0 (Bu Bölüm Hiç Yok)</span>
      <span class="legend-item"><i style="background:#7f1d1d"></i> 0 (İldeki Bölüm Kapatıldı)</span>
      <span class="legend-item"><i style="background:#0e7490"></i> 1 Üniversitede Açık</span>
      <span class="legend-item"><i style="background:#22d3ee"></i> 2–3 Üniversitede Açık</span>
      <span class="legend-item"><i style="background:#06b6d4"></i> 4–7 Üniversitede Açık</span>
      <span class="legend-item"><i style="background:#0891b2"></i> 8+ Üniversitede Açık</span>
    `;
    return;
  }

  if (currentMapMode === 'count') {
    legendEl.innerHTML = `
      <span class="legend-item"><i style="background:#ef4444"></i> 0 (Üniversitesiz İl)</span>
      <span class="legend-item"><i style="background:#1e3a8a"></i> 1 Kurum</span>
      <span class="legend-item"><i style="background:#93c5fd"></i> 2 Kurum</span>
      <span class="legend-item"><i style="background:#60a5fa"></i> 3–4 Kurum</span>
      <span class="legend-item"><i style="background:#2563eb"></i> 5–20 Kurum</span>
      <span class="legend-item"><i style="background:#1d4ed8"></i> 20+ Kurum</span>
    `;
  } else if (currentMapMode === 'type') {
    legendEl.innerHTML = `
      <span class="legend-item"><i style="background:#2563eb"></i> Sadece Devlet</span>
      <span class="legend-item"><i style="background:#6366f1"></i> Karma (Devlet Ağırlıklı)</span>
      <span class="legend-item"><i style="background:#a855f7"></i> Karma (Vakıf Ağırlıklı)</span>
      <span class="legend-item"><i style="background:#9333ea"></i> Sadece Vakıf</span>
      <span class="legend-item"><i style="background:#ef4444"></i> 0 Aktif Kurum</span>
    `;
  } else if (currentMapMode === 'pruned') {
    legendEl.innerHTML = `
      <span class="legend-item"><i style="background:#10b981"></i> %0 Kaldırıldı (Tam Koruma)</span>
      <span class="legend-item"><i style="background:#fbbf24"></i> %1–34 Kaldırıldı</span>
      <span class="legend-item"><i style="background:#f97316"></i> %35–69 Kaldırıldı</span>
      <span class="legend-item"><i style="background:#ef4444"></i> %70–99 Kaldırıldı</span>
      <span class="legend-item"><i style="background:#7f1d1d"></i> %100 Kaldırıldı</span>
    `;
  } else if (currentMapMode === 'research') {
    legendEl.innerHTML = `
      <span class="legend-item"><i style="background:#0891b2"></i> 3+ Araştırma Üni. (Merkez)</span>
      <span class="legend-item"><i style="background:#06b6d4"></i> 1–2 Araştırma Üniversitesi</span>
      <span class="legend-item"><i style="background:#3b82f6"></i> Köklü Üniversite İli (≤1992)</span>
      <span class="legend-item"><i style="background:#1e293b"></i> 1993+ Bölgesel Üniversite İli</span>
      <span class="legend-item"><i style="background:#ef4444"></i> 0 Aktif Kurum</span>
    `;
  }
}

function updateMap() {
  if (!geojsonLayer) return;

  geojsonLayer.setStyle(featureStyle);
  geojsonLayer.eachLayer(layer => {
    const cityName = normalizeGeoCityName(layer.feature.properties.name);
    const stats = getCityStats(cityName);
    layer.setTooltipContent(buildTooltipHtml(cityName, stats));
  });

  renderMapLegend();
  renderCityLabels();
}

// Window resize & responsive listener to invalidate map dimensions
if (typeof window !== 'undefined') {
  let mapResizeTimeout = null;
  window.addEventListener('resize', () => {
    if (mapResizeTimeout) clearTimeout(mapResizeTimeout);
    mapResizeTimeout = setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 200);
  });
}
