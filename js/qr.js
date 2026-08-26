// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 5.4
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - เชื่อม locations จาก Backend
// - Search
// - Filter Zone
// - Filter Active / Inactive
// - Filter QR Status
// - Pagination
// - เลือกจุด
// - เลือกทั้งหมดเฉพาะหน้าปัจจุบัน
// - เลือกข้ามหน้าได้
// - สร้าง QR Code จาก pointId
// - แสดง QR Preview
// - พิมพ์ QR จริง
// - ใช้ QR จาก Preview โดยตรง
// - A4 แนวนอน = 8 QR / หน้า
// - 4 คอลัมน์ × 2 แถว
// - QR1 QR2 QR3 QR4
// - QR5 QR6 QR7 QR8
// - กรอบ QR เป็นสี่เหลี่ยมผืนผ้าแนวตั้ง
// - พิมพ์เฉพาะรายการที่เลือก
// - พิมพ์ Active ทั้งหมด
// - รีเฟรชรายการ
//
// VERSION 5.4 FIX:
//
// ปัญหา V5.3:
// - QR Preview ถูกต้อง
// - แต่ canvas ที่ clone ด้วย cloneNode(true)
//   ไม่ได้คัดลอกภาพที่วาดอยู่จริง
// - Print CSS บังคับ width/height ใหม่
// - ทำให้ QR มีโอกาสเพี้ยน / ยืด / หลุดกรอบ
// - window.print() บาง browser มีปัญหาจาก
//   DOM print area ที่ใช้ canvas clone
//
// V5.4:
//
// - QR Preview เป็นแหล่งข้อมูลต้นฉบับ
// - ไม่สร้าง QR ใหม่ตอนพิมพ์
// - Canvas จาก Preview ถูกแปลงเป็น PNG
//   ด้วย toDataURL() จาก canvas ตัวจริง
// - IMG ใช้ src เดิม
// - Print Area ใช้ IMG เท่านั้นสำหรับ QR
// - ไม่ clone canvas
// - ไม่ใช้ object-fit เพื่อบังคับ canvas
// - QR มีขนาด square คงที่
// - QR ไม่ล้นกรอบ
// - Card เป็นสี่เหลี่ยมผืนผ้าแนวตั้ง
// - A4 Landscape
// - 4 × 2 = 8 QR / หน้า
// - รอ DOM ก่อน window.print()
// - หลัง print คืนหน้าเว็บตามปกติ
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ฐานข้อมูล
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - API Action = qrManagement
// - QR Data = pointId
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
// STATE
// ==================================================

let qrLocations =
  [];

let selectedPointIds =
  new Set();


// ==================================================
// FILTER STATE
// ==================================================

let qrSearchKeyword =
  "";

let qrZoneValue =
  "";

let qrStatusValue =
  "";

let qrExistValue =
  "";


// ==================================================
// PAGINATION STATE
// ==================================================

let qrCurrentPage =
  1;

let qrCurrentPageSize =
  25;


// ==================================================
// INITIALIZATION GUARD
// ==================================================

let qrEventsInitialized =
  false;


// ==================================================
// PRINT STATE
// ==================================================

let qrPrintStyleInjected =
  false;

let qrIsPrinting =
  false;


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
          method:
            "GET",

          cache:
            "no-store"
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


    qrCurrentPage =
      1;


    buildZoneFilter();


    updateQRSummary();


    renderQRTable();


    clearQRPreview();


    clearQRPrintArea();


    setQRStatus(
      `✅ โหลดข้อมูลสำเร็จ ${qrLocations.length} จุด`
    );


    console.log(
      "GGN QR: Locations loaded",
      qrLocations.length
    );


  } catch (error) {

    console.error(
      "GGN QR Management Error:",
      error
    );


    qrLocations =
      [];


    selectedPointIds =
      new Set();


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


  const normalized =
    {
      ...location
    };


  normalized.pointId =
    String(
      location.pointId ||
      ""
    ).trim();


  normalized.zone =
    String(
      location.zone ||
      ""
    ).trim();


  normalized.location =
    String(
      location.location ||
      ""
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

  if (
    value === true
  ) {

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

    `<tr>
      <td
        colspan="7"
        class="qr-table-loading"
      >
        ⏳ กำลังโหลดรายการจุดตรวจ...
      </td>
    </tr>`;

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

    `<option value="">
      ทุกเขต
    </option>`;


  const zones =
    [
      ...new Set(

        qrLocations

          .map(
            location =>
              String(
                location.zone ||
                ""
              ).trim()
          )

          .filter(
            zone =>
              zone !== ""
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


      option.value =
        zone;


      option.textContent =
        zone;


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
// GET FILTERED LOCATIONS
// ==================================================

function getFilteredLocations() {

  let locations =
    [...qrLocations];


  const keyword =
    String(
      qrSearchKeyword ||
      ""
    )
      .trim()
      .toLowerCase();


  if (keyword) {

    locations =
      locations.filter(
        function(location) {

          const pointId =
            String(
              location.pointId ||
              ""
            ).toLowerCase();


          const zone =
            String(
              location.zone ||
              ""
            ).toLowerCase();


          const locationName =
            String(
              location.location ||
              ""
            ).toLowerCase();


          return (
            pointId.includes(
              keyword
            ) ||

            zone.includes(
              keyword
            ) ||

            locationName.includes(
              keyword
            )
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
              location.zone ||
              ""
            ).trim() ===
            qrZoneValue
          );

        }
      );

  }


  if (
    qrStatusValue ===
    "active"
  ) {

    locations =
      locations.filter(
        location =>
          location.active === true
      );

  }


  if (
    qrStatusValue ===
    "inactive"
  ) {

    locations =
      locations.filter(
        location =>
          location.active !== true
      );

  }


  if (
    qrExistValue ===
    "yes"
  ) {

    locations =
      locations.filter(
        location =>
          locationHasQR(
            location
          )
      );

  }


  if (
    qrExistValue ===
    "no"
  ) {

    locations =
      locations.filter(
        location =>
          !locationHasQR(
            location
          )
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


  const values =
    [

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

      if (
        value === true
      ) {

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
// GET CURRENT PAGE LOCATIONS
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
      qrCurrentPage -
      1
    ) *
    qrCurrentPageSize;


  return filtered.slice(
    start,
    start +
      qrCurrentPageSize
  );

}


// ==================================================
// GET TOTAL PAGES
// ==================================================

function getTotalPages() {

  const filtered =
    getFilteredLocations();


  return Math.max(
    1,
    Math.ceil(
      filtered.length /
      qrCurrentPageSize
    )
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


    cell.colSpan =
      7;


    cell.className =
      "qr-table-loading";


    cell.textContent =
      filtered.length === 0
        ? "⚪ ไม่พบจุดตรวจตามเงื่อนไขที่ค้นหา"
        : "⚪ ไม่มีรายการในหน้านี้";


    row.appendChild(
      cell
    );


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

      const row =
        createLocationRow(
          location
        );


      qrLocationTableBody.appendChild(
        row
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
// CREATE LOCATION TABLE ROW
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
      location.pointId ||
      ""
    ).trim();


  const zone =
    String(
      location.zone ||
      ""
    ).trim();


  const locationName =
    String(
      location.location ||
      ""
    ).trim();


  const isActive =
    location.active === true;


  const hasQR =
    locationHasQR(
      location
    );


  const isSelected =
    selectedPointIds.has(
      pointId
    );


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
    !isActive ||
    !pointId;


  checkbox.setAttribute(
    "aria-label",
    `เลือก ${pointId || locationName}`
  );


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
    pointId ||
    "-";


  pointCell.appendChild(
    pointStrong
  );


  row.appendChild(
    pointCell
  );


  const zoneCell =
    document.createElement(
      "td"
    );


  zoneCell.className =
    "qr-col-zone";


  zoneCell.textContent =
    zone ||
    "-";


  row.appendChild(
    zoneCell
  );


  const locationCell =
    document.createElement(
      "td"
    );


  locationCell.className =
    "qr-col-location";


  locationCell.textContent =
    locationName ||
    "-";


  row.appendChild(
    locationCell
  );


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
    !isActive ||
    !pointId;


  actionButton.title =
    isActive
      ? "สร้าง QR Code"
      : "จุดนี้ Inactive";


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
        new Set(
          [pointId]
        );


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


  row.addEventListener(
    "click",
    function(event) {

      if (
        event.target === checkbox ||
        event.target.closest(
          "button"
        )
      ) {

        return;

      }


      if (
        !isActive ||
        !pointId
      ) {

        return;

      }


      const nextSelected =
        !selectedPointIds.has(
          pointId
        );


      handleLocationSelection(
        location,
        nextSelected
      );

    }
  );


  return row;

}


// ==================================================
// HANDLE LOCATION SELECTION
// ==================================================

function handleLocationSelection(
  location,
  selected
) {

  const pointId =
    String(
      location.pointId ||
      ""
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
// UPDATE PAGE SELECT ALL CHECKBOX
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
            location.pointId ||
            ""
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
// TOGGLE SELECT CURRENT PAGE
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
            location.pointId ||
            ""
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
            location.pointId ||
            ""
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


  setQRStatus(
    allSelected
      ? "⬜ ยกเลิกการเลือกในหน้านี้แล้ว"
      : `☑️ เลือก ${selectable.length} จุดในหน้านี้แล้ว`
  );

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
                location.pointId ||
                ""
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
// GET SELECTED LOCATIONS
// ==================================================

function getSelectedLocations() {

  return qrLocations.filter(
    function(location) {

      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      return (
        location.active === true &&
        pointId !== "" &&
        selectedPointIds.has(
          pointId
        )
      );

    }
  );

}


// ==================================================
// GET ACTIVE LOCATIONS
// ==================================================

function getActiveLocations() {

  return qrLocations.filter(
    function(location) {

      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      return (
        location.active === true &&
        pointId !== ""
      );

    }
  );

}


// ==================================================
// UPDATE SUMMARY
// ==================================================

function updateQRSummary() {

  const total =
    qrLocations.length;


  const active =
    qrLocations.filter(
      function(location) {

        return location.active === true;

      }
    ).length;


  const hasQR =
    qrLocations.filter(
      function(location) {

        return locationHasQR(
          location
        );

      }
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
    typeof QRCode ===
    "undefined"
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


  console.log(
    "GGN QR Created:",
    selectedLocations
  );

}


// ==================================================
// RENDER QR PREVIEW
//
// QR DATA = pointId
//
// IMPORTANT:
// ส่วนนี้คือ QR ต้นฉบับ
//
// Print V5.4:
// - ไม่สร้าง QR ใหม่
// - ใช้ Canvas/Image จาก Preview
// ==================================================

function renderQRPreview(
  locations
) {

  if (!qrPreviewGrid) {

    return;

  }


  qrPreviewGrid.innerHTML =
    "";


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


      const qrBox =
        document.createElement(
          "div"
        );


      qrBox.className =
        "qr-preview-code";


      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      if (!pointId) {

        qrBox.textContent =
          "ไม่มี Point ID";

      } else {

        try {

          new QRCode(
            qrBox,
            {

              text:
                pointId,

              width:
                180,

              height:
                180,

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


      const pointIdElement =
        document.createElement(
          "div"
        );


      pointIdElement.className =
        "qr-preview-point-id";


      pointIdElement.textContent =
        pointId ||
        "-";


      const locationElement =
        document.createElement(
          "div"
        );


      locationElement.className =
        "qr-preview-location";


      locationElement.textContent =
        location.location ||
        "-";


      const zoneElement =
        document.createElement(
          "div"
        );


      zoneElement.className =
        "qr-preview-zone";


      zoneElement.textContent =
        location.zone ||
        "-";


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
        behavior:
          "smooth",

        block:
          "start"
      }
    );

  }

}


// ==================================================
// CLEAR QR PREVIEW
// ==================================================

function clearQRPreview() {

  if (!qrPreviewGrid) {

    return;

  }


  qrPreviewGrid.innerHTML =

    `<div class="qr-empty-state">
      ยังไม่มี QR Code
    </div>`;


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      "0 จุด";

  }

}


// ==================================================
// PRINT STYLE
//
// VERSION 5.4
//
// A4 Landscape
// 4 × 2
// 8 QR / page
//
// IMPORTANT:
// QR ใน Print = PNG ที่สร้างจาก
// Canvas ตัวจริงใน Preview
// ==================================================

function injectQRPrintStyle() {

  if (
    qrPrintStyleInjected
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "ggn-qr-print-style";


  style.textContent = `

    /* =================================================
       NORMAL MODE
       ================================================= */

    #qrPrintArea {

      display: none;

    }


    /* =================================================
       PRINT MODE
       ================================================= */

    body.ggn-qr-print-active {

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    body.ggn-qr-print-active
    .dashboard-header,

    body.ggn-qr-print-active
    .dashboard-menu,

    body.ggn-qr-print-active
    .dashboard-sidebar,

    body.ggn-qr-print-active
    .sidebar,

    body.ggn-qr-print-active
    .qr-header,

    body.ggn-qr-print-active
    .qr-toolbar,

    body.ggn-qr-print-active
    .qr-management-header {

      display: none !important;

    }


    /* =================================================
       MAIN
       ================================================= */

    body.ggn-qr-print-active
    .dashboard-container {

      display: block !important;

      width: 297mm !important;

      min-width: 297mm !important;

      max-width: 297mm !important;

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    body.ggn-qr-print-active
    .qr-management-view {

      display: block !important;

      width: 297mm !important;

      min-width: 297mm !important;

      max-width: 297mm !important;

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    body.ggn-qr-print-active
    .qr-management-view
    > *:not(#qrPrintArea) {

      display: none !important;

    }


    /* =================================================
       PRINT AREA
       ================================================= */

    body.ggn-qr-print-active
    #qrPrintArea {

      display: block !important;

      visibility: visible !important;

      width: 297mm !important;

      min-width: 297mm !important;

      max-width: 297mm !important;

      margin: 0 !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    /* =================================================
       A4 LANDSCAPE PAGE
       ================================================= */

    .ggn-qr-print-page {

      box-sizing: border-box;

      width: 297mm;

      height: 210mm;

      padding: 8mm;

      display: grid;

      grid-template-columns:
        repeat(4, minmax(0, 1fr));

      grid-template-rows:
        repeat(2, minmax(0, 1fr));

      gap: 5mm;

      overflow: hidden;

      background: #ffffff;

      page-break-after: always;

      break-after: page;

    }


    .ggn-qr-print-page:last-child {

      page-break-after: auto;

      break-after: auto;

    }


    /* =================================================
       PRINT CARD
       
       แนวตั้ง
       ================================================= */

    .ggn-qr-print-card {

      box-sizing: border-box;

      width: 100%;

      height: 100%;

      min-width: 0;

      min-height: 0;

      max-width: 100%;

      max-height: 100%;

      border: 1px solid #cccccc;

      border-radius: 3mm;

      display: flex;

      flex-direction: column;

      align-items: center;

      justify-content: center;

      text-align: center;

      padding: 4mm;

      overflow: hidden;

      background: #ffffff;

      break-inside: avoid;

      page-break-inside: avoid;

    }


    /* =================================================
       QR CONTAINER
       
       FIX:
       ไม่ให้ QR ถูกยืดตาม Card
       ================================================= */

    .ggn-qr-print-code {

      width: 32mm !important;

      height: 32mm !important;

      min-width: 32mm !important;

      min-height: 32mm !important;

      max-width: 32mm !important;

      max-height: 32mm !important;

      flex: 0 0 32mm !important;

      display: flex !important;

      align-items: center !important;

      justify-content: center !important;

      position: relative !important;

      box-sizing: border-box !important;

      overflow: hidden !important;

      margin: 0 auto 3mm auto !important;

      padding: 0 !important;

      background: #ffffff !important;

    }


    /* =================================================
       QR IMAGE
       
       V5.4:
       ใช้ PNG จาก Canvas Preview
       ไม่สร้าง QR ใหม่
       ================================================= */

    .ggn-qr-print-code img {

      display: block !important;

      width: 32mm !important;

      height: 32mm !important;

      min-width: 32mm !important;

      min-height: 32mm !important;

      max-width: 32mm !important;

      max-height: 32mm !important;

      flex: 0 0 32mm !important;

      object-fit: contain !important;

      object-position: center center !important;

      box-sizing: border-box !important;

      margin: 0 !important;

      padding: 0 !important;

      border: 0 !important;

    }


    /* =================================================
       ห้าม Canvas ปรากฏใน Print
       ================================================= */

    .ggn-qr-print-code canvas {

      display: none !important;

    }


    /* =================================================
       POINT ID
       ================================================= */

    .ggn-qr-print-point {

      width: 100%;

      max-width: 100%;

      box-sizing: border-box;

      font-size: 13pt;

      font-weight: 700;

      line-height: 1.15;

      margin: 0 0 1.5mm 0;

      word-break: break-word;

      overflow-wrap: anywhere;

      text-align: center;

    }


    /* =================================================
       LOCATION
       ================================================= */

    .ggn-qr-print-location {

      width: 100%;

      max-width: 100%;

      box-sizing: border-box;

      font-size: 9.5pt;

      font-weight: 600;

      line-height: 1.2;

      margin: 0 0 1mm 0;

      word-break: break-word;

      overflow-wrap: anywhere;

      text-align: center;

    }


    /* =================================================
       ZONE
       ================================================= */

    .ggn-qr-print-zone {

      width: 100%;

      max-width: 100%;

      box-sizing: border-box;

      font-size: 8.5pt;

      line-height: 1.15;

      margin: 0;

      color: #444444;

      word-break: break-word;

      overflow-wrap: anywhere;

      text-align: center;

    }


    /* =================================================
       PAGE SETTINGS
       ================================================= */

    @page {

      size: A4 landscape;

      margin: 0;

    }


    /* =================================================
       PRINT MEDIA
       ================================================= */

    @media print {

      html {

        width: 297mm !important;

        height: 210mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body {

        width: 297mm !important;

        min-width: 297mm !important;

        margin: 0 !important;

        padding: 0 !important;

        background: #ffffff !important;

      }


      body.ggn-qr-print-active {

        width: 297mm !important;

        min-width: 297mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body.ggn-qr-print-active
      .dashboard-container {

        display: block !important;

        width: 297mm !important;

        min-width: 297mm !important;

        max-width: 297mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body.ggn-qr-print-active
      .qr-management-view {

        display: block !important;

        width: 297mm !important;

        min-width: 297mm !important;

        max-width: 297mm !important;

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

        width: 297mm !important;

        min-width: 297mm !important;

        max-width: 297mm !important;

        margin: 0 !important;

        padding: 0 !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-page {

        width: 297mm !important;

        height: 210mm !important;

        padding: 8mm !important;

        display: grid !important;

        grid-template-columns:
          repeat(4, minmax(0, 1fr)) !important;

        grid-template-rows:
          repeat(2, minmax(0, 1fr)) !important;

        gap: 5mm !important;

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

        display: flex !important;

        visibility: visible !important;

        box-sizing: border-box !important;

        width: 100% !important;

        height: 100% !important;

        overflow: hidden !important;

        break-inside: avoid !important;

        page-break-inside: avoid !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-code {

        display: flex !important;

        visibility: visible !important;

        width: 32mm !important;

        height: 32mm !important;

        min-width: 32mm !important;

        min-height: 32mm !important;

        max-width: 32mm !important;

        max-height: 32mm !important;

        flex: 0 0 32mm !important;

        overflow: hidden !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-code img {

        display: block !important;

        visibility: visible !important;

        width: 32mm !important;

        height: 32mm !important;

        min-width: 32mm !important;

        min-height: 32mm !important;

        max-width: 32mm !important;

        max-height: 32mm !important;

        flex: 0 0 32mm !important;

        object-fit: contain !important;

        object-position: center center !important;

      }


      body.ggn-qr-print-active
      .ggn-qr-print-code canvas {

        display: none !important;

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
        pointElement.textContent ||
        ""
      ).trim();


    if (
      cardPointId ===
      pointId
    ) {

      return card;

    }

  }


  return null;

}


// ==================================================
// GET QR IMAGE FROM PREVIEW
//
// V5.4 CORE
//
// สำคัญที่สุดของระบบ
//
// ถ้า Preview เป็น Canvas:
//   ใช้ Canvas ตัวจริง
//   -> toDataURL()
//   -> PNG
//
// ถ้า Preview เป็น IMG:
//   ใช้ src เดิม
//
// ไม่มีการสร้าง QR ใหม่
// ==================================================

function getPreviewQRImage(
  previewCard
) {

  if (!previewCard) {

    return null;

  }


  const qrContainer =
    previewCard.querySelector(
      ".qr-preview-code"
    );


  if (!qrContainer) {

    return null;

  }


  /*
   * ----------------------------------------------
   * CASE 1: Canvas
   * ----------------------------------------------
   */

  const canvas =
    qrContainer.querySelector(
      "canvas"
    );


  if (canvas) {

    try {

      if (
        typeof canvas.toDataURL !==
        "function"
      ) {

        throw new Error(
          "Canvas ไม่รองรับ toDataURL"
        );

      }


      const dataUrl =
        canvas.toDataURL(
          "image/png"
        );


      if (
        !dataUrl ||
        dataUrl ===
          "data:,"
      ) {

        throw new Error(
          "ไม่สามารถอ่านภาพจาก Canvas"
        );

      }


      return {
        type:
          "image",

        src:
          dataUrl

      };

    } catch (error) {

      console.error(
        "GGN QR V5.4: Canvas toDataURL Error",
        error
      );

    }

  }


  /*
   * ----------------------------------------------
   * CASE 2: IMG
   * ----------------------------------------------
   */

  const img =
    qrContainer.querySelector(
      "img"
    );


  if (img) {

    const src =
      String(
        img.currentSrc ||
        img.src ||
        ""
      ).trim();


    if (src) {

      return {
        type:
          "image",

        src:
          src

      };

    }

  }


  return null;

}


// ==================================================
// CREATE PRINT CARD FROM PREVIEW
//
// V5.4
//
// IMPORTANT:
//
// ไม่ clone QR DOM
//
// สร้าง Card ใหม่เฉพาะ:
// - กรอบ
// - QR Image
// - Point ID
// - Location
// - Zone
//
// QR Image มาจาก Preview โดยตรง
// ==================================================

function createQRPrintCardFromPreview(
  location
) {

  const pointId =
    String(
      location.pointId ||
      ""
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
      "GGN QR V5.4: ไม่พบ Preview Card สำหรับ",
      pointId
    );


    return null;

  }


  /*
   * ----------------------------------------------
   * อ่าน QR จาก Preview
   * ----------------------------------------------
   */

  const qrImage =
    getPreviewQRImage(
      previewCard
    );


  if (!qrImage) {

    console.warn(
      "GGN QR V5.4: ไม่สามารถดึง QR จาก Preview ได้",
      pointId
    );


    return null;

  }


  /*
   * ----------------------------------------------
   * CREATE CARD
   * ----------------------------------------------
   */

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "ggn-qr-print-card";


  /*
   * ----------------------------------------------
   * QR CONTAINER
   * ----------------------------------------------
   */

  const qrCode =
    document.createElement(
      "div"
    );


  qrCode.className =
    "ggn-qr-print-code";


  /*
   * ----------------------------------------------
   * QR IMAGE
   *
   * ใช้ภาพจาก Preview
   * ----------------------------------------------
   */

  const image =
    document.createElement(
      "img"
    );


  image.src =
    qrImage.src;


  image.alt =
    `QR Code ${pointId}`;


  image.decoding =
    "sync";


  image.loading =
    "eager";


  image.draggable =
    false;


  qrCode.appendChild(
    image
  );


  card.appendChild(
    qrCode
  );


  /*
   * ----------------------------------------------
   * POINT ID
   * ----------------------------------------------
   */

  const pointElement =
    document.createElement(
      "div"
    );


  pointElement.className =
    "ggn-qr-print-point";


  pointElement.textContent =
    pointId ||
    "-";


  card.appendChild(
    pointElement
  );


  /*
   * ----------------------------------------------
   * LOCATION
   * ----------------------------------------------
   */

  const locationElement =
    document.createElement(
      "div"
    );


  locationElement.className =
    "ggn-qr-print-location";


  locationElement.textContent =
    location.location ||
    "-";


  card.appendChild(
    locationElement
  );


  /*
   * ----------------------------------------------
   * ZONE
   * ----------------------------------------------
   */

  const zoneElement =
    document.createElement(
      "div"
    );


  zoneElement.className =
    "ggn-qr-print-zone";


  zoneElement.textContent =
    location.zone ||
    "-";


  card.appendChild(
    zoneElement
  );


  return card;

}


// ==================================================
// BUILD PRINT AREA
//
// 8 QR / A4
//
// Landscape
//
// QR1 QR2 QR3 QR4
// QR5 QR6 QR7 QR8
//
// IMPORTANT:
// QR Image มาจาก Preview
// ==================================================

function buildQRPrintArea(
  locations
) {

  if (!qrPrintArea) {

    return false;

  }


  if (
    !Array.isArray(
      locations
    ) ||
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


  /*
   * ----------------------------------------------
   * ตรวจสอบ Preview
   * ----------------------------------------------
   */

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


  const ITEMS_PER_PAGE =
    8;


  let renderedCount =
    0;


  let failedPointIds =
    [];


  /*
   * ----------------------------------------------
   * สร้างทีละหน้า
   * ----------------------------------------------
   */

  for (
    let index = 0;
    index < locations.length;
    index += ITEMS_PER_PAGE
  ) {

    const pageLocations =
      locations.slice(
        index,
        index +
          ITEMS_PER_PAGE
      );


    const page =
      document.createElement(
        "div"
      );


    page.className =
      "ggn-qr-print-page";


    pageLocations.forEach(
      function(location) {

        const printCard =
          createQRPrintCardFromPreview(
            location
          );


        if (!printCard) {

          failedPointIds.push(
            String(
              location.pointId ||
              ""
            ).trim()
          );


          return;

        }


        page.appendChild(
          printCard
        );


        renderedCount++;

      }
    );


    /*
     * ถ้าหน้านี้มี Card
     * จึงเพิ่มหน้า
     */

    if (
      page.children.length > 0
    ) {

      qrPrintArea.appendChild(
        page
      );

    }

  }


  /*
   * ----------------------------------------------
   * DEBUG
   * ----------------------------------------------
   */

  console.log(
    "GGN QR V5.4 Print Area:",
    {
      requested:
        locations.length,

      rendered:
        renderedCount,

      failed:
        failedPointIds,

      pages:
        Math.ceil(
          renderedCount /
          ITEMS_PER_PAGE
        ),

      perPage:
        ITEMS_PER_PAGE,

      layout:
        "A4 Landscape / 4 × 2",

      qrSource:
        "Preview Canvas/Image → PNG"
    }
  );


  /*
   * ----------------------------------------------
   * ตรวจสอบความครบ
   * ----------------------------------------------
   */

  if (
    renderedCount !==
    locations.length
  ) {

    console.warn(
      "GGN QR V5.4: Preview QR ไม่ครบ",
      {
        requested:
          locations.length,

        rendered:
          renderedCount,

        failed:
          failedPointIds
      }
    );


    setQRStatus(
      `⚠️ QR ในพื้นที่สร้างไม่ครบ ${renderedCount}/${locations.length} จุด กรุณากดสร้าง QR ใหม่`
    );


    clearQRPrintArea();


    return false;

  }


  return true;

}


// ==================================================
// WAIT FOR PRINT IMAGES
//
// V5.4
//
// รอ PNG ที่มาจาก Preview
// โหลดและพร้อมก่อน print
// ==================================================

function waitForQRPrintRender() {

  return new Promise(
    function(resolve) {

      requestAnimationFrame(
        function() {

          requestAnimationFrame(
            function() {

              const images =
                qrPrintArea
                  ? Array.from(
                      qrPrintArea.querySelectorAll(
                        ".ggn-qr-print-code img"
                      )
                    )
                  : [];


              if (
                images.length === 0
              ) {

                resolve();

                return;

              }


              const promises =
                images.map(
                  function(image) {

                    if (
                      image.complete &&
                      image.naturalWidth > 0
                    ) {

                      return Promise.resolve();

                    }


                    return new Promise(
                      function(
                        imageResolve
                      ) {

                        let finished =
                          false;


                        const finish =
                          function() {

                            if (
                              finished
                            ) {

                              return;

                            }


                            finished =
                              true;


                            imageResolve();

                          };


                        image.onload =
                          finish;


                        image.onerror =
                          finish;


                        setTimeout(
                          finish,
                          1500
                        );

                      }
                    );

                  }
                );


              Promise.all(
                promises
              ).then(
                function() {

                  /*
                   * ให้ browser
                   * คำนวณ layout ให้เสร็จ
                   */

                  requestAnimationFrame(
                    function() {

                      requestAnimationFrame(
                        function() {

                          setTimeout(
                            function() {

                              resolve();

                            },
                            100
                          );

                        }
                      );

                    }
                  );

                }
              );

            }
          );

        }
      );

    }
  );

}


// ==================================================
// START PRINT
// ==================================================

async function startQRPrint(
  locations,
  statusMessage
) {

  if (
    qrIsPrinting
  ) {

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


    console.error(
      "GGN QR: ไม่พบ #qrPrintArea"
    );


    return;

  }


  if (!qrPreviewGrid) {

    setQRStatus(
      "❌ ไม่พบพื้นที่สร้าง QR"
    );


    return;

  }


  qrIsPrinting =
    true;


  try {

    /*
     * ---------------------------------------------
     * ตรวจสอบ Preview
     * ---------------------------------------------
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
     * ---------------------------------------------
     * BUILD PRINT AREA
     * ---------------------------------------------
     */

    const success =
      buildQRPrintArea(
        locations
      );


    if (!success) {

      return;

    }


    /*
     * ---------------------------------------------
     * เปิด Print Mode
     * ---------------------------------------------
     */

    document.body.classList.add(
      "ggn-qr-print-active"
    );


    /*
     * ---------------------------------------------
     * รอรูป QR
     * ---------------------------------------------
     */

    await waitForQRPrintRender();


    /*
     * ---------------------------------------------
     * ตรวจสอบ Card
     * ---------------------------------------------
     */

    const renderedCards =
      qrPrintArea.querySelectorAll(
        ".ggn-qr-print-card"
      );


    const renderedQrElements =
      qrPrintArea.querySelectorAll(
        ".ggn-qr-print-code img"
      );


    console.log(
      "GGN QR V5.4 Print Render Check:",
      {
        expectedCards:
          locations.length,

        renderedCards:
          renderedCards.length,

        renderedQR:
          renderedQrElements.length
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
      renderedQrElements.length !==
      locations.length
    ) {

      throw new Error(
        `QR ไม่ครบ ${renderedQrElements.length}/${locations.length}`
      );

    }


    /*
     * ---------------------------------------------
     * ตรวจสอบรูปภาพจริง
     * ---------------------------------------------
     */

    const invalidImages =
      Array.from(
        renderedQrElements
      ).filter(
        function(image) {

          return (
            !image.complete ||
            image.naturalWidth <= 0
          );

        }
      );


    if (
      invalidImages.length > 0
    ) {

      throw new Error(
        `QR Image โหลดไม่สมบูรณ์ ${invalidImages.length} รายการ`
      );

    }


    /*
     * ---------------------------------------------
     * STATUS
     * ---------------------------------------------
     */

    setQRStatus(
      statusMessage ||
      `🖨️ เตรียมพิมพ์ ${locations.length} จุด`
    );


    /*
     * ---------------------------------------------
     * PRINT
     * ---------------------------------------------
     *
     * ใช้ try/catch
     * ป้องกัน browser block
     */

    try {

      window.print();

    } catch (printError) {

      throw new Error(
        `Browser ไม่สามารถเปิดหน้าพิมพ์ได้: ${
          printError &&
          printError.message
            ? printError.message
            : "Unknown Error"
        }`
      );

    }

  } catch (error) {

    console.error(
      "GGN QR V5.4 Print Error:",
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

    qrIsPrinting =
      false;

  }

}


// ==================================================
// AFTER PRINT
//
// คืนหน้าเว็บกลับสู่สถานะปกติ
// ==================================================

function handleQRAfterPrint() {

  document.body.classList.remove(
    "ggn-qr-print-active"
  );


  clearQRPrintArea();


  qrIsPrinting =
    false;


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


  /*
   * ต้องมี QR Preview
   */

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
    `🖨️ เตรียมพิมพ์ ${selectedLocations.length} จุด — 8 QR / A4 แนวนอน`
  );

}


// ==================================================
// PRINT ALL
//
// Active ทั้งหมด
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


  /*
   * เลือก Active ทั้งหมด
   */

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
   * ต้องมี QR Preview
   */

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
      "⚠️ กรุณากดสร้าง QR ก่อนพิมพ์ Active ทั้งหมด"
    );

    return;

  }


  /*
   * พิมพ์ Active ทั้งหมด
   */

  startQRPrint(
    activeLocations,
    `🖨️ เตรียมพิมพ์จุด Active ทั้งหมด ${activeLocations.length} จุด — 8 QR / A4 แนวนอน`
  );


  console.log(
    "GGN Print All QR V5.4:",
    activeLocations
  );

}


// ==================================================
// UPDATE PAGINATION
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


  if (
    totalItems === 0
  ) {

    qrPaginationInfo.textContent =
      "0 รายการ";

  } else {

    const start =
      (
        (
          qrCurrentPage -
          1
        ) *
        qrCurrentPageSize
      ) + 1;


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


  previousButton.title =
    "หน้าก่อนหน้า";


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

      if (
        page === "..."
      ) {

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


  nextButton.title =
    "หน้าถัดไป";


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
// CREATE PAGE NUMBERS
// ==================================================

function createPageNumbers(
  current,
  total
) {

  if (
    total <= 7
  ) {

    return Array.from(
      {
        length:
          total
      },
      function(_, index) {

        return index + 1;

      }
    );

  }


  const pages =
    [];


  pages.push(
    1
  );


  if (
    current > 4
  ) {

    pages.push(
      "..."
    );

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

    pages.push(
      page
    );

  }


  if (
    current <
    total - 3
  ) {

    pages.push(
      "..."
    );

  }


  pages.push(
    total
  );


  return pages;

}


// ==================================================
// CLEAR FILTER
// ==================================================

function clearQRFilters() {

  qrSearchKeyword =
    "";

  qrZoneValue =
    "";

  qrStatusValue =
    "";

  qrExistValue =
    "";


  if (qrSearchInput) {

    qrSearchInput.value =
      "";

  }


  if (qrZoneFilter) {

    qrZoneFilter.value =
      "";

  }


  if (qrStatusFilter) {

    qrStatusFilter.value =
      "";

  }


  if (qrExistFilter) {

    qrExistFilter.value =
      "";

  }


  qrCurrentPage =
    1;


  renderQRTable();


  setQRStatus(
    "🔄 ล้างตัวกรองแล้ว"
  );

}


// ==================================================
// HANDLE PAGE SIZE
// ==================================================

function handlePageSizeChange() {

  if (!qrPageSize) {

    return;

  }


  const value =
    Number(
      qrPageSize.value
    );


  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    qrCurrentPageSize =
      25;

  } else {

    qrCurrentPageSize =
      value;

  }


  qrCurrentPage =
    1;


  renderQRTable();

}


// ==================================================
// SET STATUS
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
// EVENT: SEARCH
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
          qrSearchInput.value ||
          ""
        )
          .trim()
          .toLowerCase();


      qrCurrentPage =
        1;


      renderQRTable();

    }
  );

}


// ==================================================
// EVENT: ZONE FILTER
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


      qrCurrentPage =
        1;


      renderQRTable();

    }
  );

}


// ==================================================
// EVENT: STATUS FILTER
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


      qrCurrentPage =
        1;


      renderQRTable();

    }
  );

}


// ==================================================
// EVENT: QR FILTER
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


      qrCurrentPage =
        1;


      renderQRTable();

    }
  );

}


// ==================================================
// EVENT: SELECT ALL CURRENT PAGE
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
// EVENT: CLEAR FILTER
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
// EVENT: PAGE SIZE
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
// EVENT: CLEAR ALL
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
// EVENT: CREATE QR
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
// EVENT: PRINT SELECTED
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
// EVENT: PRINT ALL
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
// EVENT: REFRESH
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
// EVENT: AFTER PRINT
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
// INITIALIZE EVENTS
// ==================================================

function initializeQREvents() {

  if (qrEventsInitialized) {

    return;

  }


  qrEventsInitialized =
    true;


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