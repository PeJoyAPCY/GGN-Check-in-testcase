// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 1.0 RESET
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - แสดงข้อมูลลง Table
// - Search
// - Filter Zone / Status / QR
// - Pagination
// - Select
// - Select All
// - Clear All
// - สร้าง QR Code
// - QR Preview
// - Print QR
//
// IMPORTANT
// - ยึด qr.html ปัจจุบันเป็นหลัก
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ Database
// - QR DATA = pointId
// ==================================================


// ==================================================
// PAGE GUARD
// ==================================================

if (currentPage !== "qr.html") {

  console.log(
    "GGN QR: ไม่ใช่หน้า qr.html จึงไม่เริ่มระบบ"
  );

} else {


// ==================================================
// CONSTANTS
// ==================================================

const QR_CARD_WIDTH_MM = 57;
const QR_CARD_HEIGHT_MM = 88;

const QR_COLUMNS = 3;
const QR_ROWS = 3;

const QR_PER_PAGE =
  QR_COLUMNS * QR_ROWS;

const QR_SIZE_PX = 180;


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

const qrLocationTableBody =
  getElement("qrLocationTableBody");

const qrPaginationInfo =
  getElement("qrPaginationInfo");

const qrPagination =
  getElement("qrPagination");

const qrPageSize =
  getElement("qrPageSize");

const selectAllQrCheckbox =
  getElement("selectAllQrCheckbox");

const clearAllQrBtn =
  getElement("clearAllQrBtn");

const createQrBtn =
  getElement("createQrBtn");

const printSelectedQrBtn =
  getElement("printSelectedQrBtn");

const printAllQrBtn =
  getElement("printAllQrBtn");

const qrPreviewGrid =
  getElement("qrPreviewGrid");

const qrPreviewCount =
  getElement("qrPreviewCount");

const refreshQrBtn =
  getElement("refreshQrBtn");


// ==================================================
// STATE
// ==================================================

let qrLocations = [];

let filteredQrLocations = [];

let selectedPointIds =
  new Set();

let currentQrPage = 1;

let currentQrPageSize = 25;

let currentSearch = "";

let currentZone = "";

let currentStatus = "";

let currentQrExist = "";


// ==================================================
// INIT
// ==================================================

function initializeQR() {

  console.log(
    "GGN QR: initializeQR()"
  );


  bindQREvents();


  loadQRManagement();

}


// ==================================================
// EVENT BINDING
// ==================================================

function bindQREvents() {


  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  if (qrSearchInput) {

    qrSearchInput.addEventListener(
      "input",
      function () {

        currentSearch =
          String(
            qrSearchInput.value || ""
          )
            .trim()
            .toLowerCase();


        currentQrPage = 1;

        applyQRFilters();

      }
    );

  }


  // --------------------------------------------------
  // ZONE FILTER
  // --------------------------------------------------

  if (qrZoneFilter) {

    qrZoneFilter.addEventListener(
      "change",
      function () {

        currentZone =
          qrZoneFilter.value || "";

        currentQrPage = 1;

        applyQRFilters();

      }
    );

  }


  // --------------------------------------------------
  // STATUS FILTER
  // --------------------------------------------------

  if (qrStatusFilter) {

    qrStatusFilter.addEventListener(
      "change",
      function () {

        currentStatus =
          qrStatusFilter.value || "";

        currentQrPage = 1;

        applyQRFilters();

      }
    );

  }


  // --------------------------------------------------
  // QR EXIST FILTER
  // --------------------------------------------------

  if (qrExistFilter) {

    qrExistFilter.addEventListener(
      "change",
      function () {

        currentQrExist =
          qrExistFilter.value || "";

        currentQrPage = 1;

        applyQRFilters();

      }
    );

  }


  // --------------------------------------------------
  // CLEAR FILTER
  // --------------------------------------------------

  if (clearQrFilterBtn) {

    clearQrFilterBtn.addEventListener(
      "click",
      clearQRFilters
    );

  }


  // --------------------------------------------------
  // PAGE SIZE
  // --------------------------------------------------

  if (qrPageSize) {

    qrPageSize.addEventListener(
      "change",
      function () {

        const value =
          parseInt(
            qrPageSize.value,
            10
          );


        currentQrPageSize =
          Number.isFinite(value) &&
          value > 0
            ? value
            : 25;


        currentQrPage = 1;

        renderQRTable();

      }
    );

  }


  // --------------------------------------------------
  // SELECT ALL
  // --------------------------------------------------

  if (selectAllQrCheckbox) {

    selectAllQrCheckbox.addEventListener(
      "change",
      function () {

        toggleSelectAll(
          selectAllQrCheckbox.checked
        );

      }
    );

  }


  // --------------------------------------------------
  // CLEAR ALL
  // --------------------------------------------------

  if (clearAllQrBtn) {

    clearAllQrBtn.addEventListener(
      "click",
      function () {

        selectedPointIds.clear();

        updateSelectionUI();

        setQRStatus(
          "⬜ ยกเลิกการเลือกทั้งหมดแล้ว"
        );

      }
    );

  }


  // --------------------------------------------------
  // CREATE QR
  // --------------------------------------------------

  if (createQrBtn) {

    createQrBtn.addEventListener(
      "click",
      createSelectedQR
    );

  }


  // --------------------------------------------------
  // PRINT SELECTED
  // --------------------------------------------------

  if (printSelectedQrBtn) {

    printSelectedQrBtn.addEventListener(
      "click",
      printSelectedQR
    );

  }


  // --------------------------------------------------
  // PRINT ALL
  // --------------------------------------------------

  if (printAllQrBtn) {

    printAllQrBtn.addEventListener(
      "click",
      printAllQR
    );

  }


  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  if (refreshQrBtn) {

    refreshQrBtn.addEventListener(
      "click",
      function () {

        loadQRManagement();

      }
    );

  }

}


// ==================================================
// LOAD DATA
// ==================================================

async function loadQRManagement() {

  if (!qrLocationTableBody) {

    console.error(
      "GGN QR: ไม่พบ #qrLocationTableBody"
    );

    return;

  }


  setQRStatus(
    "⏳ กำลังโหลดรายการจุดตรวจ..."
  );


  renderTableLoading();


  if (
    typeof GOOGLE_APPS_SCRIPT_URL ===
    "undefined" ||
    !GOOGLE_APPS_SCRIPT_URL
  ) {

    setQRStatus(
      "❌ ไม่พบ GOOGLE_APPS_SCRIPT_URL"
    );

    renderTableError(
      "ไม่พบ Google Apps Script URL"
    );

    return;

  }


  try {

    const apiUrl =
      `${GOOGLE_APPS_SCRIPT_URL}` +
      `?action=qrManagement`;


    console.log(
      "GGN QR Management Request:",
      apiUrl
    );


    const response =
      await fetch(
        apiUrl
      );


    console.log(
      "GGN QR Management HTTP:",
      response.status
    );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "GGN QR Management Response:",
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
          : "API ไม่ส่งข้อมูลสำเร็จ"
      );

    }


    const data =
      result.data || {};


    /*
     * ----------------------------------------------
     * รองรับโครงสร้าง API หลัก
     * ----------------------------------------------
     */

    if (
      Array.isArray(
        data.locations
      )
    ) {

      qrLocations =
        data.locations;

    } else {

      qrLocations = [];

    }


    /*
     * ----------------------------------------------
     * Reset
     * ----------------------------------------------
     */

    selectedPointIds.clear();

    currentQrPage = 1;


    /*
     * ----------------------------------------------
     * Page total
     * ----------------------------------------------
     */

    if (qrPageTotal) {

      qrPageTotal.textContent =
        qrLocations.length;

    }


    /*
     * ----------------------------------------------
     * Build filters
     * ----------------------------------------------
     */

    buildZoneFilter();


    /*
     * ----------------------------------------------
     * Apply filters
     * ----------------------------------------------
     */

    applyQRFilters();


    /*
     * ----------------------------------------------
     * Status
     * ----------------------------------------------
     */

    setQRStatus(
      `✅ โหลดข้อมูลสำเร็จ ${qrLocations.length} จุด`
    );


    console.log(
      "GGN QR Locations:",
      qrLocations
    );


  } catch (error) {

    console.error(
      "GGN QR Management Error:",
      error
    );


    qrLocations = [];

    filteredQrLocations = [];

    selectedPointIds.clear();


    updateSummary();


    renderTableError(
      error.message ||
      "ไม่สามารถโหลดข้อมูลได้"
    );


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
// TABLE LOADING
// ==================================================

function renderTableLoading() {

  if (!qrLocationTableBody) {

    return;

  }


  qrLocationTableBody.innerHTML = `

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
// TABLE ERROR
// ==================================================

function renderTableError(
  message
) {

  if (!qrLocationTableBody) {

    return;

  }


  qrLocationTableBody.innerHTML = `

    <tr>

      <td
        colspan="7"
        class="qr-table-loading"
      >
        ❌ ${escapeHTML(message)}
      </td>

    </tr>

  `;


  if (qrPaginationInfo) {

    qrPaginationInfo.textContent =
      "0 รายการ";

  }


  if (qrPagination) {

    qrPagination.innerHTML =
      "";

  }

}


// ==================================================
// BUILD ZONE FILTER
// ==================================================

function buildZoneFilter() {

  if (!qrZoneFilter) {

    return;

  }


  const previousValue =
    currentZone;


  const zones =
    Array.from(

      new Set(

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

    )
      .sort(
        (a, b) =>
          a.localeCompare(
            b,
            "th"
          )
      );


  qrZoneFilter.innerHTML = `

    <option value="">
      ทุกเขต
    </option>

  `;


  zones.forEach(
    zone => {

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


  if (
    zones.includes(
      previousValue
    )
  ) {

    qrZoneFilter.value =
      previousValue;

  } else {

    qrZoneFilter.value =
      "";

    currentZone =
      "";

  }

}


// ==================================================
// APPLY FILTERS
// ==================================================

function applyQRFilters() {

  const search =
    currentSearch;


  filteredQrLocations =
    qrLocations.filter(
      location => {

        const pointId =
          String(
            location.pointId ||
            ""
          )
            .trim()
            .toLowerCase();


        const zone =
          String(
            location.zone ||
            ""
          )
            .trim()
            .toLowerCase();


        const locationName =
          String(
            location.location ||
            ""
          )
            .trim()
            .toLowerCase();


        /*
         * --------------------------------------------
         * SEARCH
         * --------------------------------------------
         */

        if (search) {

          const matched =
            pointId.includes(search) ||
            zone.includes(search) ||
            locationName.includes(search);


          if (!matched) {

            return false;

          }

        }


        /*
         * --------------------------------------------
         * ZONE
         * --------------------------------------------
         */

        if (
          currentZone &&
          String(
            location.zone ||
            ""
          ).trim() !== currentZone
        ) {

          return false;

        }


        /*
         * --------------------------------------------
         * STATUS
         * --------------------------------------------
         */

        const isActive =
          location.active === true;


        if (
          currentStatus === "active" &&
          !isActive
        ) {

          return false;

        }


        if (
          currentStatus === "inactive" &&
          isActive
        ) {

          return false;

        }


        /*
         * --------------------------------------------
         * QR
         *
         * รองรับหลายชื่อ field
         * --------------------------------------------
         */

        const hasQR =
          checkHasQR(
            location
          );


        if (
          currentQrExist === "yes" &&
          !hasQR
        ) {

          return false;

        }


        if (
          currentQrExist === "no" &&
          hasQR
        ) {

          return false;

        }


        return true;

      }
    );


  /*
   * ----------------------------------------------
   * ปรับ Page
   * ----------------------------------------------
   */

  const totalPages =
    getTotalPages();


  if (
    currentQrPage >
    totalPages
  ) {

    currentQrPage =
      Math.max(
        1,
        totalPages
      );

  }


  renderQRTable();


  updateSummary();

}


// ==================================================
// CHECK HAS QR
// ==================================================

function checkHasQR(
  location
) {

  if (!location) {

    return false;

  }


  /*
   * รองรับ field ที่อาจมีในข้อมูล
   */

  if (
    location.hasQR === true ||
    location.hasQr === true ||
    location.qr === true ||
    location.qrExists === true
  ) {

    return true;

  }


  if (
    typeof location.qrCode === "string" &&
    location.qrCode.trim() !== ""
  ) {

    return true;

  }


  if (
    typeof location.qr === "string" &&
    location.qr.trim() !== ""
  ) {

    return true;

  }


  /*
   * ถ้ามี pointId
   * แต่ Backend ไม่ได้ส่งสถานะ QR
   *
   * ยังถือว่าไม่มี QR
   */

  return false;

}


// ==================================================
// RENDER TABLE
// ==================================================

function renderQRTable() {

  if (!qrLocationTableBody) {

    return;

  }


  qrLocationTableBody.innerHTML =
    "";


  if (
    filteredQrLocations.length === 0
  ) {

    qrLocationTableBody.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="qr-table-loading"
        >
          ⚪ ไม่พบข้อมูลตามเงื่อนไข
        </td>

      </tr>

    `;


    updatePagination();

    updateSelectAllState();

    return;

  }


  const startIndex =
    (
      currentQrPage -
      1
    ) *
    currentQrPageSize;


  const endIndex =
    Math.min(
      startIndex +
      currentQrPageSize,
      filteredQrLocations.length
    );


  const pageItems =
    filteredQrLocations.slice(
      startIndex,
      endIndex
    );


  pageItems.forEach(
    location => {

      const row =
        createQRTableRow(
          location
        );


      qrLocationTableBody.appendChild(
        row
      );

    }
  );


  updatePagination();

  updateSelectAllState();

}


// ==================================================
// CREATE TABLE ROW
// ==================================================

function createQRTableRow(
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
      "-"
    ).trim();


  const locationName =
    String(
      location.location ||
      "-"
    ).trim();


  const active =
    location.active === true;


  const hasQR =
    checkHasQR(
      location
    );


  /*
   * ----------------------------------------------
   * CHECK
   * ----------------------------------------------
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
    selectedPointIds.has(
      pointId
    );


  checkbox.disabled =
    !active ||
    !pointId;


  checkbox.addEventListener(
    "change",
    function () {

      if (
        checkbox.checked
      ) {

        selectedPointIds.add(
          pointId
        );

      } else {

        selectedPointIds.delete(
          pointId
        );

      }


      updateSelectionUI();

    }
  );


  checkCell.appendChild(
    checkbox
  );


  row.appendChild(
    checkCell
  );


  /*
   * ----------------------------------------------
   * POINT
   * ----------------------------------------------
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
   * ----------------------------------------------
   * ZONE
   * ----------------------------------------------
   */

  const zoneCell =
    document.createElement(
      "td"
    );


  zoneCell.className =
    "qr-col-zone";


  zoneCell.textContent =
    zone;


  row.appendChild(
    zoneCell
  );


  /*
   * ----------------------------------------------
   * LOCATION
   * ----------------------------------------------
   */

  const locationCell =
    document.createElement(
      "td"
    );


  locationCell.className =
    "qr-col-location";


  locationCell.textContent =
    locationName;


  row.appendChild(
    locationCell
  );


  /*
   * ----------------------------------------------
   * STATUS
   * ----------------------------------------------
   */

  const statusCell =
    document.createElement(
      "td"
    );


  statusCell.className =
    "qr-col-status";


  const statusSpan =
    document.createElement(
      "span"
    );


  statusSpan.textContent =
    active
      ? "ACTIVE"
      : "INACTIVE";


  statusSpan.className =
    active
      ? "qr-status-active"
      : "qr-status-inactive";


  statusCell.appendChild(
    statusSpan
  );


  row.appendChild(
    statusCell
  );


  /*
   * ----------------------------------------------
   * QR
   * ----------------------------------------------
   */

  const qrCell =
    document.createElement(
      "td"
    );


  qrCell.className =
    "qr-col-qr";


  const qrSpan =
    document.createElement(
      "span"
    );


  qrSpan.textContent =
    hasQR
      ? "มี QR"
      : "ยังไม่มี QR";


  qrSpan.className =
    hasQR
      ? "qr-exists"
      : "qr-not-exists";


  qrCell.appendChild(
    qrSpan
  );


  row.appendChild(
    qrCell
  );


  /*
   * ----------------------------------------------
   * ACTION
   * ----------------------------------------------
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
    "qr-row-action-button";


  actionButton.textContent =
    "📱 QR";


  actionButton.disabled =
    !active ||
    !pointId;


  actionButton.addEventListener(
    "click",
    function () {

      selectedPointIds.clear();

      selectedPointIds.add(
        pointId
      );


      updateSelectionUI();


      createSelectedQR();

    }
  );


  actionCell.appendChild(
    actionButton
  );


  row.appendChild(
    actionCell
  );


  return row;

}


// ==================================================
// SUMMARY
// ==================================================

function updateSummary() {

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
        checkHasQR(
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


  updateSelectAllState();

}


// ==================================================
// SELECTION UI
// ==================================================

function updateSelectionUI() {

  updateSummary();

  updateVisibleCheckboxes();

  updateSelectAllState();

}


// ==================================================
// UPDATE VISIBLE CHECKBOXES
// ==================================================

function updateVisibleCheckboxes() {

  if (!qrLocationTableBody) {

    return;

  }


  const checkboxes =
    qrLocationTableBody.querySelectorAll(
      ".qr-location-checkbox"
    );


  checkboxes.forEach(
    checkbox => {

      checkbox.checked =
        selectedPointIds.has(
          checkbox.value
        );

    }
  );

}


// ==================================================
// SELECT ALL
// ==================================================

function toggleSelectAll(
  checked
) {

  if (checked) {

    filteredQrLocations.forEach(
      location => {

        if (
          location.active !== true
        ) {

          return;

        }


        const pointId =
          String(
            location.pointId ||
            ""
          ).trim();


        if (pointId) {

          selectedPointIds.add(
            pointId
          );

        }

      }
    );


    setQRStatus(
      `☑️ เลือกจุด Active ${selectedPointIds.size} จุด`
    );

  } else {

    filteredQrLocations.forEach(
      location => {

        const pointId =
          String(
            location.pointId ||
            ""
          ).trim();


        if (pointId) {

          selectedPointIds.delete(
            pointId
          );

        }

      }
    );


    setQRStatus(
      "⬜ ยกเลิกการเลือกในรายการนี้แล้ว"
    );

  }


  updateSelectionUI();

}


// ==================================================
// SELECT ALL STATE
// ==================================================

function updateSelectAllState() {

  if (!selectAllQrCheckbox) {

    return;

  }


  const selectable =
    filteredQrLocations.filter(
      location =>
        location.active === true &&
        String(
          location.pointId ||
          ""
        ).trim()
    );


  if (selectable.length === 0) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      false;

    return;

  }


  const selected =
    selectable.filter(
      location =>
        selectedPointIds.has(
          String(
            location.pointId
          ).trim()
        )
    );


  if (
    selected.length ===
    selectable.length
  ) {

    selectAllQrCheckbox.checked =
      true;

    selectAllQrCheckbox.indeterminate =
      false;

    return;

  }


  if (
    selected.length > 0
  ) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      true;

    return;

  }


  selectAllQrCheckbox.checked =
    false;

  selectAllQrCheckbox.indeterminate =
    false;

}


// ==================================================
// CLEAR FILTERS
// ==================================================

function clearQRFilters() {

  currentSearch = "";

  currentZone = "";

  currentStatus = "";

  currentQrExist = "";

  currentQrPage = 1;


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


  applyQRFilters();


  setQRStatus(
    "🔄 ล้างตัวกรองแล้ว"
  );

}


// ==================================================
// PAGINATION
// ==================================================

function getTotalPages() {

  if (
    filteredQrLocations.length === 0
  ) {

    return 1;

  }


  return Math.ceil(
    filteredQrLocations.length /
    currentQrPageSize
  );

}


// ==================================================
// UPDATE PAGINATION
// ==================================================

function updatePagination() {

  if (qrPaginationInfo) {

    if (
      filteredQrLocations.length === 0
    ) {

      qrPaginationInfo.textContent =
        "0 รายการ";

    } else {

      const start =
        (
          currentQrPage -
          1
        ) *
        currentQrPageSize +
        1;


      const end =
        Math.min(
          currentQrPage *
          currentQrPageSize,
          filteredQrLocations.length
        );


      qrPaginationInfo.textContent =
        `${start}-${end} จาก ${filteredQrLocations.length} รายการ`;

    }

  }


  if (!qrPagination) {

    return;

  }


  qrPagination.innerHTML =
    "";


  const totalPages =
    getTotalPages();


  if (
    totalPages <= 1
  ) {

    return;

  }


  /*
   * Previous
   */

  const previous =
    createPaginationButton(
      "‹",
      currentQrPage > 1
    );


  previous.addEventListener(
    "click",
    function () {

      if (
        currentQrPage <= 1
      ) {

        return;

      }


      currentQrPage--;

      renderQRTable();

      scrollQRTableTop();

    }
  );


  qrPagination.appendChild(
    previous
  );


  /*
   * Page buttons
   */

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    /*
     * ถ้ามีหลายหน้ามาก
     * แสดงเฉพาะช่วงใกล้หน้าปัจจุบัน
     */

    if (
      totalPages > 7 &&
      page !== 1 &&
      page !== totalPages &&
      Math.abs(
        page -
        currentQrPage
      ) > 2
    ) {

      if (
        page === 2 ||
        page === totalPages - 1
      ) {

        const dots =
          document.createElement(
            "span"
          );


        dots.textContent =
          "...";


        dots.className =
          "qr-pagination-dots";


        qrPagination.appendChild(
          dots
        );

      }


      continue;

    }


    const button =
      createPaginationButton(
        String(page),
        true
      );


    if (
      page === currentQrPage
    ) {

      button.classList.add(
        "active"
      );

    }


    button.addEventListener(
      "click",
      function () {

        currentQrPage =
          page;

        renderQRTable();

        scrollQRTableTop();

      }
    );


    qrPagination.appendChild(
      button
    );

  }


  /*
   * Next
   */

  const next =
    createPaginationButton(
      "›",
      currentQrPage <
      totalPages
    );


  next.addEventListener(
    "click",
    function () {

      if (
        currentQrPage >=
        totalPages
      ) {

        return;

      }


      currentQrPage++;

      renderQRTable();

      scrollQRTableTop();

    }
  );


  qrPagination.appendChild(
    next
  );

}


// ==================================================
// PAGINATION BUTTON
// ==================================================

function createPaginationButton(
  text,
  enabled
) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.textContent =
    text;


  button.className =
    "qr-pagination-button";


  button.disabled =
    !enabled;


  return button;

}


// ==================================================
// SCROLL TABLE
// ==================================================

function scrollQRTableTop() {

  const section =
    document.querySelector(
      ".qr-table-section"
    );


  if (!section) {

    return;

  }


  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

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

  const locations =
    getSelectedLocations();


  if (
    locations.length === 0
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
      "❌ ไม่พบ qrcodejs"
    );

    console.error(
      "GGN QR: QRCode library is not loaded."
    );

    return;

  }


  renderQRPreview(
    locations
  );


  setQRStatus(
    `✅ สร้าง QR สำเร็จ ${locations.length} จุด`
  );

}


// ==================================================
// CREATE QR NODE
// ==================================================

function createQRNode(
  container,
  pointId
) {

  if (!container) {

    return false;

  }


  if (!pointId) {

    container.textContent =
      "ไม่มี Point ID";

    return false;

  }


  try {

    new QRCode(
      container,
      {

        text:
          pointId,

        width:
          QR_SIZE_PX,

        height:
          QR_SIZE_PX,

        correctLevel:
          QRCode.CorrectLevel.H

      }
    );


    return true;

  } catch (error) {

    console.error(
      "GGN QR Create Error:",
      error
    );


    container.textContent =
      "สร้าง QR ไม่สำเร็จ";


    return false;

  }

}


// ==================================================
// RENDER QR PREVIEW
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
    !Array.isArray(
      locations
    ) ||
    locations.length === 0
  ) {

    clearQRPreview();

    return;

  }


  locations.forEach(
    location => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "qr-preview-card";


      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      /*
       * QR
       */

      const qrBox =
        document.createElement(
          "div"
        );


      qrBox.className =
        "qr-preview-code";


      createQRNode(
        qrBox,
        pointId
      );


      /*
       * Point ID
       */

      const point =
        document.createElement(
          "div"
        );


      point.className =
        "qr-preview-point-id";


      point.textContent =
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


      card.appendChild(
        qrBox
      );


      card.appendChild(
        point
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


  console.log(
    "GGN QR Preview:",
    locations
  );

}


// ==================================================
// CLEAR PREVIEW
// ==================================================

function clearQRPreview() {

  if (!qrPreviewGrid) {

    return;

  }


  qrPreviewGrid.innerHTML = `

    <div class="qr-empty-state">

      ยังไม่มี QR Code

    </div>

  `;


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      "0 จุด";

  }

}


// ==================================================
// PRINT SELECTED
// ==================================================

function printSelectedQR() {

  const locations =
    getSelectedLocations();


  if (
    locations.length === 0
  ) {

    setQRStatus(
      "⚠️ กรุณาเลือกจุดที่ต้องการพิมพ์"
    );

    return;

  }


  printQRLocations(
    locations
  );

}


// ==================================================
// PRINT ALL
// ==================================================

function printAllQR() {

  const locations =
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
    locations.length === 0
  ) {

    setQRStatus(
      "⚠️ ไม่พบจุด Active สำหรับพิมพ์"
    );

    return;

  }


  selectedPointIds =
    new Set(

      locations.map(
        location =>
          String(
            location.pointId
          ).trim()
      )

    );


  updateSelectionUI();


  printQRLocations(
    locations
  );

}


// ==================================================
// PRINT QR
// ==================================================

async function printQRLocations(
  locations
) {

  if (
    !Array.isArray(
      locations
    ) ||
    locations.length === 0
  ) {

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
    locations
  );


  /*
   * รอ QR render
   */

  await waitForQRRender();


  const cards =
    getQRPreviewCards();


  if (
    cards.length === 0
  ) {

    setQRStatus(
      "❌ ไม่พบ QR Preview"
    );

    return;

  }


  /*
   * ใช้ print window
   *
   * ไม่แตะ DOM หลัก
   */

  const printWindow =
    window.open(
      "",
      "_blank"
    );


  if (!printWindow) {

    setQRStatus(
      "❌ Browser บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up"
    );

    return;

  }


  const cardsHTML =
    cards
      .map(
        card =>
          card.outerHTML
      )
      .join("");


  printWindow.document.open();


  printWindow.document.write(`

    <!DOCTYPE html>

    <html lang="th">

    <head>

      <meta charset="UTF-8">

      <title>
        GGN QR Print
      </title>

      <style>

        @page {

          size: A4 portrait;

          margin: 0;

        }


        html,
        body {

          margin: 0;

          padding: 0;

          width: 210mm;

          background: #fff;

        }


        body {

          font-family:
            Arial,
            "Noto Sans Thai",
            sans-serif;

        }


        .print-page {

          width: 210mm;

          height: 297mm;

          display: grid;

          grid-template-columns:
            57mm 57mm 57mm;

          grid-template-rows:
            88mm 88mm 88mm;

          justify-content: center;

          align-content: center;

          page-break-after: always;

          break-after: page;

        }


        .print-page:last-child {

          page-break-after: auto;

          break-after: auto;

        }


        .qr-preview-card {

          width: 57mm;

          height: 88mm;

          box-sizing: border-box;

          padding: 3mm;

          border:
            0.35mm solid #000;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: flex-start;

          overflow: hidden;

          background: #fff;

        }


        .qr-preview-code {

          width: 46mm;

          height: 46mm;

          display: flex;

          align-items: center;

          justify-content: center;

          margin-bottom: 2mm;

          overflow: hidden;

        }


        .qr-preview-code canvas,
        .qr-preview-code img {

          width: 46mm;

          height: 46mm;

          display: block;

        }


        .qr-preview-point-id {

          width: 100%;

          text-align: center;

          font-size: 5mm;

          line-height: 1.05;

          font-weight: 700;

          margin-bottom: 1.5mm;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

        }


        .qr-preview-location {

          width: 100%;

          text-align: center;

          font-size: 3.4mm;

          line-height: 1.2;

          font-weight: 600;

          margin-bottom: 1.5mm;

          overflow: hidden;

        }


        .qr-preview-zone {

          width: 100%;

          text-align: center;

          font-size: 3.3mm;

          line-height: 1.15;

          font-weight: 600;

          overflow: hidden;

        }

      </style>

    </head>


    <body>

  `);


  /*
   * แบ่งหน้า
   */

  for (
    let i = 0;
    i < cards.length;
    i += QR_PER_PAGE
  ) {

    const pageCards =
      cards.slice(
        i,
        i +
        QR_PER_PAGE
      );


    printWindow.document.write(
      `<section class="print-page">`
    );


    pageCards.forEach(
      card => {

        printWindow.document.write(
          card.outerHTML
        );

      }
    );


    printWindow.document.write(
      `</section>`
    );

  }


  printWindow.document.write(`

    </body>

    </html>

  `);


  printWindow.document.close();


  /*
   * รอ image / canvas
   */

  setTimeout(
    function () {

      printWindow.focus();

      printWindow.print();

      setQRStatus(
        `🖨️ กำลังพิมพ์ ${locations.length} ใบ`
      );

    },
    500
  );

}


// ==================================================
// WAIT QR RENDER
// ==================================================

function waitForQRRender() {

  return new Promise(
    resolve => {

      requestAnimationFrame(
        function () {

          requestAnimationFrame(
            function () {

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

}


// ==================================================
// GET PREVIEW CARDS
// ==================================================

function getQRPreviewCards() {

  if (!qrPreviewGrid) {

    return [];

  }


  return Array.from(
    qrPreviewGrid.querySelectorAll(
      ".qr-preview-card"
    )
  );

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
// ESCAPE HTML
// ==================================================

function escapeHTML(
  value
) {

  return String(
    value === undefined ||
    value === null
      ? ""
      : value
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ==================================================
// START
// ==================================================

console.log(
  "GGN QR: qr.js Version 1.0 RESET loaded."
);


initializeQR();


} // END PAGE GUARD