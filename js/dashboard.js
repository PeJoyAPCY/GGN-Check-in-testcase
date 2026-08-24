// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 1
//
// หน้าที่:
// - โหลด Dashboard จาก API
// - แสดง Summary
// - แสดงข้อมูลแยกตามเขต
// - แสดงสถานะของแต่ละจุด
// - รีเฟรชข้อมูล
//
// IMPORTANT:
// - ใช้ API ที่ทดสอบผ่านแล้ว
// - ไม่แก้ไข Backend
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ใช้ ZONE จาก app.js
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
    "⏳ กำลังโหลดข้อมูล Dashboard...";


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
      "✅ โหลดข้อมูลสำเร็จ";


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
      label:
        "จุดทั้งหมด",

      value:
        summary.total || 0
    },

    {
      label:
        "เข้างานแล้ว",

      value:
        summary.checkIn || 0
    },

    {
      label:
        "ออกงานแล้ว",

      value:
        summary.checkOut || 0
    },

    {
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
        "dashboard-summary-card";


      const value =
        document.createElement(
          "div"
        );


      value.className =
        "dashboard-summary-value";


      value.textContent =
        item.value;


      const label =
        document.createElement(
          "div"
        );


      label.className =
        "dashboard-summary-label";


      label.textContent =
        item.label;


      card.appendChild(
        value
      );


      card.appendChild(
        label
      );


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

      const zoneCard =
        document.createElement(
          "section"
        );


      zoneCard.className =
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


      const zoneName =
        document.createElement(
          "h3"
        );


      zoneName.textContent =
        zone.zone || "-";


      const zoneSummary =
        document.createElement(
          "div"
        );


      zoneSummary.className =
        "dashboard-zone-summary";


      zoneSummary.textContent =

        `ทั้งหมด ${zone.total || 0} จุด` +

        ` | 🟢 ${zone.checkIn || 0}` +

        ` | 🔴 ${zone.checkOut || 0}` +

        ` | ⚪ ${zone.noData || 0}`;


      zoneHeader.appendChild(
        zoneName
      );


      zoneHeader.appendChild(
        zoneSummary
      );


      zoneCard.appendChild(
        zoneHeader
      );


      // =================================================
      // POINTS
      // =================================================

      const pointsContainer =
        document.createElement(
          "div"
        );


      pointsContainer.className =
        "dashboard-points";


      (zone.points || []).forEach(
        point => {

          const pointCard =
            createPointCard(
              point
            );


          pointsContainer.appendChild(
            pointCard
          );

        }
      );


      zoneCard.appendChild(
        pointsContainer
      );


      dashboardZones.appendChild(
        zoneCard
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
      "div"
    );


  card.className =
    "dashboard-point";


  // =================================================
  // STATUS
  // =================================================

  const status =
    point.status ||
    "UNKNOWN";


  card.classList.add(
    `status-${status.toLowerCase()}`
  );


  // =================================================
  // HEADER
  // =================================================

  const header =
    document.createElement(
      "div"
    );


  header.className =
    "dashboard-point-header";


  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "dashboard-point-icon";


  icon.textContent =
    point.statusIcon ||
    "⚪";


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "dashboard-point-title";


  title.textContent =

    `${point.pointId || "-"}` +

    ` ${point.location || ""}`;


  header.appendChild(
    icon
  );


  header.appendChild(
    title
  );


  card.appendChild(
    header
  );


  // =================================================
  // STATUS TEXT
  // =================================================

  const statusText =
    document.createElement(
      "div"
    );


  statusText.className =
    "dashboard-point-status";


  statusText.textContent =
    point.statusText ||
    "ไม่ทราบสถานะ";


  card.appendChild(
    statusText
  );


  // =================================================
  // RECORD
  // =================================================

  if (
    point.fullname ||
    point.timestamp
  ) {

    const record =
      document.createElement(
        "div"
      );


    record.className =
      "dashboard-point-record";


    if (point.fullname) {

      const name =
        document.createElement(
          "div"
        );


      name.textContent =
        `👤 ${point.fullname}`;


      record.appendChild(
        name
      );

    }


    if (point.jobType) {

      const job =
        document.createElement(
          "div"
        );


      job.textContent =
        `📌 ${point.jobType}`;


      record.appendChild(
        job
      );

    }


    if (point.timestamp) {

      const time =
        document.createElement(
          "div"
        );


      time.textContent =
        `🕐 ${point.timestamp}`;


      record.appendChild(
        time
      );

    }


    card.appendChild(
      record
    );

  }


  return card;

}


// ==================================================
// REFRESH
// ==================================================

if (refreshDashboardBtn) {

  refreshDashboardBtn.addEventListener(
    "click",
    loadDashboard
  );

}


// ==================================================
// START DASHBOARD
// ==================================================

if (
  currentPage === "dashboard.html"
) {

  loadDashboard();

}