// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 3.1
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
// - QR Data = pointId
// - รองรับข้อมูลประมาณ 150 จุดขึ้นไป
// ==================================================


// ==================================================
// PAGE GUARD
// ==================================================

if (
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

const qrLocationList =
  getElement("qrLocationList");

const qrTotalCount =
  getElement("qrTotalCount");

const qrActiveCount =
  getElement("qrActiveCount");

const qrSelectedCount =
  getElement("qrSelectedCount");

const qrPreviewGrid =
  getElement("qrPreviewGrid");

const qrPreviewCount =
  getElement("qrPreviewCount");

const selectAllQrBtn =
  getElement("selectAllQrBtn");

const clearAllQrBtn =
  getElement("clearAllQrBtn");

const createQrBtn =
  getElement("createQrBtn");

const printSelectedQrBtn =
  getElement("printSelectedQrBtn");

const printAllQrBtn =
  getElement("printAllQrBtn");

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
// QR UI STATE
// ==================================================

let qrSearchKeyword =
  "";

let qrZoneFilter =
  "ALL";

let qrStatusFilter =
  "ALL";

let qrFilter =
  "ALL";

let qrCurrentPage =
  1;

const QR_PAGE_SIZE =
  25;


// ==================================================
// DYNAMIC UI ELEMENTS
// ==================================================

let qrSearchInput =
  null;

let qrZoneSelect =
  null;

let qrStatusSelect =
  null;

let qrFilterSelect =
  null;

let qrPageSizeLabel =
  null;

let qrPagination =
  null;

let qrPageInfo =
  null;

let qrPageSelectAll =
  null;


// ==================================================
// LOAD QR MANAGEMENT
// ==================================================

async function loadQRManagement() {

  if (!qrLocationList) {

    return;

  }


  setQRStatus(
    "⏳ กำลังโหลดรายการจุดตรวจ..."
  );


  showQRLoading();


  try {

    const response =
      await fetch(
        `${GOOGLE_APPS_SCRIPT_URL}?action=qrManagement`
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
          : "ไม่สามารถโหลด QR Management ได้"
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


    /*
     * ---------------------------------------------
     * ล้าง Selection
     * ---------------------------------------------
     */

    selectedPointIds =
      new Set();


    /*
     * ---------------------------------------------
     * Reset Filter
     * ---------------------------------------------
     */

    qrSearchKeyword =
      "";

    qrZoneFilter =
      "ALL";

    qrStatusFilter =
      "ALL";

    qrFilter =
      "ALL";

    qrCurrentPage =
      1;


    /*
     * ---------------------------------------------
     * สร้าง UI
     * ---------------------------------------------
     */

    initializeQRManagementUI();


    /*
     * ---------------------------------------------
     * Render
     * ---------------------------------------------
     */

    renderQRLocations();


    updateQRSummary();


    clearQRPreview();


    setQRStatus(
      `✅ โหลดข้อมูลสำเร็จ ${qrLocations.length} จุด`
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


    renderQRLocations();


    updateQRSummary();


    clearQRPreview();


    setQRStatus(
      "❌ โหลดข้อมูลไม่สำเร็จ" +
      (
        error.message
          ? `: ${error.message}`
          : ""
      )
    );

  }

}


// ==================================================
// SHOW LOADING
// ==================================================

function showQRLoading() {

  if (!qrLocationList) {

    return;

  }


  qrLocationList.innerHTML =

    `<div class="qr-empty-state">
      ⏳ กำลังโหลดรายการจุดตรวจ...
    </div>`;

}


// ==================================================
// INITIALIZE QR MANAGEMENT UI
//
// สร้าง Search / Filter / Pagination
// โดยไม่ต้องแก้ qr.html
// ==================================================

function initializeQRManagementUI() {

  if (!qrLocationList) {

    return;

  }


  const existingToolbar =
    document.querySelector(
      ".qr-dynamic-toolbar"
    );


  if (existingToolbar) {

    existingToolbar.remove();

  }


  /*
   * ---------------------------------------------
   * Toolbar
   * ---------------------------------------------
   */

  const toolbar =
    document.createElement(
      "section"
    );


  toolbar.className =
    "qr-dynamic-toolbar";


  /*
   * ---------------------------------------------
   * Search
   * ---------------------------------------------
   */

  const searchGroup =
    document.createElement(
      "div"
    );


  searchGroup.className =
    "qr-filter-group qr-search-group";


  const searchLabel =
    document.createElement(
      "label"
    );


  searchLabel.textContent =
    "🔎 ค้นหา";


  qrSearchInput =
    document.createElement(
      "input"
    );


  qrSearchInput.type =
    "search";


  qrSearchInput.className =
    "qr-search-input";


  qrSearchInput.placeholder =
    "Point ID / จุดตรวจ / เขต";


  qrSearchInput.value =
    qrSearchKeyword;


  qrSearchInput.addEventListener(
    "input",
    function() {

      qrSearchKeyword =
        String(
          qrSearchInput.value ||
          ""
        ).trim().toLowerCase();


      qrCurrentPage =
        1;


      renderQRLocations();

    }
  );


  searchGroup.appendChild(
    searchLabel
  );


  searchGroup.appendChild(
    qrSearchInput
  );


  /*
   * ---------------------------------------------
   * Zone Filter
   * ---------------------------------------------
   */

  const zoneGroup =
    document.createElement(
      "div"
    );


  zoneGroup.className =
    "qr-filter-group";


  const zoneLabel =
    document.createElement(
      "label"
    );


  zoneLabel.textContent =
    "🏢 เขต";


  qrZoneSelect =
    document.createElement(
      "select"
    );


  qrZoneSelect.className =
    "qr-filter-select";


  createZoneFilterOptions();


  qrZoneSelect.addEventListener(
    "change",
    function() {

      qrZoneFilter =
        qrZoneSelect.value;


      qrCurrentPage =
        1;


      renderQRLocations();

    }
  );


  zoneGroup.appendChild(
    zoneLabel
  );


  zoneGroup.appendChild(
    qrZoneSelect
  );


  /*
   * ---------------------------------------------
   * Active Filter
   * ---------------------------------------------
   */

  const statusGroup =
    document.createElement(
      "div"
    );


  statusGroup.className =
    "qr-filter-group";


  const statusLabel =
    document.createElement(
      "label"
    );


  statusLabel.textContent =
    "สถานะ";


  qrStatusSelect =
    document.createElement(
      "select"
    );


  qrStatusSelect.className =
    "qr-filter-select";


  addSelectOption(
    qrStatusSelect,
    "ALL",
    "ทุกสถานะ"
  );


  addSelectOption(
    qrStatusSelect,
    "ACTIVE",
    "🟢 Active"
  );


  addSelectOption(
    qrStatusSelect,
    "INACTIVE",
    "🔴 Inactive"
  );


  qrStatusSelect.value =
    qrStatusFilter;


  qrStatusSelect.addEventListener(
    "change",
    function() {

      qrStatusFilter =
        qrStatusSelect.value;


      qrCurrentPage =
        1;


      renderQRLocations();

    }
  );


  statusGroup.appendChild(
    statusLabel
  );


  statusGroup.appendChild(
    qrStatusSelect
  );


  /*
   * ---------------------------------------------
   * QR Filter
   * ---------------------------------------------
   */

  const qrFilterGroup =
    document.createElement(
      "div"
    );


  qrFilterGroup.className =
    "qr-filter-group";


  const qrFilterLabel =
    document.createElement(
      "label"
    );


  qrFilterLabel.textContent =
    "QR";


  qrFilterSelect =
    document.createElement(
      "select"
    );


  qrFilterSelect.className =
    "qr-filter-select";


  addSelectOption(
    qrFilterSelect,
    "ALL",
    "ทุกสถานะ QR"
  );


  addSelectOption(
    qrFilterSelect,
    "HAS_QR",
    "✓ มี QR"
  );


  addSelectOption(
    qrFilterSelect,
    "NO_QR",
    "- ยังไม่มี QR"
  );


  qrFilterSelect.value =
    qrFilter;


  qrFilterSelect.addEventListener(
    "change",
    function() {

      qrFilter =
        qrFilterSelect.value;


      qrCurrentPage =
        1;


      renderQRLocations();

    }
  );


  qrFilterGroup.appendChild(
    qrFilterLabel
  );


  qrFilterGroup.appendChild(
    qrFilterSelect
  );


  /*
   * ---------------------------------------------
   * Append Toolbar
   * ---------------------------------------------
   */

  toolbar.appendChild(
    searchGroup
  );


  toolbar.appendChild(
    zoneGroup
  );


  toolbar.appendChild(
    statusGroup
  );


  toolbar.appendChild(
    qrFilterGroup
  );


  /*
   * ---------------------------------------------
   * Insert Before Location List
   * ---------------------------------------------
   */

  qrLocationList.parentNode.insertBefore(
    toolbar,
    qrLocationList
  );


  /*
   * ---------------------------------------------
   * Pagination Container
   * ---------------------------------------------
   */

  createPaginationUI();

}


// ==================================================
// CREATE ZONE OPTIONS
// ==================================================

function createZoneFilterOptions() {

  if (!qrZoneSelect) {

    return;

  }


  qrZoneSelect.innerHTML =
    "";


  addSelectOption(
    qrZoneSelect,
    "ALL",
    "ทุกเขต"
  );


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
    (a, b) =>
      a.localeCompare(
        b,
        "th"
      )
  );


  zones.forEach(
    zone => {

      addSelectOption(
        qrZoneSelect,
        zone,
        zone
      );

    }
  );


  qrZoneSelect.value =
    qrZoneFilter;

}


// ==================================================
// ADD SELECT OPTION
// ==================================================

function addSelectOption(
  select,
  value,
  text
) {

  const option =
    document.createElement(
      "option"
    );


  option.value =
    value;


  option.textContent =
    text;


  select.appendChild(
    option
  );

}


// ==================================================
// CREATE PAGINATION UI
// ==================================================

function createPaginationUI() {

  if (!qrLocationList) {

    return;

  }


  const existing =
    document.querySelector(
      ".qr-pagination-wrapper"
    );


  if (existing) {

    existing.remove();

  }


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "qr-pagination-wrapper";


  /*
   * ---------------------------------------------
   * Left
   * ---------------------------------------------
   */

  const left =
    document.createElement(
      "div"
    );


  left.className =
    "qr-pagination-left";


  qrPageSelectAll =
    document.createElement(
      "button"
    );


  qrPageSelectAll.type =
    "button";


  qrPageSelectAll.className =
    "qr-page-select-button";


  qrPageSelectAll.textContent =
    "☐ เลือกทั้งหมดในหน้านี้";


  qrPageSelectAll.addEventListener(
    "click",
    function() {

      toggleSelectCurrentPage();

    }
  );


  left.appendChild(
    qrPageSelectAll
  );


  /*
   * ---------------------------------------------
   * Center
   * ---------------------------------------------
   */

  const center =
    document.createElement(
      "div"
    );


  center.className =
    "qr-pagination-center";


  const previousButton =
    document.createElement(
      "button"
    );


  previousButton.type =
    "button";


  previousButton.className =
    "qr-page-button";


  previousButton.textContent =
    "‹";


  previousButton.title =
    "หน้าก่อนหน้า";


  previousButton.addEventListener(
    "click",
    function() {

      if (
        qrCurrentPage > 1
      ) {

        qrCurrentPage--;

        renderQRLocations();

      }

    }
  );


  qrPagination =
    document.createElement(
      "div"
    );


  qrPagination.className =
    "qr-pagination";


  const nextButton =
    document.createElement(
      "button"
    );


  nextButton.type =
    "button";


  nextButton.className =
    "qr-page-button";


  nextButton.textContent =
    "›";


  nextButton.title =
    "หน้าถัดไป";


  nextButton.addEventListener(
    "click",
    function() {

      const totalPages =
        getTotalPages();


      if (
        qrCurrentPage <
        totalPages
      ) {

        qrCurrentPage++;

        renderQRLocations();

      }

    }
  );


  center.appendChild(
    previousButton
  );


  center.appendChild(
    qrPagination
  );


  center.appendChild(
    nextButton
  );


  /*
   * ---------------------------------------------
   * Right
   * ---------------------------------------------
   */

  const right =
    document.createElement(
      "div"
    );


  right.className =
    "qr-pagination-right";


  qrPageInfo =
    document.createElement(
      "span"
    );


  qrPageInfo.className =
    "qr-page-info";


  right.appendChild(
    qrPageInfo
  );


  /*
   * ---------------------------------------------
   * Append
   * ---------------------------------------------
   */

  wrapper.appendChild(
    left
  );


  wrapper.appendChild(
    center
  );


  wrapper.appendChild(
    right
  );


  qrLocationList.parentNode.insertBefore(
    wrapper,
    qrLocationList.nextSibling
  );

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

  if (
    qrSearchKeyword
  ) {

    locations =
      locations.filter(
        location => {

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
              qrSearchKeyword
            ) ||

            zone.includes(
              qrSearchKeyword
            ) ||

            locationName.includes(
              qrSearchKeyword
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

  if (
    qrZoneFilter !== "ALL"
  ) {

    locations =
      locations.filter(
        location =>
          String(
            location.zone ||
            ""
          ).trim() ===
          qrZoneFilter
      );

  }


  /*
   * ---------------------------------------------
   * ACTIVE STATUS
   * ---------------------------------------------
   */

  if (
    qrStatusFilter === "ACTIVE"
  ) {

    locations =
      locations.filter(
        location =>
          location.active === true
      );

  }


  if (
    qrStatusFilter === "INACTIVE"
  ) {

    locations =
      locations.filter(
        location =>
          location.active !== true
      );

  }


  /*
   * ---------------------------------------------
   * QR STATUS
   * ---------------------------------------------
   */

  if (
    qrFilter !== "ALL"
  ) {

    locations =
      locations.filter(
        location => {

          const hasQR =
            locationHasQR(
              location
            );


          if (
            qrFilter === "HAS_QR"
          ) {

            return hasQR;

          }


          if (
            qrFilter === "NO_QR"
          ) {

            return !hasQR;

          }


          return true;

        }
      );

  }


  return locations;

}


// ==================================================
// DETECT QR STATUS
//
// รองรับชื่อ property หลายรูปแบบ
// โดยไม่แก้ Backend
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
    value => {

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
// GET TOTAL PAGES
// ==================================================

function getTotalPages() {

  const filtered =
    getFilteredLocations();


  return Math.max(
    1,
    Math.ceil(
      filtered.length /
      QR_PAGE_SIZE
    )
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
        QR_PAGE_SIZE
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
    QR_PAGE_SIZE;


  return filtered.slice(
    start,
    start + QR_PAGE_SIZE
  );

}


// ==================================================
// RENDER LOCATIONS
// ==================================================

function renderQRLocations() {

  if (!qrLocationList) {

    return;

  }


  const filteredLocations =
    getFilteredLocations();


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLocations.length /
        QR_PAGE_SIZE
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


  qrLocationList.innerHTML =
    "";


  /*
   * ---------------------------------------------
   * List Header
   * ---------------------------------------------
   */

  const listHeader =
    document.createElement(
      "div"
    );


  listHeader.className =
    "qr-list-header";


  const headerTitle =
    document.createElement(
      "h3"
    );


  headerTitle.textContent =
    "📍 รายการจุดตรวจ";


  const headerCount =
    document.createElement(
      "span"
    );


  headerCount.className =
    "qr-list-count";


  headerCount.textContent =
    `${filteredLocations.length} จุด`;


  listHeader.appendChild(
    headerTitle
  );


  listHeader.appendChild(
    headerCount
  );


  qrLocationList.appendChild(
    listHeader
  );


  /*
   * ---------------------------------------------
   * Empty
   * ---------------------------------------------
   */

  if (
    pageLocations.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "qr-empty-state";


    empty.textContent =
      "⚪ ไม่พบจุดตรวจตามเงื่อนไขที่ค้นหา";


    qrLocationList.appendChild(
      empty
    );


    updatePaginationUI(
      0,
      0
    );


    return;

  }


  /*
   * ---------------------------------------------
   * Grid
   * ---------------------------------------------
   */

  const grid =
    document.createElement(
      "div"
    );


  grid.className =
    "qr-location-grid";


  pageLocations.forEach(
    location => {

      grid.appendChild(
        createQRLocationCard(
          location
        )
      );

    }
  );


  qrLocationList.appendChild(
    grid
  );


  updatePaginationUI(
    filteredLocations.length,
    pageLocations.length
  );


  updateQRSummary();

}


// ==================================================
// CREATE LOCATION CARD
// ==================================================

function createQRLocationCard(
  location
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "qr-location-card";


  const isActive =
    location.active === true;


  const pointId =
    String(
      location.pointId ||
      ""
    ).trim();


  const hasQR =
    locationHasQR(
      location
    );


  /*
   * ---------------------------------------------
   * State
   * ---------------------------------------------
   */

  card.classList.add(
    isActive
      ? "qr-location-active"
      : "qr-location-inactive"
  );


  if (
    selectedPointIds.has(
      pointId
    )
  ) {

    card.classList.add(
      "qr-location-selected"
    );

  }


  /*
   * ---------------------------------------------
   * CHECKBOX
   * ---------------------------------------------
   */

  const checkboxWrapper =
    document.createElement(
      "label"
    );


  checkboxWrapper.className =
    "qr-checkbox-wrapper";


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
    selectedPointIds.has(
      pointId
    );


  checkbox.disabled =
    !isActive ||
    !pointId;


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


  checkboxWrapper.appendChild(
    checkbox
  );


  card.appendChild(
    checkboxWrapper
  );


  /*
   * ---------------------------------------------
   * HEADER
   * ---------------------------------------------
   */

  const header =
    document.createElement(
      "div"
    );


  header.className =
    "qr-location-header";


  const pointIdElement =
    document.createElement(
      "strong"
    );


  pointIdElement.className =
    "qr-location-point-id";


  pointIdElement.textContent =
    pointId ||
    "-";


  const activeStatus =
    document.createElement(
      "span"
    );


  activeStatus.className =
    "qr-location-active-status";


  activeStatus.textContent =
    isActive
      ? "ACTIVE"
      : "INACTIVE";


  header.appendChild(
    pointIdElement
  );


  header.appendChild(
    activeStatus
  );


  card.appendChild(
    header
  );


  /*
   * ---------------------------------------------
   * ZONE
   * ---------------------------------------------
   */

  const zone =
    document.createElement(
      "div"
    );


  zone.className =
    "qr-location-zone";


  zone.textContent =
    location.zone
      ? `📍 ${location.zone}`
      : "📍 -";


  card.appendChild(
    zone
  );


  /*
   * ---------------------------------------------
   * LOCATION
   * ---------------------------------------------
   */

  const locationName =
    document.createElement(
      "div"
    );


  locationName.className =
    "qr-location-name";


  locationName.textContent =
    location.location ||
    "-";


  card.appendChild(
    locationName
  );


  /*
   * ---------------------------------------------
   * QR STATUS
   * ---------------------------------------------
   */

  const qrInfo =
    document.createElement(
      "div"
    );


  qrInfo.className =
    "qr-location-info";


  qrInfo.textContent =
    !isActive
      ? "⛔ จุดนี้ถูกปิดใช้งาน"
      : hasQR
        ? "✓ มี QR Code"
        : "📱 ยังไม่มี QR Code";


  card.appendChild(
    qrInfo
  );


  /*
   * ---------------------------------------------
   * QUICK QR BUTTON
   *
   * ปุ่มนี้สร้าง QR เฉพาะจุด
   * ไม่ต้องเลือก Checkbox ก่อน
   * ---------------------------------------------
   */

  const quickQrButton =
    document.createElement(
      "button"
    );


  quickQrButton.type =
    "button";


  quickQrButton.className =
    "qr-card-action-button";


  quickQrButton.textContent =
    "📱 QR";


  quickQrButton.disabled =
    !isActive ||
    !pointId;


  quickQrButton.addEventListener(
    "click",
    function(event) {

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


      updateQRCheckboxes();


      updateQRSummary();


      createSelectedQR();

    }
  );


  card.appendChild(
    quickQrButton
  );


  /*
   * ---------------------------------------------
   * CARD CLICK
   * ---------------------------------------------
   */

  card.addEventListener(
    "click",
    function(event) {

      if (
        event.target === checkbox ||
        event.target.closest(
          ".qr-checkbox-wrapper"
        ) ||
        event.target === quickQrButton
      ) {

        return;

      }


      if (
        !isActive ||
        !pointId
      ) {

        return;

      }


      checkbox.checked =
        !checkbox.checked;


      handleLocationSelection(
        location,
        checkbox.checked
      );

    }
  );


  return card;

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


  updateQRCheckboxes();


  updateQRSummary();


  updatePageSelectAll();

}


// ==================================================
// UPDATE CHECKBOXES
// ==================================================

function updateQRCheckboxes() {

  if (!qrLocationList) {

    return;

  }


  const checkboxes =
    qrLocationList.querySelectorAll(
      ".qr-location-checkbox"
    );


  checkboxes.forEach(
    checkbox => {

      checkbox.checked =
        selectedPointIds.has(
          checkbox.value
        );


      const card =
        checkbox.closest(
          ".qr-location-card"
        );


      if (card) {

        card.classList.toggle(
          "qr-location-selected",
          checkbox.checked
        );

      }

    }
  );


  updatePageSelectAll();

}


// ==================================================
// UPDATE PAGE SELECT ALL
// ==================================================

function updatePageSelectAll() {

  if (!qrPageSelectAll) {

    return;

  }


  const pageLocations =
    getCurrentPageLocations();


  const selectable =
    pageLocations.filter(
      location =>
        location.active === true &&
        String(
          location.pointId ||
          ""
        ).trim()
    );


  if (
    selectable.length === 0
  ) {

    qrPageSelectAll.textContent =
      "☐ ไม่มีจุดให้เลือก";

    qrPageSelectAll.disabled =
      true;

    return;

  }


  qrPageSelectAll.disabled =
    false;


  const allSelected =
    selectable.every(
      location =>
        selectedPointIds.has(
          String(
            location.pointId
          ).trim()
        )
    );


  qrPageSelectAll.textContent =
    allSelected
      ? "☑️ ยกเลิกทั้งหมดในหน้านี้"
      : "☐ เลือกทั้งหมดในหน้านี้";

}


// ==================================================
// TOGGLE CURRENT PAGE
// ==================================================

function toggleSelectCurrentPage() {

  const pageLocations =
    getCurrentPageLocations();


  const selectable =
    pageLocations.filter(
      location =>
        location.active === true &&
        String(
          location.pointId ||
          ""
        ).trim()
    );


  if (
    selectable.length === 0
  ) {

    return;

  }


  const allSelected =
    selectable.every(
      location =>
        selectedPointIds.has(
          String(
            location.pointId
          ).trim()
        )
    );


  selectable.forEach(
    location => {

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


  updateQRCheckboxes();


  updateQRSummary();


  setQRStatus(
    allSelected
      ? "⬜ ยกเลิกการเลือกในหน้านี้แล้ว"
      : `☑️ เลือก ${selectable.length} จุดในหน้านี้แล้ว`
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
      location =>
        location.active === true
    ).length;


  const qrCount =
    qrLocations.filter(
      location =>
        locationHasQR(
          location
        )
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


  if (qrSelectedCount) {

    qrSelectedCount.textContent =
      selected;

  }


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      `${selected} จุด`;

  }


  /*
   * ---------------------------------------------
   * เพิ่ม QR Count ถ้ามีพื้นที่รองรับ
   * ---------------------------------------------
   */

  const qrCountElement =
    getElement(
      "qrGeneratedCount"
    );


  if (qrCountElement) {

    qrCountElement.textContent =
      qrCount;

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

}


// ==================================================
// SELECT ALL
//
// หมายถึง Active ทั้งหมดทุกหน้า
// ใช้เมื่อผู้ใช้กดปุ่มเดิมด้านบน
// ==================================================

function selectAllQR() {

  selectedPointIds =
    new Set(

      qrLocations

        .filter(
          location =>
            location.active === true
        )

        .map(
          location =>
            String(
              location.pointId ||
              ""
            ).trim()
        )

        .filter(
          pointId =>
            pointId !== ""
        )

    );


  updateQRCheckboxes();


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


  updateQRCheckboxes();


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
    location => {

      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      return (
        location.active === true &&
        pointId &&
        selectedPointIds.has(
          pointId
        )
      );

    }
  );

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


  locations.forEach(
    location => {

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
          "ไม่มี pointId";


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
       * Point ID
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
       * Location
       */

      const locationName =
        document.createElement(
          "div"
        );


      locationName.className =
        "qr-preview-location";


      locationName.textContent =
        location.location ||
        "-";


      /*
       * Zone
       */

      const zone =
        document.createElement(
          "div"
        );


      zone.className =
        "qr-preview-zone";


      zone.textContent =
        location.zone ||
        "-";


      /*
       * Append
       */

      card.appendChild(
        qrBox
      );


      card.appendChild(
        pointIdElement
      );


      card.appendChild(
        locationName
      );


      card.appendChild(
        zone
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
// PRINT SELECTED
//
// ตอนนี้ยังเป็น Preview
// ระบบพิมพ์จริงทำขั้นถัดไป
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
    typeof QRCode === "undefined"
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
      location => {

        return (
          location.active === true &&
          String(
            location.pointId ||
            ""
          ).trim()
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
        location =>
          String(
            location.pointId
          ).trim()
      )

    );


  updateQRCheckboxes();


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
// UPDATE PAGINATION UI
// ==================================================

function updatePaginationUI(
  totalItems,
  currentItems
) {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
        QR_PAGE_SIZE
      )
    );


  if (qrPageInfo) {

    const start =
      totalItems === 0
        ? 0
        : (
            (
              qrCurrentPage -
              1
            ) *
            QR_PAGE_SIZE
          ) + 1;


    const end =
      Math.min(
        qrCurrentPage *
          QR_PAGE_SIZE,
        totalItems
      );


    qrPageInfo.textContent =
      totalItems === 0
        ? "0 รายการ"
        : `${start}-${end} จาก ${totalItems}`;

  }


  if (!qrPagination) {

    return;

  }


  qrPagination.innerHTML =
    "";


  /*
   * ---------------------------------------------
   * แสดงเลขหน้า
   *
   * ถ้ามีหลายหน้า
   * แสดงช่วงใกล้หน้าปัจจุบัน
   * ---------------------------------------------
   */

  const pages =
    createPageNumbers(
      qrCurrentPage,
      totalPages
    );


  pages.forEach(
    page => {

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


          renderQRLocations();

        }
      );


      qrPagination.appendChild(
        button
      );

    }
  );


  updatePageSelectAll();

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
      (
        _,
        index
      ) =>
        index + 1
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
    current < total - 3
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
// EVENTS
// ==================================================


// ==================================================
// REFRESH
// ==================================================

if (refreshQrBtn) {

  refreshQrBtn.addEventListener(
    "click",
    function() {

      loadQRManagement();

    }
  );

}


// ==================================================
// SELECT ALL
// ==================================================

if (selectAllQrBtn) {

  selectAllQrBtn.addEventListener(
    "click",
    function() {

      selectAllQR();

    }
  );

}


// ==================================================
// CLEAR ALL
// ==================================================

if (clearAllQrBtn) {

  clearAllQrBtn.addEventListener(
    "click",
    function() {

      clearAllQR();

    }
  );

}


// ==================================================
// CREATE QR
// ==================================================

if (createQrBtn) {

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

if (printSelectedQrBtn) {

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

if (printAllQrBtn) {

  printAllQrBtn.addEventListener(
    "click",
    function() {

      printAllQR();

    }
  );

}


// ==================================================
// START
// ==================================================

loadQRManagement();


}