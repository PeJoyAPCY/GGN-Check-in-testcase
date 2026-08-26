// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 4.0
//
// หน้าที่:
// - Common Function
// - Google Apps Script URL
// - Zone
// - Current Page
// - Index Page
// - QR Point ID
// - ตรวจสอบจุดตรวจจาก Backend
// - ส่ง Point ID ต่อระหว่างหน้า
// - Dashboard / QR Management Navigation
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ฐานข้อมูล
// - รักษา Logic Check-in / Check-out เดิม
// - รองรับ dashboard.html
// - รองรับ qr.html
// ==================================================


// ==================================================
// GOOGLE APPS SCRIPT
// ==================================================

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw0JQofeb4nDdIY91oak4YF6wTCEZzG-nuW6_lqLyRk1EwbBAgFZSIFDDgI-4v5C7G5Fg/exec";


// ==================================================
// DEFAULT ZONE
// ==================================================

const ZONE =
  "ทดสอบ";


// ==================================================
// CURRENT PAGE
// ==================================================

const currentPage =
  window.location.pathname
    .split("/")
    .pop() || "index.html";


// ==================================================
// QR POINT ID
// ==================================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const POINT_ID =
  String(
    urlParams.get("pointId") ||
    ""
  ).trim();


// ==================================================
// CURRENT LOCATION DATA
// ==================================================

let currentZone =
  ZONE;


let currentLocation =
  "";


// ==================================================
// COMMON
// ==================================================

function getElement(id) {

  return document.getElementById(id);

}


// ==================================================
// GET SELECTED JOB
// ==================================================

function getSelectedJob() {

  const selected =
    document.querySelector(
      'input[name="jobType"]:checked'
    );

  return selected
    ? selected.value
    : "";

}


// ==================================================
// GET CURRENT ZONE
// ==================================================

function getCurrentZone() {

  return currentZone;

}


// ==================================================
// GET CURRENT LOCATION
// ==================================================

function getCurrentLocation() {

  return currentLocation;

}


// ==================================================
// GET CURRENT POINT ID
// ==================================================

function getCurrentPointId() {

  return POINT_ID;

}


// ==================================================
// ZONE DISPLAY
// ==================================================

const zoneTitle =
  getElement("zoneTitle");


// ==================================================
// SET LOCATION DISPLAY
// ==================================================

function updateLocationDisplay() {

  if (!zoneTitle) {

    return;

  }


  if (POINT_ID) {

    if (currentLocation) {

      zoneTitle.textContent =
        `${currentZone} | ${currentLocation}`;

    } else {

      zoneTitle.textContent =
        currentZone;

    }

    return;

  }


  zoneTitle.textContent =
    currentZone;

}


// ==================================================
// LOAD LOCATION BY POINT ID
// ==================================================

async function loadLocationByPoint() {

  if (!POINT_ID) {

    updateLocationDisplay();

    return true;

  }


  if (!GOOGLE_APPS_SCRIPT_URL) {

    if (zoneTitle) {

      zoneTitle.textContent =
        "❌ ยังไม่ได้ตั้งค่า Google Apps Script URL";

    }

    return false;

  }


  if (zoneTitle) {

    zoneTitle.textContent =
      "⏳ กำลังตรวจสอบจุดตรวจ...";

  }


  try {

    const apiUrl =
      `${GOOGLE_APPS_SCRIPT_URL}` +
      `?action=locationByPoint` +
      `&pointId=${encodeURIComponent(POINT_ID)}`;


    console.log(
      "GGN Location API:",
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
      "GGN Location Result:",
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
          : "ไม่พบข้อมูลจุดตรวจ"
      );

    }


    const data =
      result.data || {};


    const returnedPointId =
      String(
        data.pointId ||
        POINT_ID
      ).trim();


    const returnedZone =
      String(
        data.zone ||
        ""
      ).trim();


    const returnedLocation =
      String(
        data.location ||
        ""
      ).trim();


    const active =
      data.active === true;


    if (!active) {

      throw new Error(
        "จุดตรวจนี้ถูกปิดใช้งาน"
      );

    }


    if (!returnedZone) {

      throw new Error(
        "Backend ไม่ส่งข้อมูล zone"
      );

    }


    if (!returnedLocation) {

      throw new Error(
        "Backend ไม่ส่งข้อมูล location"
      );

    }


    currentZone =
      returnedZone;


    currentLocation =
      returnedLocation;


    updateLocationDisplay();


    console.log(
      "GGN Point Verified:",
      {
        pointId:
          returnedPointId,

        zone:
          currentZone,

        location:
          currentLocation,

        active:
          active
      }
    );


    return true;


  } catch (error) {

    console.error(
      "GGN Location Error:",
      error
    );


    if (zoneTitle) {

      zoneTitle.textContent =
        "❌ ไม่สามารถตรวจสอบจุดตรวจได้";

    }


    return false;

  }

}


// ==================================================
// DASHBOARD / QR NAVIGATION
//
// ใช้กับ:
// dashboard.html
// qr.html
//
// ไม่ใช้ router
// เปลี่ยนหน้าโดยตรง
// ==================================================

function initializeManagementNavigation() {

  /*
   * ----------------------------------------------
   * Dashboard Menu
   * ----------------------------------------------
   */

  const dashboardMenuButtons =
    document.querySelectorAll(
      "#dashboardMenuBtn"
    );


  dashboardMenuButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function(event) {

          event.preventDefault();

          if (
            currentPage === "dashboard.html"
          ) {

            return;

          }

          window.location.href =
            "./dashboard.html";

        }
      );

    }
  );


  /*
   * ----------------------------------------------
   * QR Management Menu
   * ----------------------------------------------
   */

  const qrManagementMenuButtons =
    document.querySelectorAll(
      "#qrManagementMenuBtn"
    );


  qrManagementMenuButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function(event) {

          event.preventDefault();

          if (
            currentPage === "qr.html"
          ) {

            return;

          }

          window.location.href =
            "./qr.html";

        }
      );

    }
  );


  /*
   * ----------------------------------------------
   * Mobile Bottom Navigation
   *
   * ใช้ data-menu-target
   * ----------------------------------------------
   */

  const bottomButtons =
    document.querySelectorAll(
      ".dashboard-bottom-nav-button"
    );


  bottomButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function(event) {

          event.preventDefault();


          const targetId =
            button.dataset.menuTarget;


          if (!targetId) {

            return;

          }


          const target =
            document.getElementById(
              targetId
            );


          if (!target) {

            return;

          }


          target.click();

        }
      );

    }
  );


  /*
   * ----------------------------------------------
   * Active Menu
   * ----------------------------------------------
   */

  updateManagementNavigationState();

}


// ==================================================
// UPDATE NAVIGATION STATE
// ==================================================

function updateManagementNavigationState() {

  const isDashboard =
    currentPage === "dashboard.html";


  const isQR =
    currentPage === "qr.html";


  /*
   * ----------------------------------------------
   * Sidebar
   * ----------------------------------------------
   */

  document
    .querySelectorAll(
      "#dashboardMenuBtn"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "dashboard-menu-active",
          isDashboard
        );

      }
    );


  document
    .querySelectorAll(
      "#qrManagementMenuBtn"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "dashboard-menu-active",
          isQR
        );

      }
    );


  /*
   * ----------------------------------------------
   * Mobile Bottom
   * ----------------------------------------------
   */

  document
    .querySelectorAll(
      ".dashboard-bottom-nav-button"
    )
    .forEach(
      button => {

        const targetId =
          button.dataset.menuTarget;


        let active =
          false;


        if (
          targetId ===
          "dashboardMenuBtn"
        ) {

          active =
            isDashboard;

        }


        if (
          targetId ===
          "qrManagementMenuBtn"
        ) {

          active =
            isQR;

        }


        button.classList.toggle(
          "dashboard-menu-active",
          active
        );

      }
    );

}


// ==================================================
// INDEX PAGE
// ==================================================

function initializeIndex() {

  const checkinBtn =
    getElement("checkinBtn");


  const checkoutBtn =
    getElement("checkoutBtn");


  /*
   * ----------------------------------------------
   * CHECK-IN
   * ----------------------------------------------
   */

  if (checkinBtn) {

    checkinBtn.addEventListener(
      "click",
      () => {

        if (POINT_ID) {

          window.location.href =
            `./checkin.html?pointId=${encodeURIComponent(POINT_ID)}`;

          return;

        }


        window.location.href =
          `./checkin.html?zone=${encodeURIComponent(currentZone)}`;

      }
    );

  }


  /*
   * ----------------------------------------------
   * CHECK-OUT
   * ----------------------------------------------
   */

  if (checkoutBtn) {

    checkoutBtn.addEventListener(
      "click",
      () => {

        if (POINT_ID) {

          window.location.href =
            `./checkout.html?pointId=${encodeURIComponent(POINT_ID)}`;

          return;

        }


        window.location.href =
          `./checkout.html?zone=${encodeURIComponent(currentZone)}`;

      }
    );

  }

}


// ==================================================
// START APPLICATION
// ==================================================

async function startApplication() {

  /*
   * ----------------------------------------------
   * Management Pages
   * ----------------------------------------------
   *
   * ต้องเริ่ม Navigation ก่อน
   * เพื่อให้ Dashboard ↔ QR ใช้งานได้
   * ----------------------------------------------
   */

  if (
    currentPage === "dashboard.html" ||
    currentPage === "qr.html"
  ) {

    initializeManagementNavigation();

    return;

  }


  /*
   * ----------------------------------------------
   * INDEX
   * ----------------------------------------------
   */

  if (
    currentPage === "" ||
    currentPage === "index.html"
  ) {

    if (POINT_ID) {

      await loadLocationByPoint();

    } else {

      updateLocationDisplay();

    }


    initializeIndex();

    return;

  }


  /*
   * ----------------------------------------------
   * CHECK-IN
   * ----------------------------------------------
   */

  if (
    currentPage === "checkin.html"
  ) {

    if (POINT_ID) {

      await loadLocationByPoint();

    } else {

      updateLocationDisplay();

    }

    return;

  }


  /*
   * ----------------------------------------------
   * CHECK-OUT
   * ----------------------------------------------
   */

  if (
    currentPage === "checkout.html"
  ) {

    if (POINT_ID) {

      await loadLocationByPoint();

    } else {

      updateLocationDisplay();

    }

    return;

  }

}


// ==================================================
// START
// ==================================================

startApplication();