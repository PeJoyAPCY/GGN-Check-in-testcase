// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 3
//
// หน้าที่:
// - โหลด Dashboard จาก API
// - แสดง Summary
// - แสดงทุกจุดตรวจ
// - แบ่งกลุ่มตาม Zone
// - แสดงสถานะของแต่ละจุด
// - รีเฟรชข้อมูล
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ฐานข้อมูล
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ปรับเฉพาะการแสดงผล UI
// ==================================================


// ==================================================
// ELEMENTS
// ==================================================

const dashboardStatus =
  getElement("dashboardStatus");


const dashboardSummary =
  getElement("dashboardSummary");


const dashboardZones =
  getElement("dashboardZones");


const refreshDashboardBtn =
  getElement("refreshDashboardBtn");


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


      // =================================================
      // ZONE HEADER
      // =================================================

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


      // =================================================
      // POINT GRID
      // =================================================

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


  // =================================================
  // STATUS
  // =================================================

  const status =
    point.status ||
    "UNKNOWN";


  card.classList.add(
    `point-status-${status.toLowerCase()}`
  );


  // =================================================
  // HEADER
  // =================================================

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


  // =================================================
  // LOCATION
  // =================================================

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


  // =================================================
  // STATUS TEXT
  // =================================================

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


  // =================================================
  // PERSON
  // =================================================

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


  // =================================================
  // JOB TYPE
  // =================================================

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


  // =================================================
  // TIMESTAMP
  // =================================================

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
// REFRESH BUTTON
// ==================================================

if (refreshDashboardBtn) {

  refreshDashboardBtn.addEventListener(
    "click",
    loadDashboard
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