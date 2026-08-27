// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 3.1
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - แสดงรายการจุดตรวจ
// - เลือกจุด
// - เลือกทั้งหมด / ยกเลิกทั้งหมด
// - สร้าง QR Code จาก pointId
// - แสดง QR Preview
// - พิมพ์ QR Card จริง
// - A4 Portrait
// - 3 คอลัมน์ × 3 แถว
// - Card ขนาด 57 × 88 mm
// - QR Code ขนาดใหญ่
//
// STRUCTURE:
// - zone     = เขต
// - location = จุดตรวจ
// - pointId  = ข้อมูลภายใน QR
//
// IMPORTANT:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ไม่แก้ Backend
// - ไม่แก้ API
// - QR Management ทำงานเฉพาะ qr.html
// - QR Data = pointId
// - PRINT ใช้ Preview Card ตัวจริง
// - ไม่ใช้ html2canvas
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

const QR_CARD_WIDTH_MM = 57;
const QR_CARD_HEIGHT_MM = 88;

const QR_PAGE_COLUMNS = 3;
const QR_PAGE_ROWS = 3;

const QR_CARDS_PER_PAGE =
  QR_PAGE_COLUMNS *
  QR_PAGE_ROWS;

const QR_CODE_SIZE_PX = 180;


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
// PRINT STATE
// ==================================================

let qrPrintState = {

  active:
    false,

  originalParent:
    null,

  originalNextSibling:
    null,

  printRoot:
    null

};


// ==================================================
// PRINT STYLE
//
// สร้าง CSS สำหรับการพิมพ์โดยตรง
// ไม่พึ่ง html2canvas
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

    /* =========================================
       GGN QR PRINT
       A4 Portrait
       3 × 3
       Card 57 × 88 mm
       ========================================= */

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

        height: 297mm !important;

        margin: 0 !important;

        padding: 0 !important;

        background: #fff !important;

        overflow: hidden !important;

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


      .qr-preview-card {

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


      .qr-preview-code {

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


      .qr-preview-code canvas,
      .qr-preview-code img {

        display: block !important;

        width: 46mm !important;

        height: 46mm !important;

        max-width: 46mm !important;

        max-height: 46mm !important;

        object-fit: contain !important;

        image-rendering: auto !important;

      }


      .qr-preview-point-id {

        width: 100% !important;

        margin: 0 0 1.5mm 0 !important;

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


      .qr-preview-location {

        width: 100% !important;

        margin: 0 0 1.5mm 0 !important;

        padding: 0 !important;

        text-align: center !important;

        font-size: 3.4mm !important;

        line-height: 1.2 !important;

        font-weight: 600 !important;

        color: #000 !important;

        overflow: hidden !important;

        display: -webkit-box !important;

        -webkit-line-clamp: 2 !important;

        -webkit-box-orient: vertical !important;

      }


      .qr-preview-zone {

        width: 100% !important;

        margin: 0 !important;

        padding: 0 !important;

        text-align: center !important;

        font-size: 3.3mm !important;

        line-height: 1.15 !important;

        font-weight: 600 !important;

        color: #000 !important;

        white-space: nowrap !important;

        overflow: hidden !important;

        text-overflow: ellipsis !important;

      }


      .qr-empty-state {

        display: none !important;

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


    renderQRLocations(
      qrLocations
    );


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


    renderQRLocations(
      []
    );


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
// RENDER LOCATIONS
// ==================================================

function renderQRLocations(
  locations
) {

  if (!qrLocationList) {

    return;

  }


  qrLocationList.innerHTML =
    "";


  if (
    !Array.isArray(
      locations
    ) ||
    locations.length === 0
  ) {

    qrLocationList.innerHTML =

      `<div class="qr-empty-state">
        ⚪ ไม่พบข้อมูลจุดตรวจ
      </div>`;

    return;

  }


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
    `${locations.length} จุด`;


  listHeader.appendChild(
    headerTitle
  );


  listHeader.appendChild(
    headerCount
  );


  qrLocationList.appendChild(
    listHeader
  );


  const grid =
    document.createElement(
      "div"
    );


  grid.className =
    "qr-location-grid";


  locations.forEach(
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


  const qrInfo =
    document.createElement(
      "div"
    );


  qrInfo.className =
    "qr-location-info";


  qrInfo.textContent =
    isActive
      ? "📱 พร้อมสร้าง QR Code"
      : "⛔ จุดนี้ถูกปิดใช้งาน";


  card.appendChild(
    qrInfo
  );


  card.addEventListener(
    "click",
    function(event) {

      if (
        event.target === checkbox ||
        event.target.closest(
          ".qr-checkbox-wrapper"
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
// CREATE SINGLE QR CODE
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


  if (!pointId) {

    qrBox.textContent =
      "ไม่มี pointId";

    return false;

  }


  try {

    new QRCode(
      qrBox,
      {

        text:
          pointId,

        width:
          QR_CODE_SIZE_PX,

        height:
          QR_CODE_SIZE_PX,

        correctLevel:
          QRCode.CorrectLevel.H

      }
    );


    return true;

  } catch (error) {

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
//
// Card = 57 × 88 mm
//
// ภายใน:
// - QR Code ใหญ่
// - Point ID
// - Location
// - Zone
//
// QR DATA = pointId
// ==================================================

function renderQRPreview(
  locations
) {

  if (!qrPreviewGrid) {

    return;

  }


  injectQRPrintStyles();


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


      card.dataset.pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      // ==================================================
      // QR CODE
      // ==================================================

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

      const locationName =
        document.createElement(
          "div"
        );


      locationName.className =
        "qr-preview-location";


      locationName.textContent =
        location.location ||
        "-";


      locationName.title =
        location.location ||
        "-";


      // ==================================================
      // ZONE
      // ==================================================

      const zone =
        document.createElement(
          "div"
        );


      zone.className =
        "qr-preview-zone";


      zone.textContent =
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
        "pointId"

    }
  );

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
// WAIT FOR QR RENDER
//
// qrcodejs สร้าง canvas/img แบบ asynchronous
// บาง browser ต้องรอ DOM render ก่อน print
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
// CREATE PRINT ROOT
//
// ไม่ clone Card
// ใช้ Card ตัวจริงจาก Preview
//
// เหตุผล:
// - canvas QR จะไม่หาย
// - QR ที่เห็นใน Preview = QR ที่พิมพ์
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
    let pageIndex = 0;
    pageIndex < pageCount;
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
      let i = start;
      i < end;
      i++
    ) {

      page.appendChild(
        cards[i]
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
    cards.length === 0
  ) {

    return false;

  }


  const firstCard =
    cards[0];


  if (!firstCard) {

    return false;

  }


  injectQRPrintStyles();


  qrPrintState.originalParent =
    firstCard.parentNode;


  /*
   * Card ทุกใบอยู่ใน qrPreviewGrid
   * เก็บตำแหน่งเดิมของใบแรกไว้
   * เพื่อ restore หลังพิมพ์
   */

  qrPrintState.originalNextSibling =
    firstCard;


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
    !printRoot
  ) {

    qrPrintState =
      {

        active:
          false,

        originalParent:
          null,

        originalNextSibling:
          null,

        printRoot:
          null

      };

    return;

  }


  /*
   * ดึง Card กลับเข้า Preview Grid
   * โดยรักษาลำดับเดิม
   */

  const cards =
    Array.from(
      printRoot.querySelectorAll(
        ".qr-preview-card"
      )
    );


  if (
    qrPrintState.originalParent
  ) {

    cards.forEach(
      card => {

        qrPrintState.originalParent.appendChild(
          card
        );

      }
    );

  }


  printRoot.remove();


  qrPrintState =
    {

      active:
        false,

      originalParent:
        null,

      originalNextSibling:
        null,

      printRoot:
        null

    };


  console.log(
    "GGN QR: Print UI restored."
  );

}


// ==================================================
// PRINT CURRENT PREVIEW
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

    setQRStatus(
      "⚠️ ไม่มี QR สำหรับพิมพ์"
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


  /*
   * สร้าง Preview ก่อนเสมอ
   */

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


  /*
   * ตรวจว่า QR มีจริงทุกใบ
   */

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
    invalidCards.length > 0
  ) {

    setQRStatus(
      `❌ QR สร้างไม่สมบูรณ์ ${invalidCards.length} ใบ`
    );

    console.error(
      "GGN QR: Some QR cards have no rendered QR."
    );

    return;

  }


  try {

    const prepared =
      await prepareQRPrint(
        cards
      );


    if (!prepared) {

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
          pageCount

      }
    );


    /*
     * ให้ browser layout เสร็จก่อน
     */

    await waitForQRRender();


    window.print();


  } catch (error) {

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
    selectedLocations.length === 0
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
//
// เลือก Active ทั้งหมด
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

  if (!qrStatus) {

    return;

  }


  qrStatus.textContent =
    message;

}


// ==================================================
// PRINT EVENTS
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

injectQRPrintStyles();


loadQRManagement();


}