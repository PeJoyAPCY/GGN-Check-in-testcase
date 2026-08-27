// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 1.0
//
// หน้าที่:
// - QR Management
// - โหลดข้อมูล Locations จาก Backend
// - Search
// - Filter Zone
// - Filter Status
// - Filter QR
// - Pagination
// - Select / Select All
// - สร้าง QR Code
// - Preview QR
// - Print Selected
// - Print All
// - Refresh
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ใช้ action=qrManagement
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - อ้างอิง ID จาก qr.html โดยตรง
// ==================================================


// ==================================================
// STATE
// ==================================================

let qrLocations = [];

let qrFilteredLocations = [];

let qrSelectedPointIds = new Set();

let qrCurrentPage = 1;

let qrPageSize = 25;

let qrSearchKeyword = "";

let qrZoneFilter = "";

let qrStatusFilter = "";

let qrExistFilter = "";


// ==================================================
// DOM
// ==================================================

const qrStatus =
  document.getElementById("qrStatus");

const qrPageTotal =
  document.getElementById("qrPageTotal");

const qrSearchInput =
  document.getElementById("qrSearchInput");

const qrZoneFilterElement =
  document.getElementById("qrZoneFilter");

const qrStatusFilterElement =
  document.getElementById("qrStatusFilter");

const qrExistFilterElement =
  document.getElementById("qrExistFilter");

const clearQrFilterBtn =
  document.getElementById("clearQrFilterBtn");

const qrTotalCount =
  document.getElementById("qrTotalCount");

const qrActiveCount =
  document.getElementById("qrActiveCount");

const qrHasQrCount =
  document.getElementById("qrHasQrCount");

const qrSelectedCount =
  document.getElementById("qrSelectedCount");

const selectAllQrCheckbox =
  document.getElementById("selectAllQrCheckbox");

const qrPageSizeElement =
  document.getElementById("qrPageSize");

const qrLocationTableBody =
  document.getElementById("qrLocationTableBody");

const qrPaginationInfo =
  document.getElementById("qrPaginationInfo");

const qrPagination =
  document.getElementById("qrPagination");

const clearAllQrBtn =
  document.getElementById("clearAllQrBtn");

const createQrBtn =
  document.getElementById("createQrBtn");

const printSelectedQrBtn =
  document.getElementById("printSelectedQrBtn");

const printAllQrBtn =
  document.getElementById("printAllQrBtn");

const qrPreviewCount =
  document.getElementById("qrPreviewCount");

const qrPreviewGrid =
  document.getElementById("qrPreviewGrid");

const qrPrintArea =
  document.getElementById("qrPrintArea");

const refreshQrBtn =
  document.getElementById("refreshQrBtn");


// ==================================================
// SAFE VALUE
// ==================================================

function qrValue(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(value).trim();

}


// ==================================================
// NORMALIZE LOCATION
//
// รองรับชื่อ field ที่ Backend ใช้
// ==================================================

function normalizeQrLocation(item) {

  if (!item || typeof item !== "object") {

    return null;

  }


  const pointId =
    qrValue(
      item.pointId ||
      item.pointID ||
      item.PointId ||
      item.PointID ||
      item.id
    );


  const zone =
    qrValue(
      item.zone ||
      item.Zone
    );


  const location =
    qrValue(
      item.location ||
      item.Location ||
      item.name ||
      item.Name
    );


  let active =
    item.active;


  if (
    active === undefined ||
    active === null
  ) {

    active =
      item.status;

  }


  if (
    typeof active === "string"
  ) {

    active =
      active.toLowerCase() === "true" ||
      active.toLowerCase() === "active" ||
      active === "1";

  } else {

    active =
      active === true ||
      active === 1;

  }


  let hasQr =
    item.hasQr;


  if (
    hasQr === undefined ||
    hasQr === null
  ) {

    hasQr =
      item.qr;

  }


  if (
    hasQr === undefined ||
    hasQr === null
  ) {

    hasQr =
      item.qrCode;

  }


  if (
    hasQr === undefined ||
    hasQr === null
  ) {

    hasQr =
      item.qrUrl;

  }


  if (
    typeof hasQr === "string"
  ) {

    hasQr =
      hasQr.trim() !== "" &&
      hasQr.toLowerCase() !== "false";

  } else {

    hasQr =
      hasQr === true ||
      hasQr === 1;

  }


  return {

    ...item,

    pointId,

    zone,

    location,

    active,

    hasQr

  };

}


// ==================================================
// SET STATUS
// ==================================================

function setQrStatus(
  message,
  type = ""
) {

  if (!qrStatus) {

    return;

  }


  qrStatus.textContent =
    message;


  qrStatus.dataset.status =
    type;

}


// ==================================================
// LOAD QR MANAGEMENT DATA
// ==================================================

async function loadQrManagementData() {

  setQrStatus(
    "⏳ กำลังโหลดข้อมูล..."
  );


  if (
    !GOOGLE_APPS_SCRIPT_URL
  ) {

    setQrStatus(
      "❌ ไม่พบ Google Apps Script URL"
    );

    renderQrTableEmpty(
      "ไม่พบ Google Apps Script URL"
    );

    return false;

  }


  try {

    const apiUrl =
      `${GOOGLE_APPS_SCRIPT_URL}` +
      `?action=qrManagement`;


    console.log(
      "⚡ GGN QR Management Request:",
      apiUrl
    );


    const response =
      await fetch(
        apiUrl
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "⚡ GGN QR Management Response:",
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
          : "ไม่สามารถโหลดข้อมูลจุดตรวจได้"
      );

    }


    /*
     * --------------------------------------------------
     * รองรับโครงสร้าง response
     * --------------------------------------------------
     *
     * result.data.locations
     * result.data.activeLocations
     *
     * และ fallback
     * result.locations
     */

    const data =
      result.data &&
      typeof result.data === "object"
        ? result.data
        : result;


    let locations =
      Array.isArray(
        data.locations
      )
        ? data.locations
        : [];


    /*
     * --------------------------------------------------
     * ถ้า Backend ส่งเฉพาะ activeLocations
     * ให้ใช้เป็น fallback
     * --------------------------------------------------
     */

    if (
      locations.length === 0 &&
      Array.isArray(
        data.activeLocations
      )
    ) {

      locations =
        data.activeLocations;

    }


    qrLocations =
      locations
        .map(
          normalizeQrLocation
        )
        .filter(
          item =>
            item &&
            item.pointId
        );


    /*
     * --------------------------------------------------
     * ล้าง selection ที่ไม่มีอยู่แล้ว
     * --------------------------------------------------
     */

    const validPointIds =
      new Set(
        qrLocations.map(
          item =>
            item.pointId
        )
      );


    qrSelectedPointIds =
      new Set(
        [...qrSelectedPointIds]
          .filter(
            pointId =>
              validPointIds.has(
                pointId
              )
          )
      );


    populateZoneFilter();

    updateQrSummary();

    applyQrFilters();

    setQrStatus(
      `✅ โหลดข้อมูลสำเร็จ ${qrLocations.length} จุด`
    );


    return true;


  } catch (error) {

    console.error(
      "GGN QR Management Error:",
      error
    );


    qrLocations = [];

    qrFilteredLocations = [];

    updateQrSummary();

    renderQrTableEmpty(
      "❌ ไม่สามารถโหลดข้อมูลจุดตรวจได้"
    );


    setQrStatus(
      "❌ ไม่สามารถโหลดข้อมูลได้"
    );


    return false;

  }

}


// ==================================================
// POPULATE ZONE FILTER
// ==================================================

function populateZoneFilter() {

  if (!qrZoneFilterElement) {

    return;

  }


  const currentValue =
    qrZoneFilterElement.value;


  const zones =
    [...new Set(
      qrLocations
        .map(
          item =>
            item.zone
        )
        .filter(Boolean)
    )]
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "th"
        )
    );


  qrZoneFilterElement.innerHTML =
    "";


  const allOption =
    document.createElement(
      "option"
    );


  allOption.value =
    "";


  allOption.textContent =
    "ทุกเขต";


  qrZoneFilterElement.appendChild(
    allOption
  );


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


      qrZoneFilterElement.appendChild(
        option
      );

    }
  );


  if (
    zones.includes(
      currentValue
    )
  ) {

    qrZoneFilterElement.value =
      currentValue;

  } else {

    qrZoneFilterElement.value =
      "";

  }

}


// ==================================================
// APPLY FILTERS
// ==================================================

function applyQrFilters() {

  const keyword =
    qrSearchKeyword
      .toLowerCase()
      .trim();


  qrFilteredLocations =
    qrLocations.filter(
      item => {

        /*
         * SEARCH
         */

        if (keyword) {

          const searchText =
            [
              item.pointId,
              item.zone,
              item.location
            ]
              .map(
                qrValue
              )
              .join(" ")
              .toLowerCase();


          if (
            !searchText.includes(
              keyword
            )
          ) {

            return false;

          }

        }


        /*
         * ZONE
         */

        if (
          qrZoneFilter &&
          item.zone !== qrZoneFilter
        ) {

          return false;

        }


        /*
         * STATUS
         */

        if (
          qrStatusFilter === "active" &&
          item.active !== true
        ) {

          return false;

        }


        if (
          qrStatusFilter === "inactive" &&
          item.active === true
        ) {

          return false;

        }


        /*
         * QR
         */

        if (
          qrExistFilter === "yes" &&
          item.hasQr !== true
        ) {

          return false;

        }


        if (
          qrExistFilter === "no" &&
          item.hasQr === true
        ) {

          return false;

        }


        return true;

      }
    );


  /*
   * ถ้าเปลี่ยน filter
   * กลับหน้าแรก
   */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        qrFilteredLocations.length /
        qrPageSize
      )
    );


  if (
    qrCurrentPage >
    totalPages
  ) {

    qrCurrentPage =
      totalPages;

  }


  renderQrTable();

  renderQrPagination();

  updateSelectAllState();

}


// ==================================================
// UPDATE SUMMARY
// ==================================================

function updateQrSummary() {

  const total =
    qrLocations.length;


  const active =
    qrLocations.filter(
      item =>
        item.active === true
    ).length;


  const hasQr =
    qrLocations.filter(
      item =>
        item.hasQr === true
    ).length;


  const selected =
    qrSelectedPointIds.size;


  if (qrPageTotal) {

    qrPageTotal.textContent =
      total;

  }


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
      hasQr;

  }


  if (qrSelectedCount) {

    qrSelectedCount.textContent =
      selected;

  }


  if (createQrBtn) {

    createQrBtn.disabled =
      selected === 0;

  }


  if (printSelectedQrBtn) {

    printSelectedQrBtn.disabled =
      selected === 0;

  }

}


// ==================================================
// RENDER TABLE
// ==================================================

function renderQrTable() {

  if (!qrLocationTableBody) {

    return;

  }


  const start =
    (
      qrCurrentPage -
      1
    ) *
    qrPageSize;


  const end =
    start +
    qrPageSize;


  const pageItems =
    qrFilteredLocations.slice(
      start,
      end
    );


  if (
    pageItems.length === 0
  ) {

    renderQrTableEmpty(
      "ไม่พบข้อมูลตามเงื่อนไข"
    );

    updatePaginationInfo(
      0,
      0,
      qrFilteredLocations.length
    );

    return;

  }


  qrLocationTableBody.innerHTML =
    "";


  pageItems.forEach(
    item => {

      const tr =
        document.createElement(
          "tr"
        );


      /*
       * CHECKBOX
       */

      const checkTd =
        document.createElement(
          "td"
        );


      checkTd.className =
        "qr-col-check";


      const checkbox =
        document.createElement(
          "input"
        );


      checkbox.type =
        "checkbox";


      checkbox.className =
        "qr-row-checkbox";


      checkbox.dataset.pointId =
        item.pointId;


      checkbox.checked =
        qrSelectedPointIds.has(
          item.pointId
        );


      checkbox.addEventListener(
        "change",
        () => {

          if (
            checkbox.checked
          ) {

            qrSelectedPointIds.add(
              item.pointId
            );

          } else {

            qrSelectedPointIds.delete(
              item.pointId
            );

          }


          updateQrSummary();

          updateSelectAllState();

        }
      );


      checkTd.appendChild(
        checkbox
      );


      tr.appendChild(
        checkTd
      );


      /*
       * POINT
       */

      tr.appendChild(
        createQrCell(
          item.pointId,
          "qr-col-point"
        )
      );


      /*
       * ZONE
       */

      tr.appendChild(
        createQrCell(
          item.zone,
          "qr-col-zone"
        )
      );


      /*
       * LOCATION
       */

      tr.appendChild(
        createQrCell(
          item.location,
          "qr-col-location"
        )
      );


      /*
       * STATUS
       */

      const statusTd =
        document.createElement(
          "td"
        );


      statusTd.className =
        "qr-col-status";


      const statusSpan =
        document.createElement(
          "span"
        );


      statusSpan.className =
        item.active
          ? "qr-status-active"
          : "qr-status-inactive";


      statusSpan.textContent =
        item.active
          ? "Active"
          : "Inactive";


      statusTd.appendChild(
        statusSpan
      );


      tr.appendChild(
        statusTd
      );


      /*
       * QR
       */

      const qrTd =
        document.createElement(
          "td"
        );


      qrTd.className =
        "qr-col-qr";


      qrTd.textContent =
        item.hasQr
          ? "มี QR"
          : "ยังไม่มี QR";


      tr.appendChild(
        qrTd
      );


      /*
       * ACTION
       */

      const actionTd =
        document.createElement(
          "td"
        );


      actionTd.className =
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
        item.hasQr
          ? "📱 QR"
          : "📱 สร้าง";


      actionButton.addEventListener(
        "click",
        () => {

          generateQrPreview(
            [item]
          );

        }
      );


      actionTd.appendChild(
        actionButton
      );


      tr.appendChild(
        actionTd
      );


      qrLocationTableBody.appendChild(
        tr
      );

    }
  );


  updatePaginationInfo(
    start + 1,
    Math.min(
      end,
      qrFilteredLocations.length
    ),
    qrFilteredLocations.length
  );

}


// ==================================================
// CREATE TABLE CELL
// ==================================================

function createQrCell(
  value,
  className
) {

  const td =
    document.createElement(
      "td"
    );


  td.className =
    className;


  td.textContent =
    qrValue(value);


  return td;

}


// ==================================================
// EMPTY TABLE
// ==================================================

function renderQrTableEmpty(
  message
) {

  if (!qrLocationTableBody) {

    return;

  }


  qrLocationTableBody.innerHTML =
    "";


  const tr =
    document.createElement(
      "tr"
    );


  const td =
    document.createElement(
      "td"
    );


  td.colSpan =
    7;


  td.className =
    "qr-table-loading";


  td.textContent =
    message;


  tr.appendChild(
    td
  );


  qrLocationTableBody.appendChild(
    tr
  );


}


// ==================================================
// PAGINATION INFO
// ==================================================

function updatePaginationInfo(
  start,
  end,
  total
) {

  if (!qrPaginationInfo) {

    return;

  }


  if (total === 0) {

    qrPaginationInfo.textContent =
      "0 รายการ";

    return;

  }


  qrPaginationInfo.textContent =
    `${start}-${end} จาก ${total} รายการ`;

}


// ==================================================
// PAGINATION
// ==================================================

function renderQrPagination() {

  if (!qrPagination) {

    return;

  }


  qrPagination.innerHTML =
    "";


  const totalPages =
    Math.ceil(
      qrFilteredLocations.length /
      qrPageSize
    );


  if (
    totalPages <= 1
  ) {

    return;

  }


  /*
   * PREVIOUS
   */

  const previousButton =
    createPaginationButton(
      "‹",
      qrCurrentPage > 1
    );


  previousButton.addEventListener(
    "click",
    () => {

      if (
        qrCurrentPage <= 1
      ) {

        return;

      }


      qrCurrentPage--;

      renderQrTable();

      renderQrPagination();

      updateSelectAllState();

    }
  );


  qrPagination.appendChild(
    previousButton
  );


  /*
   * PAGE BUTTONS
   */

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    /*
     * ไม่แสดงทุกหน้าถ้ามีจำนวนมาก
     */

    if (
      totalPages > 10 &&
      page !== 1 &&
      page !== totalPages &&
      Math.abs(
        page -
        qrCurrentPage
      ) > 2
    ) {

      continue;

    }


    const button =
      createPaginationButton(
        page,
        true
      );


    if (
      page === qrCurrentPage
    ) {

      button.classList.add(
        "active"
      );

    }


    button.addEventListener(
      "click",
      () => {

        qrCurrentPage =
          page;

        renderQrTable();

        renderQrPagination();

        updateSelectAllState();

      }
    );


    qrPagination.appendChild(
      button
    );

  }


  /*
   * NEXT
   */

  const nextButton =
    createPaginationButton(
      "›",
      qrCurrentPage < totalPages
    );


  nextButton.addEventListener(
    "click",
    () => {

      if (
        qrCurrentPage >=
        totalPages
      ) {

        return;

      }


      qrCurrentPage++;

      renderQrTable();

      renderQrPagination();

      updateSelectAllState();

    }
  );


  qrPagination.appendChild(
    nextButton
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


  button.disabled =
    !enabled;


  return button;

}


// ==================================================
// SELECT ALL CURRENT PAGE
// ==================================================

function updateSelectAllState() {

  if (!selectAllQrCheckbox) {

    return;

  }


  const start =
    (
      qrCurrentPage -
      1
    ) *
    qrPageSize;


  const end =
    start +
    qrPageSize;


  const pageItems =
    qrFilteredLocations.slice(
      start,
      end
    );


  if (
    pageItems.length === 0
  ) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      false;

    return;

  }


  const selectedCount =
    pageItems.filter(
      item =>
        qrSelectedPointIds.has(
          item.pointId
        )
    ).length;


  selectAllQrCheckbox.checked =
    selectedCount ===
    pageItems.length;


  selectAllQrCheckbox.indeterminate =
    selectedCount > 0 &&
    selectedCount <
    pageItems.length;

}


// ==================================================
// SELECT ALL EVENT
// ==================================================

function handleSelectAllQr() {

  const start =
    (
      qrCurrentPage -
      1
    ) *
    qrPageSize;


  const end =
    start +
    qrPageSize;


  const pageItems =
    qrFilteredLocations.slice(
      start,
      end
    );


  if (
    selectAllQrCheckbox.checked
  ) {

    pageItems.forEach(
      item => {

        qrSelectedPointIds.add(
          item.pointId
        );

      }
    );

  } else {

    pageItems.forEach(
      item => {

        qrSelectedPointIds.delete(
          item.pointId
        );

      }
    );

  }


  renderQrTable();

  updateQrSummary();

  updateSelectAllState();

}


// ==================================================
// CLEAR ALL SELECTION
// ==================================================

function clearAllQrSelection() {

  qrSelectedPointIds.clear();


  renderQrTable();

  updateQrSummary();

  updateSelectAllState();

}


// ==================================================
// GET SELECTED LOCATIONS
// ==================================================

function getSelectedQrLocations() {

  return qrLocations.filter(
    item =>
      qrSelectedPointIds.has(
        item.pointId
      )
  );

}


// ==================================================
// GENERATE QR
// ==================================================

function generateQrPreview(
  locations
) {

  if (!qrPreviewGrid) {

    return;

  }


  if (
    !Array.isArray(locations) ||
    locations.length === 0
  ) {

    return;

  }


  qrPreviewGrid.innerHTML =
    "";


  locations.forEach(
    item => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "qr-preview-card";


      /*
       * HEADER
       */

      const title =
        document.createElement(
          "div"
        );


      title.className =
        "qr-preview-title";


      title.textContent =
        item.location ||
        item.pointId;


      card.appendChild(
        title
      );


      /*
       * ZONE
       */

      const zone =
        document.createElement(
          "div"
        );


      zone.className =
        "qr-preview-zone";


      zone.textContent =
        `${item.zone} | ${item.pointId}`;


      card.appendChild(
        zone
      );


      /*
       * QR CONTAINER
       */

      const qrContainer =
        document.createElement(
          "div"
        );


      qrContainer.className =
        "qr-preview-code";


      card.appendChild(
        qrContainer
      );


      qrPreviewGrid.appendChild(
        card
      );


      /*
       * QR URL
       *
       * QR จะเปิด index.html
       * พร้อม pointId
       */

      const qrUrl =
        buildQrUrl(
          item.pointId
        );


      if (
        typeof QRCode ===
        "undefined"
      ) {

        qrContainer.textContent =
          "ไม่พบ QR Code Library";

        return;

      }


      new QRCode(
        qrContainer,
        {

          text:
            qrUrl,

          width:
            180,

          height:
            180,

          correctLevel:
            QRCode.CorrectLevel.H

        }
      );

    }
  );


  if (qrPreviewCount) {

    qrPreviewCount.textContent =
      `${locations.length} จุด`;

  }


  console.log(
    "⚡ GGN QR Preview:",
    locations
  );

}


// ==================================================
// BUILD QR URL
// ==================================================

// ==================================================
// BUILD QR URL
//
// หน้าที่:
// - สร้าง URL สำหรับ QR Code
// - QR ต้องเปิดหน้า index.html
// - ใช้ pointId เป็นตัวระบุจุดตรวจ
//
// ตัวอย่าง:
//
// https://pejoyapcy.github.io/GGN-Check-in-testcase/index.html?pointId=CM1_001
//
// IMPORTANT:
// - ไม่ใช้ URL ของ qr.html
// - ไม่ใช้ pathname ของ qr.html โดยตรง
// - ใช้ตำแหน่งของไฟล์ปัจจุบันเป็นฐาน
// - บังคับปลายทางเป็น index.html
// ==================================================

function buildQrUrl(pointId) {

  const cleanPointId =
    qrValue(pointId);

  if (!cleanPointId) {

    return "";

  }


  // ==================================================
  // สร้าง URL ไปยัง index.html
  //
  // ถ้าอยู่ที่:
  // /GGN-Check-in-testcase/qr.html
  //
  // จะได้:
  // /GGN-Check-in-testcase/index.html
  // ==================================================

  const url =
    new URL(
      "./index.html",
      window.location.href
    );


  // ==================================================
  // ใส่ Point ID
  // ==================================================

  url.searchParams.set(
    "pointId",
    cleanPointId
  );


  // ==================================================
  // คืน URL เต็ม
  // ==================================================

  return url.href;

}


// ==================================================
// CREATE QR SELECTED
// ==================================================

function handleCreateQr() {

  const selected =
    getSelectedQrLocations();


  if (
    selected.length === 0
  ) {

    return;

  }


  generateQrPreview(
    selected
  );

}


// ==================================================
// PRINT SELECTED
// ==================================================

function handlePrintSelectedQr() {

  const selected =
    getSelectedQrLocations();


  if (
    selected.length === 0
  ) {

    return;

  }


  preparePrint(
    selected
  );


  window.print();

}


// ==================================================
// PRINT ALL
// ==================================================

function handlePrintAllQr() {

  if (
    qrLocations.length === 0
  ) {

    return;

  }


  preparePrint(
    qrLocations
  );


  window.print();

}


// ==================================================
// PREPARE PRINT
// ==================================================

function preparePrint(
  locations
) {

  if (!qrPrintArea) {

    return;

  }


  qrPrintArea.innerHTML =
    "";


  locations.forEach(
    item => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "qr-print-card";


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "qr-print-title";


      title.textContent =
        item.location ||
        item.pointId;


      card.appendChild(
        title
      );


      const zone =
        document.createElement(
          "div"
        );


      zone.className =
        "qr-print-zone";


      zone.textContent =
        item.zone;


      card.appendChild(
        zone
      );


      const point =
        document.createElement(
          "div"
        );


      point.className =
        "qr-print-point";


      point.textContent =
        item.pointId;


      card.appendChild(
        point
      );


      const qr =
        document.createElement(
          "div"
        );


      qr.className =
        "qr-print-code";


      card.appendChild(
        qr
      );


      qrPrintArea.appendChild(
        card
      );


      if (
        typeof QRCode !==
        "undefined"
      ) {

        new QRCode(
          qr,
          {

            text:
              buildQrUrl(
                item.pointId
              ),

            width:
              300,

            height:
              300,

            correctLevel:
              QRCode.CorrectLevel.H

          }
        );

      }

    }
  );

}


// ==================================================
// CLEAR FILTER
// ==================================================

function clearQrFilters() {

  qrSearchKeyword =
    "";


  qrZoneFilter =
    "";


  qrStatusFilter =
    "";


  qrExistFilter =
    "";


  qrCurrentPage =
    1;


  if (qrSearchInput) {

    qrSearchInput.value =
      "";

  }


  if (qrZoneFilterElement) {

    qrZoneFilterElement.value =
      "";

  }


  if (qrStatusFilterElement) {

    qrStatusFilterElement.value =
      "";

  }


  if (qrExistFilterElement) {

    qrExistFilterElement.value =
      "";

  }


  applyQrFilters();

}


// ==================================================
// SEARCH EVENT
// ==================================================

function handleQrSearch(
  event
) {

  qrSearchKeyword =
    event.target.value;


  qrCurrentPage =
    1;


  applyQrFilters();

}


// ==================================================
// ZONE FILTER EVENT
// ==================================================

function handleQrZoneFilter(
  event
) {

  qrZoneFilter =
    event.target.value;


  qrCurrentPage =
    1;


  applyQrFilters();

}


// ==================================================
// STATUS FILTER EVENT
// ==================================================

function handleQrStatusFilter(
  event
) {

  qrStatusFilter =
    event.target.value;


  qrCurrentPage =
    1;


  applyQrFilters();

}


// ==================================================
// QR FILTER EVENT
// ==================================================

function handleQrExistFilter(
  event
) {

  qrExistFilter =
    event.target.value;


  qrCurrentPage =
    1;


  applyQrFilters();

}


// ==================================================
// PAGE SIZE
// ==================================================

function handleQrPageSize(
  event
) {

  qrPageSize =
    Number(
      event.target.value
    ) || 25;


  qrCurrentPage =
    1;


  applyQrFilters();

}


// ==================================================
// BIND EVENTS
// ==================================================

function bindQrEvents() {

  if (qrSearchInput) {

    qrSearchInput.addEventListener(
      "input",
      handleQrSearch
    );

  }


  if (qrZoneFilterElement) {

    qrZoneFilterElement.addEventListener(
      "change",
      handleQrZoneFilter
    );

  }


  if (qrStatusFilterElement) {

    qrStatusFilterElement.addEventListener(
      "change",
      handleQrStatusFilter
    );

  }


  if (qrExistFilterElement) {

    qrExistFilterElement.addEventListener(
      "change",
      handleQrExistFilter
    );

  }


  if (clearQrFilterBtn) {

    clearQrFilterBtn.addEventListener(
      "click",
      clearQrFilters
    );

  }


  if (selectAllQrCheckbox) {

    selectAllQrCheckbox.addEventListener(
      "change",
      handleSelectAllQr
    );

  }


  if (qrPageSizeElement) {

    qrPageSizeElement.addEventListener(
      "change",
      handleQrPageSize
    );

  }


  if (clearAllQrBtn) {

    clearAllQrBtn.addEventListener(
      "click",
      clearAllQrSelection
    );

  }


  if (createQrBtn) {

    createQrBtn.addEventListener(
      "click",
      handleCreateQr
    );

  }


  if (printSelectedQrBtn) {

    printSelectedQrBtn.addEventListener(
      "click",
      handlePrintSelectedQr
    );

  }


  if (printAllQrBtn) {

    printAllQrBtn.addEventListener(
      "click",
      handlePrintAllQr
    );

  }


  if (refreshQrBtn) {

    refreshQrBtn.addEventListener(
      "click",
      loadQrManagementData
    );

  }

}


// ==================================================
// INITIALIZE QR MANAGEMENT
// ==================================================

async function initializeQrManagement() {

  console.log(
    "⚡ GGN QR Management Initialize"
  );


  bindQrEvents();

  updateQrSummary();

  await loadQrManagementData();

}


// ==================================================
// START
// ==================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeQrManagement
  );

} else {

  initializeQrManagement();

}