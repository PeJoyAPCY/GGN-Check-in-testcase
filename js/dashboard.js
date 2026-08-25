// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 5
//
// หน้าที่:
// - โหลด Dashboard จาก API
// - แสดง Summary
// - แสดงทุกจุดตรวจ
// - แบ่งกลุ่มตาม Zone
// - แสดงสถานะของแต่ละจุด
// - รีเฟรชข้อมูล
// - นำทางไปหน้า QR Management
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ฐานข้อมูล
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - QR Management แยกเป็น qr.html
// - QR Management ใช้ qr.js
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


const dashboardMenuBtn =
  getElement("dashboardMenuBtn");


const qrManagementMenuBtn =
  getElement("qrManagementMenuBtn");


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
// NAVIGATE TO QR MANAGEMENT
// ==================================================

function openQRManagement() {

  window.location.href =
    "./qr.html";

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
    function() {

      window.location.href =
        "./dashboard.html";

    }
  );

}


if (qrManagementMenuBtn) {

  qrManagementMenuBtn.addEventListener(
    "click",
    openQRManagement
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