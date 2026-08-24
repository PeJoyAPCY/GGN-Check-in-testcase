// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 1.0
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - แสดงรายการจุดตรวจ
// - เลือกจุด
// - เลือกทั้งหมด / ยกเลิกทั้งหมด
// - เตรียมระบบสร้าง QR
// - เตรียมระบบพิมพ์ QR
//
// IMPORTANT:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ Dashboard
// - ยังไม่สร้าง QR จริงใน Version นี้
// ==================================================


// ==================================================
// ELEMENTS
// ==================================================

const qrStatus =
  getElement("qrStatus");


const qrLocationList =
  getElement("qrLocationList");


const qrLoading =
  getElement("qrLoading");


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

let qrLocations = [];

let selectedPointIds = new Set();


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


    /*
     * ---------------------------------------------
     * ล้างรายการที่เลือก
     *
     * เพราะข้อมูลถูกโหลดใหม่
     * ---------------------------------------------
     */

    selectedPointIds.clear();


    /*
     * ---------------------------------------------
     * Render
     * ---------------------------------------------
     */

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


    selectedPointIds.clear();


    renderQRLocations(
      []
    );


    updateQRSummary();


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

    `<div
      id="qrLoading"
      class="qr-empty-state"
    >
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


  /*
   * ---------------------------------------------
   * สร้าง Header
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


  /*
   * ---------------------------------------------
   * Location Grid
   * ---------------------------------------------
   */

  const grid =
    document.createElement(
      "div"
    );


  grid.className =
    "qr-location-grid";


  locations.forEach(
    function(location) {

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


  /*
   * ---------------------------------------------
   * Active / Inactive
   * ---------------------------------------------
   */

  const isActive =
    location.active === true;


  card.classList.add(
    isActive
      ? "qr-location-active"
      : "qr-location-inactive"
  );


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
    location.pointId || "";


  checkbox.checked =
    selectedPointIds.has(
      location.pointId
    );


  checkbox.disabled =
    !isActive;


  checkbox.addEventListener(
    "change",
    function() {

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
   * POINT HEADER
   * ---------------------------------------------
   */

  const header =
    document.createElement(
      "div"
    );


  header.className =
    "qr-location-header";


  const pointId =
    document.createElement(
      "strong"
    );


  pointId.className =
    "qr-location-point-id";


  pointId.textContent =
    location.pointId ||
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
    pointId
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
    isActive
      ? "📱 พร้อมสร้าง QR Code"
      : "⛔ จุดนี้ถูกปิดใช้งาน";


  card.appendChild(
    qrInfo
  );


  /*
   * ---------------------------------------------
   * CLICK CARD
   *
   * คลิกบริเวณ Card เพื่อเลือกได้
   * แต่ไม่ทำงานถ้าคลิก checkbox โดยตรง
   * ---------------------------------------------
   */

  card.addEventListener(
    "click",
    function(event) {

      if (
        event.target === checkbox
      ) {

        return;

      }


      if (!isActive) {

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
    function(checkbox) {

      checkbox.checked =
        selectedPointIds.has(
          checkbox.value
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

        return (
          location.active === true
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
   * ปรับสถานะปุ่ม
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
// ==================================================

function selectAllQR() {

  qrLocations.forEach(
    function(location) {

      if (
        location.active === true &&
        location.pointId
      ) {

        selectedPointIds.add(
          String(
            location.pointId
          ).trim()
        );

      }

    }
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

  selectedPointIds.clear();


  updateQRCheckboxes();

  updateQRSummary();


  clearQRPreview();


  setQRStatus(
    "⬜ ยกเลิกการเลือกทั้งหมดแล้ว"
  );

}


// ==================================================
// CREATE QR
//
// Version 1:
// ยังไม่สร้าง QR จริง
// ---------------------------------------------
// ฟังก์ชันนี้เตรียมไว้สำหรับ QR Generator
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


  console.log(
    "Selected QR Locations:",
    selectedLocations
  );


  /*
   * ---------------------------------------------
   * Version 1
   * ---------------------------------------------
   *
   * ยังไม่สร้าง QR จริง
   *
   * ขั้นต่อไปจะนำ:
   *
   * pointId
   * zone
   * location
   *
   * ไปสร้าง QR URL
   *
   * เช่น:
   *
   * https://.../index.html?pointId=P001
   *
   * ---------------------------------------------
   */


  renderQRPreviewPlaceholder(
    selectedLocations
  );


  setQRStatus(
    `📱 เตรียมสร้าง QR สำหรับ ${selectedLocations.length} จุดแล้ว`
  );

}


// ==================================================
// GET SELECTED LOCATIONS
// ==================================================

function getSelectedLocations() {

  return qrLocations.filter(
    function(location) {

      return selectedPointIds.has(
        String(
          location.pointId ||
          ""
        ).trim()
      );

    }
  );

}


// ==================================================
// RENDER QR PREVIEW PLACEHOLDER
//
// ยังไม่ใช่ QR จริง
// ==================================================

function renderQRPreviewPlaceholder(
  locations
) {

  if (!qrPreviewGrid) {

    return;

  }


  qrPreviewGrid.innerHTML =
    "";


  locations.forEach(
    function(location) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "qr-preview-card";


      /*
       * QR PLACEHOLDER
       */

      const qrBox =
        document.createElement(
          "div"
        );


      qrBox.className =
        "qr-placeholder";


      qrBox.textContent =
        "QR";


      /*
       * POINT ID
       */

      const pointId =
        document.createElement(
          "div"
        );


      pointId.className =
        "qr-preview-point-id";


      pointId.textContent =
        location.pointId ||
        "-";


      /*
       * LOCATION
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
       * ZONE
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
        pointId
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
// Version 1:
// ยังไม่สั่งพิมพ์จริง
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


  console.log(
    "Print Selected QR:",
    selectedLocations
  );


  setQRStatus(
    `🖨️ เตรียมพิมพ์ ${selectedLocations.length} จุด`
  );

}


// ==================================================
// PRINT ALL
//
// Version 1:
// พิมพ์เฉพาะ Active
// ==================================================

function printAllQR() {

  const activeLocations =
    qrLocations.filter(
      function(location) {

        return (
          location.active === true
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


  /*
   * เลือก Active ทั้งหมด
   */

  selectedPointIds.clear();


  activeLocations.forEach(
    function(location) {

      if (
        location.pointId
      ) {

        selectedPointIds.add(
          String(
            location.pointId
          ).trim()
        );

      }

    }
  );


  updateQRCheckboxes();

  updateQRSummary();


  renderQRPreviewPlaceholder(
    activeLocations
  );


  setQRStatus(
    `🖨️ เตรียมพิมพ์จุด Active ทั้งหมด ${activeLocations.length} จุด`
  );


  console.log(
    "Print All QR:",
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
// SELECT ALL BUTTON
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
// CLEAR ALL BUTTON
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
// CREATE QR BUTTON
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
// PRINT SELECTED BUTTON
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
// PRINT ALL BUTTON
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

if (
  currentPage === "qr.html"
) {

  loadQRManagement();

}