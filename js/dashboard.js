// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 4
//
// หน้าที่:
// - โหลด Dashboard จาก API
// - แสดง Summary
// - แสดงทุกจุดตรวจ
// - แบ่งกลุ่มตาม Zone
// - แสดงสถานะของแต่ละจุด
// - รีเฟรชข้อมูล
// - QR Management
// - โหลดรายการจุดสำหรับจัดการ QR
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ฐานข้อมูล
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - QR จริงและระบบพิมพ์จะพัฒนาขั้นถัดไป
// ==================================================


// ==================================================
// DASHBOARD ELEMENTS
// ==================================================

const dashboardStatus =
  getElement("dashboardStatus");


const dashboardSummary =
  getElement("dashboardSummary");


const dashboardZones =
  getElement("dashboardZones");


const refreshDashboardBtn =
  getElement("refreshDashboardBtn");


const dashboardView =
  getElement("dashboardView");


const qrManagementView =
  getElement("qrManagementView");


const dashboardMenuBtn =
  getElement("dashboardMenuBtn");


const qrManagementMenuBtn =
  getElement("qrManagementMenuBtn");


// ==================================================
// QR MANAGEMENT ELEMENTS
// ==================================================

const qrManagementSummary =
  getElement("qrManagementSummary");


const qrLocations =
  getElement("qrLocations");


const qrSelectionInfo =
  getElement("qrSelectionInfo");


const qrSelectAllBtn =
  getElement("qrSelectAllBtn");


const qrClearSelectionBtn =
  getElement("qrClearSelectionBtn");


const qrRefreshBtn =
  getElement("qrRefreshBtn");


// ==================================================
// QR DATA
// ==================================================

let qrLocationsData = [];

let qrSelectedPoints = new Set();


// ==================================================
// LOAD DASHBOARD
// ==================================================

async function loadDashboard() {

  if (!dashboardStatus) {

    return;

  }


  dashboardStatus.textContent =
    "⏳ กำลังโหลดข้อมูล...";


  try {

    const response =
      await fetch(
        `${GOOGLE_APPS_SCRIPT_URL}?action=dashboard`
      );


    const result =
      await response.json();


    console.log(
      "GGN Dashboard API:",
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
          : "ไม่สามารถโหลด Dashboard ได้"
      );

    }


    const data =
      result.data || {};


    renderSummary(
      data.summary || {}
    );


    renderZones(
      data.zones || []
    );


    dashboardStatus.textContent =
      "✅ อัปเดตข้อมูลล่าสุดแล้ว";


  } catch (error) {

    console.error(
      "GGN Dashboard Error:",
      error
    );


    dashboardStatus.textContent =
      "❌ โหลดข้อมูลไม่สำเร็จ" +
      (
        error.message
          ? `: ${error.message}`
          : ""
      );

  }

}


// ==================================================
// RENDER SUMMARY
// ==================================================

function renderSummary(summary) {

  if (!dashboardSummary) {

    return;

  }


  dashboardSummary.innerHTML =
    "";


  const items = [

    {
      className:
        "total",

      icon:
        "📍",

      label:
        "จุดทั้งหมด",

      value:
        summary.total || 0

    },

    {
      className:
        "checkin",

      icon:
        "🟢",

      label:
        "เข้างานแล้ว",

      value:
        summary.checkIn || 0

    },

    {
      className:
        "checkout",

      icon:
        "🔴",

      label:
        "ออกงานแล้ว",

      value:
        summary.checkOut || 0

    },

    {
      className:
        "nodata",

      icon:
        "⚪",

      label:
        "ยังไม่มีข้อมูล",

      value:
        summary.noData || 0

    }

  ];


  items.forEach(
    item => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        `summary-card summary-${item.className}`;


      card.innerHTML =

        `<span class="summary-icon">
          ${item.icon}
        </span>

        <span class="summary-value">
          ${item.value}
        </span>

        <span class="summary-label">
          ${item.label}
        </span>`;


      dashboardSummary.appendChild(
        card
      );

    }
  );

}


// ==================================================
// RENDER ZONES
// ==================================================

function renderZones(zones) {

  if (!dashboardZones) {

    return;

  }


  dashboardZones.innerHTML =
    "";


  if (!zones.length) {

    dashboardZones.innerHTML =

      `<div class="dashboard-empty">
        ⚪ ไม่พบข้อมูลจุดตรวจ
      </div>`;

    return;

  }


  zones.forEach(
    zone => {

      const zoneSection =
        document.createElement(
          "section"
        );


      zoneSection.className =
        "dashboard-zone";


      const zoneHeader =
        document.createElement(
          "div"
        );


      zoneHeader.className =
        "dashboard-zone-header";


      const zoneTitle =
        document.createElement(
          "h3"
        );


      zoneTitle.className =
        "dashboard-zone-title";


      zoneTitle.textContent =
        zone.zone || "-";


      const zoneSummary =
        document.createElement(
          "div"
        );


      zoneSummary.className =
        "dashboard-zone-summary";


      zoneSummary.innerHTML =

        `<span>ทั้งหมด ${zone.total || 0} จุด</span>
         <span>🟢 ${zone.checkIn || 0}</span>
         <span>🔴 ${zone.checkOut || 0}</span>
         <span>⚪ ${zone.noData || 0}</span>`;


      zoneHeader.appendChild(
        zoneTitle
      );


      zoneHeader.appendChild(
        zoneSummary
      );


      zoneSection.appendChild(
        zoneHeader
      );


      const pointsGrid =
        document.createElement(
          "div"
        );


      pointsGrid.className =
        "dashboard-points-grid";


      (zone.points || []).forEach(
        point => {

          pointsGrid.appendChild(
            createPointCard(
              point
            )
          );

        }
      );


      zoneSection.appendChild(
        pointsGrid
      );


      dashboardZones.appendChild(
        zoneSection
      );

    }
  );

}


// ==================================================
// CREATE POINT CARD
// ==================================================

function createPointCard(point) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "dashboard-point-card";


  const status =
    point.status ||
    "UNKNOWN";


  card.classList.add(
    `point-status-${status.toLowerCase()}`
  );


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "point-card-header";


  const statusIcon =
    document.createElement(
      "span"
    );


  statusIcon.className =
    "point-status-icon";


  statusIcon.textContent =
    point.statusIcon ||
    "⚪";


  const pointId =
    document.createElement(
      "span"
    );


  pointId.className =
    "point-id";


  pointId.textContent =
    point.pointId ||
    "-";


  header.appendChild(
    statusIcon
  );


  header.appendChild(
    pointId
  );


  card.appendChild(
    header
  );


  const location =
    document.createElement(
      "div"
    );


  location.className =
    "point-location";


  location.textContent =
    point.location ||
    "-";


  card.appendChild(
    location
  );


  const statusText =
    document.createElement(
      "div"
    );


  statusText.className =
    "point-status-text";


  statusText.textContent =
    point.statusText ||
    "ไม่ทราบสถานะ";


  card.appendChild(
    statusText
  );


  const person =
    document.createElement(
      "div"
    );


  person.className =
    "point-person";


  person.textContent =

    point.fullname
      ? `👤 ${point.fullname}`
      : "👤 —";


  card.appendChild(
    person
  );


  const job =
    document.createElement(
      "div"
    );


  job.className =
    "point-job";


  job.textContent =

    point.jobType
      ? `📌 ${point.jobType}`
      : "📌 —";


  card.appendChild(
    job
  );


  const timestamp =
    document.createElement(
      "div"
    );


  timestamp.className =
    "point-timestamp";


  timestamp.textContent =

    point.timestamp
      ? `🕐 ${point.timestamp}`
      : "🕐 —";


  card.appendChild(
    timestamp
  );


  return card;

}


// ==================================================
// SHOW DASHBOARD
// ==================================================

function showDashboardView() {

  if (dashboardView) {

    dashboardView.hidden =
      false;

  }


  if (qrManagementView) {

    qrManagementView.hidden =
      true;

  }


  dashboardMenuBtn?.classList.add(
    "dashboard-menu-active"
  );


  qrManagementMenuBtn?.classList.remove(
    "dashboard-menu-active"
  );


  loadDashboard();

}


// ==================================================
// SHOW QR MANAGEMENT
// ==================================================

function showQRManagementView() {

  if (dashboardView) {

    dashboardView.hidden =
      true;

  }


  if (qrManagementView) {

    qrManagementView.hidden =
      false;

  }


  dashboardMenuBtn?.classList.remove(
    "dashboard-menu-active"
  );


  qrManagementMenuBtn?.classList.add(
    "dashboard-menu-active"
  );


  loadQRManagement();

}


// ==================================================
// LOAD QR MANAGEMENT
//
// Backend:
// action=qrManagement
// ==================================================

async function loadQRManagement() {

  if (!qrLocations) {

    return;

  }


  qrLocations.innerHTML =

    `<div class="qr-loading">
      ⏳ กำลังโหลดรายการจุดตรวจ...
    </div>`;


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


    qrLocationsData =
      data.locations || [];


    qrSelectedPoints =
      new Set();


    renderQRManagementSummary(
      data
    );


    renderQRLocations(
      qrLocationsData
    );


    updateQRSelectionInfo();


  } catch (error) {

    console.error(
      "GGN QR Management Error:",
      error
    );


    qrLocations.innerHTML =

      `<div class="qr-error">
        ❌ โหลดข้อมูลไม่สำเร็จ
        <br>
        ${escapeHTML(error.message || "")}
      </div>`;

  }

}


// ==================================================
// RENDER QR SUMMARY
// ==================================================

function renderQRManagementSummary(data) {

  if (!qrManagementSummary) {

    return;

  }


  qrManagementSummary.innerHTML =

    `<div class="qr-summary-card">

      <span class="qr-summary-icon">
        📍
      </span>

      <span class="qr-summary-value">
        ${data.count || 0}
      </span>

      <span class="qr-summary-label">
        จุดทั้งหมด
      </span>

    </div>


    <div class="qr-summary-card">

      <span class="qr-summary-icon">
        🟢
      </span>

      <span class="qr-summary-value">
        ${data.activeCount || 0}
      </span>

      <span class="qr-summary-label">
        จุด Active
      </span>

    </div>


    <div class="qr-summary-card">

      <span class="qr-summary-icon">
        ⚪
      </span>

      <span class="qr-summary-value">
        ${(data.count || 0) -
        (data.activeCount || 0)}
      </span>

      <span class="qr-summary-label">
        จุดปิดใช้งาน
      </span>

    </div>`;

}


// ==================================================
// RENDER QR LOCATIONS
// ==================================================

function renderQRLocations(locations) {

  if (!qrLocations) {

    return;

  }


  qrLocations.innerHTML =
    "";


  if (!locations.length) {

    qrLocations.innerHTML =

      `<div class="dashboard-empty">
        ⚪ ไม่พบข้อมูลจุดตรวจ
      </div>`;

    return;

  }


  locations.forEach(
    location => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "qr-location-card";


      if (
        !location.active
      ) {

        card.classList.add(
          "qr-location-inactive"
        );

      }


      const checkbox =
        document.createElement(
          "input"
        );


      checkbox.type =
        "checkbox";


      checkbox.className =
        "qr-location-checkbox";


      checkbox.value =
        location.pointId;


      checkbox.checked =
        qrSelectedPoints.has(
          location.pointId
        );


      checkbox.addEventListener(
        "change",
        function() {

          if (this.checked) {

            qrSelectedPoints.add(
              location.pointId
            );

            card.classList.add(
              "qr-location-selected"
            );

          } else {

            qrSelectedPoints.delete(
              location.pointId
            );

            card.classList.remove(
              "qr-location-selected"
            );

          }


          updateQRSelectionInfo();

        }
      );


      const content =
        document.createElement(
          "div"
        );


      content.className =
        "qr-location-content";


      const pointId =
        document.createElement(
          "div"
        );


      pointId.className =
        "qr-location-point-id";


      pointId.textContent =
        location.pointId || "-";


      const locationName =
        document.createElement(
          "div"
        );


      locationName.className =
        "qr-location-name";


      locationName.textContent =
        location.location || "-";


      const zone =
        document.createElement(
          "div"
        );


      zone.className =
        "qr-location-zone";


      zone.textContent =
        location.zone || "-";


      const active =
        document.createElement(
          "span"
        );


      active.className =
        location.active
          ? "qr-active"
          : "qr-inactive";


      active.textContent =
        location.active
          ? "● Active"
          : "● ปิดใช้งาน";


      content.appendChild(
        pointId
      );


      content.appendChild(
        locationName
      );


      content.appendChild(
        zone
      );


      content.appendChild(
        active
      );


      card.appendChild(
        checkbox
      );


      card.appendChild(
        content
      );


      qrLocations.appendChild(
        card
      );

    }
  );

}


// ==================================================
// SELECT ALL
// ==================================================

function selectAllQRLocations() {

  qrSelectedPoints =
    new Set(

      qrLocationsData
        .filter(
          location =>
            location.active === true
        )
        .map(
          location =>
            location.pointId
        )

    );


  renderQRLocations(
    qrLocationsData
  );


  updateQRSelectionInfo();

}


// ==================================================
// CLEAR SELECTION
// ==================================================

function clearQRSelection() {

  qrSelectedPoints =
    new Set();


  renderQRLocations(
    qrLocationsData
  );


  updateQRSelectionInfo();

}


// ==================================================
// UPDATE SELECTION INFO
// ==================================================

function updateQRSelectionInfo() {

  if (!qrSelectionInfo) {

    return;

  }


  const count =
    qrSelectedPoints.size;


  if (!count) {

    qrSelectionInfo.innerHTML =
      "📌 ยังไม่ได้เลือกจุดตรวจ";

    return;

  }


  qrSelectionInfo.innerHTML =

    `📌 เลือกแล้ว
     <strong>${count}</strong>
     จุด`;

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHTML(value) {

  return String(value)
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
// EVENTS
// ==================================================

if (refreshDashboardBtn) {

  refreshDashboardBtn.addEventListener(
    "click",
    loadDashboard
  );

}


if (dashboardMenuBtn) {

  dashboardMenuBtn.addEventListener(
    "click",
    showDashboardView
  );

}


if (qrManagementMenuBtn) {

  qrManagementMenuBtn.addEventListener(
    "click",
    showQRManagementView
  );

}


if (qrSelectAllBtn) {

  qrSelectAllBtn.addEventListener(
    "click",
    selectAllQRLocations
  );

}


if (qrClearSelectionBtn) {

  qrClearSelectionBtn.addEventListener(
    "click",
    clearQRSelection
  );

}


if (qrRefreshBtn) {

  qrRefreshBtn.addEventListener(
    "click",
    loadQRManagement
  );

}


// ==================================================
// START
// ==================================================

if (
  currentPage === "dashboard.html"
) {

  loadDashboard();

}