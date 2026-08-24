// ==================================================
// GGN CHECK-IN
// QR.JS
// Version 2.0
//
// หน้าที่:
// - QR Management
// - โหลดรายการจุดตรวจจาก API
// - แสดงรายการจุดตรวจ
// - เลือกจุด
// - เลือกทั้งหมด / ยกเลิกทั้งหมด
// - สร้าง QR Code จริงจาก pointId
// - แสดง QR Preview
// - เตรียมระบบพิมพ์ QR
//
// STRUCTURE:
// - zone     = เขต
// - location = จุดตรวจ
// - pointId  = ลำดับ / ตัวสร้าง QR
//
// IMPORTANT:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ Dashboard
// - QR Version 2.0 ใช้ pointId เป็นข้อมูลภายใน QR
// ==================================================


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

    `<div
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
   * HEADER
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
   * LOCATION GRID
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
   * ACTIVE / INACTIVE
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
    String(
      location.pointId || ""
    ).trim();


  checkbox.checked =
    selectedPointIds.has(
      checkbox.value
    );


  checkbox.disabled =
    !isActive ||
    !checkbox.value;


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
   * QR INFO
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
   * CARD CLICK
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
// ==================================================

function selectAllQR() {

  qrLocations.forEach(
    function(location) {

      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      if (
        location.active === true &&
        pointId
      ) {

        selectedPointIds.add(
          pointId
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
// Version 2:
// สร้าง QR จริงจาก pointId
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


  /*
   * ---------------------------------------------
   * ตรวจสอบ QR Generator
   * ---------------------------------------------
   */

  if (
    typeof QRCode === "undefined"
  ) {

    setQRStatus(
      "❌ ไม่พบ QR Generator กรุณาตรวจสอบ qrcodejs"
    );

    console.error(
      "QRCode library is not loaded."
    );

    return;

  }


  console.log(
    "Creating QR:",
    selectedLocations
  );


  /*
   * ---------------------------------------------
   * สร้าง QR จริง
   * ---------------------------------------------
   */

  renderQRPreview(
    selectedLocations
  );


  setQRStatus(
    `✅ สร้าง QR สำเร็จ ${selectedLocations.length} จุด`
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
        pointId &&
        selectedPointIds.has(
          pointId
        ) &&
        location.active === true
      );

    }
  );

}


// ==================================================
// RENDER QR PREVIEW
//
// QR DATA:
// pointId
//
// ตัวอย่าง:
// P001
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
    function(location) {

      /*
       * -------------------------------------------
       * CARD
       * -------------------------------------------
       */

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "qr-preview-card";


      /*
       * -------------------------------------------
       * QR CONTAINER
       * -------------------------------------------
       */

      const qrBox =
        document.createElement(
          "div"
        );


      qrBox.className =
        "qr-preview-code";


      /*
       * -------------------------------------------
       * CREATE QR
       *
       * QR DATA = pointId
       * -------------------------------------------
       */

      const pointId =
        String(
          location.pointId ||
          ""
        ).trim();


      try {

        new QRCode(
          qrBox,
          {
            text: pointId,
            width: 180,
            height: 180,
            correctLevel:
              QRCode.CorrectLevel.H
          }
        );

      } catch (error) {

        console.error(
          "QR creation error:",
          error
        );


        qrBox.textContent =
          "สร้าง QR ไม่สำเร็จ";

      }


      /*
       * -------------------------------------------
       * POINT ID
       * -------------------------------------------
       */

      const pointIdElement =
        document.createElement(
          "div"
        );


      pointIdElement.className =
        "qr-preview-point-id";


      pointIdElement.textContent =
        pointId;


      /*
       * -------------------------------------------
       * LOCATION
       * -------------------------------------------
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
       * -------------------------------------------
       * ZONE
       * -------------------------------------------
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
       * -------------------------------------------
       * APPEND
       * -------------------------------------------
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
// Version 2:
// เตรียมใช้ QR Preview
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
   * สร้าง QR ก่อนพิมพ์
   */

  renderQRPreview(
    selectedLocations
  );


  setQRStatus(
    `🖨️ เตรียมพิมพ์ ${selectedLocations.length} จุด`
  );


  console.log(
    "Print Selected QR:",
    selectedLocations
  );

}


// ==================================================
// PRINT ALL
//
// Version 2:
// เลือก Active ทั้งหมด
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


  /*
   * ---------------------------------------------
   * เลือก Active ทั้งหมด
   * ---------------------------------------------
   */

  selectedPointIds.clear();


  activeLocations.forEach(
    function(location) {

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


  updateQRCheckboxes();

  updateQRSummary();


  /*
   * ---------------------------------------------
   * สร้าง QR Preview
   * ---------------------------------------------
   */

  renderQRPreview(
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