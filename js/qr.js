// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 5.7
//
// QR MANAGEMENT + PRINT
//
// V5.7
//
// PRINT ARCHITECTURE
//
// --------------------------------------------------
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - Search
// - Filter Zone
// - Filter Active / Inactive
// - Filter QR Status
// - Pagination
// - เลือกจุด
// - สร้าง QR Code
// - แสดง QR Preview
// - พิมพ์ QR
// - A4 Portrait
// - 3 × 3 = 9 QR / หน้า
// - QR Card ขนาดจริง 57 × 88 mm
//
// --------------------------------------------------
//
// V5.7 IMPORTANT
//
// PAPER
// - A4 Portrait
// - 210 × 297 mm
//
// QR CARD
// - 57 × 88 mm
// - แนวตั้ง
//
// LAYOUT
// - 3 columns × 3 rows
// - 9 QR / A4
//
// CARD CONTENT
// - Border
// - QR Code
// - Point ID
// - Location
// - Zone
//
// --------------------------------------------------
//
// QR LINK
//
// QR จะเปิด:
//
// index.html?pointId=POINT_ID
//
// ตัวอย่าง:
//
// index.html?pointId=ZONE1-001
//
// โดยใช้ URL ของระบบปัจจุบันเป็น Base URL
//
// --------------------------------------------------
//
// PRINT
//
// Preview = ต้นฉบับจริง
//
// เมื่อกด "สร้าง QR"
// จะสร้าง Card ใน #qrPreviewGrid
//
// เมื่อกด "พิมพ์"
//
// 1. อ่าน Card จาก Preview
// 2. อ่าน QR Bitmap จาก Preview
// 3. Snapshot Card ทั้งก้อน
// 4. ใช้ Snapshot เป็น IMG
// 5. วาง IMG ลง A4
//
// จะไม่:
// - สร้าง QR ใหม่ตอนพิมพ์
// - regenerate QR
// - เปลี่ยน pointId
// - เปลี่ยน QR Data
// - ยืด Snapshot ด้วย object-fit: fill
//
// --------------------------------------------------
//
// IMPORTANT
//
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ Database
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - API Action = qrManagement
//
// ==================================================


// ==================================================
// PAGE GUARD
// ==================================================

if (
  typeof currentPage === "undefined" ||
  currentPage !== "qr.html"
) {

  console.log(
    "GGN QR: ไม่ใช่หน้า qr.html จึงไม่เริ่มระบบ"
  );

} else {


// ==================================================
// ELEMENTS
// ==================================================

const qrStatus =
  getElement("qrStatus");

const qrPageTotal =
  getElement("qrPageTotal");

const qrSearchInput =
  getElement("qrSearchInput");

const qrZoneFilter =
  getElement("qrZoneFilter");

const qrStatusFilter =
  getElement("qrStatusFilter");

const qrExistFilter =
  getElement("qrExistFilter");

const clearQrFilterBtn =
  getElement("clearQrFilterBtn");

const qrTotalCount =
  getElement("qrTotalCount");

const qrActiveCount =
  getElement("qrActiveCount");

const qrHasQrCount =
  getElement("qrHasQrCount");

const qrSelectedCount =
  getElement("qrSelectedCount");

const selectAllQrCheckbox =
  getElement("selectAllQrCheckbox");

const qrPageSize =
  getElement("qrPageSize");

const qrLocationTableBody =
  getElement("qrLocationTableBody");

const qrPaginationInfo =
  getElement("qrPaginationInfo");

const qrPagination =
  getElement("qrPagination");

const clearAllQrBtn =
  getElement("clearAllQrBtn");

const createQrBtn =
  getElement("createQrBtn");

const printSelectedQrBtn =
  getElement("printSelectedQrBtn");

const printAllQrBtn =
  getElement("printAllQrBtn");

const qrPreviewSection =
  getElement("qrPreviewSection");

const qrPreviewCount =
  getElement("qrPreviewCount");

const qrPreviewGrid =
  getElement("qrPreviewGrid");

const qrPrintArea =
  getElement("qrPrintArea");

const refreshQrBtn =
  getElement("refreshQrBtn");


// ==================================================
// PRINT CONSTANTS
// ==================================================
//
// A4 Portrait
// 210 × 297 mm
//
// QR Card
// 57 × 88 mm
//
// 3 × 3 = 9 Cards
//
// Horizontal:
//
// 57 × 3 = 171 mm
//
// Remaining:
//
// 210 - 171 = 39 mm
//
// Left / Right:
//
// 19.5 mm
//
// Vertical:
//
// 88 × 3 = 264 mm
//
// Remaining:
//
// 297 - 264 = 33 mm
//
// Top / Bottom:
//
// 16.5 mm
// ==================================================

const QR_CARD_WIDTH_MM = 57;

const QR_CARD_HEIGHT_MM = 88;

const A4_WIDTH_MM = 210;

const A4_HEIGHT_MM = 297;

const QR_COLUMNS = 3;

const QR_ROWS = 3;

const ITEMS_PER_PAGE =
  QR_COLUMNS * QR_ROWS;


// ==================================================
// QR LINK BASE
// ==================================================
//
// QR ต้องเปิด index.html
// และส่ง pointId ไปด้วย
//
// ตัวอย่าง:
//
// https://domain.com/index.html?pointId=ABC001
//
// ใช้ path ของระบบปัจจุบัน
// ไม่ hard-code domain
// ==================================================

function getQRBaseURL() {

  try {

    const currentURL =
      new URL(
        window.location.href
      );


    currentURL.pathname =
      currentURL.pathname
        .replace(
          /\/[^/]*$/,
          "/index.html"
        );


    currentURL.search = "";

    currentURL.hash = "";


    return currentURL.toString();

  } catch (error) {

    console.warn(
      "GGN QR: ไม่สามารถสร้าง Base URL ได้",
      error
    );


    return "index.html";

  }

}


// ==================================================
// BUILD QR URL
// ==================================================

function buildQRUrl(
  pointId
) {

  const cleanPointId =
    String(
      pointId || ""
    ).trim();


  if (!cleanPointId) {

    return "";

  }


  try {

    const baseURL =
      getQRBaseURL();


    const url =
      new URL(
        baseURL,
        window.location.href
      );


    url.searchParams.set(
      "pointId",
      cleanPointId
    );


    return url.toString();

  } catch (error) {

    console.warn(
      "GGN QR: สร้าง QR URL ไม่สำเร็จ",
      error
    );


    return (
      "index.html?pointId=" +
      encodeURIComponent(
        cleanPointId
      )
    );

  }

}


// ==================================================
// STATE
// ==================================================

let qrLocations = [];

let selectedPointIds =
  new Set();


// ==================================================
// FILTER STATE
// ==================================================

let qrSearchKeyword = "";

let qrZoneValue = "";

let qrStatusValue = "";

let qrExistValue = "";


// ==================================================
// PAGINATION STATE
// ==================================================

let qrCurrentPage = 1;

let qrCurrentPageSize = 25;


// ==================================================
// EVENT GUARD
// ==================================================

let qrEventsInitialized = false;


// ==================================================
// PRINT STATE
// ==================================================

let qrPrintStyleInjected = false;

let qrIsPrinting = false;


// ==================================================
// PREVIEW SNAPSHOT CACHE
//
// key = pointId
// value = data URL
// ==================================================

const qrSnapshotCache =
  new Map();


// ==================================================
// LOAD QR MANAGEMENT
// ==================================================

async function loadQRManagement() {

  if (!qrLocationTableBody) {

    console.warn(
      "GGN QR: ไม่พบ #qrLocationTableBody"
    );

    return;

  }


  setQRStatus(
    "⏳ กำลังโหลดรายการจุดตรวจ..."
  );


  showQRTableLoading();


  try {

    if (
      typeof GOOGLE_APPS_SCRIPT_URL ===
      "undefined" ||
      !GOOGLE_APPS_SCRIPT_URL
    ) {

      throw new Error(
        "ไม่พบ GOOGLE_APPS_SCRIPT_URL"
      );

    }


    const url =
      `${GOOGLE_APPS_SCRIPT_URL}?action=qrManagement`;


    console.log(
      "GGN QR: Request",
      url
    );


    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "GGN QR Management API:",
      result
    );


    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "Backend ไม่ส่งข้อมูลสำเร็จ"
      );

    }


    const data =
      result.data || {};


    qrLocations =
      Array.isArray(
        data.locations
      )
        ? data.locations
        : [];


    qrLocations =
      qrLocations.map(
        normalizeLocation
      );


    selectedPointIds =
      new Set();


    qrSnapshotCache.clear();


    qrCurrentPage = 1;


    buildZoneFilter();

    updateQRSummary();

    renderQRTable();

    clearQRPreview();

    clearQRPrintArea();


    setQRStatus(
      `✅ โหลดข้อมูลสำเร็จ ${qrLocations.length} จุด`
    );


  } catch (error) {

    console.error(
      "GGN QR Management Error:",
      error
    );


    qrLocations = [];

    selectedPointIds =
      new Set();

    qrSnapshotCache.clear();


    updateQRSummary();

    renderQRTable();

    clearQRPreview();

    clearQRPrintArea();


    setQRStatus(
      "❌ โหลดข้อมูลไม่สำเร็จ" +
      (
        error &&
        error.message
          ? `: ${error.message}`
          : ""
      )
    );

  }

}


// ==================================================
// NORMALIZE LOCATION
// ==================================================

function normalizeLocation(
  location
) {

  if (
    !location ||
    typeof location !== "object"
  ) {

    return {};

  }


  const normalized = {
    ...location
  };


  normalized.pointId =
    String(
      location.pointId || ""
    ).trim();


  normalized.zone =
    String(
      location.zone || ""
    ).trim();


  normalized.location =
    String(
      location.location || ""
    ).trim();


  normalized.active =
    normalizeBoolean(
      location.active
    );


  return normalized;

}


// ==================================================
// NORMALIZE BOOLEAN
// ==================================================

function normalizeBoolean(
  value
) {

  if (value === true) {

    return true;

  }


  if (
    value === false ||
    value === null ||
    typeof value === "undefined"
  ) {

    return false;

  }


  if (
    typeof value === "string"
  ) {

    const text =
      value
        .trim()
        .toLowerCase();


    return (
      text === "true" ||
      text === "1" ||
      text === "yes" ||
      text === "active" ||
      text === "ใช้งาน" ||
      text === "เปิด"
    );

  }


  if (
    typeof value === "number"
  ) {

    return value === 1;

  }


  return false;

}


// ==================================================
// SHOW TABLE LOADING
// ==================================================

function showQRTableLoading() {

  if (!qrLocationTableBody) {

    return;

  }


  qrLocationTableBody.innerHTML =
    `
    <tr>
      <td
        colspan="7"
        class="qr-table-loading"
      >
        ⏳ กำลังโหลดรายการจุดตรวจ...
      </td>
    </tr>
    `;

}


// ==================================================
// BUILD ZONE FILTER
// ==================================================

function buildZoneFilter() {

  if (!qrZoneFilter) {

    return;

  }


  const currentValue =
    qrZoneValue;


  qrZoneFilter.innerHTML =
    `
    <option value="">
      ทุกเขต
    </option>
    `;


  const zones =
    [
      ...new Set(
        qrLocations
          .map(
            location =>
              String(
                location.zone || ""
              ).trim()
          )
          .filter(
            zone => zone !== ""
          )
      )
    ];


  zones.sort(
    function(a, b) {

      return a.localeCompare(
        b,
        "th"
      );

    }
  );


  zones.forEach(
    function(zone) {

      const option =
        document.createElement(
          "option"
        );


      option.value = zone;

      option.textContent = zone;


      qrZoneFilter.appendChild(
        option
      );

    }
  );


  const exists =
    Array.from(
      qrZoneFilter.options
    ).some(
      option =>
        option.value ===
        currentValue
    );


  qrZoneFilter.value =
    exists
      ? currentValue
      : "";


  qrZoneValue =
    qrZoneFilter.value;

}


// ==================================================
// FILTER
// ==================================================

function getFilteredLocations() {

  let locations =
    [...qrLocations];


  const keyword =
    String(
      qrSearchKeyword || ""
    )
      .trim()
      .toLowerCase();


  if (keyword) {

    locations =
      locations.filter(
        function(location) {

          const pointId =
            String(
              location.pointId || ""
            ).toLowerCase();


          const zone =
            String(
              location.zone || ""
            ).toLowerCase();


          const locationName =
            String(
              location.location || ""
            ).toLowerCase();


          return (
            pointId.includes(keyword) ||
            zone.includes(keyword) ||
            locationName.includes(keyword)
          );

        }
      );

  }


  if (qrZoneValue) {

    locations =
      locations.filter(
        function(location) {

          return (
            String(
              location.zone || ""
            ).trim() ===
            qrZoneValue
          );

        }
      );

  }


  if (qrStatusValue === "active") {

    locations =
      locations.filter(
        location =>
          location.active === true
      );

  }


  if (qrStatusValue === "inactive") {

    locations =
      locations.filter(
        location =>
          location.active !== true
      );

  }


  if (qrExistValue === "yes") {

    locations =
      locations.filter(
        location =>
          locationHasQR(location)
      );

  }


  if (qrExistValue === "no") {

    locations =
      locations.filter(
        location =>
          !locationHasQR(location)
      );

  }


  return locations;

}


// ==================================================
// DETECT QR STATUS
// ==================================================

function locationHasQR(
  location
) {

  if (
    !location ||
    typeof location !== "object"
  ) {

    return false;

  }


  const values = [

    location.hasQr,

    location.hasQR,

    location.qr,

    location.qrCode,

    location.qrUrl,

    location.qrData,

    location.qrGenerated

  ];


  return values.some(
    function(value) {

      if (value === true) {

        return true;

      }


      if (
        typeof value === "string"
      ) {

        return (
          value.trim() !== ""
        );

      }


      return false;

    }
  );

}


// ==================================================
// CURRENT PAGE
// ==================================================

function getCurrentPageLocations() {

  const filtered =
    getFilteredLocations();


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
        qrCurrentPageSize
      )
    );


  if (
    qrCurrentPage >
    totalPages
  ) {

    qrCurrentPage =
      totalPages;

  }


  const start =
    (
      qrCurrentPage - 1
    ) *
    qrCurrentPageSize;


  return filtered.slice(
    start,
    start + qrCurrentPageSize
  );

}


// ==================================================
// RENDER TABLE
// ==================================================

function renderQRTable() {

  if (!qrLocationTableBody) {

    return;

  }


  const filtered =
    getFilteredLocations();


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
        qrCurrentPageSize
      )
    );


  if (
    qrCurrentPage >
    totalPages
  ) {

    qrCurrentPage =
      totalPages;

  }


  const pageLocations =
    getCurrentPageLocations();


  qrLocationTableBody.innerHTML =
    "";


  if (
    pageLocations.length === 0
  ) {

    const row =
      document.createElement(
        "tr"
      );


    const cell =
      document.createElement(
        "td"
      );


    cell.colSpan = 7;

    cell.className =
      "qr-table-loading";


    cell.textContent =
      filtered.length === 0
        ? "⚪ ไม่พบจุดตรวจตามเงื่อนไขที่ค้นหา"
        : "⚪ ไม่มีรายการในหน้านี้";


    row.appendChild(cell);

    qrLocationTableBody.appendChild(row);


    updatePagination(
      filtered.length
    );

    updatePageSelectAll();


    return;

  }


  pageLocations.forEach(
    function(location) {

      qrLocationTableBody.appendChild(
        createLocationRow(location)
      );

    }
  );


  updatePagination(
    filtered.length
  );

  updatePageSelectAll();

  updateQRSummary();

}


// ==================================================
// CREATE LOCATION ROW
// ==================================================

function createLocationRow(
  location
) {

  const row =
    document.createElement(
      "tr"
    );


  const pointId =
    String(
      location.pointId || ""
    ).trim();


  const zone =
    String(
      location.zone || ""
    ).trim();


  const locationName =
    String(
      location.location || ""
    ).trim();


  const isActive =
    location.active === true;


  const hasQR =
    locationHasQR(location);


  const isSelected =
    selectedPointIds.has(pointId);


  if (isSelected) {

    row.classList.add(
      "qr-row-selected"
    );

  }


  if (!isActive) {

    row.classList.add(
      "qr-row-inactive"
    );

  }


  // CHECKBOX

  const checkCell =
    document.createElement(
      "td"
    );


  checkCell.className =
    "qr-col-check";


  const checkbox =
    document.createElement(
      "input"
    );


  checkbox.type = "checkbox";

  checkbox.className =
    "qr-location-checkbox";

  checkbox.value = pointId;

  checkbox.checked =
    isSelected;

  checkbox.disabled =
    !isActive || !pointId;


  checkbox.addEventListener(
    "change",
    function(event) {

      event.stopPropagation();

      handleLocationSelection(
        location,
        checkbox.checked
      );

    }
  );


  checkCell.appendChild(
    checkbox
  );


  row.appendChild(
    checkCell
  );


  // POINT

  const pointCell =
    document.createElement(
      "td"
    );


  pointCell.className =
    "qr-col-point";


  const pointStrong =
    document.createElement(
      "strong"
    );


  pointStrong.textContent =
    pointId || "-";


  pointCell.appendChild(
    pointStrong
  );


  row.appendChild(
    pointCell
  );


  // ZONE

  const zoneCell =
    document.createElement(
      "td"
    );


  zoneCell.className =
    "qr-col-zone";


  zoneCell.textContent =
    zone || "-";


  row.appendChild(
    zoneCell
  );


  // LOCATION

  const locationCell =
    document.createElement(
      "td"
    );


  locationCell.className =
    "qr-col-location";


  locationCell.textContent =
    locationName || "-";


  row.appendChild(
    locationCell
  );


  // ACTIVE STATUS

  const statusCell =
    document.createElement(
      "td"
    );


  statusCell.className =
    "qr-col-status";


  const statusBadge =
    document.createElement(
      "span"
    );


  statusBadge.className =
    isActive
      ? "qr-status-badge active"
      : "qr-status-badge inactive";


  statusBadge.textContent =
    isActive
      ? "Active"
      : "Inactive";


  statusCell.appendChild(
    statusBadge
  );


  row.appendChild(
    statusCell
  );


  // QR STATUS

  const qrCell =
    document.createElement(
      "td"
    );


  qrCell.className =
    "qr-col-qr";


  const qrBadge =
    document.createElement(
      "span"
    );


  qrBadge.className =
    hasQR
      ? "qr-status-badge qr-has"
      : "qr-status-badge qr-none";


  qrBadge.textContent =
    hasQR
      ? "มี QR"
      : "ยังไม่มี QR";


  qrCell.appendChild(
    qrBadge
  );


  row.appendChild(
    qrCell
  );


  // ACTION

  const actionCell =
    document.createElement(
      "td"
    );


  actionCell.className =
    "qr-col-action";


  const actionButton =
    document.createElement(
      "button"
    );


  actionButton.type =
    "button";


  actionButton.className =
    "qr-card-action-button";


  actionButton.textContent =
    "📱 สร้าง QR";


  actionButton.disabled =
    !isActive || !pointId;


  actionButton.addEventListener(
    "click",
    function(event) {

      event.preventDefault();

      event.stopPropagation();


      if (
        !isActive ||
        !pointId
      ) {

        return;

      }


      selectedPointIds =
        new Set([pointId]);


      renderQRTable();

      updateQRSummary();

      createSelectedQR();

    }
  );


  actionCell.appendChild(
    actionButton
  );


  row.appendChild(
    actionCell
  );


  // ROW CLICK

  row.addEventListener(
    "click",
    function(event) {

      if (
        event.target === checkbox ||
        event.target.closest("button")
      ) {

        return;

      }


      if (
        !isActive ||
        !pointId
      ) {

        return;

      }


      handleLocationSelection(
        location,
        !selectedPointIds.has(pointId)
      );

    }
  );


  return row;

}


// ==================================================
// HANDLE SELECTION
// ==================================================

function handleLocationSelection(
  location,
  selected
) {

  const pointId =
    String(
      location.pointId || ""
    ).trim();


  if (!pointId) {

    return;

  }


  if (
    location.active !== true
  ) {

    return;

  }


  if (selected) {

    selectedPointIds.add(pointId);

  } else {

    selectedPointIds.delete(pointId);

  }


  renderQRTable();

  updateQRSummary();

}


// ==================================================
// UPDATE SELECT ALL
// ==================================================

function updatePageSelectAll() {

  if (!selectAllQrCheckbox) {

    return;

  }


  const pageLocations =
    getCurrentPageLocations();


  const selectable =
    pageLocations.filter(
      function(location) {

        return (
          location.active === true &&
          String(
            location.pointId || ""
          ).trim() !== ""
        );

      }
    );


  if (
    selectable.length === 0
  ) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      false;

    selectAllQrCheckbox.disabled =
      true;

    return;

  }


  selectAllQrCheckbox.disabled =
    false;


  const selectedCount =
    selectable.filter(
      function(location) {

        return selectedPointIds.has(
          String(
            location.pointId
          ).trim()
        );

      }
    ).length;


  selectAllQrCheckbox.checked =
    selectedCount ===
    selectable.length;


  selectAllQrCheckbox.indeterminate =
    selectedCount > 0 &&
    selectedCount <
      selectable.length;

}


// ==================================================
// TOGGLE CURRENT PAGE
// ==================================================

function toggleSelectCurrentPage() {

  const pageLocations =
    getCurrentPageLocations();


  const selectable =
    pageLocations.filter(
      function(location) {

        return (
          location.active === true &&
          String(
            location.pointId || ""
          ).trim() !== ""
        );

      }
    );


  if (
    selectable.length === 0
  ) {

    return;

  }


  const allSelected =
    selectable.every(
      function(location) {

        return selectedPointIds.has(
          String(
            location.pointId
          ).trim()
        );

      }
    );


  selectable.forEach(
    function(location) {

      const pointId =
        String(
          location.pointId
        ).trim();


      if (allSelected) {

        selectedPointIds.delete(
          pointId
        );

      } else {

        selectedPointIds.add(
          pointId
        );

      }

    }
  );


  renderQRTable();

  updateQRSummary();

}


// ==================================================
// SELECT ALL ACTIVE
// ==================================================

function selectAllQR() {

  selectedPointIds =
    new Set(
      qrLocations
        .filter(
          function(location) {

            return (
              location.active === true &&
              String(
                location.pointId || ""
              ).trim() !== ""
            );

          }
        )
        .map(
          function(location) {

            return String(
              location.pointId
            ).trim();

          }
        )
    );


  renderQRTable();

  updateQRSummary();


  setQRStatus(
    `☑️ เลือกจุด Active ทั้งหมด ${selectedPointIds.size} จุด`
  );

}


// ==================================================
// CLEAR ALL
// ==================================================

function clearAllQR() {

  selectedPointIds =
    new Set();


  if (selectAllQrCheckbox) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      false;

  }


  renderQRTable();

  updateQRSummary();

  clearQRPreview();

  clearQRPrintArea();


  setQRStatus(
    "⬜ ยกเลิกการเลือกทั้งหมดแล้ว"
  );

}


// ==================================================
// GET SELECTED
// ==================================================

function getSelectedLocations() {

  return qrLocations.filter(
    function(location) {

      const pointId =
        String(
          location.pointId || ""
        ).trim();


      return (
        location.active === true &&
        pointId !== "" &&
        selectedPointIds.has(pointId)
      );

    }
  );

}


// ==================================================
// GET ACTIVE
// ==================================================

function getActiveLocations() {

  return qrLocations.filter(
    function(location) {

      const pointId =
        String(
          location.pointId || ""
        ).trim();


      return (
        location.active === true &&
        pointId !== ""
      );

    }
  );

}


// ==================================================
// SUMMARY
// ==================================================

function updateQRSummary() {

  const total =
    qrLocations.length;


  const active =
    qrLocations.filter(
      location =>
        location.active === true
    ).length;


  const hasQR =
    qrLocations.filter(
      location =>
        locationHasQR(location)
    ).length;


  const selected =
    selectedPointIds.size;


  if (qrTotalCount) {

    qrTotalCount.textContent =
      total;

  }


  if (qrActiveCount) {

    qrActiveCount.textContent =
      active;

  }


  if (qrHasQrCount) {

    qrHasQrCount.textContent =
      hasQR;

  }


  if (qrSelectedCount) {

    qrSelectedCount.textContent =
      selected;

  }


  if (qrPageTotal) {

    qrPageTotal.textContent =
      total;

  }


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      `${selected} จุด`;

  }


  if (createQrBtn) {

    createQrBtn.disabled =
      selected === 0;

  }


  if (printSelectedQrBtn) {

    printSelectedQrBtn.disabled =
      selected === 0;

  }


  if (printAllQrBtn) {

    printAllQrBtn.disabled =
      active === 0;

  }


  if (clearAllQrBtn) {

    clearAllQrBtn.disabled =
      selected === 0;

  }

}


// ==================================================
// CREATE SELECTED QR
// ==================================================

function createSelectedQR() {

  const selectedLocations =
    getSelectedLocations();


  if (
    selectedLocations.length === 0
  ) {

    setQRStatus(
      "⚠️ กรุณาเลือกจุดตรวจก่อนสร้าง QR"
    );

    return;

  }


  if (
    typeof QRCode === "undefined"
  ) {

    setQRStatus(
      "❌ ไม่พบ QR Generator กรุณาตรวจสอบ qrcodejs"
    );


    console.error(
      "GGN QR: QRCode library is not loaded."
    );


    return;

  }


  renderQRPreview(
    selectedLocations
  );


  setQRStatus(
    `✅ สร้าง QR สำเร็จ ${selectedLocations.length} จุด`
  );

}


// ==================================================
// RENDER QR PREVIEW
//
// Preview เป็นต้นฉบับจริง
//
// Card ใน Preview:
// - แนวตั้ง
// - 57 × 88 mm
// - QR
// - Point ID
// - Location
// - Zone
// ==================================================

function renderQRPreview(
  locations
) {

  if (!qrPreviewGrid) {

    return;

  }


  qrPreviewGrid.innerHTML =
    "";


  qrSnapshotCache.clear();


  if (
    !locations ||
    locations.length === 0
  ) {

    clearQRPreview();

    return;

  }


  locations.forEach(
    function(location) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "qr-preview-card";


      /*
       * ------------------------------------------------
       * Card Preview
       *
       * ขนาดจริง:
       * 57 × 88 mm
       * ------------------------------------------------
       */

      card.style.width =
        `${QR_CARD_WIDTH_MM}mm`;


      card.style.height =
        `${QR_CARD_HEIGHT_MM}mm`;


      card.style.boxSizing =
        "border-box";


      /*
       * QR BOX
       */

      const qrBox =
        document.createElement(
          "div"
        );


      qrBox.className =
        "qr-preview-code";


      const pointId =
        String(
          location.pointId || ""
        ).trim();


      /*
       * QR DATA
       *
       * QR ชี้ไปที่:
       *
       * index.html?pointId=...
       */

      const qrData =
        buildQRUrl(
          pointId
        );


      if (!pointId) {

        qrBox.textContent =
          "ไม่มี Point ID";

      } else {

        try {

          new QRCode(
            qrBox,
            {
              text: qrData,

              width: 180,

              height: 180,

              correctLevel:
                QRCode.CorrectLevel.H
            }
          );

        } catch (error) {

          console.error(
            "GGN QR creation error:",
            error
          );


          qrBox.textContent =
            "สร้าง QR ไม่สำเร็จ";

        }

      }


      /*
       * POINT ID
       */

      const pointIdElement =
        document.createElement(
          "div"
        );


      pointIdElement.className =
        "qr-preview-point-id";


      pointIdElement.textContent =
        pointId || "-";


      /*
       * LOCATION
       */

      const locationElement =
        document.createElement(
          "div"
        );


      locationElement.className =
        "qr-preview-location";


      locationElement.textContent =
        location.location || "-";


      /*
       * ZONE
       */

      const zoneElement =
        document.createElement(
          "div"
        );


      zoneElement.className =
        "qr-preview-zone";


      zoneElement.textContent =
        location.zone || "-";


      /*
       * APPEND
       */

      card.appendChild(
        qrBox
      );


      card.appendChild(
        pointIdElement
      );


      card.appendChild(
        locationElement
      );


      card.appendChild(
        zoneElement
      );


      qrPreviewGrid.appendChild(
        card
      );

    }
  );


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      `${locations.length} จุด`;

  }


  if (qrPreviewSection) {

    qrPreviewSection.scrollIntoView(
      {
        behavior: "smooth",
        block: "start"
      }
    );

  }

}


// ==================================================
// CLEAR PREVIEW
// ==================================================

function clearQRPreview() {

  if (!qrPreviewGrid) {

    return;

  }


  qrPreviewGrid.innerHTML =
    `
    <div class="qr-empty-state">
      ยังไม่มี QR Code
    </div>
    `;


  qrSnapshotCache.clear();


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      "0 จุด";

  }

}


// ==================================================
// PRINT STYLE V5.7
//
// A4 Portrait
// Card 57 × 88 mm
// 3 × 3
// 9 QR / หน้า
// ==================================================

function injectQRPrintStyle() {

  if (qrPrintStyleInjected) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "ggn-qr-print-style";


  style.textContent = `

    /* ================================================
       NORMAL
       ================================================ */

    #qrPrintArea {
      display: none;
    }


    /* ================================================
       PRINT BODY
       ================================================ */

    body.ggn-qr-print-active {

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    body.ggn-qr-print-active
    .dashboard-header {

      display: none !important;

    }


    body.ggn-qr-print-active
    .dashboard-menu {

      display: none !important;

    }


    body.ggn-qr-print-active
    .dashboard-container {

      display: block !important;

      width: ${A4_WIDTH_MM}mm !important;

      min-width: ${A4_WIDTH_MM}mm !important;

      max-width: ${A4_WIDTH_MM}mm !important;

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    body.ggn-qr-print-active
    .qr-management-view {

      display: block !important;

      width: ${A4_WIDTH_MM}mm !important;

      min-width: ${A4_WIDTH_MM}mm !important;

      max-width: ${A4_WIDTH_MM}mm !important;

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    body.ggn-qr-print-active
    .qr-management-view
    > *:not(#qrPrintArea) {

      display: none !important;

    }


    /* ================================================
       PRINT AREA
       ================================================ */

    body.ggn-qr-print-active
    #qrPrintArea {

      display: block !important;

      visibility: visible !important;

      width: ${A4_WIDTH_MM}mm !important;

      min-width: ${A4_WIDTH_MM}mm !important;

      max-width: ${A4_WIDTH_MM}mm !important;

      height: auto !important;

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    /* ================================================
       A4 PORTRAIT PAGE
       ================================================ */

    .ggn-qr-print-page {

      box-sizing: border-box;

      width: ${A4_WIDTH_MM}mm;

      height: ${A4_HEIGHT_MM}mm;

      padding: 0;

      margin: 0;

      display: grid;

      grid-template-columns:
        repeat(${QR_COLUMNS}, ${QR_CARD_WIDTH_MM}mm);

      grid-template-rows:
        repeat(${QR_ROWS}, ${QR_CARD_HEIGHT_MM}mm);

      column-gap: 0;

      row-gap: 0;

      justify-content: center;

      align-content: center;

      align-items: center;

      justify-items: center;

      overflow: hidden;

      background: #ffffff;

      page-break-after: always;

      break-after: page;

    }


    .ggn-qr-print-page:last-child {

      page-break-after: auto;

      break-after: auto;

    }


    /* ================================================
       PRINT CARD
       
       Card container
       ================================================ */

    .ggn-qr-print-card {

      box-sizing: border-box;

      width: ${QR_CARD_WIDTH_MM}mm;

      height: ${QR_CARD_HEIGHT_MM}mm;

      min-width: ${QR_CARD_WIDTH_MM}mm;

      max-width: ${QR_CARD_WIDTH_MM}mm;

      min-height: ${QR_CARD_HEIGHT_MM}mm;

      max-height: ${QR_CARD_HEIGHT_MM}mm;

      margin: 0;

      padding: 0;

      overflow: hidden;

      background: #ffffff;

      border: 0;

      break-inside: avoid;

      page-break-inside: avoid;

      display: block;

    }


    /* ================================================
       SNAPSHOT IMAGE
       
       Snapshot เป็น Card ทั้งใบ
       
       ห้าม stretch ด้วย object-fit: fill
       
       ใช้ขนาดจริงตามอัตราส่วน 57:88
       ================================================ */

    .ggn-qr-snapshot {

      display: block;

      width: ${QR_CARD_WIDTH_MM}mm;

      height: ${QR_CARD_HEIGHT_MM}mm;

      min-width: ${QR_CARD_WIDTH_MM}mm;

      min-height: ${QR_CARD_HEIGHT_MM}mm;

      max-width: ${QR_CARD_WIDTH_MM}mm;

      max-height: ${QR_CARD_HEIGHT_MM}mm;

      object-fit: contain;

      object-position: center center;

      margin: 0;

      padding: 0;

      border: 0;

      box-sizing: border-box;

    }


    /* ================================================
       PAGE
       ================================================ */

    @page {

      size: A4 portrait;

      margin: 0;

    }


    /* ================================================
       PRINT MEDIA
       ================================================ */

    @media print {

      html {

        width: ${A4_WIDTH_MM}mm !important;

        height: ${A4_HEIGHT_MM}mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body {

        width: ${A4_WIDTH_MM}mm !important;

        min-width: ${A4_WIDTH_MM}mm !important;

        max-width: ${A4_WIDTH_MM}mm !important;

        margin: 0 !important;

        padding: 0 !important;

        background: #ffffff !important;

      }


      body.ggn-qr-print-active
      .dashboard-container {

        display: block !important;

        width: ${A4_WIDTH_MM}mm !important;

        min-width: ${A4_WIDTH_MM}mm !important;

        max-width: ${A4_WIDTH_MM}mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body.ggn-qr-print-active
      .qr-management-view {

        display: block !important;

        width: ${A4_WIDTH_MM}mm !important;

        min-width: ${A4_WIDTH_MM}mm !important;

        max-width: ${A4_WIDTH_MM}mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body.ggn-qr-print-active
      .qr-management-view
      > *:not(#qrPrintArea) {

        display: none !important;

      }


      body.ggn-qr-print-active
      #qrPrintArea {

        display: block !important;

        visibility: visible !important;

        width: ${A4_WIDTH_MM}mm !important;

        min-width: ${A4_WIDTH_MM}mm !important;

        max-width: ${A4_WIDTH_MM}mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-page {

        display: grid !important;

        width: ${A4_WIDTH_MM}mm !important;

        height: ${A4_HEIGHT_MM}mm !important;

        padding: 0 !important;

        margin: 0 !important;

        grid-template-columns:
          repeat(
            ${QR_COLUMNS},
            ${QR_CARD_WIDTH_MM}mm
          ) !important;

        grid-template-rows:
          repeat(
            ${QR_ROWS},
            ${QR_CARD_HEIGHT_MM}mm
          ) !important;

        column-gap: 0 !important;

        row-gap: 0 !important;

        justify-content: center !important;

        align-content: center !important;

        align-items: center !important;

        justify-items: center !important;

        overflow: hidden !important;

        page-break-after: always !important;

        break-after: page !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-page:last-child {

        page-break-after: auto !important;

        break-after: auto !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-card {

        display: block !important;

        visibility: visible !important;

        width: ${QR_CARD_WIDTH_MM}mm !important;

        height: ${QR_CARD_HEIGHT_MM}mm !important;

        min-width: ${QR_CARD_WIDTH_MM}mm !important;

        max-width: ${QR_CARD_WIDTH_MM}mm !important;

        min-height: ${QR_CARD_HEIGHT_MM}mm !important;

        max-height: ${QR_CARD_HEIGHT_MM}mm !important;

        margin: 0 !important;

        padding: 0 !important;

        overflow: hidden !important;

        box-sizing: border-box !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-snapshot {

        display: block !important;

        visibility: visible !important;

        width: ${QR_CARD_WIDTH_MM}mm !important;

        height: ${QR_CARD_HEIGHT_MM}mm !important;

        min-width: ${QR_CARD_WIDTH_MM}mm !important;

        min-height: ${QR_CARD_HEIGHT_MM}mm !important;

        max-width: ${QR_CARD_WIDTH_MM}mm !important;

        max-height: ${QR_CARD_HEIGHT_MM}mm !important;

        object-fit: contain !important;

        object-position: center center !important;

        margin: 0 !important;

        padding: 0 !important;

        border: 0 !important;

        box-sizing: border-box !important;

      }

    }

  `;


  document.head.appendChild(
    style
  );


  qrPrintStyleInjected = true;

}


// ==================================================
// CLEAR PRINT AREA
// ==================================================

function clearQRPrintArea() {

  if (!qrPrintArea) {

    return;

  }


  qrPrintArea.innerHTML = "";

}


// ==================================================
// FIND PREVIEW CARD
// ==================================================

function findPreviewCardByPointId(
  pointId
) {

  if (!qrPreviewGrid) {

    return null;

  }


  const cards =
    Array.from(
      qrPreviewGrid.querySelectorAll(
        ".qr-preview-card"
      )
    );


  for (
    const card of cards
  ) {

    const pointElement =
      card.querySelector(
        ".qr-preview-point-id"
      );


    if (!pointElement) {

      continue;

    }


    const cardPointId =
      String(
        pointElement.textContent || ""
      ).trim();


    if (
      cardPointId === pointId
    ) {

      return card;

    }

  }


  return null;

}


// ==================================================
// WAIT FOR PREVIEW QR
//
// V5.8
//
// รอ QR ที่อยู่ใน Preview ให้พร้อมจริง
// ==================================================

function waitForPreviewQR(card) {

  return new Promise(function(resolve) {

    if (!card) {

      resolve(false);

      return;

    }


    const qrCanvas =
      card.querySelector(
        ".qr-preview-code canvas"
      );


    const qrImg =
      card.querySelector(
        ".qr-preview-code img"
      );


    /*
     * ---------------------------------------------
     * Canvas
     * ---------------------------------------------
     */

    if (qrCanvas) {

      let attempts = 0;

      const checkCanvas = function() {

        attempts++;


        if (
          qrCanvas.width > 0 &&
          qrCanvas.height > 0
        ) {

          resolve(true);

          return;

        }


        if (attempts >= 20) {

          resolve(false);

          return;

        }


        setTimeout(
          checkCanvas,
          50
        );

      };


      checkCanvas();

      return;

    }


    /*
     * ---------------------------------------------
     * IMG
     * ---------------------------------------------
     */

    if (qrImg) {

      if (
        qrImg.complete &&
        qrImg.naturalWidth > 0
      ) {

        resolve(true);

        return;

      }


      let done = false;


      const finish = function(success) {

        if (done) {

          return;

        }


        done = true;

        resolve(success);

      };


      qrImg.onload =
        function() {

          finish(
            qrImg.naturalWidth > 0
          );

        };


      qrImg.onerror =
        function() {

          finish(false);

        };


      setTimeout(
        function() {

          finish(
            qrImg.complete &&
            qrImg.naturalWidth > 0
          );

        },
        3000
      );


      return;

    }


    resolve(false);

  });

}

// ==================================================
// SNAPSHOT CARD
//
// V5.8
//
// Snapshot จาก Preview โดยตรง
//
// ไม่สร้าง QR ใหม่
// ไม่เปลี่ยนสัดส่วน Card
//
// Card:
// 57 × 88 mm
// ==================================================

async function snapshotQRCard(
  previewCard,
  pointId
) {

  if (!previewCard) {

    return null;

  }


  /*
   * ---------------------------------------------
   * Cache
   * ---------------------------------------------
   */

  if (
    qrSnapshotCache.has(pointId)
  ) {

    return qrSnapshotCache.get(
      pointId
    );

  }


  /*
   * ---------------------------------------------
   * รอ Preview QR
   * ---------------------------------------------
   */

  const qrReady =
    await waitForPreviewQR(
      previewCard
    );


  if (!qrReady) {

    console.warn(
      "GGN QR V5.8: Preview QR ยังไม่พร้อม",
      pointId
    );


    return null;

  }


  /*
   * ---------------------------------------------
   * อ่านขนาด Card จริงจาก Preview
   * ---------------------------------------------
   */

  const rect =
    previewCard.getBoundingClientRect();


  const width =
    Math.max(
      1,
      Math.round(rect.width)
    );


  const height =
    Math.max(
      1,
      Math.round(rect.height)
    );


  /*
   * ---------------------------------------------
   * ตรวจ Aspect Ratio
   * ---------------------------------------------
   */

  const expectedRatio =
    QR_CARD_WIDTH_MM /
    QR_CARD_HEIGHT_MM;


  const actualRatio =
    width /
    height;


  const ratioDifference =
    Math.abs(
      actualRatio -
      expectedRatio
    );


  console.log(
    "GGN QR V5.8 Snapshot:",
    {
      pointId,
      previewWidth: width,
      previewHeight: height,
      expectedRatio,
      actualRatio,
      ratioDifference
    }
  );


  /*
   * ---------------------------------------------
   * Clone Preview
   * ---------------------------------------------
   */

  const clone =
    previewCard.cloneNode(true);


  /*
   * ---------------------------------------------
   * เปลี่ยน Canvas เป็น PNG IMG
   *
   * เพราะ cloneNode(canvas)
   * จะไม่เก็บ bitmap เดิม
   * ---------------------------------------------
   */

  const originalCanvas =
    previewCard.querySelector(
      ".qr-preview-code canvas"
    );


  const clonedCanvas =
    clone.querySelector(
      ".qr-preview-code canvas"
    );


  if (
    originalCanvas &&
    clonedCanvas
  ) {

    try {

      const qrDataUrl =
        originalCanvas.toDataURL(
          "image/png"
        );


      const qrImage =
        document.createElement(
          "img"
        );


      qrImage.src =
        qrDataUrl;


      qrImage.alt =
        pointId;


      /*
       * สำคัญ
       *
       * ใช้ขนาดเดียวกับ Canvas เดิม
       * ไม่สร้าง QR ใหม่
       */

      qrImage.style.display =
        "block";


      qrImage.style.width =
        "100%";


      qrImage.style.height =
        "100%";


      qrImage.style.margin =
        "0";


      qrImage.style.padding =
        "0";


      qrImage.style.border =
        "0";


      qrImage.style.boxSizing =
        "border-box";


      qrImage.style.objectFit =
        "contain";


      qrImage.style.objectPosition =
        "center";


      clonedCanvas.replaceWith(
        qrImage
      );


    } catch (error) {

      console.error(
        "GGN QR V5.8: อ่าน Preview Canvas ไม่สำเร็จ",
        error
      );


      return null;

    }

  }


  /*
   * ---------------------------------------------
   * กำหนดขนาด Clone
   *
   * ต้องเท่ากับ Preview 1:1
   * ---------------------------------------------
   */

  clone.style.width =
    `${width}px`;


  clone.style.height =
    `${height}px`;


  clone.style.minWidth =
    `${width}px`;


  clone.style.minHeight =
    `${height}px`;


  clone.style.maxWidth =
    `${width}px`;


  clone.style.maxHeight =
    `${height}px`;


  clone.style.margin =
    "0";


  clone.style.padding =
    "0";


  clone.style.boxSizing =
    "border-box";


  /*
   * ---------------------------------------------
   * SVG
   * ---------------------------------------------
   */

  const serializer =
    new XMLSerializer();


  const clonedHTML =
    serializer.serializeToString(
      clone
    );


  const svg =
    `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
    >

      <foreignObject
        x="0"
        y="0"
        width="${width}"
        height="${height}"
      >

        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style="
            width:${width}px;
            height:${height}px;
            min-width:${width}px;
            min-height:${height}px;
            max-width:${width}px;
            max-height:${height}px;
            margin:0;
            padding:0;
            box-sizing:border-box;
            background:#ffffff;
            overflow:hidden;
          "
        >

          ${clonedHTML}

        </div>

      </foreignObject>

    </svg>
    `;


  const blob =
    new Blob(
      [svg],
      {
        type:
          "image/svg+xml;charset=utf-8"
      }
    );


  const blobUrl =
    URL.createObjectURL(
      blob
    );


  try {

    const image =
      await loadImage(
        blobUrl
      );


    /*
     * ---------------------------------------------
     * High Resolution
     *
     * 4× Preview
     * ---------------------------------------------
     */

    const scale = 4;


    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width =
      width * scale;


    canvas.height =
      height * scale;


    const context =
      canvas.getContext(
        "2d"
      );


    if (!context) {

      throw new Error(
        "ไม่สามารถสร้าง Canvas Context ได้"
      );

    }


    /*
     * ---------------------------------------------
     * White Background
     * ---------------------------------------------
     */

    context.fillStyle =
      "#ffffff";


    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    /*
     * ---------------------------------------------
     * Pixel Mapping
     *
     * Preview และ Snapshot
     * ใช้สัดส่วนเดียวกัน
     * ---------------------------------------------
     */

    context.imageSmoothingEnabled =
      true;


    context.imageSmoothingQuality =
      "high";


    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );


    /*
     * ---------------------------------------------
     * PNG
     * ---------------------------------------------
     */

    const dataUrl =
      canvas.toDataURL(
        "image/png"
      );


    if (
      !dataUrl ||
      dataUrl.length < 100
    ) {

      throw new Error(
        "Snapshot PNG ไม่สมบูรณ์"
      );

    }


    /*
     * ---------------------------------------------
     * Cache
     * ---------------------------------------------
     */

    qrSnapshotCache.set(
      pointId,
      dataUrl
    );


    console.log(
      "GGN QR V5.8 Snapshot สำเร็จ:",
      {
        pointId,
        width,
        height,
        scale,
        outputWidth:
          canvas.width,
        outputHeight:
          canvas.height
      }
    );


    return dataUrl;

  } catch (error) {

    console.error(
      "GGN QR V5.8 Snapshot Error:",
      error
    );


    return null;

  } finally {

    URL.revokeObjectURL(
      blobUrl
    );

  }

}

// ==================================================
// LOAD IMAGE
// ==================================================

function loadImage(
  src
) {

  return new Promise(
    function(resolve, reject) {

      const image =
        new Image();


      image.onload =
        function() {

          resolve(image);

        };


      image.onerror =
        function(error) {

          reject(error);

        };


      image.src =
        src;

    }
  );

}

// ==================================================
// BUILD PRINT CARD
//
// V5.8
//
// ใช้ Snapshot จาก Preview
//
// Card จริง:
// 57 × 88 mm
// ==================================================

async function createQRPrintCardFromPreview(
  location
) {

  const pointId =
    String(
      location.pointId || ""
    ).trim();


  if (!pointId) {

    return null;

  }


  const previewCard =
    findPreviewCardByPointId(
      pointId
    );


  if (!previewCard) {

    console.warn(
      "GGN QR V5.8: ไม่พบ Preview Card",
      pointId
    );


    return null;

  }


  /*
   * ---------------------------------------------
   * Snapshot Preview
   * ---------------------------------------------
   */

  const snapshot =
    await snapshotQRCard(
      previewCard,
      pointId
    );


  if (!snapshot) {

    return null;

  }


  /*
   * ---------------------------------------------
   * Print Card
   * ---------------------------------------------
   */

  const printCard =
    document.createElement(
      "div"
    );


  printCard.className =
    "ggn-qr-print-card";


  printCard.style.width =
    `${QR_CARD_WIDTH_MM}mm`;


  printCard.style.height =
    `${QR_CARD_HEIGHT_MM}mm`;


  printCard.style.minWidth =
    `${QR_CARD_WIDTH_MM}mm`;


  printCard.style.minHeight =
    `${QR_CARD_HEIGHT_MM}mm`;


  printCard.style.maxWidth =
    `${QR_CARD_WIDTH_MM}mm`;


  printCard.style.maxHeight =
    `${QR_CARD_HEIGHT_MM}mm`;


  printCard.style.margin =
    "0";


  printCard.style.padding =
    "0";


  printCard.style.boxSizing =
    "border-box";


  printCard.style.overflow =
    "hidden";


  /*
   * ---------------------------------------------
   * Snapshot
   * ---------------------------------------------
   */

  const image =
    document.createElement(
      "img"
    );


  image.className =
    "ggn-qr-snapshot";


  image.src =
    snapshot;


  image.alt =
    pointId;


  image.draggable =
    false;


  image.style.display =
    "block";


  image.style.width =
    "100%";


  image.style.height =
    "100%";


  image.style.minWidth =
    "100%";


  image.style.minHeight =
    "100%";


  image.style.maxWidth =
    "100%";


  image.style.maxHeight =
    "100%";


  image.style.margin =
    "0";


  image.style.padding =
    "0";


  image.style.border =
    "0";


  image.style.boxSizing =
    "border-box";


  /*
   * สำคัญ
   *
   * Snapshot เป็น Card สำเร็จรูป
   *
   * ดังนั้นไม่ให้ Browser
   * คำนวณเนื้อหาภายในใหม่
   */

  image.style.objectFit =
    "fill";


  image.style.objectPosition =
    "center";


  printCard.appendChild(
    image
  );


  return printCard;

}


// ==================================================
// BUILD PRINT AREA
//
// 3 × 3
// 9 QR / A4 Portrait
//
// Card:
// 57 × 88 mm
//
// A4:
// 210 × 297 mm
// ==================================================

async function buildQRPrintArea(
  locations
) {

  if (!qrPrintArea) {

    return false;

  }


  if (
    !Array.isArray(locations) ||
    locations.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่มีรายการสำหรับพิมพ์"
    );

    return false;

  }


  if (!qrPreviewGrid) {

    setQRStatus(
      "❌ ไม่พบพื้นที่สร้าง QR"
    );

    return false;

  }


  injectQRPrintStyle();


  clearQRPrintArea();


  const previewCards =
    qrPreviewGrid.querySelectorAll(
      ".qr-preview-card"
    );


  if (
    previewCards.length === 0
  ) {

    setQRStatus(
      "⚠️ กรุณากดสร้าง QR ก่อนพิมพ์"
    );

    return false;

  }


  let renderedCount = 0;


  for (
    let index = 0;
    index < locations.length;
    index += ITEMS_PER_PAGE
  ) {

    const pageLocations =
      locations.slice(
        index,
        index + ITEMS_PER_PAGE
      );


    const page =
      document.createElement(
        "div"
      );


    page.className =
      "ggn-qr-print-page";


    page.style.width =
      `${A4_WIDTH_MM}mm`;


    page.style.height =
      `${A4_HEIGHT_MM}mm`;


    for (
      const location
      of pageLocations
    ) {

      const printCard =
        await createQRPrintCardFromPreview(
          location
        );


      if (!printCard) {

        continue;

      }


      page.appendChild(
        printCard
      );


      renderedCount++;

    }


    qrPrintArea.appendChild(
      page
    );

  }


  const expectedPages =
    Math.ceil(
      locations.length /
      ITEMS_PER_PAGE
    );


  console.log(
    "GGN QR V5.7 Print Area:",
    {
      requested:
        locations.length,

      rendered:
        renderedCount,

      pages:
        expectedPages,

      perPage:
        ITEMS_PER_PAGE,

      layout:
        "A4 Portrait / 3 × 3",

      paper:
        `${A4_WIDTH_MM} × ${A4_HEIGHT_MM} mm`,

      card:
        `${QR_CARD_WIDTH_MM} × ${QR_CARD_HEIGHT_MM} mm`,

      marginHorizontal:
        "19.5 mm",

      marginVertical:
        "16.5 mm",

      source:
        "Preview Card Snapshot",

      qr:
        "Preview QR Bitmap"
    }
  );


  if (
    renderedCount !==
    locations.length
  ) {

    clearQRPrintArea();


    setQRStatus(
      `⚠️ สร้างภาพ QR ไม่ครบ ${renderedCount}/${locations.length} จุด กรุณากดสร้าง QR ใหม่`
    );


    return false;

  }


  return true;

}


// ==================================================
// WAIT FOR PRINT IMAGES
//
// V5.8
// ==================================================

function waitForQRPrintImages() {

  return new Promise(function(resolve, reject) {

    if (!qrPrintArea) {

      resolve();

      return;

    }


    const images =
      Array.from(
        qrPrintArea.querySelectorAll(
          ".ggn-qr-snapshot"
        )
      );


    if (
      images.length === 0
    ) {

      resolve();

      return;

    }


    let completed = 0;


    const finishOne =
      function() {

        completed++;


        if (
          completed >=
          images.length
        ) {

          requestAnimationFrame(
            function() {

              requestAnimationFrame(
                function() {

                  resolve();

                }
              );

            }
          );

        }

      };


    images.forEach(
      function(image) {

        if (
          image.complete &&
          image.naturalWidth > 0
        ) {

          finishOne();

          return;

        }


        let done = false;


        const finish =
          function() {

            if (done) {

              return;

            }


            done = true;

            finishOne();

          };


        image.onload =
          finish;


        image.onerror =
          finish;


        setTimeout(
          finish,
          5000
        );

      }
    );

  });

}


// ==================================================
// START PRINT
// ==================================================

async function startQRPrint(
  locations,
  statusMessage
) {

  if (qrIsPrinting) {

    return;

  }


  if (
    !locations ||
    locations.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่มีรายการสำหรับพิมพ์"
    );

    return;

  }


  if (!qrPrintArea) {

    setQRStatus(
      "❌ ไม่พบพื้นที่พิมพ์ QR"
    );

    return;

  }


  if (!qrPreviewGrid) {

    setQRStatus(
      "❌ ไม่พบพื้นที่สร้าง QR"
    );

    return;

  }


  qrIsPrinting = true;


  try {

    /*
     * ตรวจสอบ Preview
     */

    const previewCards =
      qrPreviewGrid.querySelectorAll(
        ".qr-preview-card"
      );


    if (
      previewCards.length === 0
    ) {

      throw new Error(
        "ยังไม่มี QR ในพื้นที่สร้าง กรุณากดสร้าง QR ก่อนพิมพ์"
      );

    }


    /*
     * สร้าง Snapshot
     */

    setQRStatus(
      `⏳ กำลังเตรียมภาพ QR ${locations.length} จุด...`
    );


    const success =
      await buildQRPrintArea(
        locations
      );


    if (!success) {

      return;

    }


    /*
     * เปิด Print Mode
     */

    document.body.classList.add(
      "ggn-qr-print-active"
    );


    /*
     * รอ Image
     */

    await waitForQRPrintImages();


    /*
     * รอ Layout
     */

    await new Promise(
      function(resolve) {

        requestAnimationFrame(
          function() {

            requestAnimationFrame(
              function() {

                resolve();

              }
            );

          }
        );

      }
    );


    /*
     * ตรวจสอบ Card
     */

    const renderedCards =
      qrPrintArea.querySelectorAll(
        ".ggn-qr-print-card"
      );


    const renderedImages =
      qrPrintArea.querySelectorAll(
        ".ggn-qr-snapshot"
      );


    console.log(
      "GGN QR V5.7 Print Check:",
      {
        expected:
          locations.length,

        cards:
          renderedCards.length,

        images:
          renderedImages.length,

        paper:
          "A4 Portrait",

        paperSize:
          "210 × 297 mm",

        cardSize:
          "57 × 88 mm",

        layout:
          "3 × 3 / 9 QR",

        margins:
          "19.5 mm horizontal / 16.5 mm vertical"
      }
    );


    if (
      renderedCards.length !==
      locations.length
    ) {

      throw new Error(
        `QR Card ไม่ครบ ${renderedCards.length}/${locations.length}`
      );

    }


    if (
      renderedImages.length !==
      locations.length
    ) {

      throw new Error(
        `QR Snapshot ไม่ครบ ${renderedImages.length}/${locations.length}`
      );

    }


    /*
     * PRINT
     */

    setQRStatus(
      statusMessage ||
      `🖨️ กำลังเปิดหน้าพิมพ์ ${locations.length} จุด`
    );


    window.print();

  } catch (error) {

    console.error(
      "GGN QR V5.7 Print Error:",
      error
    );


    document.body.classList.remove(
      "ggn-qr-print-active"
    );


    clearQRPrintArea();


    setQRStatus(
      "❌ ไม่สามารถเตรียมการพิมพ์ได้" +
      (
        error &&
        error.message
          ? `: ${error.message}`
          : ""
      )
    );

  } finally {

    qrIsPrinting = false;

  }

}


// ==================================================
// AFTER PRINT
// ==================================================

function handleQRAfterPrint() {

  document.body.classList.remove(
    "ggn-qr-print-active"
  );


  clearQRPrintArea();


  qrIsPrinting = false;


  setQRStatus(
    "✅ พิมพ์ QR เสร็จแล้ว"
  );

}


// ==================================================
// PRINT SELECTED
// ==================================================

function printSelectedQR() {

  const selectedLocations =
    getSelectedLocations();


  if (
    selectedLocations.length === 0
  ) {

    setQRStatus(
      "⚠️ กรุณาเลือกจุดที่ต้องการพิมพ์"
    );

    return;

  }


  const previewCards =
    qrPreviewGrid
      ? qrPreviewGrid.querySelectorAll(
          ".qr-preview-card"
        )
      : [];


  if (
    previewCards.length === 0
  ) {

    setQRStatus(
      "⚠️ กรุณากดสร้าง QR ก่อนพิมพ์"
    );

    return;

  }


  startQRPrint(
    selectedLocations,
    `🖨️ เตรียมพิมพ์ ${selectedLocations.length} จุด — 9 QR / A4 แนวตั้ง`
  );

}


// ==================================================
// PRINT ALL
// ==================================================

function printAllQR() {

  const activeLocations =
    getActiveLocations();


  if (
    activeLocations.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่พบจุด Active สำหรับพิมพ์"
    );

    return;

  }


  selectedPointIds =
    new Set(
      activeLocations.map(
        function(location) {

          return String(
            location.pointId
          ).trim();

        }
      )
    );


  renderQRTable();

  updateQRSummary();


  /*
   * ------------------------------------------------
   * Print All ต้องมี Preview ครบทุกจุด
   *
   * ดังนั้นสร้าง Preview ใหม่
   * จาก Active ทั้งหมด
   * ก่อนเริ่มพิมพ์
   * ------------------------------------------------
   */

  renderQRPreview(
    activeLocations
  );


  const previewCards =
    qrPreviewGrid
      ? qrPreviewGrid.querySelectorAll(
          ".qr-preview-card"
        )
      : [];


  if (
    previewCards.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่สามารถสร้าง Preview สำหรับ Active ทั้งหมดได้"
    );

    return;

  }


  startQRPrint(
    activeLocations,
    `🖨️ เตรียมพิมพ์จุด Active ทั้งหมด ${activeLocations.length} จุด — 9 QR / A4 แนวตั้ง`
  );

}


// ==================================================
// PAGINATION
// ==================================================

function updatePagination(
  totalItems
) {

  if (!qrPaginationInfo) {

    return;

  }


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
        qrCurrentPageSize
      )
    );


  if (totalItems === 0) {

    qrPaginationInfo.textContent =
      "0 รายการ";

  } else {

    const start =
      (
        qrCurrentPage - 1
      ) *
      qrCurrentPageSize +
      1;


    const end =
      Math.min(
        qrCurrentPage *
          qrCurrentPageSize,
        totalItems
      );


    qrPaginationInfo.textContent =
      `${start}-${end} จาก ${totalItems} รายการ`;

  }


  if (!qrPagination) {

    return;

  }


  qrPagination.innerHTML =
    "";


  const previousButton =
    document.createElement(
      "button"
    );


  previousButton.type =
    "button";


  previousButton.className =
    "qr-page-number";


  previousButton.textContent =
    "‹";


  previousButton.disabled =
    qrCurrentPage <= 1;


  previousButton.addEventListener(
    "click",
    function() {

      if (
        qrCurrentPage <= 1
      ) {

        return;

      }


      qrCurrentPage--;

      renderQRTable();

    }
  );


  qrPagination.appendChild(
    previousButton
  );


  const pages =
    createPageNumbers(
      qrCurrentPage,
      totalPages
    );


  pages.forEach(
    function(page) {

      if (page === "...") {

        const dots =
          document.createElement(
            "span"
          );


        dots.className =
          "qr-page-dots";


        dots.textContent =
          "…";


        qrPagination.appendChild(
          dots
        );


        return;

      }


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "qr-page-number";


      button.textContent =
        page;


      if (
        page === qrCurrentPage
      ) {

        button.classList.add(
          "active"
        );

      }


      button.addEventListener(
        "click",
        function() {

          qrCurrentPage =
            page;

          renderQRTable();

        }
      );


      qrPagination.appendChild(
        button
      );

    }
  );


  const nextButton =
    document.createElement(
      "button"
    );


  nextButton.type =
    "button";


  nextButton.className =
    "qr-page-number";


  nextButton.textContent =
    "›";


  nextButton.disabled =
    qrCurrentPage >=
    totalPages;


  nextButton.addEventListener(
    "click",
    function() {

      if (
        qrCurrentPage >=
        totalPages
      ) {

        return;

      }


      qrCurrentPage++;

      renderQRTable();

    }
  );


  qrPagination.appendChild(
    nextButton
  );

}


// ==================================================
// PAGE NUMBERS
// ==================================================

function createPageNumbers(
  current,
  total
) {

  if (total <= 7) {

    return Array.from(
      {
        length: total
      },
      function(_, index) {

        return index + 1;

      }
    );

  }


  const pages = [];


  pages.push(1);


  if (current > 4) {

    pages.push("...");

  }


  const start =
    Math.max(
      2,
      current - 1
    );


  const end =
    Math.min(
      total - 1,
      current + 1
    );


  for (
    let page = start;
    page <= end;
    page++
  ) {

    pages.push(page);

  }


  if (
    current <
    total - 3
  ) {

    pages.push("...");

  }


  pages.push(total);


  return pages;

}


// ==================================================
// CLEAR FILTER
// ==================================================

function clearQRFilters() {

  qrSearchKeyword = "";

  qrZoneValue = "";

  qrStatusValue = "";

  qrExistValue = "";


  if (qrSearchInput) {

    qrSearchInput.value = "";

  }


  if (qrZoneFilter) {

    qrZoneFilter.value = "";

  }


  if (qrStatusFilter) {

    qrStatusFilter.value = "";

  }


  if (qrExistFilter) {

    qrExistFilter.value = "";

  }


  qrCurrentPage = 1;


  renderQRTable();


  setQRStatus(
    "🔄 ล้างตัวกรองแล้ว"
  );

}


// ==================================================
// PAGE SIZE
// ==================================================

function handlePageSizeChange() {

  if (!qrPageSize) {

    return;

  }


  const value =
    Number(
      qrPageSize.value
    );


  qrCurrentPageSize =
    Number.isFinite(value) &&
    value > 0
      ? value
      : 25;


  qrCurrentPage = 1;


  renderQRTable();

}


// ==================================================
// STATUS
// ==================================================

function setQRStatus(
  message
) {

  if (!qrStatus) {

    return;

  }


  qrStatus.textContent =
    message;

}


// ==================================================
// SEARCH
// ==================================================

function initializeQRSearch() {

  if (!qrSearchInput) {

    return;

  }


  qrSearchInput.addEventListener(
    "input",
    function() {

      qrSearchKeyword =
        String(
          qrSearchInput.value || ""
        )
          .trim()
          .toLowerCase();


      qrCurrentPage = 1;


      renderQRTable();

    }
  );

}


// ==================================================
// ZONE FILTER
// ==================================================

function initializeQRZoneFilter() {

  if (!qrZoneFilter) {

    return;

  }


  qrZoneFilter.addEventListener(
    "change",
    function() {

      qrZoneValue =
        qrZoneFilter.value;


      qrCurrentPage = 1;


      renderQRTable();

    }
  );

}


// ==================================================
// STATUS FILTER
// ==================================================

function initializeQRStatusFilter() {

  if (!qrStatusFilter) {

    return;

  }


  qrStatusFilter.addEventListener(
    "change",
    function() {

      qrStatusValue =
        qrStatusFilter.value;


      qrCurrentPage = 1;


      renderQRTable();

    }
  );

}


// ==================================================
// QR FILTER
// ==================================================

function initializeQRExistFilter() {

  if (!qrExistFilter) {

    return;

  }


  qrExistFilter.addEventListener(
    "change",
    function() {

      qrExistValue =
        qrExistFilter.value;


      qrCurrentPage = 1;


      renderQRTable();

    }
  );

}


// ==================================================
// SELECT ALL
// ==================================================

function initializeSelectAll() {

  if (!selectAllQrCheckbox) {

    return;

  }


  selectAllQrCheckbox.addEventListener(
    "change",
    function() {

      toggleSelectCurrentPage();

    }
  );

}


// ==================================================
// CLEAR FILTER
// ==================================================

function initializeClearFilter() {

  if (!clearQrFilterBtn) {

    return;

  }


  clearQrFilterBtn.addEventListener(
    "click",
    function() {

      clearQRFilters();

    }
  );

}


// ==================================================
// PAGE SIZE
// ==================================================

function initializePageSize() {

  if (!qrPageSize) {

    return;

  }


  qrCurrentPageSize =
    Number(
      qrPageSize.value
    ) || 25;


  qrPageSize.addEventListener(
    "change",
    function() {

      handlePageSizeChange();

    }
  );

}


// ==================================================
// CLEAR ALL
// ==================================================

function initializeClearAll() {

  if (!clearAllQrBtn) {

    return;

  }


  clearAllQrBtn.addEventListener(
    "click",
    function() {

      clearAllQR();

    }
  );

}


// ==================================================
// CREATE
// ==================================================

function initializeCreateQR() {

  if (!createQrBtn) {

    return;

  }


  createQrBtn.addEventListener(
    "click",
    function() {

      createSelectedQR();

    }
  );

}


// ==================================================
// PRINT SELECTED
// ==================================================

function initializePrintSelected() {

  if (!printSelectedQrBtn) {

    return;

  }


  printSelectedQrBtn.addEventListener(
    "click",
    function() {

      printSelectedQR();

    }
  );

}


// ==================================================
// PRINT ALL
// ==================================================

function initializePrintAll() {

  if (!printAllQrBtn) {

    return;

  }


  printAllQrBtn.addEventListener(
    "click",
    function() {

      printAllQR();

    }
  );

}


// ==================================================
// REFRESH
// ==================================================

function initializeRefresh() {

  if (!refreshQrBtn) {

    return;

  }


  refreshQrBtn.addEventListener(
    "click",
    function() {

      loadQRManagement();

    }
  );

}


// ==================================================
// AFTER PRINT
// ==================================================

function initializeAfterPrint() {

  window.addEventListener(
    "afterprint",
    function() {

      handleQRAfterPrint();

    }
  );

}


// ==================================================
// INITIALIZE
// ==================================================

function initializeQREvents() {

  if (qrEventsInitialized) {

    return;

  }


  qrEventsInitialized = true;


  initializeQRSearch();

  initializeQRZoneFilter();

  initializeQRStatusFilter();

  initializeQRExistFilter();

  initializeSelectAll();

  initializeClearFilter();

  initializePageSize();

  initializeClearAll();

  initializeCreateQR();

  initializePrintSelected();

  initializePrintAll();

  initializeRefresh();

  initializeAfterPrint();

}


// ==================================================
// START
// ==================================================

initializeQREvents();

loadQRManagement();


} // END PAGE GUARD