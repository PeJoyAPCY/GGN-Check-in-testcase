
// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 5.2
//
// หน้าที่:
// - โหลด Dashboard จาก API
// - โหลด Status Dashboard จาก API
// - แสดง Summary
// - แสดงทุกจุดตรวจ
// - แบ่งกลุ่มตาม Zone
// - แสดงสถานะของแต่ละจุด
// - รองรับหลายคนต่อ 1 Point
// - รองรับ DAY / NIGHT
// - รองรับ NORMAL / SAT / SUN / SPECIAL
// - รีเฟรชข้อมูล
// - จัดการเมนู Dashboard / QR Management
//
// IMPORTANT:
// - QR Management แยกไปอยู่ที่ qr.html + qr.js แล้ว
// - ไม่จัดการ QR ภายในไฟล์นี้
// - ไม่แก้ Backend
// - ไม่แก้ฐานข้อมูล
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
//
// V5.2:
// - ใช้ action=statusdashboard เป็นแหล่งข้อมูล Status
// - ไม่ใช้ status จาก action=dashboard เป็นตัวตัดสินสถานะ Point
// - รองรับ persons[] หลายคนต่อ Point
// - Summary ใช้ข้อมูลจาก Status Dashboard
// - ปรับ Point Card ใหม่
// - ตัด Job Type / 📌 ออกจาก Point Card
// - ตัดวันที่ออกจากเวลา
// - แสดงเวลาเฉพาะ HH:mm:ss
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


// ==================================================
// MENU ELEMENTS
// ==================================================

const dashboardMenuBtn =
  getElement("dashboardMenuBtn");


const qrManagementMenuBtn =
  getElement("qrManagementMenuBtn");


// ==================================================
// LOAD DASHBOARD
//
// ขั้นตอน:
//
// 1. โหลด Dashboard เดิม
//    เพื่อใช้ข้อมูล Zone / Point / Location
//
// 2. โหลด Status Dashboard
//    เพื่อใช้สถานะกำลังพล
//
// 3. Merge ข้อมูลเข้าด้วยกัน
// ==================================================

async function loadDashboard() {

  if (!dashboardStatus) {

    return;

  }


  dashboardStatus.textContent =
    "⏳ กำลังโหลดข้อมูล...";


  try {

    // ==================================================
    // LOAD BASE DASHBOARD
    // ==================================================

    const dashboardResponse =
      await fetch(
        `${GOOGLE_APPS_SCRIPT_URL}?action=dashboard`
      );


    const dashboardResult =
      await dashboardResponse.json();


    console.log(
      "GGN Dashboard API:",
      dashboardResult
    );


    if (
      !dashboardResult ||
      dashboardResult.success !== true
    ) {

      throw new Error(
        dashboardResult &&
        dashboardResult.message
          ? dashboardResult.message
          : "ไม่สามารถโหลด Dashboard ได้"
      );

    }


    const dashboardData =
      dashboardResult.data || {};


    // ==================================================
    // LOAD STATUS DASHBOARD
    //
    // ใช้ข้อมูลสถานะจริงของแต่ละ Point
    // ==================================================

    const statusResponse =
      await fetch(
        `${GOOGLE_APPS_SCRIPT_URL}?action=statusdashboard`
      );


    const statusResult =
      await statusResponse.json();


    console.log(
      "GGN Status Dashboard API:",
      statusResult
    );


    if (
      !statusResult ||
      statusResult.success !== true
    ) {

      throw new Error(
        statusResult &&
        statusResult.message
          ? statusResult.message
          : "ไม่สามารถโหลด Status Dashboard ได้"
      );

    }


    const statusData =
      statusResult.data || {};


    // ==================================================
    // MERGE STATUS INTO DASHBOARD
    // ==================================================

    const mergedData =
      mergeDashboardStatus(

        dashboardData,

        statusData

      );


    // ==================================================
    // RENDER
    // ==================================================

    renderSummary(
      mergedData.summary || {}
    );


    renderZones(
      mergedData.zones || []
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
// MERGE DASHBOARD + STATUS DASHBOARD
// ==================================================
//
// Dashboard API:
// - zones
// - points
// - location
//
// Status Dashboard API:
// - statuses
// - summary
//
// จุดสำคัญ:
//
// statusData.statuses[pointId]
// จะเป็นข้อมูลจาก Status Dashboard
//
// ==================================================

function mergeDashboardStatus(
  dashboardData,
  statusData
) {

  const baseData =
    dashboardData || {};


  const statuses =
    statusData &&
    statusData.statuses
      ? statusData.statuses
      : {};


  // ==================================================
  // SUMMARY
  // ==================================================

  const summary =
    buildDashboardSummaryFromStatus(
      statuses
    );


  // ==================================================
  // ZONES
  // ==================================================

  const zones =
    Array.isArray(
      baseData.zones
    )
      ? baseData.zones
      : [];


  zones.forEach(
    function(zone) {

      if (
        !zone
      ) {

        return;

      }


      const points =
        Array.isArray(
          zone.points
        )
          ? zone.points
          : [];


      points.forEach(
        function(point) {

          if (
            !point
          ) {

            return;

          }


          const pointId =
            String(
              point.pointId ||
              ""
            ).trim();


          if (
            !pointId
          ) {

            return;

          }


          const status =
            statuses[
              pointId
            ];


          if (
            !status
          ) {

            /*
             * ถ้าไม่พบ Status
             * ให้ใช้สถานะเดิมของ Dashboard
             * เพื่อไม่ให้ UI หาย
             */

            return;

          }


          applyStatusToPoint(
            point,
            status
          );

        }
      );


      /*
       * Recalculate Zone Summary
       */

      updateZoneSummary(
        zone,
        statuses
      );

    }
  );


  return {

    summary:
      summary,

    zones:
      zones

  };

}


// ==================================================
// BUILD SUMMARY FROM STATUS DASHBOARD
// ==================================================
//
// Status:
//
// COMPLETE
// PARTIAL
// NOT_STARTED
// NO_SETTING
// ERROR
//
// Summary:
//
// total
// complete
// partial
// notStarted
// noSetting
// error
//
// แต่ UI เดิมต้องการ:
//
// total
// checkIn
// checkOut
// noData
//
// ดังนั้น map ให้ UI เดิมใช้งานได้
//
// checkIn:
//   COMPLETE + PARTIAL
//
// noData:
//   NOT_STARTED + NO_SETTING + ERROR
//
// checkOut:
//   ใช้ 0 เพราะ Status Dashboard ใหม่
//   ไม่ได้ใช้ Check-out เป็นสถานะของ Point
//
// ==================================================

function buildDashboardSummaryFromStatus(
  statuses
) {

  const summary = {

    total:
      0,

    checkIn:
      0,

    checkOut:
      0,

    noData:
      0,

    complete:
      0,

    partial:
      0,

    notStarted:
      0,

    noSetting:
      0,

    error:
      0

  };


  if (
    !statuses ||
    typeof statuses !== "object"
  ) {

    return summary;

  }


  Object.keys(
    statuses
  ).forEach(
    function(pointId) {

      const status =
        statuses[
          pointId
        ];


      if (
        !status
      ) {

        return;

      }


      summary.total++;


      switch (
        status.status
      ) {

        case "COMPLETE":

          summary.complete++;
          summary.checkIn++;

          break;


        case "PARTIAL":

          summary.partial++;
          summary.checkIn++;

          break;


        case "NOT_STARTED":

          summary.notStarted++;
          summary.noData++;

          break;


        case "NO_SETTING":

          summary.noSetting++;
          summary.noData++;

          break;


        case "ERROR":

          summary.error++;
          summary.noData++;

          break;


        default:

          summary.noData++;

          break;

      }

    }
  );


  return summary;

}


// ==================================================
// APPLY STATUS TO POINT
// ==================================================

function applyStatusToPoint(
  point,
  status
) {

  if (
    !point ||
    !status
  ) {

    return;

  }


  // ==================================================
  // STATUS
  // ==================================================

  point.status =
    status.status ||
    "UNKNOWN";


  point.statusText =
    status.statusText ||
    "ไม่ทราบสถานะ";


  // ==================================================
  // COUNTS
  // ==================================================

  point.requiredCount =
    Number(
      status.requiredCount ||
      0
    );


  point.checkedInCount =
    Number(
      status.checkedInCount ||
      0
    );


  point.remainingCount =
    Number(
      status.remainingCount ||
      0
    );


  point.hasSetting =
    status.hasSetting === true;


  point.dayType =
    status.dayType ||
    "";


  point.shift =
    status.shift ||
    "";


  // ==================================================
  // PERSONS
  //
  // รองรับหลายคน
  // ==================================================

  point.persons =
    Array.isArray(
      status.persons
    )
      ? status.persons
      : [];


  // ==================================================
  // STATUS ICON
  // ==================================================

  point.statusIcon =
    getDashboardStatusIcon(
      point.status
    );


  // ==================================================
  // PERSON DISPLAY
  //
  // เพื่อ compatibility กับ UI เดิม
  //
  // fullname:
  // คนแรก / รวมหลายคน
  //
  // timestamp:
  // เวลา Check-in คนแรก
  //
  // ==================================================

  if (
    point.persons.length > 0
  ) {

    point.fullname =
      point.persons
        .map(
          function(person) {

            return String(
              person.fullname ||
              ""
            ).trim();

          }
        )
        .filter(
          function(name) {

            return !!name;

          }
        )
        .join(
          ", "
        );


    point.timestamp =
      point.persons[0].timestamp ||
      "";

  } else {

    point.fullname =
      "";


    point.timestamp =
      "";

  }


  /*
   * jobType
   *
   * Status Dashboard ไม่มี jobType
   * จึงไม่เขียนทับค่าที่มาจาก Dashboard เดิม
   */

}


// ==================================================
// STATUS ICON
// ==================================================

function getDashboardStatusIcon(
  status
) {

  switch (
    String(
      status ||
      ""
    )
      .trim()
      .toUpperCase()
  ) {

    case "COMPLETE":

      return "🟢";


    case "PARTIAL":

      return "🟡";


    case "NOT_STARTED":

      return "⚪";


    case "NO_SETTING":

      return "⚫";


    case "ERROR":

      return "🔴";


    default:

      return "⚪";

  }

}


// ==================================================
// UPDATE ZONE SUMMARY
// ==================================================

function updateZoneSummary(
  zone,
  statuses
) {

  if (
    !zone
  ) {

    return;

  }


  const points =
    Array.isArray(
      zone.points
    )
      ? zone.points
      : [];


  let total =
    0;


  let complete =
    0;


  let partial =
    0;


  let notStarted =
    0;


  let noSetting =
    0;


  let error =
    0;


  points.forEach(
    function(point) {

      if (
        !point
      ) {

        return;

      }


      const pointId =
        String(
          point.pointId ||
          ""
        ).trim();


      if (
        !pointId
      ) {

        return;

      }


      total++;


      const status =
        statuses[
          pointId
        ];


      if (
        !status
      ) {

        return;

      }


      switch (
        status.status
      ) {

        case "COMPLETE":

          complete++;

          break;


        case "PARTIAL":

          partial++;

          break;


        case "NOT_STARTED":

          notStarted++;

          break;


        case "NO_SETTING":

          noSetting++;

          break;


        case "ERROR":

          error++;

          break;

      }

    }
  );


  /*
   * เก็บค่าใหม่
   */

  zone.total =
    total;


  zone.complete =
    complete;


  zone.partial =
    partial;


  zone.notStarted =
    notStarted;


  zone.noSetting =
    noSetting;


  zone.error =
    error;


  /*
   * Compatibility กับ UI เดิม
   */

  zone.checkIn =
    complete +
    partial;


  zone.checkOut =
    0;


  zone.noData =
    notStarted +
    noSetting +
    error;

}


// ==================================================
// RENDER SUMMARY
// ==================================================

function renderSummary(summary) {

  if (
    !dashboardSummary
  ) {

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
        "ครบ/เข้างานแล้ว",

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

  if (
    !dashboardZones
  ) {

    return;

  }


  dashboardZones.innerHTML =
    "";


  if (
    !zones.length
  ) {

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


      // ==================================================
      // ZONE HEADER
      // ==================================================

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
        zone.zone ||
        "-";


      const zoneSummary =
        document.createElement(
          "div"
        );


      zoneSummary.className =
        "dashboard-zone-summary";


      zoneSummary.innerHTML =

        `<span>
          ทั้งหมด ${zone.total || 0} จุด
        </span>

        <span>
          🟢 ${zone.complete || 0}
        </span>

        <span>
          🟡 ${zone.partial || 0}
        </span>

        <span>
          ⚪ ${zone.notStarted || 0}
        </span>

        <span>
          ⚫ ${zone.noSetting || 0}
        </span>`;


      zoneHeader.appendChild(
        zoneTitle
      );


      zoneHeader.appendChild(
        zoneSummary
      );


      zoneSection.appendChild(
        zoneHeader
      );


      // ==================================================
      // POINT GRID
      // ==================================================

      const pointsGrid =
        document.createElement(
          "div"
        );


      pointsGrid.className =
        "dashboard-points-grid";


      (
        zone.points ||
        []
      ).forEach(
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
//
// V5.2 CARD FORMAT:
//
// 🟢 LP_027
//
// 129. บริษัท นิชิได(ประเทศไทย)จำกัด
// ชื่อเดิมไทยซินเทอร์ดเมช
//
// ครบกำลังพล
//
// 👥 1/1
//
// 👤 จำนงค์วินันท์ · 06:53:23
//
// IMPORTANT:
// - ไม่แสดงวันที่
// - ไม่แสดง 📌 Job Type
// - รองรับหลายคนต่อ Point
// ==================================================

function createPointCard(
  point
) {

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


  // ==================================================
  // HEADER
  // ==================================================

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
    getDashboardStatusIcon(
      status
    );


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


  // ==================================================
  // LOCATION
  // ==================================================

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


  // ==================================================
  // STATUS TEXT
  // ==================================================

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


  // ==================================================
  // REQUIRED / CHECKED-IN
  // ==================================================

  const manpower =
    document.createElement(
      "div"
    );


  manpower.className =
    "point-manpower";


  if (
    point.hasSetting
  ) {

    manpower.textContent =
      `👥 ${point.checkedInCount || 0}/${point.requiredCount || 0}`;

  } else {

    manpower.textContent =
      "👥 ไม่ได้ตั้งกำลังพล";

  }


  card.appendChild(
    manpower
  );


  // ==================================================
  // PERSONS
  //
  // รองรับหลายคนต่อ Point
  //
  // รูปแบบ:
  // 👤 ชื่อ · HH:mm:ss
  //
  // ไม่แสดงวันที่
  // ==================================================

  const persons =
    Array.isArray(
      point.persons
    )
      ? point.persons
      : [];


  const person =
    document.createElement(
      "div"
    );


  person.className =
    "point-person";


  if (
    persons.length
  ) {

    person.innerHTML =
      "";


    persons.forEach(
      function(personData, index) {

        const personRow =
          document.createElement(
            "div"
          );


        personRow.className =
          "point-person-row";


        const fullname =
          String(
            personData.fullname ||
            ""
          ).trim();


        const timestamp =
          formatDashboardTime(
            personData.timestamp
          );


        personRow.textContent =
          `👤 ${fullname || "—"}` +
          (
            timestamp
              ? ` · ${timestamp}`
              : ""
          );


        person.appendChild(
          personRow
        );

      }
    );

  } else {

    person.textContent =
      "👤 —";

  }


  card.appendChild(
    person
  );


  // ==================================================
  // TIMESTAMP FALLBACK
  //
  // กรณีไม่มี persons แต่ Dashboard เดิม
  // มี timestamp ให้แสดงเวลา
  //
  // แสดงเฉพาะ HH:mm:ss
  // ==================================================

  if (
    !persons.length &&
    point.timestamp
  ) {

    const timestamp =
      document.createElement(
        "div"
      );


    timestamp.className =
      "point-timestamp";


    const formattedTime =
      formatDashboardTime(
        point.timestamp
      );


    if (
      formattedTime
    ) {

      timestamp.textContent =
        `🕐 ${formattedTime}`;

      card.appendChild(
        timestamp
      );

    }

  }


  // ==================================================
  // IMPORTANT
  //
  // V5.2 ไม่สร้าง Job Type
  // และไม่แสดง 📌
  //
  // ==================================================


  // ==================================================
  // RETURN
  // ==================================================

  return card;

}


// ==================================================
// FORMAT DASHBOARD TIME
//
// หน้าที่:
// - รับ timestamp จาก API
// - ตัดวันที่ออก
// - คืนค่าเฉพาะเวลา HH:mm:ss
//
// รองรับตัวอย่าง:
//
// 03/09/2026 06:53:23
// 2026-09-03 06:53:23
// 2026-09-03T06:53:23
// 06:53:23
// 06:53
//
// ==================================================

function formatDashboardTime(
  timestamp
) {

  if (
    timestamp === null ||
    timestamp === undefined
  ) {

    return "";

  }


  const value =
    String(
      timestamp
    ).trim();


  if (
    !value
  ) {

    return "";

  }


  // ==================================================
  // HH:mm:ss
  // ==================================================

  let match =
    value.match(
      /(?:^|\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/
    );


  if (
    match
  ) {

    const hour =
      String(
        match[1]
      ).padStart(
        2,
        "0"
      );


    const minute =
      String(
        match[2]
      ).padStart(
        2,
        "0"
      );


    const second =
      String(
        match[3] || "00"
      ).padStart(
        2,
        "0"
      );


    return (
      `${hour}:${minute}:${second}`
    );

  }


  // ==================================================
  // ถ้าเป็น Date string ที่ Browser parse ได้
  // ==================================================

  const date =
    new Date(
      value
    );


  if (
    !Number.isNaN(
      date.getTime()
    )
  ) {

    const hour =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );


    const minute =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );


    const second =
      String(
        date.getSeconds()
      ).padStart(
        2,
        "0"
      );


    return (
      `${hour}:${minute}:${second}`
    );

  }


  // ==================================================
  // ถ้าไม่สามารถ parse ได้
  // คืนค่าเดิม
  // ==================================================

  return value;

}


// ==================================================
// GO TO DASHBOARD
// ==================================================

function goToDashboard() {

  /*
   * ถ้าอยู่หน้า Dashboard อยู่แล้ว
   * ไม่ต้องโหลดหน้าใหม่
   */

  if (
    currentPage === "dashboard.html"
  ) {

    loadDashboard();

    return;

  }


  window.location.href =
    "./dashboard.html";

}


// ==================================================
// GO TO QR MANAGEMENT
// ==================================================

function goToQRManagement() {

  /*
   * QR Management แยกเป็นหน้า qr.html
   */

  if (
    currentPage === "qr.html"
  ) {

    return;

  }


  window.location.href =
    "./qr.html";

}


// ==================================================
// UPDATE MENU ACTIVE STATE
// ==================================================

function updateDashboardMenu() {

  if (
    dashboardMenuBtn
  ) {

    dashboardMenuBtn.classList.toggle(
      "dashboard-menu-active",
      currentPage === "dashboard.html"
    );

  }


  if (
    qrManagementMenuBtn
  ) {

    qrManagementMenuBtn.classList.toggle(
      "dashboard-menu-active",
      currentPage === "qr.html"
    );

  }

}


// ==================================================
// EVENTS
// ==================================================


// ==================================================
// REFRESH DASHBOARD
// ==================================================

if (
  refreshDashboardBtn
) {

  refreshDashboardBtn.addEventListener(
    "click",
    loadDashboard
  );

}


// ==================================================
// DASHBOARD MENU
// ==================================================

if (
  dashboardMenuBtn
) {

  dashboardMenuBtn.addEventListener(
    "click",
    goToDashboard
  );

}


// ==================================================
// QR MANAGEMENT MENU
// ==================================================

if (
  qrManagementMenuBtn
) {

  qrManagementMenuBtn.addEventListener(
    "click",
    goToQRManagement
  );

}


// ==================================================
// START
// ==================================================

updateDashboardMenu();


if (
  currentPage === "dashboard.html"
) {

  loadDashboard();

}