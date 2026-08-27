// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 5.9
//
// QR MANAGEMENT + PRINT
//
// V5.9
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
// V5.9 IMPORTANT
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
// 2. ใช้ QR ที่อยู่ใน Preview เดิม
// 3. สร้าง Snapshot ของ Card ทั้งใบ
// 4. ใช้ Snapshot เป็น IMG
// 5. วาง IMG ลง A4
// 6. พิมพ์
//
// IMPORTANT
//
// - ไม่สร้าง QR ใหม่ตอนพิมพ์
// - ไม่ regenerate QR
// - ไม่เปลี่ยน pointId
// - ไม่เปลี่ยน QR Data
// - ไม่อ่าน QR Data ใหม่จาก Backend
// - ไม่ใช้ originalCanvas.toDataURL()
// - ป้องกันปัญหา Tainted Canvas จาก V5.8
//
// --------------------------------------------------
//
// PAPER
//
// - A4 Portrait
// - 210 × 297 mm
//
// QR CARD
//
// - 57 × 88 mm
// - แนวตั้ง
//
// LAYOUT
//
// - 3 columns × 3 rows
// - 9 QR / A4
//
// CARD CONTENT
//
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
// SNAPSHOT CONSTANTS
// ==================================================
//
// ใช้ Pixel เป็นฐานสำหรับ Snapshot
//
// Card Preview ที่พบจากการทดสอบ:
//
// 57 mm × 88 mm
//
// Browser render โดยประมาณ:
//
// 215 × 333 px
//
// V5.9 จะ snapshot จาก DOM Card
// โดยไม่แตะ original QR canvas โดยตรง
//
// ==================================================

const QR_SNAPSHOT_SCALE = 2;



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
      currentURL.pathname.replace(
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

    qrLocationTableBody.appendChild(
      row
    );


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



  // ==================================================
  // CHECKBOX
  // ==================================================

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


  checkbox.type =
    "checkbox";


  checkbox.className =
    "qr-location-checkbox";


  checkbox.value =
    pointId;


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



  // ==================================================
  // POINT
  // ==================================================

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



  // ==================================================
  // ZONE
  // ==================================================

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



  // ==================================================
  // LOCATION
  // ==================================================

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



  // ==================================================
  // ACTIVE STATUS
  // ==================================================

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



  // ==================================================
  // QR STATUS
  // ==================================================

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



  // ==================================================
  // ACTION
  // ==================================================

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



  // ==================================================
  // ROW CLICK
  // ==================================================

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

    selectedPointIds.add(
      pointId
    );

  } else {

    selectedPointIds.delete(
      pointId
    );
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
//
// - แนวตั้ง
// - 57 × 88 mm
// - QR
// - Point ID
// - Location
// - Zone
//
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


      // ------------------------------------------------
      // Card Preview
      //
      // ขนาดจริง:
      // 57 × 88 mm
      // ------------------------------------------------

      card.style.width =
        `${QR_CARD_WIDTH_MM}mm`;


      card.style.height =
        `${QR_CARD_HEIGHT_MM}mm`;


      card.style.boxSizing =
        "border-box";


      // ------------------------------------------------
      // QR BOX
      // ------------------------------------------------

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


      // ------------------------------------------------
      // QR DATA
      //
      // QR ชี้ไปที่:
      //
      // index.html?pointId=...
      // ------------------------------------------------

      const qrData =
        buildQRUrl(
          pointId
        );


      // เก็บ QR Data ไว้กับ Card
      // เพื่อให้ Print ตรวจสอบได้
      // โดยไม่ต้องสร้าง QR ใหม่
      card.dataset.pointId =
        pointId;


      card.dataset.qrData =
        qrData;


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


      // ------------------------------------------------
      // POINT ID
      // ------------------------------------------------

      const pointIdElement =
        document.createElement(
          "div"
        );


      pointIdElement.className =
        "qr-preview-point-id";


      pointIdElement.textContent =
        pointId || "-";



      // ------------------------------------------------
      // LOCATION
      // ------------------------------------------------

      const locationElement =
        document.createElement(
          "div"
        );


      locationElement.className =
        "qr-preview-location";


      locationElement.textContent =
        location.location || "-";



      // ------------------------------------------------
      // ZONE
      // ------------------------------------------------

      const zoneElement =
        document.createElement(
          "div"
        );


      zoneElement.className =
        "qr-preview-zone";


      zoneElement.textContent =
        location.zone || "-";



      // ------------------------------------------------
      // APPEND
      // ------------------------------------------------

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
// PRINT STYLE V5.9
//
// A4 Portrait
// Card 57 × 88 mm
// 3 × 3
// 9 QR / หน้า
//
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
      min-width: ${A4_WIDTH_MM_MM}mm !important;
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
        repeat(
          ${QR_COLUMNS},
          ${QR_CARD_WIDTH_MM}mm
        );

      grid-template-rows:
        repeat(
          ${QR_ROWS},
          ${QR_CARD_HEIGHT_MM}mm
        );

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


  qrPrintStyleInjected =
    true;
}



// ==================================================
// CLEAR PRINT AREA
// ==================================================

function clearQRPrintArea() {

  if (!qrPrintArea) {
    return;
  }


  qrPrintArea.innerHTML =
    "";
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
// V5.9 SNAPSHOT HELPERS
//
// จุดสำคัญของ V5.9:
//
// ห้าม:
//
// originalCanvas.toDataURL()
//
// เพราะ V5.8 พบ:
//
// SecurityError:
// Failed to execute 'toDataURL' on
// 'HTMLCanvasElement':
// Tainted canvases may not be exported.
//
// ดังนั้น V5.9 จะไม่ดึง Bitmap
// จาก QR Canvas โดยตรง
//
// แต่จะ snapshot "Card Preview"
// ที่ผู้ใช้เห็นอยู่แล้ว
//
// ==================================================



// ==================================================
// WAIT FOR IMAGE
// ==================================================

function waitForImage(
  image
) {

  return new Promise(
    function(resolve) {

      if (!image) {

        resolve();

        return;
      }


      if (image.complete) {

        resolve();

        return;
      }


      image.addEventListener(
        "load",
        function() {

          resolve();
        },
        {
          once: true
        }
      );


      image.addEventListener(
        "error",
        function() {

          resolve();
        },
        {
          once: true
        }
      );
    }
  );
}



// ==================================================
// WAIT FOR QR RENDER
// ==================================================
//
// รอให้ QR ที่สร้างใน Preview
// render เสร็จสมบูรณ์ก่อน snapshot
//
// ==================================================

async function waitForQRRender(
  card
) {

  if (!card) {
    return;
  }


  const images =
    Array.from(
      card.querySelectorAll(
        "img"
      )
    );


  if (images.length > 0) {

    await Promise.all(
      images.map(
        waitForImage
      )
    );
  }


  // ให้ Browser มีเวลา
  // วาด DOM และ QR ให้เสร็จ
  await new Promise(
    function(resolve) {

      requestAnimationFrame(
        function() {

          requestAnimationFrame(
            resolve
          );
        }
      );
    }
  );
}



// ==================================================
// GET CARD DIMENSION
// ==================================================

function getPreviewCardDimension(
  card
) {

  if (!card) {

    return {
      width: 0,
      height: 0
    };
  }


  const rect =
    card.getBoundingClientRect();


  return {

    width:
      Math.round(
        rect.width
      ),

    height:
      Math.round(
        rect.height
      )
  };
}



// ==================================================
// CLONE PREVIEW CARD
// ==================================================
//
// Clone เฉพาะ Card
// ไม่สร้าง QR ใหม่
//
// ==================================================

function clonePreviewCard(
  card
) {

  if (!card) {
    return null;
  }


  const clone =
    card.cloneNode(true);


  clone.classList.add(
    "ggn-qr-snapshot-source"
  );


  clone.style.width =
    `${QR_CARD_WIDTH_MM}mm`;


  clone.style.height =
    `${QR_CARD_HEIGHT_MM}mm`;


  clone.style.minWidth =
    `${QR_CARD_WIDTH_MM}mm`;


  clone.style.minHeight =
    `${QR_CARD_HEIGHT_MM}mm`;


  clone.style.maxWidth =
    `${QR_CARD_WIDTH_MM}mm`;


  clone.style.maxHeight =
    `${QR_CARD_HEIGHT_MM}mm`;


  clone.style.margin =
    "0";


  clone.style.boxSizing =
    "border-box";


  return clone;
}



// ==================================================
// COPY COMPUTED STYLE
// ==================================================
//
// ใช้เพื่อให้ Snapshot
// มีหน้าตาเหมือน Preview
//
// ==================================================

function copyComputedStyle(
  source,
  target
) {

  if (
    !source ||
    !target
  ) {

    return;
  }


  const computed =
    window.getComputedStyle(
      source
    );


  const properties = [

    "box-sizing",

    "display",

    "position",

    "width",

    "height",

    "min-width",

    "min-height",

    "max-width",

    "max-height",

    "margin",

    "padding",

    "border",

    "border-radius",

    "background",

    "background-color",

    "background-image",

    "color",

    "font-family",

    "font-size",

    "font-weight",

    "font-style",

    "line-height",

    "letter-spacing",

    "text-align",

    "text-transform",

    "white-space",

    "overflow",

    "object-fit",

    "object-position",

    "align-items",

    "justify-content",

    "flex-direction",

    "gap"

  ];


  properties.forEach(
    function(property) {

      const value =
        computed.getPropertyValue(
          property
        );


      if (value) {

        target.style.setProperty(
          property,
          value
        );
      }
    }
  );
}



// ==================================================
// COPY CARD STYLES RECURSIVELY
// ==================================================

function copyCardStyles(
  source,
  target
) {

  if (
    !source ||
    !target
  ) {

    return;
  }


  copyComputedStyle(
    source,
    target
  );


  const sourceChildren =
    Array.from(
      source.children
    );


  const targetChildren =
    Array.from(
      target.children
    );


  sourceChildren.forEach(
    function(
      sourceChild,
      index
    ) {

      const targetChild =
        targetChildren[index];


      if (!targetChild) {
        return;
      }


      copyComputedStyle(
        sourceChild,
        targetChild
      );


      copyCardStyles(
        sourceChild,
        targetChild
      );
    }
  );
}



// ==================================================
// PREPARE SNAPSHOT SOURCE
// ==================================================
//
// เตรียม Card Preview ที่ clone แล้ว
// ให้สามารถถูก rasterize ได้
//
// IMPORTANT:
//
// ไม่แตะ QR Canvas ต้นฉบับ
//
// ==================================================

function prepareSnapshotSource(
  card
) {

  const clone =
    clonePreviewCard(
      card
    );


  if (!clone) {
    return null;
  }


  copyCardStyles(
    card,
    clone
  );


  // ------------------------------------------------
  // QR Canvas
  //
  // ไม่เรียก toDataURL()
  // ไม่อ่าน Bitmap
  // ไม่ regenerate QR
  // ------------------------------------------------

  const originalCanvases =
    Array.from(
      card.querySelectorAll(
        "canvas"
      )
    );


  const cloneCanvases =
    Array.from(
      clone.querySelectorAll(
        "canvas"
      )
    );


  originalCanvases.forEach(
    function(
      originalCanvas,
      index
    ) {

      const cloneCanvas =
        cloneCanvases[index];


      if (!cloneCanvas) {
        return;
      }


      const width =
        originalCanvas.width;


      const height =
        originalCanvas.height;


      cloneCanvas.width =
        width;


      cloneCanvas.height =
        height;


      cloneCanvas.style.width =
        originalCanvas.style.width;


      cloneCanvas.style.height =
        originalCanvas.style.height;


      // ------------------------------------------------
      // สำคัญ:
      //
      // ไม่ใช้:
      //
      // originalCanvas.toDataURL()
      //
      // ------------------------------------------------

      cloneCanvas.dataset.ggnQrCanvas =
        "preview-original";
    }
  );


  return clone;
}



// ==================================================
// BUILD SNAPSHOT STAGE
// ==================================================
//
// สร้างพื้นที่ชั่วคราวนอกหน้าจอ
//
// ==================================================

function createSnapshotStage(
  clone
) {

  const stage =
    document.createElement(
      "div"
    );


  stage.className =
    "ggn-qr-snapshot-stage";


  stage.style.position =
    "fixed";


  stage.style.left =
    "-100000px";


  stage.style.top =
    "0";


  stage.style.width =
    `${QR_CARD_WIDTH_MM}mm`;


  stage.style.height =
    `${QR_CARD_HEIGHT_MM}mm`;


  stage.style.minWidth =
    `${QR_CARD_WIDTH_MM}mm`;


  stage.style.minHeight =
    `${QR_CARD_HEIGHT_MM}mm`;


  stage.style.maxWidth =
    `${QR_CARD_WIDTH_MM}mm`;


  stage.style.maxHeight =
    `${QR_CARD_HEIGHT_MM}mm`;


  stage.style.margin =
    "0";


  stage.style.padding =
    "0";


  stage.style.background =
    "#ffffff";


  stage.style.overflow =
    "hidden";


  stage.style.boxSizing =
    "border-box";


  stage.style.zIndex =
    "-999999";


  stage.appendChild(
    clone
  );


  document.body.appendChild(
    stage
  );


  return stage;
}



// ==================================================
// FIND QR IMAGE IN PREVIEW
// ==================================================
//
// qrcodejs บาง version จะมีทั้ง:
//
// - canvas
// - img
//
// ถ้ามี IMG ที่เป็น Data URL
// ให้ใช้ IMG เดิมของ Preview
//
// ไม่ regenerate QR
//
// ==================================================

function findPreviewQRImage(
  card
) {

  if (!card) {
    return null;
  }


  const images =
    Array.from(
      card.querySelectorAll(
        "img"
      )
    );


  for (
    const image of images
  ) {

    const src =
      String(
        image.getAttribute(
          "src"
        ) || ""
      ).trim();


    if (
      src.startsWith(
        "data:image/"
      )
    ) {

      return image;
    }
  }


  return null;
}



// ==================================================
// COPY PREVIEW QR IMAGE
// ==================================================
//
// ถ้า Preview มี IMG QR
// ให้ clone IMG เดิม
//
// ==================================================

function preservePreviewQRImage(
  originalCard,
  clonedCard
) {

  const originalImage =
    findPreviewQRImage(
      originalCard
    );


  if (!originalImage) {

    return false;
  }


  const clonedImages =
    Array.from(
      clonedCard.querySelectorAll(
        "img"
      )
    );


  const clonedImage =
    clonedImages.find(
      function(image) {

        const src =
          String(
            image.getAttribute(
              "src"
            ) || ""
          ).trim();


        return (
          src.startsWith(
            "data:image/"
          )
        );
      }
    );


  if (!clonedImage) {

    return false;
  }


  clonedImage.src =
    originalImage.src;


  clonedImage.removeAttribute(
    "crossorigin"
  );


  return true;
}



// ==================================================
// SNAPSHOT USING HTML2CANVAS
// ==================================================
//
// V5.9
//
// html2canvas ใช้ DOM Card
// เป็นต้นฉบับ
//
// ไม่สร้าง QR ใหม่
//
// allowTaint = false
// useCORS = true
//
// และจะไม่เรียก
// originalCanvas.toDataURL()
//
// ==================================================

async function snapshotPreviewCard(
  card
) {

  if (!card) {

    throw new Error(
      "ไม่พบ QR Preview Card"
    );
  }


  if (
    typeof html2canvas ===
    "undefined"
  ) {

    throw new Error(
      "ไม่พบ html2canvas"
    );
  }


  const pointId =
    String(
      card.dataset.pointId ||
      card.querySelector(
        ".qr-preview-point-id"
      )?.textContent ||
      ""
    ).trim();


  if (!pointId) {

    throw new Error(
      "ไม่พบ Point ID ใน Preview Card"
    );
  }


  // ------------------------------------------------
  // ถ้ามี Snapshot อยู่แล้ว
  // ให้ใช้ Snapshot เดิม
  // ------------------------------------------------

  if (
    qrSnapshotCache.has(
      pointId
    )
  ) {

    return qrSnapshotCache.get(
      pointId
    );
  }


  // ------------------------------------------------
  // รอ QR Preview
  // ------------------------------------------------

  await waitForQRRender(
    card
  );


  // ------------------------------------------------
  // ตรวจสอบขนาด Card
  // ------------------------------------------------

  const dimension =
    getPreviewCardDimension(
      card
    );


  console.log(
    "GGN QR V5.9: Preview Card",
    {
      pointId,
      width: dimension.width,
      height: dimension.height
    }
  );


  if (
    dimension.width <= 0 ||
    dimension.height <= 0
  ) {

    throw new Error(
      `Preview Card ${pointId} ไม่มีขนาด`
    );
  }


  // ------------------------------------------------
  // Clone Card
  // ------------------------------------------------

  const clone =
    prepareSnapshotSource(
      card
    );


  if (!clone) {

    throw new Error(
      `ไม่สามารถ Clone Preview Card ${pointId} ได้`
    );
  }


  // ------------------------------------------------
  // รักษา QR IMG เดิม
  // ------------------------------------------------

  const preserved =
    preservePreviewQRImage(
      card,
      clone
    );


  console.log(
    "GGN QR V5.9: Preserve QR Image",
    {
      pointId,
      preserved
    }
  );


  // ------------------------------------------------
  // Snapshot Stage
  // ------------------------------------------------

  const stage =
    createSnapshotStage(
      clone
    );


  try {

    await waitForQRRender(
      clone
    );


    // ------------------------------------------------
    // ใช้ html2canvas กับ Card Preview
    //
    // สำคัญ:
    //
    // ไม่แตะ originalCanvas.toDataURL()
    // ------------------------------------------------

    const canvas =
      await html2canvas(
        clone,
        {
          scale:
            QR_SNAPSHOT_SCALE,

          useCORS:
            true,

          allowTaint:
            false,

          backgroundColor:
            "#ffffff",

          logging:
            false,

          imageTimeout:
            15000,

          removeContainer:
            true,

          foreignObjectRendering:
            false
        }
      );


    // ------------------------------------------------
    // ตรวจสอบ Snapshot Canvas
    // ------------------------------------------------

    if (!canvas) {

      throw new Error(
        `สร้าง Snapshot ${pointId} ไม่สำเร็จ`
      );
    }


    if (
      canvas.width <= 0 ||
      canvas.height <= 0
    ) {

      throw new Error(
        `Snapshot ${pointId} มีขนาดไม่ถูกต้อง`
      );
    }


    console.log(
      "GGN QR V5.9: Snapshot",
      {
        pointId,
        width: canvas.width,
        height: canvas.height
      }
    );


    // ------------------------------------------------
    // แปลง Snapshot Canvas
    //
    // Canvas นี้คือ Canvas ที่
    // html2canvas สร้างขึ้นใหม่
    //
    // ไม่ใช่ QR Canvas ต้นฉบับ
    // ------------------------------------------------

    let dataURL = "";


    try {

      dataURL =
        canvas.toDataURL(
          "image/png"
        );

    } catch (error) {

      console.error(
        "GGN QR V5.9: Snapshot export failed",
        {
          pointId,
          error
        }
      );


      throw new Error(
        `ไม่สามารถส่งออก Snapshot ของ ${pointId} ได้`
      );
    }


    if (
      !dataURL ||
      !dataURL.startsWith(
        "data:image/"
      )
    ) {

      throw new Error(
        `Snapshot ${pointId} ไม่ใช่ภาพที่ถูกต้อง`
      );
    }


    // ------------------------------------------------
    // Cache
    // ------------------------------------------------

    qrSnapshotCache.set(
      pointId,
      dataURL
    );


    return dataURL;

  } finally {

    if (stage) {

      stage.remove();
    }
  }
}


// ==================================================
// END OF PART 1/2
// ==================================================


// GGN CHECK-IN
// QR.JS
// Version 5.9
//
// PART 2/2
//
// CONTINUE FROM PART 1/2
//
// หน้าที่:
// - Pagination
// - Event Binding
// - Preview Snapshot
// - Print Snapshot
// - A4 Portrait
// - 3 × 3
// - 57 × 88 mm
// - Restore UI หลังพิมพ์
//
// IMPORTANT
//
// Preview = ต้นฉบับจริง
//
// Print จะใช้ Snapshot จาก Preview
//
// ไม่สร้าง QR ใหม่
// ไม่เปลี่ยน pointId
// ไม่เปลี่ยน QR Data
// ไม่อ่าน QR ใหม่จาก Backend
// ไม่ใช้ originalCanvas.toDataURL()
//
// ==================================================


// ==================================================
// PAGINATION
// ==================================================

function updatePagination(totalItems) {

  if (!qrPaginationInfo || !qrPagination) {
    return;
  }

  const total = Math.max(
    0,
    Number(totalItems) || 0
  );

  const pageSize = Math.max(
    1,
    Number(qrCurrentPageSize) || 25
  );

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  if (qrCurrentPage > totalPages) {
    qrCurrentPage = totalPages;
  }

  if (qrCurrentPage < 1) {
    qrCurrentPage = 1;
  }

  if (total === 0) {

    qrPaginationInfo.textContent =
      "ไม่พบข้อมูล";

  } else {

    const start =
      ((qrCurrentPage - 1) * pageSize) + 1;

    const end =
      Math.min(
        qrCurrentPage * pageSize,
        total
      );

    qrPaginationInfo.textContent =
      `${start}-${end} จาก ${total} จุด`;
  }

  renderPaginationButtons(
    totalPages
  );
}


// ==================================================
// RENDER PAGINATION BUTTONS
// ==================================================

function renderPaginationButtons(totalPages) {

  if (!qrPagination) {
    return;
  }

  qrPagination.innerHTML = "";

  const createButton =
    function(label, page, disabled, active) {

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "qr-pagination-button";

      if (active) {
        button.classList.add(
          "active"
        );
      }

      button.textContent = label;

      button.disabled = !!disabled;

      button.addEventListener(
        "click",
        function(event) {

          event.preventDefault();
          event.stopPropagation();

          if (button.disabled) {
            return;
          }

          if (
            page < 1 ||
            page > totalPages
          ) {
            return;
          }

          if (
            page === qrCurrentPage
          ) {
            return;
          }

          qrCurrentPage = page;

          renderQRTable();

          if (qrLocationTableBody) {
            qrLocationTableBody.scrollIntoView({
              behavior: "smooth",
              block: "nearest"
            });
          }
        }
      );

      qrPagination.appendChild(
        button
      );
    };


  // Previous

  createButton(
    "‹",
    qrCurrentPage - 1,
    qrCurrentPage <= 1,
    false
  );


  // --------------------------------------------------
  // Page Number Logic
  // --------------------------------------------------

  const pages = [];

  if (totalPages <= 7) {

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      pages.push(page);
    }

  } else {

    pages.push(1);

    if (qrCurrentPage > 4) {
      pages.push("...");
    }

    const start =
      Math.max(
        2,
        qrCurrentPage - 1
      );

    const end =
      Math.min(
        totalPages - 1,
        qrCurrentPage + 1
      );

    for (
      let page = start;
      page <= end;
      page++
    ) {
      pages.push(page);
    }

    if (
      qrCurrentPage <
      totalPages - 3
    ) {
      pages.push("...");
    }

    pages.push(totalPages);
  }


  pages.forEach(
    function(page) {

      if (page === "...") {

        const span =
          document.createElement("span");

        span.className =
          "qr-pagination-ellipsis";

        span.textContent = "...";

        qrPagination.appendChild(
          span
        );

        return;
      }

      createButton(
        String(page),
        page,
        false,
        page === qrCurrentPage
      );
    }
  );


  // Next

  createButton(
    "›",
    qrCurrentPage + 1,
    qrCurrentPage >= totalPages,
    false
  );
}


// ==================================================
// PAGE SIZE
// ==================================================

function handleQRPageSizeChange() {

  if (!qrPageSize) {
    return;
  }

  const value =
    Number(qrPageSize.value);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    qrCurrentPageSize = 25;
  } else {
    qrCurrentPageSize = value;
  }

  qrCurrentPage = 1;

  renderQRTable();
}


// ==================================================
// SEARCH
// ==================================================

function handleQRSearch() {

  qrSearchKeyword =
    qrSearchInput
      ? String(
          qrSearchInput.value || ""
        ).trim()
      : "";

  qrCurrentPage = 1;

  renderQRTable();
}


// ==================================================
// ZONE FILTER
// ==================================================

function handleQRZoneFilter() {

  qrZoneValue =
    qrZoneFilter
      ? String(
          qrZoneFilter.value || ""
        ).trim()
      : "";

  qrCurrentPage = 1;

  renderQRTable();
}


// ==================================================
// ACTIVE / INACTIVE FILTER
// ==================================================

function handleQRStatusFilter() {

  qrStatusValue =
    qrStatusFilter
      ? String(
          qrStatusFilter.value || ""
        ).trim()
        .toLowerCase()
      : "";

  qrCurrentPage = 1;

  renderQRTable();
}


// ==================================================
// QR EXIST FILTER
// ==================================================

function handleQRExistFilter() {

  qrExistValue =
    qrExistFilter
      ? String(
          qrExistFilter.value || ""
        ).trim()
        .toLowerCase()
      : "";

  qrCurrentPage = 1;

  renderQRTable();
}


// ==================================================
// CLEAR FILTER
// ==================================================

function clearQRFilters() {

  qrSearchKeyword = "";
  qrZoneValue = "";
  qrStatusValue = "";
  qrExistValue = "";

  qrCurrentPage = 1;

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

  renderQRTable();

  setQRStatus(
    "🔄 ล้างตัวกรองแล้ว"
  );
}


// ==================================================
// SET STATUS
// ==================================================

function setQRStatus(message) {

  if (!qrStatus) {
    return;
  }

  qrStatus.textContent =
    String(message || "");
}


// ==================================================
// CREATE BUTTON
// ==================================================

function handleCreateQR() {

  createSelectedQR();
}


// ==================================================
// PRINT SELECTED
// ==================================================

async function handlePrintSelectedQR() {

  const selectedLocations =
    getSelectedLocations();

  if (
    !selectedLocations ||
    selectedLocations.length === 0
  ) {

    setQRStatus(
      "⚠️ กรุณาเลือกจุดตรวจก่อนพิมพ์ QR"
    );

    return;
  }

  await printLocations(
    selectedLocations,
    "selected"
  );
}


// ==================================================
// PRINT ALL ACTIVE
// ==================================================

async function handlePrintAllQR() {

  const activeLocations =
    getActiveLocations();

  if (
    !activeLocations ||
    activeLocations.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่พบจุด Active สำหรับพิมพ์ QR"
    );

    return;
  }

  await printLocations(
    activeLocations,
    "all"
  );
}


// ==================================================
// PRINT LOCATIONS
// ==================================================

async function printLocations(
  locations,
  mode
) {

  if (qrIsPrinting) {
    return;
  }

  if (
    !Array.isArray(locations) ||
    locations.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่มีรายการสำหรับพิมพ์"
    );

    return;
  }


  if (!qrPreviewGrid) {

    setQRStatus(
      "❌ ไม่พบ QR Preview"
    );

    return;
  }


  injectQRPrintStyle();


  // --------------------------------------------------
  // IMPORTANT
  //
  // Print ต้องใช้ Preview Card
  //
  // ดังนั้นถ้ายังไม่มี Preview
  // ให้สร้าง Preview จากรายการที่จะพิมพ์ก่อน
  //
  // --------------------------------------------------

  const missingPreview =
    locations.some(
      function(location) {

        const pointId =
          String(
            location.pointId || ""
          ).trim();

        return !findPreviewCardByPointId(
          pointId
        );
      }
    );


  if (missingPreview) {

    renderQRPreview(
      locations
    );

    await new Promise(
      function(resolve) {

        requestAnimationFrame(
          function() {

            requestAnimationFrame(
              resolve
            );
          }
        );
      }
    );
  }


  // --------------------------------------------------
  // Snapshot
  // --------------------------------------------------

  qrIsPrinting = true;

  setQRStatus(
    `⏳ กำลังเตรียม QR สำหรับพิมพ์ ${locations.length} จุด...`
  );


  try {

    const snapshotItems = [];


    for (
      let index = 0;
      index < locations.length;
      index++
    ) {

      const location =
        locations[index];

      const pointId =
        String(
          location.pointId || ""
        ).trim();


      if (!pointId) {
        continue;
      }


      const card =
        findPreviewCardByPointId(
          pointId
        );


      if (!card) {

        console.warn(
          "GGN QR: ไม่พบ Preview Card",
          pointId
        );

        continue;
      }


      setQRStatus(
        `⏳ กำลังเตรียม Snapshot ${index + 1}/${locations.length} : ${pointId}`
      );


      try {

        const dataURL =
          await snapshotPreviewCard(
            card
          );


        if (
          !dataURL ||
          !dataURL.startsWith(
            "data:image/"
          )
        ) {

          throw new Error(
            "Snapshot ไม่ใช่รูปภาพ"
          );
        }


        snapshotItems.push({

          pointId,

          dataURL

        });


      } catch (error) {

        console.error(
          "GGN QR: Snapshot failed",
          {
            pointId,
            error
          }
        );

        throw new Error(
          `สร้าง Snapshot ของ ${pointId} ไม่สำเร็จ`
        );
      }
    }


    if (
      snapshotItems.length === 0
    ) {

      throw new Error(
        "ไม่สามารถสร้าง Snapshot QR ได้"
      );
    }


    // --------------------------------------------------
    // BUILD PRINT AREA
    // --------------------------------------------------

    setQRStatus(
      `⏳ กำลังจัดหน้า A4 ${snapshotItems.length} QR...`
    );


    buildQRPrintArea(
      snapshotItems
    );


    // --------------------------------------------------
    // WAIT PRINT IMAGE
    // --------------------------------------------------

    await waitForPrintImages();


    // --------------------------------------------------
    // Print
    // --------------------------------------------------

    setQRStatus(
      `🖨️ พร้อมพิมพ์ ${snapshotItems.length} QR`
    );


    await preparePrint();


  } catch (error) {

    console.error(
      "GGN QR Print Error:",
      error
    );

    setQRStatus(
      "❌ พิมพ์ QR ไม่สำเร็จ" +
      (
        error &&
        error.message
          ? `: ${error.message}`
          : ""
      )
    );

    restoreAfterPrint();

  } finally {

    qrIsPrinting = false;
  }
}


// ==================================================
// BUILD PRINT AREA
// ==================================================

function buildQRPrintArea(
  snapshotItems
) {

  if (!qrPrintArea) {
    throw new Error(
      "ไม่พบ #qrPrintArea"
    );
  }


  qrPrintArea.innerHTML = "";


  if (
    !Array.isArray(snapshotItems) ||
    snapshotItems.length === 0
  ) {
    return;
  }


  // --------------------------------------------------
  // Split 9 Cards / Page
  // --------------------------------------------------

  for (
    let start = 0;
    start < snapshotItems.length;
    start += ITEMS_PER_PAGE
  ) {

    const pageItems =
      snapshotItems.slice(
        start,
        start + ITEMS_PER_PAGE
      );


    const page =
      document.createElement("section");

    page.className =
      "ggn-qr-print-page";


    // --------------------------------------------------
    // Cards
    // --------------------------------------------------

    pageItems.forEach(
      function(item) {

        const card =
          document.createElement("div");

        card.className =
          "ggn-qr-print-card";


        const image =
          document.createElement("img");

        image.className =
          "ggn-qr-snapshot";

        image.alt =
          `QR ${item.pointId}`;

        image.src =
          item.dataURL;

        image.decoding =
          "sync";

        image.draggable =
          false;


        card.appendChild(
          image
        );

        page.appendChild(
          card
        );
      }
    );


    qrPrintArea.appendChild(
      page
    );
  }
}


// ==================================================
// WAIT FOR PRINT IMAGES
// ==================================================

async function waitForPrintImages() {

  if (!qrPrintArea) {
    return;
  }

  const images =
    Array.from(
      qrPrintArea.querySelectorAll(
        "img"
      )
    );

  if (
    images.length === 0
  ) {
    return;
  }


  await Promise.all(
    images.map(
      function(image) {

        return waitForImage(
          image
        );
      }
    )
  );


  // --------------------------------------------------
  // Give browser time to layout
  // --------------------------------------------------

  await new Promise(
    function(resolve) {

      requestAnimationFrame(
        function() {

          requestAnimationFrame(
            resolve
          );
        }
      );
    }
  );
}


// ==================================================
// PREPARE PRINT
// ==================================================

async function preparePrint() {

  if (!qrPrintArea) {
    throw new Error(
      "ไม่พบ Print Area"
    );
  }


  if (
    qrPrintArea.children.length === 0
  ) {
    throw new Error(
      "ไม่มีข้อมูลสำหรับพิมพ์"
    );
  }


  injectQRPrintStyle();


  // --------------------------------------------------
  // Add print state
  // --------------------------------------------------

  document.body.classList.add(
    "ggn-qr-print-active"
  );


  // --------------------------------------------------
  // Browser layout
  // --------------------------------------------------

  await new Promise(
    function(resolve) {

      requestAnimationFrame(
        function() {

          requestAnimationFrame(
            function() {

              setTimeout(
                resolve,
                100
              );
            }
          );
        }
      );
    }
  );


  // --------------------------------------------------
  // Open browser print dialog
  // --------------------------------------------------

  window.print();
}


// ==================================================
// RESTORE AFTER PRINT
// ==================================================

function restoreAfterPrint() {

  document.body.classList.remove(
    "ggn-qr-print-active"
  );


  if (qrPrintArea) {
    qrPrintArea.innerHTML = "";
  }


  qrIsPrinting = false;
}


// ==================================================
// PRINT MEDIA EVENTS
// ==================================================

function handleBeforePrint() {

  document.body.classList.add(
    "ggn-qr-print-active"
  );
}


function handleAfterPrint() {

  restoreAfterPrint();

  setQRStatus(
    "✅ กลับสู่หน้าจัดการ QR แล้ว"
  );
}


// ==================================================
// REFRESH
// ==================================================

async function handleRefreshQR() {

  if (qrIsPrinting) {
    return;
  }

  await loadQRManagement();
}


// ==================================================
// INITIALIZE EVENTS
// ==================================================

function initializeQREvents() {

  if (qrEventsInitialized) {
    return;
  }

  qrEventsInitialized = true;


  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  if (qrSearchInput) {

    qrSearchInput.addEventListener(
      "input",
      handleQRSearch
    );
  }


  // --------------------------------------------------
  // Zone
  // --------------------------------------------------

  if (qrZoneFilter) {

    qrZoneFilter.addEventListener(
      "change",
      handleQRZoneFilter
    );
  }


  // --------------------------------------------------
  // Active / Inactive
  // --------------------------------------------------

  if (qrStatusFilter) {

    qrStatusFilter.addEventListener(
      "change",
      handleQRStatusFilter
    );
  }


  // --------------------------------------------------
  // QR Exist
  // --------------------------------------------------

  if (qrExistFilter) {

    qrExistFilter.addEventListener(
      "change",
      handleQRExistFilter
    );
  }


  // --------------------------------------------------
  // Clear Filter
  // --------------------------------------------------

  if (clearQrFilterBtn) {

    clearQrFilterBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        clearQRFilters();
      }
    );
  }


  // --------------------------------------------------
  // Page Size
  // --------------------------------------------------

  if (qrPageSize) {

    qrCurrentPageSize =
      Number(
        qrPageSize.value
      ) || 25;

    qrPageSize.addEventListener(
      "change",
      handleQRPageSizeChange
    );
  }


  // --------------------------------------------------
  // Select All Current Page
  // --------------------------------------------------

  if (selectAllQrCheckbox) {

    selectAllQrCheckbox.addEventListener(
      "change",
      function(event) {

        event.preventDefault();

        toggleSelectCurrentPage();
      }
    );
  }


  // --------------------------------------------------
  // Clear All
  // --------------------------------------------------

  if (clearAllQrBtn) {

    clearAllQrBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        clearAllQR();
      }
    );
  }


  // --------------------------------------------------
  // Create QR
  // --------------------------------------------------

  if (createQrBtn) {

    createQrBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        handleCreateQR();
      }
    );
  }


  // --------------------------------------------------
  // Print Selected
  // --------------------------------------------------

  if (printSelectedQrBtn) {

    printSelectedQrBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        handlePrintSelectedQR();
      }
    );
  }


  // --------------------------------------------------
  // Print All
  // --------------------------------------------------

  if (printAllQrBtn) {

    printAllQrBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        handlePrintAllQR();
      }
    );
  }


  // --------------------------------------------------
  // Refresh
  // --------------------------------------------------

  if (refreshQrBtn) {

    refreshQrBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        handleRefreshQR();
      }
    );
  }


  // --------------------------------------------------
  // Browser Print Events
  // --------------------------------------------------

  window.addEventListener(
    "beforeprint",
    handleBeforePrint
  );

  window.addEventListener(
    "afterprint",
    handleAfterPrint
  );
}


// ==================================================
// INITIALIZE PAGE
// ==================================================

function initializeQRPage() {

  injectQRPrintStyle();

  initializeQREvents();

  loadQRManagement();
}


// ==================================================
// PAGE INITIALIZATION
// ==================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeQRPage,
    {
      once: true
    }
  );

} else {

  initializeQRPage();
}

}

// ==================================================
// END OF QR.JS V5.9
// PART 2/2
// =================================================