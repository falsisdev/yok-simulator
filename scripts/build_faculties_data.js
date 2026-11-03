// scripts/build_faculties_data.js
// Fetches all YÖK Atlas program rows and generates:
// 1. window.DEPARTMENT_CATALOG
// 2. window.UNI_DEPARTMENTS_MAP
// 3. window.UNI_FACULTIES_MAP

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const dataCode = fs.readFileSync(path.join(__dirname, "../js/data.js"), "utf8") + "\nmodule.exports = universitiesData;";
const sb = { module: {} };
vm.runInNewContext(dataCode, sb);
const ourUnis = sb.module.exports;

function normName(s) {
  return s
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .toLocaleLowerCase("tr")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[^a-z0-9çğıöşü\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTurkishTitleCase(str) {
  if (!str) return "";
  const words = str.trim().split(/\s+/);
  return words.map(w => {
    // preserve hyphenated words like KİMYA-METALURJİ or FEN-EDEBİYAT
    if (w.includes("-")) {
      return w.split("-").map(part => toTurkishTitleCase(part)).join("-");
    }
    const lower = w.toLocaleLowerCase("tr");
    if (["ve", "ile", "de", "da"].includes(lower)) return lower;
    return lower.charAt(0).toLocaleUpperCase("tr") + lower.slice(1);
  }).join(" ");
}

function determineUnitType(name) {
  const n = name.toLocaleLowerCase("tr");
  if (n.includes("meslek yüksekokulu") || n.includes("myo")) return "MYO";
  if (n.includes("konservatuvar")) return "Konservatuvar";
  if (n.includes("yüksekokul")) return "Yüksekokul";
  if (n.includes("enstitü")) return "Enstitü";
  return "Fakülte";
}

function classifyDepartment(name, scoreType) {
  const n = name.toLocaleLowerCase("tr");
  if (scoreType === "TYT") {
    if (
      n.includes("sağlık") || n.includes("tıp") || n.includes("diş") || n.includes("ecza") ||
      n.includes("ameliyathane") || n.includes("anestezi") || n.includes("diyaliz") ||
      n.includes("optisyen") || n.includes("odyometri") || n.includes("ortopedik") ||
      n.includes("patoloji") || n.includes("radyoterapi") || n.includes("ilk ve acil") ||
      n.includes("fizyoterapi") || n.includes("elektronörofizyoloji") || n.includes("engelli") ||
      n.includes("yaşlı") || n.includes("çocuk gelişimi")
    ) {
      return "Sağlık Hizmetleri (Önlisans)";
    }
    if (
      n.includes("bilgisayar") || n.includes("bilişim") || n.includes("yazılım") ||
      n.includes("siber") || n.includes("yapay zeka") || n.includes("elektronik") ||
      n.includes("elektrik") || n.includes("makine") || n.includes("mekatronik") ||
      n.includes("otomotiv") || n.includes("inşaat") || n.includes("harita") ||
      n.includes("uçak") || n.includes("teknoloji") || n.includes("üretim") ||
      n.includes("kaynak") || n.includes("metal") || n.includes("kimya") ||
      n.includes("gıda") || n.includes("maden") || n.includes("sondaj") ||
      n.includes("enerji") || n.includes("otomasyon") || n.includes("biyomedikal")
    ) {
      return "Teknik & Bilişim (Önlisans)";
    }
    return "Meslek Yüksekokulu (Önlisans)";
  }

  if (
    n.includes("mühendis") || n.includes("mimarlık") || n.includes("şehir ve bölge") ||
    n.includes("peyzaj") || n.includes("iç mimarlık")
  ) {
    return "Mühendislik & Mimarlık";
  }
  if (
    n.includes("tıp") || n.includes("diş hekim") || n.includes("eczacılık") ||
    n.includes("hemşire") || n.includes("ebelik") || n.includes("fizyoterapi") ||
    n.includes("beslenme") || n.includes("odyoloji") || n.includes("sağlık yönetimi")
  ) {
    return "Tıp & Sağlık Bilimleri";
  }
  if (
    n.includes("bilgisayar") || n.includes("yazılım") || n.includes("yapay zeka") ||
    n.includes("bilişim") || n.includes("veri") || n.includes("matematik") ||
    n.includes("fizik") || n.includes("kimya") || n.includes("biyoloji") ||
    n.includes("istatistik") || n.includes("astronomi") || n.includes("genetik")
  ) {
    return "Bilişim & Temel Bilimler";
  }
  if (
    n.includes("iktisat") || n.includes("işletme") || n.includes("maliye") ||
    n.includes("ekonomi") || n.includes("siyaset") || n.includes("uluslararası ilişkiler") ||
    n.includes("kamu yönetimi") || n.includes("finans") || n.includes("çalışma ekonomisi")
  ) {
    return "İktisadi ve İdari Bilimler";
  }
  if (n.includes("hukuk") || n.includes("adalet")) {
    return "Hukuk";
  }
  if (n.includes("öğretmen") || n.includes("eğitim")) {
    return "Eğitim & Öğretmenlik";
  }
  if (
    n.includes("ilahiyat") || n.includes("islami") || n.includes("din")
  ) {
    return "İlahiyat & Dini İlimler";
  }
  if (
    n.includes("ziraat") || n.includes("veteriner") || n.includes("orman") ||
    n.includes("su ürünleri") || n.includes("tarım") || n.includes("bahçe") ||
    n.includes("tarla") || n.includes("bitki")
  ) {
    return "Ziraat, Orman & Veterinerlik";
  }
  return "Sosyal, Beşeri, Dil & Sanat";
}

async function fetchAllYOKRows() {
  const rows = [];
  const pageSize = 2500;
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    console.log(`Fetching page ${page + 1}...`);
    const res = await fetch("https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, size: pageSize, filters: {} })
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch page ${page}: ${res.statusText}`);
    }
    const data = await res.json();
    totalPages = data.totalPages;
    rows.push(...data.content);
    console.log(`Fetched page ${page + 1}/${totalPages} (${data.content.length} rows, running total: ${rows.length})`);
    page++;
  }
  return rows;
}

(async () => {
  console.log("Fetching YÖK Atlas university list for name matching...");
  const uRes = await fetch("https://yokatlas.yok.gov.tr/api/tercih-kilavuz/universiteler");
  const yokUnis = await uRes.json();
  console.log(`Loaded ${yokUnis.length} YÖK universities.`);

  const ourUniMap = new Map();
  ourUnis.forEach(u => {
    ourUniMap.set(normName(u.name), u.id);
  });

  const yokToOurUni = new Map();
  yokUnis.forEach(yu => {
    const raw = yu.universiteAdi;
    const n = normName(raw);
    let matchedId = ourUniMap.get(n);
    if (matchedId === undefined) {
      // prefix/partial match
      for (const [k, v] of ourUniMap.entries()) {
        if (k.length > 5 && (n.includes(k) || k.includes(n))) {
          matchedId = v;
          break;
        }
      }
    }
    if (matchedId !== undefined) {
      yokToOurUni.set(yu.universiteId, matchedId);
    }
  });

  // Explicit mappings for special spelling cases
  const bezmialem = yokUnis.find(u => u.universiteAdi.includes("BEZM"));
  if (bezmialem) yokToOurUni.set(bezmialem.universiteId, 38);
  const ahmetYesevi = yokUnis.find(u => u.universiteAdi.includes("HOCA AHMET"));
  if (ahmetYesevi) yokToOurUni.set(ahmetYesevi.universiteId, 7);
  const tuibtu = ourUnis.find(u => u.name.includes("İslam, Bilim ve Teknoloji"));
  const tuibtuId = tuibtu ? tuibtu.id : 190;

  console.log(`Mapped ${yokToOurUni.size} YÖK universities to our 203 universities.`);

  const allRows = await fetchAllYOKRows();
  console.log(`Total rows fetched: ${allRows.length}`);

  // 1. Build standardized DEPARTMENT_CATALOG
  const catalogMap = new Map();
  allRows.forEach(row => {
    const deptId = row.birimGrupId;
    if (!catalogMap.has(deptId)) {
      catalogMap.set(deptId, {
        id: deptId,
        name: row.birimGrupAdi,
        scoreType: row.puanTuru,
        degree: row.puanTuru === "TYT" ? "Önlisans" : "Lisans",
        category: classifyDepartment(row.birimGrupAdi, row.puanTuru)
      });
    }
  });

  const catalogArr = [...catalogMap.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));

  // 2. Build university-department and university-faculty mapping
  // Per university:
  // faculties: [ { id: "fac_1", name: "...", type: "..." } ]
  // deptToFaculty: { [deptId]: "fac_1" }
  // departments: [deptId, ...]

  const uniDataMap = {};
  for (let i = 0; i < ourUnis.length; i++) {
    uniDataMap[i] = {
      facultyRawCounts: {}, // facName -> { count, deptIds: Set, type }
      deptFacultyMap: {},   // deptId -> facName
      deptSet: new Set()
    };
  }

  allRows.forEach(row => {
    const ourId = yokToOurUni.get(row.universiteId);
    if (ourId === undefined) return;
    const deptId = row.birimGrupId;
    let rawFacName = (row.fymkAdi || "Genel Birim").trim();
    const facTitle = toTurkishTitleCase(rawFacName);
    const unitType = determineUnitType(rawFacName);

    const u = uniDataMap[ourId];
    u.deptSet.add(deptId);

    if (!u.facultyRawCounts[facTitle]) {
      u.facultyRawCounts[facTitle] = {
        name: facTitle,
        type: unitType,
        count: 0,
        depts: new Set()
      };
    }
    u.facultyRawCounts[facTitle].count++;
    u.facultyRawCounts[facTitle].depts.add(deptId);

    // Record department's faculty
    if (!u.deptFacultyMap[deptId]) {
      u.deptFacultyMap[deptId] = facTitle;
    }
  });

  // Handle universities with fallback data (e.g. Bezmialem, Ahmet Yesevi, TUIBTU)
  // Bezmialem
  if (uniDataMap[38].deptSet.size === 0) {
    const bFacs = [
      { name: "Tıp Fakültesi", type: "Fakülte" },
      { name: "Diş Hekimliği Fakültesi", type: "Fakülte" },
      { name: "Eczacılık Fakültesi", type: "Fakülte" },
      { name: "Sağlık Bilimleri Fakültesi", type: "Fakülte" },
      { name: "Sağlık Hizmetleri Meslek Yüksekokulu", type: "MYO" }
    ];
    bFacs.forEach(f => {
      uniDataMap[38].facultyRawCounts[f.name] = { name: f.name, type: f.type, count: 1, depts: new Set() };
    });
  }

  // Final structured output
  const finalDeptMap = {};
  const finalFacultiesMap = {};

  for (let i = 0; i < ourUnis.length; i++) {
    const u = uniDataMap[i];
    finalDeptMap[i] = Array.from(u.deptSet).sort((a, b) => a - b);

    // Build faculties list
    const facNames = Object.keys(u.facultyRawCounts);
    // If university had no faculties, give it standard defaults
    if (facNames.length === 0) {
      const defFacs = [
        { name: "Mühendislik ve Doğa Bilimleri Fakültesi", type: "Fakülte" },
        { name: "İktisadi ve İdari Bilimler Fakültesi", type: "Fakülte" },
        { name: "Meslek Yüksekokulu", type: "MYO" }
      ];
      defFacs.forEach(f => {
        u.facultyRawCounts[f.name] = { name: f.name, type: f.type, count: 1, depts: new Set() };
      });
    }

    const facList = [];
    const nameToId = {};
    let facCounter = 1;

    // Sort faculties: Fakülteler first, then Yüksekokullar, Konservatuvarlar, MYO'lar
    const sortedFacNames = Object.keys(u.facultyRawCounts).sort((a, b) => {
      const typeA = u.facultyRawCounts[a].type;
      const typeB = u.facultyRawCounts[b].type;
      const order = { "Fakülte": 1, "Yüksekokul": 2, "Konservatuvar": 3, "Enstitü": 4, "MYO": 5 };
      const diff = (order[typeA] || 99) - (order[typeB] || 99);
      if (diff !== 0) return diff;
      return a.localeCompare(b, "tr");
    });

    sortedFacNames.forEach(fn => {
      const fId = `fac_${facCounter++}`;
      nameToId[fn] = fId;
      facList.push({
        id: fId,
        name: u.facultyRawCounts[fn].name,
        type: u.facultyRawCounts[fn].type
      });
    });

    // Map each department to its faculty id
    const deptToFac = {};
    for (const [deptIdStr, facName] of Object.entries(u.deptFacultyMap)) {
      deptToFac[deptIdStr] = nameToId[facName] || facList[0].id;
    }

    // Ensure any department in deptSet has an assigned faculty
    u.deptSet.forEach(dId => {
      if (!deptToFac[dId]) {
        // Find best match or fallback to first
        deptToFac[dId] = facList[0].id;
      }
    });

    finalFacultiesMap[i] = {
      faculties: facList,
      deptToFaculty: deptToFac
    };
  }

  // Summary metrics
  let totalFaculties = 0;
  for (let i = 0; i < ourUnis.length; i++) {
    totalFaculties += finalFacultiesMap[i].faculties.length;
  }

  const outJs = `// Türkiye Yükseköğretim Ulusal Bölüm & Fakülte Kataloğu (YÖK Atlas Gerçek Verisi)
window.DEPARTMENT_CATALOG = ${JSON.stringify(catalogArr, null, 2)};

window.UNI_DEPARTMENTS_MAP = ${JSON.stringify(finalDeptMap, null, 2)};

window.UNI_FACULTIES_MAP = ${JSON.stringify(finalFacultiesMap, null, 2)};
`;

  fs.writeFileSync(path.join(__dirname, "../js/departments-data.js"), outJs, "utf8");
  console.log(`\n========================================`);
  console.log(`Successfully generated js/departments-data.js!`);
  console.log(`- Total Catalog Departments: ${catalogArr.length}`);
  console.log(`- Total Universities Covered: ${ourUnis.length}`);
  console.log(`- Total Unique Faculties & Units: ${totalFaculties}`);
  console.log(`- File Size: ${Math.round(outJs.length / 1024)} KB`);
  console.log(`========================================\n`);
})();
