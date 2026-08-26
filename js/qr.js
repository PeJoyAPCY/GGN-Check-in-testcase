// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 4.0
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
// - เตรียมระบบพิมพ์ QR
// - รีเฟรชรายการ
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ฐานข้อมูล
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - API Action = qrManagement
// - QR Data = pointId
// - รองรับข้อมูลประมาณ 150 จุดขึ้นไป
// - ใช้โครงสร้าง qr.html Version ล่าสุด
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

    /*
     * ---------------------------------------------
     * ตรวจสอบ API URL
     * ---------------------------------------------
     */

    if (
      typeof GOOGLE_APPS_SCRIPT_URL ===
      "undefined" ||
      !GOOGLE_APPS_SCRIPT_URL
    ) {

      throw new Error(
        "ไม่พบ GOOGLE_APPS_SCRIPT_URL"
      );

    }


    /*
     * ---------------------------------------------
     * เรียก Backend
     * ---------------------------------------------
     */

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


    /*
     * ---------------------------------------------
     * JSON
     * ---------------------------------------------
     */

    const result =
      await response.json();


    console.log(
      "GGN QR Management API:",
      result
    );


    /*
     * ---------------------------------------------
     * Validate
     * ---------------------------------------------
     */

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


    /*
     * ---------------------------------------------
     * DATA
     * ---------------------------------------------
     */

    const data =
      result.data || {};


    /*
     * ---------------------------------------------
     * LOCATIONS
     * ---------------------------------------------
     *
     * ใช้ locations เป็นข้อมูลหลัก
     *
     * activeLocations ใช้เป็นข้อมูลเสริม
     * แต่ไม่ใช้แทน locations
     *
     * ---------------------------------------------
     */

    qrLocations =
      Array.isArray(
        data.locations
      )
        ? data.locations
        : [];


    /*
     * ---------------------------------------------
     * NORMALIZE DATA
     * ---------------------------------------------
     */

    qrLocations =
      qrLocations.map(
        normalizeLocation
      );


    /*
     * ---------------------------------------------
     * RESET SELECTION
     * ---------------------------------------------
     */

    selectedPointIds =
      new Set();


    /*
     * ---------------------------------------------
     * RESET PAGE
     * ---------------------------------------------
     */

    qrCurrentPage =
      1;


    /*
     * ---------------------------------------------
     * BUILD ZONE FILTER
     * ---------------------------------------------
     */

    buildZoneFilter();


    /*
     * ---------------------------------------------
     * UPDATE SUMMARY
     * ---------------------------------------------
     */

    updateQRSummary();


    /*
     * ---------------------------------------------
     * RENDER
     * ---------------------------------------------
     */

    renderQRTable();


    /*
     * ---------------------------------------------
     * CLEAR PREVIEW
     * ---------------------------------------------
     */

    clearQRPreview();


    /*
     * ---------------------------------------------
     * STATUS
     * ---------------------------------------------
     */

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
//
// ทำให้ข้อมูลจาก Backend มีรูปแบบเดียวกัน
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


  /*
   * Active
   *
   * Backend ปัจจุบันควรส่ง boolean
   * แต่รองรับ string ด้วย
   */

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


  /*
   * คืนค่าเดิมถ้ายังมีอยู่
   */

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


  /*
   * ---------------------------------------------
   * SEARCH
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * ZONE
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * ACTIVE / INACTIVE
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * QR EXIST
   * ---------------------------------------------
   */

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
//
// รองรับ property หลายรูปแบบ
//
// หมายเหตุ:
// QR ที่สร้างใน Browser ยังไม่ได้บันทึก Backend
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


  /*
   * ---------------------------------------------
   * EMPTY
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * RENDER ROWS
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * Selected class
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * CHECKBOX
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * POINT
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * ZONE
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * LOCATION
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * ACTIVE STATUS
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * QR STATUS
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * ACTION
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * ROW CLICK
   *
   * คลิกแถวเพื่อเลือก
   * ยกเว้นปุ่ม / checkbox
   * ---------------------------------------------
   */

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


  setQRStatus(
    allSelected
      ? "⬜ ยกเลิกการเลือกในหน้านี้แล้ว"
      : `☑️ เลือก ${selectable.length} จุดในหน้านี้แล้ว`
  );

}


// ==================================================
// SELECT ALL ACTIVE
//
// ปุ่มนี้หมายถึงเลือก Active ทั้งหมดทุกหน้า
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


  /*
   * ---------------------------------------------
   * HTML SUMMARY
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * BUTTON STATE
   * ---------------------------------------------
   */

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


      /*
       * ---------------------------------------------
       * QR BOX
       * ---------------------------------------------
       */

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


      /*
       * ---------------------------------------------
       * POINT ID
       * ---------------------------------------------
       */

      const pointIdElement =
        document.createElement(
          "div"
        );


      pointIdElement.className =
        "qr-preview-point-id";


      pointIdElement.textContent =
        pointId ||
        "-";


      /*
       * ---------------------------------------------
       * LOCATION
       * ---------------------------------------------
       */

      const locationElement =
        document.createElement(
          "div"
        );


      locationElement.className =
        "qr-preview-location";


      locationElement.textContent =
        location.location ||
        "-";


      /*
       * ---------------------------------------------
       * ZONE
       * ---------------------------------------------
       */

      const zoneElement =
        document.createElement(
          "div"
        );


      zoneElement.className =
        "qr-preview-zone";


      zoneElement.textContent =
        location.zone ||
        "-";


      /*
       * ---------------------------------------------
       * APPEND
       * ---------------------------------------------
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


  /*
   * เลื่อนไปยัง Preview
   */

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


  if (qrPrintArea) {

    qrPrintArea.innerHTML =
      "";

  }

}


// ==================================================
// PRINT SELECTED
//
// ตอนนี้เตรียม Preview
// ระบบพิมพ์จริงสามารถต่อในขั้นถัดไป
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


  if (
    typeof QRCode ===
    "undefined"
  ) {

    setQRStatus(
      "❌ ไม่พบ QR Generator"
    );

    return;

  }


  renderQRPreview(
    selectedLocations
  );


  setQRStatus(
    `🖨️ เตรียมพิมพ์ ${selectedLocations.length} จุด`
  );


  console.log(
    "GGN Print Selected QR:",
    selectedLocations
  );

}


// ==================================================
// PRINT ALL
//
// Active ทั้งหมด
// ==================================================

function printAllQR() {

  const activeLocations =
    qrLocations.filter(
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


  renderQRPreview(
    activeLocations
  );


  setQRStatus(
    `🖨️ เตรียมพิมพ์จุด Active ทั้งหมด ${activeLocations.length} จุด`
  );


  console.log(
    "GGN Print All QR:",
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


  /*
   * ---------------------------------------------
   * INFO
   * ---------------------------------------------
   */

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


  /*
   * ---------------------------------------------
   * PAGINATION
   * ---------------------------------------------
   */

  if (!qrPagination) {

    return;

  }


  qrPagination.innerHTML =
    "";


  /*
   * Previous
   */

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


  /*
   * Page numbers
   */

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


  /*
   * Next
   */

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

}


// ==================================================
// START
// ==================================================

initializeQREvents();

loadQRManagement();


} // END PAGE GUARD