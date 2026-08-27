// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 4.1
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - Search
// - Filter Zone
// - Filter Status
// - Filter QR
// - Pagination
// - Select Location
// - Select All
// - Clear All
// - สร้าง QR Code จาก pointId
// - QR Data = Check-in URL
// - แสดง QR Preview
// - พิมพ์ QR Card จริง
// - A4 Portrait
// - 3 คอลัมน์ × 3 แถว
// - Card ขนาด 57 × 88 mm
// - QR Code ขนาดใหญ่
//
// IMPORTANT:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ไม่แก้ Backend
// - ไม่แก้ API
// - QR Data = URL + pointId
// - Print ใช้ Print Snapshot
// - ไม่ใช้ html2canvas
// - ล็อกลำดับ Card ตอนพิมพ์
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
// CONSTANTS
// ==================================================

const QR_CARD_WIDTH_MM =
  57;

const QR_CARD_HEIGHT_MM =
  88;

const QR_PAGE_COLUMNS =
  3;

const QR_PAGE_ROWS =
  3;

const QR_CARDS_PER_PAGE =
  QR_PAGE_COLUMNS *
  QR_PAGE_ROWS;

const QR_CODE_SIZE_PX =
  180;


// ==================================================
// QR LINK
// ==================================================

const QR_BASE_URL =
  "https://pejoyapcy.github.io/GGN-Check-in-testcase/index.html";


// ==================================================
// ELEMENTS
// ==================================================

const qrStatus =
  getElement("qrStatus");


const qrLocationTableBody =
  getElement(
    "qrLocationTableBody"
  );


const qrTotalCount =
  getElement("qrTotalCount");


const qrActiveCount =
  getElement("qrActiveCount");


const qrHasQrCount =
  getElement("qrHasQrCount");


const qrSelectedCount =
  getElement("qrSelectedCount");


const qrPageTotal =
  getElement("qrPageTotal");


const qrPreviewGrid =
  getElement("qrPreviewGrid");


const qrPreviewCount =
  getElement("qrPreviewCount");


const createQrBtn =
  getElement("createQrBtn");


const printSelectedQrBtn =
  getElement("printSelectedQrBtn");


const printAllQrBtn =
  getElement("printAllQrBtn");


const clearAllQrBtn =
  getElement("clearAllQrBtn");


const refreshQrBtn =
  getElement("refreshQrBtn");


const selectAllQrCheckbox =
  getElement(
    "selectAllQrCheckbox"
  );


const qrSearchInput =
  getElement(
    "qrSearchInput"
  );


const qrZoneFilter =
  getElement(
    "qrZoneFilter"
  );


const qrStatusFilter =
  getElement(
    "qrStatusFilter"
  );


const qrExistFilter =
  getElement(
    "qrExistFilter"
  );


const clearQrFilterBtn =
  getElement(
    "clearQrFilterBtn"
  );


const qrPageSize =
  getElement(
    "qrPageSize"
  );


const qrPaginationInfo =
  getElement(
    "qrPaginationInfo"
  );


const qrPagination =
  getElement(
    "qrPagination"
  );


// ==================================================
// STATE
// ==================================================

let qrLocations =
  [];

let filteredQRLocations =
  [];

let selectedPointIds =
  new Set();

let currentQRPage =
  1;

let currentQRPageSize =
  qrPageSize
    ? Number(qrPageSize.value) || 25
    : 25;


// ==================================================
// PRINT STATE
// ==================================================

let qrPrintState = {

  active:
    false,

  printRoot:
    null

};


// ==================================================
// BUILD QR URL
// ==================================================

function buildQRUrl(
  pointId
) {

  const id =
    String(
      pointId ||
      ""
    ).trim();


  if (
    !id
  ) {

    return "";

  }


  return (
    QR_BASE_URL +
    "?pointId=" +
    encodeURIComponent(
      id
    )
  );

}


// ==================================================
// PRINT STYLE
// ==================================================

function injectQRPrintStyles() {

  if (
    document.getElementById(
      "ggnQrPrintStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "ggnQrPrintStyles";


  style.textContent = `

    @page {

      size: A4 portrait;

      margin: 0;

    }


    @media print {

      html,
      body {

        margin: 0 !important;

        padding: 0 !important;

        width: 210mm !important;

        min-width: 210mm !important;

        background: #fff !important;

      }


      body * {

        visibility: hidden !important;

      }


      #ggnQrPrintRoot,
      #ggnQrPrintRoot * {

        visibility: visible !important;

      }


      #ggnQrPrintRoot {

        position: absolute !important;

        left: 0 !important;

        top: 0 !important;

        width: 210mm !important;

        margin: 0 !important;

        padding: 0 !important;

        background: #fff !important;

        overflow: visible !important;

      }


      .ggn-qr-print-page {

        width: 210mm !important;

        height: 297mm !important;

        margin: 0 !important;

        padding: 0 !important;

        display: grid !important;

        grid-template-columns:
          57mm 57mm 57mm !important;

        grid-template-rows:
          88mm 88mm 88mm !important;

        column-gap: 0 !important;

        row-gap: 0 !important;

        justify-content: center !important;

        align-content: center !important;

        box-sizing: border-box !important;

        page-break-after: always !important;

        break-after: page !important;

      }


      .ggn-qr-print-page:last-child {

        page-break-after: auto !important;

        break-after: auto !important;

      }


      .ggn-qr-print-card {

        width: 57mm !important;

        height: 88mm !important;

        min-width: 57mm !important;

        max-width: 57mm !important;

        min-height: 88mm !important;

        max-height: 88mm !important;

        box-sizing: border-box !important;

        margin: 0 !important;

        padding: 3mm !important;

        overflow: hidden !important;

        display: flex !important;

        flex-direction: column !important;

        align-items: center !important;

        justify-content: flex-start !important;

        background: #fff !important;

        border: 0.35mm solid #000 !important;

        border-radius: 0 !important;

        box-shadow: none !important;

        break-inside: avoid !important;

        page-break-inside: avoid !important;

      }


      .ggn-qr-print-code {

        width: 46mm !important;

        height: 46mm !important;

        min-width: 46mm !important;

        min-height: 46mm !important;

        max-width: 46mm !important;

        max-height: 46mm !important;

        margin: 0 auto 2mm auto !important;

        padding: 0 !important;

        display: flex !important;

        align-items: center !important;

        justify-content: center !important;

        overflow: hidden !important;

      }


      .ggn-qr-print-code img,
      .ggn-qr-print-code canvas {

        display: block !important;

        width: 46mm !important;

        height: 46mm !important;

        min-width: 46mm !important;

        min-height: 46mm !important;

        max-width: 46mm !important;

        max-height: 46mm !important;

        object-fit: contain !important;

        image-rendering: auto !important;

      }


      .ggn-qr-print-point-id {

        width: 100% !important;

        margin: auto 0 0 0 !important;

        padding: 0 !important;

        text-align: center !important;

        font-size: 5mm !important;

        line-height: 1.05 !important;

        font-weight: 700 !important;

        color: #000 !important;

        white-space: nowrap !important;

        overflow: hidden !important;

        text-overflow: ellipsis !important;

      }


        .ggn-qr-print-location {

        width: 100% !important;

        margin: 0 0 1.5mm 0 !important;

        padding: 0 !important;

        text-align: center !important;

        font-size: 3.4mm !important;

        line-height: 1.25 !important;

        font-weight: 600 !important;

        color: #000 !important;

        overflow: hidden !important;

        display: -webkit-box !important;

        -webkit-line-clamp: 3 !important;

        -webkit-box-orient: vertical !important;

      }


        .ggn-qr-print-zone {

        width: 100% !important;

        margin: 0 0 1.5mm 0 !important;

        padding: 0 !important;

        text-align: center !important;

        font-size: 4mm !important;

        line-height: 1.15 !important;

        font-weight: 700 !important;

        color: #000 !important;

        white-space: nowrap !important;

        overflow: hidden !important;

        text-overflow: ellipsis !important;

      }


    }

  `;


  document.head.appendChild(
    style
  );

}


// ==================================================
// LOAD QR MANAGEMENT
// ==================================================

async function loadQRManagement() {

  if (
    !qrLocationTableBody
  ) {

    console.error(
      "GGN QR: ไม่พบ #qrLocationTableBody"
    );

    return;

  }


  setQRStatus(
    "⏳ กำลังโหลดรายการจุดตรวจ..."
  );


  showQRLoading();


  try {

    if (
      typeof GOOGLE_APPS_SCRIPT_URL ===
      "undefined" ||
      !GOOGLE_APPS_SCRIPT_URL
    ) {

      throw new Error(
        "ไม่พบ GOOGLE_APPS_SCRIPT_URL จาก app.js"
      );

    }


    const apiUrl =
      `${GOOGLE_APPS_SCRIPT_URL}` +
      `?action=qrManagement`;


    console.log(
      "GGN QR Management API Request:",
      apiUrl
    );


    const response =
      await fetch(
        apiUrl
      );


    if (
      !response.ok
    ) {

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


    selectedPointIds =
      new Set();


    currentQRPage =
      1;


    buildQRZoneFilter();


    applyQRFilters();


    clearQRPreview();


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


    qrLocations =
      [];

    filteredQRLocations =
      [];

    selectedPointIds =
      new Set();


    renderQRTable(
      []
    );


    updateQRSummary();


    updateQRPagination();


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

  if (
    !qrLocationTableBody
  ) {

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
// BUILD ZONE FILTER
// ==================================================

function buildQRZoneFilter() {

  if (
    !qrZoneFilter
  ) {

    return;

  }


  const currentValue =
    qrZoneFilter.value;


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

    );


  zones.sort(
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
      currentValue
    )
  ) {

    qrZoneFilter.value =
      currentValue;

  }

}


// ==================================================
// CHECK QR EXISTENCE
// ==================================================

function locationHasQR(
  location
) {

  if (
    typeof location.qrExists ===
    "boolean"
  ) {

    return location.qrExists;

  }


  if (
    typeof location.hasQr ===
    "boolean"
  ) {

    return location.hasQr;

  }


  if (
    typeof location.hasQR ===
    "boolean"
  ) {

    return location.hasQR;

  }


  if (
    typeof location.qr ===
    "boolean"
  ) {

    return location.qr;

  }


  if (
    typeof location.qrCode ===
    "boolean"
  ) {

    return location.qrCode;

  }


  const pointId =
    String(
      location.pointId ||
      ""
    ).trim();


  return pointId !== "";

}


// ==================================================
// APPLY FILTERS
// ==================================================

function applyQRFilters() {

  const keyword =
    qrSearchInput
      ? String(
          qrSearchInput.value ||
          ""
        )
        .trim()
        .toLowerCase()
      : "";


  const zone =
    qrZoneFilter
      ? String(
          qrZoneFilter.value ||
          ""
        ).trim()
      : "";


  const status =
    qrStatusFilter
      ? String(
          qrStatusFilter.value ||
          ""
        ).trim()
      : "";


  const qrExist =
    qrExistFilter
      ? String(
          qrExistFilter.value ||
          ""
        ).trim()
      : "";


  filteredQRLocations =
    qrLocations.filter(
      location => {

        const pointId =
          String(
            location.pointId ||
            ""
          ).trim();


        const locationName =
          String(
            location.location ||
            ""
          ).trim();


        const locationZone =
          String(
            location.zone ||
            ""
          ).trim();


        const active =
          location.active === true;


        const hasQR =
          locationHasQR(
            location
          );


        if (
          keyword
        ) {

          const searchText =
            [

              pointId,

              locationName,

              locationZone

            ]

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


        if (
          zone &&
          locationZone !== zone
        ) {

          return false;

        }


        if (
          status === "active" &&
          !active
        ) {

          return false;

        }


        if (
          status === "inactive" &&
          active
        ) {

          return false;

        }


        if (
          qrExist === "yes" &&
          !hasQR
        ) {

          return false;

        }


        if (
          qrExist === "no" &&
          hasQR
        ) {

          return false;

        }


        return true;

      }
    );


  currentQRPage =
    1;


  renderQRTable(
    filteredQRLocations
  );


  updateQRSummary();


  updateQRPagination();


  updateSelectAllCheckbox();

}


// ==================================================
// RENDER QR TABLE
// ==================================================

function renderQRTable(
  locations
) {

  if (
    !qrLocationTableBody
  ) {

    return;

  }


  qrLocationTableBody.innerHTML =
    "";


  if (
    !Array.isArray(
      locations
    ) ||
    locations.length === 0
  ) {

    qrLocationTableBody.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="qr-table-loading"
        >
          ⚪ ไม่พบข้อมูลจุดตรวจ
        </td>

      </tr>

    `;

    return;

  }


  const start =
    (
      currentQRPage -
      1
    ) *
    currentQRPageSize;


  const end =
    Math.min(
      start +
      currentQRPageSize,
      locations.length
    );


  const pageLocations =
    locations.slice(
      start,
      end
    );


  pageLocations.forEach(
    location => {

      qrLocationTableBody.appendChild(
        createQRTableRow(
          location
        )
      );

    }
  );

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
      ""
    ).trim();


  const locationName =
    String(
      location.location ||
      ""
    ).trim();


  const active =
    location.active === true;


  const hasQR =
    locationHasQR(
      location
    );


  if (
    selectedPointIds.has(
      pointId
    )
  ) {

    row.classList.add(
      "qr-row-selected"
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
    selectedPointIds.has(
      pointId
    );


  checkbox.disabled =
    !active ||
    !pointId;


  checkbox.addEventListener(
    "change",
    function() {

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
  // POINT ID
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
    pointId ||
    "-";


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
    zone ||
    "-";


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
    locationName ||
    "-";


  row.appendChild(
    locationCell
  );


  // ==================================================
  // STATUS
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
    active
      ? "qr-status-active"
      : "qr-status-inactive";


  statusBadge.textContent =
    active
      ? "ACTIVE"
      : "INACTIVE";


  statusCell.appendChild(
    statusBadge
  );


  row.appendChild(
    statusCell
  );


  // ==================================================
  // QR
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
      ? "qr-exists"
      : "qr-not-exists";


  qrBadge.textContent =
    hasQR
      ? "มี QR"
      : "ไม่มี QR";


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
    "qr-row-action-button";


  actionButton.textContent =
    "📱 สร้าง QR";


  actionButton.disabled =
    !active ||
    !pointId;


  actionButton.addEventListener(
    "click",
    function(event) {

      event.stopPropagation();


      selectedPointIds =
        new Set([
          pointId
        ]);


      updateQRTableSelection();


      updateQRSummary();


      renderQRPreview([
        location
      ]);


      setQRStatus(
        `✅ สร้าง QR สำเร็จ: ${pointId}`
      );

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
        event.target.closest(
          "input"
        ) ||
        event.target.closest(
          "button"
        )
      ) {

        return;

      }


      if (
        !active ||
        !pointId
      ) {

        return;

      }


      const checked =
        !selectedPointIds.has(
          pointId
        );


      handleLocationSelection(
        location,
        checked
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
      location.pointId ||
      ""
    ).trim();


  if (
    !pointId
  ) {

    return;

  }


  if (
    location.active !== true
  ) {

    return;

  }


  if (
    selected
  ) {

    selectedPointIds.add(
      pointId
    );

  } else {

    selectedPointIds.delete(
      pointId
    );

  }


  updateQRTableSelection();


  updateQRSummary();


  updateSelectAllCheckbox();

}


// ==================================================
// UPDATE TABLE SELECTION
// ==================================================

function updateQRTableSelection() {

  if (
    !qrLocationTableBody
  ) {

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


      const row =
        checkbox.closest(
          "tr"
        );


      if (
        row
      ) {

        row.classList.toggle(
          "qr-row-selected",
          checkbox.checked
        );

      }

    }
  );

}


// ==================================================
// UPDATE SELECT ALL CHECKBOX
// ==================================================

function updateSelectAllCheckbox() {

  if (
    !selectAllQrCheckbox
  ) {

    return;

  }


  const activeFiltered =
    filteredQRLocations.filter(
      location =>
        location.active === true &&
        String(
          location.pointId ||
          ""
        ).trim() !== ""
    );


  if (
    activeFiltered.length === 0
  ) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      false;

    return;

  }


  const selectedCount =
    activeFiltered.filter(
      location =>
        selectedPointIds.has(
          String(
            location.pointId ||
            ""
          ).trim()
        )
    ).length;


  if (
    selectedCount ===
    0
  ) {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      false;

  } else if (
    selectedCount ===
    activeFiltered.length
  ) {

    selectAllQrCheckbox.checked =
      true;

    selectAllQrCheckbox.indeterminate =
      false;

  } else {

    selectAllQrCheckbox.checked =
      false;

    selectAllQrCheckbox.indeterminate =
      true;

  }

}


// ==================================================
// SELECT ALL
// ==================================================

function selectAllQR() {

  const activeLocations =
    filteredQRLocations.filter(
      location => {

        return (
          location.active === true &&
          String(
            location.pointId ||
            ""
          ).trim() !== ""
        );

      }
    );


  activeLocations.forEach(
    location => {

      selectedPointIds.add(
        String(
          location.pointId
        ).trim()
      );

    }
  );


  updateQRTableSelection();


  updateQRSummary();


  updateSelectAllCheckbox();


  setQRStatus(
    `☑️ เลือก Active ทั้งหมด ${activeLocations.length} จุด`
  );

}


// ==================================================
// CLEAR ALL
// ==================================================

function clearAllQR() {

  selectedPointIds =
    new Set();


  updateQRTableSelection();


  updateQRSummary();


  updateSelectAllCheckbox();


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


  const hasQR =
    qrLocations.filter(
      location =>
        locationHasQR(
          location
        )
    ).length;


  const selected =
    selectedPointIds.size;


  if (
    qrTotalCount
  ) {

    qrTotalCount.textContent =
      total;

  }


  if (
    qrActiveCount
  ) {

    qrActiveCount.textContent =
      active;

  }


  if (
    qrHasQrCount
  ) {

    qrHasQrCount.textContent =
      hasQR;

  }


  if (
    qrSelectedCount
  ) {

    qrSelectedCount.textContent =
      selected;

  }


  if (
    qrPageTotal
  ) {

    qrPageTotal.textContent =
      total;

  }


  if (
    qrPreviewCount
  ) {

    qrPreviewCount.textContent =
      `${selected} จุด`;

  }


  if (
    createQrBtn
  ) {

    createQrBtn.disabled =
      selected === 0;

  }


  if (
    printSelectedQrBtn
  ) {

    printSelectedQrBtn.disabled =
      selected === 0;

  }


  if (
    printAllQrBtn
  ) {

    printAllQrBtn.disabled =
      active === 0;

  }

}


// ==================================================
// UPDATE PAGINATION
// ==================================================

function updateQRPagination() {

  if (
    !qrPaginationInfo ||
    !qrPagination
  ) {

    return;

  }


  const total =
    filteredQRLocations.length;


  if (
    total === 0
  ) {

    qrPaginationInfo.textContent =
      "0 รายการ";


    qrPagination.innerHTML =
      "";


    return;

  }


  const totalPages =
    Math.ceil(
      total /
      currentQRPageSize
    );


  if (
    currentQRPage >
    totalPages
  ) {

    currentQRPage =
      totalPages;

  }


  const start =
    (
      currentQRPage -
      1
    ) *
    currentQRPageSize +
    1;


  const end =
    Math.min(
      currentQRPage *
      currentQRPageSize,
      total
    );


  qrPaginationInfo.textContent =
    `${start}-${end} จาก ${total} รายการ`;


  qrPagination.innerHTML =
    "";


  const previousButton =
    createPaginationButton(
      "‹",
      currentQRPage >
        1,
      function() {

        currentQRPage--;

        renderQRTable(
          filteredQRLocations
        );

        updateQRPagination();

        updateSelectAllCheckbox();

      }
    );


  qrPagination.appendChild(
    previousButton
  );


  const totalPagesToShow =
    Math.min(
      totalPages,
      7
    );


  let startPage =
    Math.max(
      1,
      currentQRPage -
        3
    );


  let endPage =
    Math.min(
      totalPages,
      startPage +
        totalPagesToShow -
        1
    );


  if (
    endPage -
    startPage +
    1 <
    totalPagesToShow
  ) {

    startPage =
      Math.max(
        1,
        endPage -
          totalPagesToShow +
          1
      );

  }


  for (
    let page =
      startPage;
    page <= endPage;
    page++
  ) {

    const button =
      createPaginationButton(
        String(page),
        true,
        function() {

          currentQRPage =
            page;


          renderQRTable(
            filteredQRLocations
          );


          updateQRPagination();


          updateSelectAllCheckbox();

        }
      );


    if (
      page ===
      currentQRPage
    ) {

      button.classList.add(
        "active"
      );

    }


    qrPagination.appendChild(
      button
    );

  }


  const nextButton =
    createPaginationButton(
      "›",
      currentQRPage <
        totalPages,
      function() {

        currentQRPage++;

        renderQRTable(
          filteredQRLocations
        );

        updateQRPagination();

        updateSelectAllCheckbox();

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
  enabled,
  handler
) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "qr-pagination-button";


  button.textContent =
    text;


  button.disabled =
    !enabled;


  if (
    enabled
  ) {

    button.addEventListener(
      "click",
      handler
    );

  }


  return button;

}


// ==================================================
// CREATE SELECTED QR
// ==================================================

function createSelectedQR() {

  const selectedLocations =
    getSelectedLocations();


  if (
    selectedLocations.length ===
    0
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
// CREATE QR NODE
// ==================================================

function createQRNode(
  qrBox,
  pointId
) {

  if (
    !qrBox
  ) {

    return false;

  }


  qrBox.innerHTML =
    "";


  if (
    !pointId
  ) {

    qrBox.textContent =
      "ไม่มี pointId";

    return false;

  }


  if (
    typeof QRCode ===
    "undefined"
  ) {

    qrBox.textContent =
      "ไม่พบ QR Generator";

    return false;

  }


  const qrUrl =
    buildQRUrl(
      pointId
    );


  if (
    !qrUrl
  ) {

    qrBox.textContent =
      "สร้าง URL ไม่สำเร็จ";

    return false;

  }


  try {

    new QRCode(
      qrBox,
      {

        text:
          qrUrl,

        width:
          QR_CODE_SIZE_PX,

        height:
          QR_CODE_SIZE_PX,

        correctLevel:
          QRCode.CorrectLevel.H

      }
    );


    qrBox.dataset.qrUrl =
      qrUrl;


    return true;


  } catch (
    error
  ) {

    console.error(
      "GGN QR creation error:",
      error
    );


    qrBox.textContent =
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

  if (
    !qrPreviewGrid
  ) {

    return;

  }


  injectQRPrintStyles();


  qrPreviewGrid.innerHTML =
    "";


  if (
    !Array.isArray(
      locations
    ) ||
    locations.length ===
    0
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


      card.dataset.pointId =
        pointId;


      // ==================================================
      // QR
      // ==================================================

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


      // ==================================================
      // POINT ID
      // ==================================================

      const pointIdElement =
        document.createElement(
          "div"
        );


      pointIdElement.className =
        "qr-preview-point-id";


      pointIdElement.textContent =
        pointId ||
        "-";


      // ==================================================
      // LOCATION
      // ==================================================

      const locationElement =
        document.createElement(
          "div"
        );


      locationElement.className =
        "qr-preview-location";


      locationElement.textContent =
        location.location ||
        "-";


      locationElement.title =
        location.location ||
        "-";


      // ==================================================
      // ZONE
      // ==================================================

      const zoneElement =
        document.createElement(
          "div"
        );


      zoneElement.className =
        "qr-preview-zone";


      zoneElement.textContent =
        location.zone ||
        "-";


      // ==================================================
      // APPEND
      // ==================================================

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


  if (
    qrPreviewCount
  ) {

    qrPreviewCount.textContent =
      `${locations.length} จุด`;

  }


  console.log(
    "GGN QR Preview:",
    {

      count:
        locations.length,

      cardWidth:
        `${QR_CARD_WIDTH_MM} mm`,

      cardHeight:
        `${QR_CARD_HEIGHT_MM} mm`,

      layout:
        "A4 Portrait 3 × 3",

      qrData:
        "URL + pointId",

      qrBaseUrl:
        QR_BASE_URL

    }
  );

}


// ==================================================
// CLEAR PREVIEW
// ==================================================

function clearQRPreview() {

  if (
    !qrPreviewGrid
  ) {

    return;

  }


  qrPreviewGrid.innerHTML = `

    <div class="qr-empty-state">

      ยังไม่มี QR Code

    </div>

  `;


  if (
    qrPreviewCount
  ) {

    qrPreviewCount.textContent =
      "0 จุด";

  }

}


// ==================================================
// WAIT FOR QR RENDER
// ==================================================

function waitForQRRender() {

  return new Promise(
    resolve => {

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

}


// ==================================================
// GET PREVIEW CARDS
// ==================================================

function getQRPreviewCards() {

  if (
    !qrPreviewGrid
  ) {

    return [];

  }


  return Array.from(
    qrPreviewGrid.querySelectorAll(
      ".qr-preview-card"
    )
  );

}


// ==================================================
// CREATE PRINT CARD SNAPSHOT
// ==================================================

function createQRPrintCardSnapshot(
  sourceCard,
  index
) {

  const printCard =
    document.createElement(
      "article"
    );


  printCard.className =
    "ggn-qr-print-card";


  printCard.dataset.pointId =
    sourceCard.dataset.pointId ||
    "";


  // ==================================================
  // LOCK GRID POSITION
  // ==================================================

  const column =
    (
      index %
      QR_PAGE_COLUMNS
    ) + 1;


  const row =
    (
      Math.floor(
        index /
        QR_PAGE_COLUMNS
      ) %
      QR_PAGE_ROWS
    ) + 1;


  printCard.style.gridColumn =
    String(
      column
    );


  printCard.style.gridRow =
    String(
      row
    );


  // ==================================================
  // QR
  // ==================================================

  const sourceQR =
    sourceCard.querySelector(
      ".qr-preview-code"
    );


  const printQR =
    document.createElement(
      "div"
    );


  printQR.className =
    "ggn-qr-print-code";


  if (
    sourceQR
  ) {

    const sourceCanvas =
      sourceQR.querySelector(
        "canvas"
      );


    const sourceImage =
      sourceQR.querySelector(
        "img"
      );


    if (
      sourceCanvas
    ) {

      try {

        const image =
          document.createElement(
            "img"
          );


        image.src =
          sourceCanvas.toDataURL(
            "image/png"
          );


        image.alt =
          "QR Code";


        printQR.appendChild(
          image
        );

      } catch (
        error
      ) {

        console.error(
          "GGN QR: Cannot snapshot canvas:",
          error
        );


        const canvas =
          sourceCanvas.cloneNode(
            true
          );


        printQR.appendChild(
          canvas
        );

      }

    } else if (
      sourceImage
    ) {

      const image =
        document.createElement(
          "img"
        );


      image.src =
        sourceImage.src;


      image.alt =
        "QR Code";


      printQR.appendChild(
        image
      );

    }

  }


  // ==================================================
  // POINT ID
  // ==================================================

  const sourcePointId =
    sourceCard.querySelector(
      ".qr-preview-point-id"
    );


  const pointId =
    document.createElement(
      "div"
    );


  pointId.className =
    "ggn-qr-print-point-id";


  pointId.textContent =
    sourcePointId
      ? sourcePointId.textContent
      : sourceCard.dataset.pointId ||
        "-";


  // ==================================================
  // LOCATION
  // ==================================================

  const sourceLocation =
    sourceCard.querySelector(
      ".qr-preview-location"
    );


  const location =
    document.createElement(
      "div"
    );


  location.className =
    "ggn-qr-print-location";


  location.textContent =
    sourceLocation
      ? sourceLocation.textContent
      : "-";


  // ==================================================
  // ZONE
  // ==================================================

  const sourceZone =
    sourceCard.querySelector(
      ".qr-preview-zone"
    );


  const zone =
    document.createElement(
      "div"
    );


  zone.className =
    "ggn-qr-print-zone";


  zone.textContent =
    sourceZone
      ? sourceZone.textContent
      : "-";


    // ==================================================
  // APPEND
  // ==================================================

  // 1. QR CODE — อยู่บนสุด
  printCard.appendChild(
    printQR
  );


  // 2. ZONE
  printCard.appendChild(
    zone
  );


  // 3. LOCATION
  printCard.appendChild(
    location
  );


  // 4. POINT ID — อยู่ล่างสุด
  printCard.appendChild(
    pointId
  );


  return printCard;

}


// ==================================================
// CREATE PRINT ROOT
// ==================================================

function createQRPrintRoot(
  cards
) {

  const printRoot =
    document.createElement(
      "div"
    );


  printRoot.id =
    "ggnQrPrintRoot";


  printRoot.setAttribute(
    "aria-hidden",
    "true"
  );


  const total =
    cards.length;


  const pageCount =
    Math.ceil(
      total /
      QR_CARDS_PER_PAGE
    );


  for (
    let pageIndex =
      0;
    pageIndex <
    pageCount;
    pageIndex++
  ) {

    const page =
      document.createElement(
        "section"
      );


    page.className =
      "ggn-qr-print-page";


    const start =
      pageIndex *
      QR_CARDS_PER_PAGE;


    const end =
      Math.min(
        start +
          QR_CARDS_PER_PAGE,
        total
      );


    for (
      let i =
        start;
      i <
      end;
      i++
    ) {

      const printIndex =
        i -
        start;


      const printCard =
        createQRPrintCardSnapshot(
          cards[i],
          printIndex
        );


      page.appendChild(
        printCard
      );

    }


    printRoot.appendChild(
      page
    );

  }


  document.body.appendChild(
    printRoot
  );


  return printRoot;

}


// ==================================================
// PREPARE PRINT
// ==================================================

async function prepareQRPrint(
  cards
) {

  if (
    qrPrintState.active
  ) {

    return false;

  }


  if (
    !cards ||
    cards.length ===
    0
  ) {

    return false;

  }


  injectQRPrintStyles();


  qrPrintState.active =
    true;


  qrPrintState.printRoot =
    createQRPrintRoot(
      cards
    );


  await waitForQRRender();


  return true;

}


// ==================================================
// RESTORE AFTER PRINT
// ==================================================

function restoreQRAfterPrint() {

  if (
    !qrPrintState.active
  ) {

    return;

  }


  const printRoot =
    qrPrintState.printRoot;


  if (
    printRoot &&
    printRoot.parentNode
  ) {

    printRoot.remove();

  }


  qrPrintState =
    {

      active:
        false,

      printRoot:
        null

    };


  console.log(
    "GGN QR: Print Snapshot removed. Preview remains unchanged."
  );

}


// ==================================================
// PRINT QR LOCATIONS
// ==================================================

async function printQRLocations(
  locations
) {

  if (
    !Array.isArray(
      locations
    ) ||
    locations.length ===
    0
  ) {

    setQRStatus(
      "⚠️ ไม่มี QR สำหรับพิมพ์"
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


  // ==================================================
  // CREATE PREVIEW FIRST
  // ==================================================

  renderQRPreview(
    locations
  );


  await waitForQRRender();


  const cards =
    getQRPreviewCards();


  if (
    cards.length !==
    locations.length
  ) {

    setQRStatus(
      "❌ จำนวน QR Preview ไม่ตรงกับรายการที่ต้องการพิมพ์"
    );


    console.error(
      "GGN QR: Preview card count mismatch",
      {

        expected:
          locations.length,

        actual:
          cards.length

      }
    );


    return;

  }


  // ==================================================
  // CHECK QR
  // ==================================================

  const invalidCards =
    cards.filter(
      card => {

        return (
          !card.querySelector(
            ".qr-preview-code canvas"
          ) &&
          !card.querySelector(
            ".qr-preview-code img"
          )
        );

      }
    );


  if (
    invalidCards.length >
    0
  ) {

    setQRStatus(
      `❌ QR สร้างไม่สมบูรณ์ ${invalidCards.length} ใบ`
    );


    console.error(
      "GGN QR: Some QR cards have no rendered QR."
    );


    return;

  }


  // ==================================================
  // PREPARE PRINT SNAPSHOT
  // ==================================================

  try {

    const prepared =
      await prepareQRPrint(
        cards
      );


    if (
      !prepared
    ) {

      throw new Error(
        "ไม่สามารถเตรียม Print Layout ได้"
      );

    }


    const pageCount =
      Math.ceil(
        locations.length /
        QR_CARDS_PER_PAGE
      );


    setQRStatus(
      `🖨️ กำลังเปิดหน้าพิมพ์ ${locations.length} ใบ / ${pageCount} หน้า`
    );


    console.log(
      "GGN QR Print:",
      {

        total:
          locations.length,

        cardSize:
          `${QR_CARD_WIDTH_MM} × ${QR_CARD_HEIGHT_MM} mm`,

        paper:
          "A4 Portrait",

        grid:
          "3 × 3",

        cardsPerPage:
          QR_CARDS_PER_PAGE,

        pages:
          pageCount,

        order:
          "DOM order locked by gridColumn/gridRow",

        qrData:
          "URL + pointId"

      }
    );


    await waitForQRRender();


    window.print();


  } catch (
    error
  ) {

    console.error(
      "GGN QR Print Error:",
      error
    );


    restoreQRAfterPrint();


    setQRStatus(
      "❌ พิมพ์ QR ไม่สำเร็จ" +
      (
        error.message
          ? `: ${error.message}`
          : ""
      )
    );

  }

}


// ==================================================
// PRINT SELECTED
// ==================================================

function printSelectedQR() {

  const selectedLocations =
    getSelectedLocations();


  if (
    selectedLocations.length ===
    0
  ) {

    setQRStatus(
      "⚠️ กรุณาเลือกจุดที่ต้องการพิมพ์"
    );

    return;

  }


  printQRLocations(
    selectedLocations
  );

}


// ==================================================
// PRINT ALL
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
          ).trim() !== ""
        );

      }
    );


  if (
    activeLocations.length ===
    0
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


  updateQRTableSelection();


  updateQRSummary();


  updateSelectAllCheckbox();


  printQRLocations(
    activeLocations
  );

}


// ==================================================
// SET STATUS
// ==================================================

function setQRStatus(
  message
) {

  if (
    !qrStatus
  ) {

    return;

  }


  qrStatus.textContent =
    message;

}


// ==================================================
// CLEAR FILTER
// ==================================================

function clearQRFilters() {

  if (
    qrSearchInput
  ) {

    qrSearchInput.value =
      "";

  }


  if (
    qrZoneFilter
  ) {

    qrZoneFilter.value =
      "";

  }


  if (
    qrStatusFilter
  ) {

    qrStatusFilter.value =
      "";

  }


  if (
    qrExistFilter
  ) {

    qrExistFilter.value =
      "";

  }


  currentQRPage =
    1;


  applyQRFilters();


  setQRStatus(
    "🔄 ล้างตัวกรองแล้ว"
  );

}


// ==================================================
// SEARCH EVENT
// ==================================================

if (
  qrSearchInput
) {

  qrSearchInput.addEventListener(
    "input",
    function() {

      applyQRFilters();

    }
  );

}


// ==================================================
// FILTER EVENTS
// ==================================================

if (
  qrZoneFilter
) {

  qrZoneFilter.addEventListener(
    "change",
    function() {

      applyQRFilters();

    }
  );

}


if (
  qrStatusFilter
) {

  qrStatusFilter.addEventListener(
    "change",
    function() {

      applyQRFilters();

    }
  );

}


if (
  qrExistFilter
) {

  qrExistFilter.addEventListener(
    "change",
    function() {

      applyQRFilters();

    }
  );

}


// ==================================================
// CLEAR FILTER EVENT
// ==================================================

if (
  clearQrFilterBtn
) {

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

if (
  qrPageSize
) {

  qrPageSize.addEventListener(
    "change",
    function() {

      currentQRPageSize =
        Number(
          qrPageSize.value
        ) || 25;


      currentQRPage =
        1;


      renderQRTable(
        filteredQRLocations
      );


      updateQRPagination();


      updateSelectAllCheckbox();

    }
  );

}


// ==================================================
// SELECT ALL CHECKBOX
// ==================================================

if (
  selectAllQrCheckbox
) {

  selectAllQrCheckbox.addEventListener(
    "change",
    function() {

      if (
        selectAllQrCheckbox.checked
      ) {

        selectAllQR();

      } else {

        clearAllQR();

      }

    }
  );

}


// ==================================================
// CLEAR ALL BUTTON
// ==================================================

if (
  clearAllQrBtn
) {

  clearAllQrBtn.addEventListener(
    "click",
    function() {

      clearAllQR();

    }
  );

}


// ==================================================
// CREATE QR BUTTON
// ==================================================

if (
  createQrBtn
) {

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

if (
  printSelectedQrBtn
) {

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

if (
  printAllQrBtn
) {

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

if (
  refreshQrBtn
) {

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

window.addEventListener(
  "afterprint",
  function() {

    restoreQRAfterPrint();


    setQRStatus(
      "✅ กลับสู่หน้า QR Management แล้ว"
    );

  }
);


// ==================================================
// START
// ==================================================

injectQRPrintStyles();


console.log(
  "=========================================="
);

console.log(
  "GGN QR Management V4.1 START"
);

console.log(
  "Current Page:",
  currentPage
);

console.log(
  "QR Table Body:",
  !!qrLocationTableBody
);

console.log(
  "API URL:",
  typeof GOOGLE_APPS_SCRIPT_URL !==
    "undefined"
    ? "OK"
    : "MISSING"
);

console.log(
  "QRCode Library:",
  typeof QRCode !==
    "undefined"
    ? "OK"
    : "MISSING"
);

console.log(
  "QR Base URL:",
  QR_BASE_URL
);

console.log(
  "=========================================="
);


loadQRManagement();


}