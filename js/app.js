// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 4.2
//
// หน้าที่:
// - Common Function
// - Google Apps Script URL
// - Zone
// - Current Page
// - Index Page
// - QR Point ID
// - ตรวจสอบจุดตรวจจาก Backend
// - Cache Promise การตรวจสอบ Point
// - ใช้ Request เดียวร่วมกันทั้งระบบ
// - ส่ง Point ID ต่อระหว่างหน้า
// - Dashboard / QR Management Navigation
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ไม่แก้ฐานข้อมูล
// - รักษา Logic Check-in / Check-out เดิม
// - Check-in / Check-out ใช้ผล Point Verification เดียวกัน
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
// POINT VERIFICATION STATE
//
// V4.2
//
// จุดสำคัญ:
//
// Promise เดียว
// ↓
// API Request เดียว
// ↓
// ทุกหน้าที่เรียกใช้ผลเดียวกัน
//
// ป้องกัน:
// app.js
// + checkin.js
// + checkout.js
//
// ยิง locationByPoint ซ้ำ
// ==================================================

let locationPromise =
  null;


let locationVerified =
  false;


let locationVerificationResult =
  null;


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
// GET LOCATION VERIFICATION RESULT
//
// V4.2
//
// ให้ Check-in / Check-out
// อ่านผลการตรวจสอบล่าสุดได้
//
// คืนค่า:
// {
//   success,
//   pointId,
//   zone,
//   location,
//   active
// }
//
// หรือ null
// ==================================================

function getLocationVerificationResult() {

  return locationVerificationResult;

}


// ==================================================
// CHECK LOCATION VERIFIED
// ==================================================

function isLocationVerified() {

  return (
    locationVerified === true
  );

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
// LOAD LOCATION BY POINT
//
// V4.2
//
// IMPORTANT:
//
// Function นี้สามารถถูกเรียกหลายครั้งได้
//
// แต่จะยิง API เพียงครั้งเดียว
//
// ครั้งแรก:
// loadLocationByPoint()
// ↓
// สร้าง Promise
// ↓
// fetch()
// ↓
// เก็บ Promise ไว้
//
// ครั้งต่อไป:
// loadLocationByPoint()
// ↓
// คืน Promise เดิม
//
// ดังนั้น:
//
// app.js
// checkin.js
// checkout.js
//
// ใช้ Request เดียวกัน
// ==================================================

function loadLocationByPoint() {

  // ==================================================
  // ไม่มี Point ID
  // ==================================================

  if (!POINT_ID) {

    updateLocationDisplay();

    return Promise.resolve(
      true
    );

  }


  // ==================================================
  // ถ้าตรวจสอบสำเร็จแล้ว
  //
  // ไม่ต้อง Request ใหม่
  // ==================================================

  if (
    locationVerified === true &&
    locationVerificationResult
  ) {

    return Promise.resolve(
      true
    );

  }


  // ==================================================
  // ถ้ามี Request อยู่แล้ว
  //
  // ใช้ Promise เดิม
  // ==================================================

  if (locationPromise) {

    console.log(
      "⚡ GGN Location Promise Reuse"
    );

    return locationPromise;

  }


  // ==================================================
  // ตรวจสอบ URL
  // ==================================================

  if (!GOOGLE_APPS_SCRIPT_URL) {

    if (zoneTitle) {

      zoneTitle.textContent =
        "❌ ยังไม่ได้ตั้งค่า Google Apps Script URL";

    }


    return Promise.resolve(
      false
    );

  }


  // ==================================================
  // แสดงสถานะ
  // ==================================================

  if (zoneTitle) {

    zoneTitle.textContent =
      "⏳ กำลังตรวจสอบจุดตรวจ...";

  }


  // ==================================================
  // CREATE SINGLE PROMISE
  // ==================================================

  locationPromise =
    (async function() {

      try {

        const apiUrl =
          `${GOOGLE_APPS_SCRIPT_URL}` +
          `?action=locationByPoint` +
          `&pointId=${encodeURIComponent(POINT_ID)}`;


        console.log(
          "⚡ GGN Location API Request:",
          apiUrl
        );


        const startTime =
          performance.now();


        // ==================================================
        // REQUEST
        // ==================================================

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


        const elapsed =
          Math.round(
            performance.now() -
            startTime
          );


        console.log(
          `⚡ GGN Location Response: ${elapsed} ms`
        );


        console.log(
          "GGN Location Result:",
          result
        );


        // ==================================================
        // VALIDATE RESPONSE
        // ==================================================

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


        // ==================================================
        // VALIDATE ACTIVE
        // ==================================================

        if (!active) {

          throw new Error(
            "จุดตรวจนี้ถูกปิดใช้งาน"
          );

        }


        // ==================================================
        // VALIDATE ZONE
        // ==================================================

        if (!returnedZone) {

          throw new Error(
            "Backend ไม่ส่งข้อมูล zone"
          );

        }


        // ==================================================
        // VALIDATE LOCATION
        // ==================================================

        if (!returnedLocation) {

          throw new Error(
            "Backend ไม่ส่งข้อมูล location"
          );

        }


        // ==================================================
        // SAVE CURRENT DATA
        // ==================================================

        currentZone =
          returnedZone;


        currentLocation =
          returnedLocation;


        // ==================================================
        // SAVE VERIFICATION RESULT
        // ==================================================

        locationVerificationResult = {

          success:
            true,

          pointId:
            returnedPointId,

          zone:
            returnedZone,

          location:
            returnedLocation,

          active:
            true

        };


        locationVerified =
          true;


        // ==================================================
        // UPDATE DISPLAY
        // ==================================================

        updateLocationDisplay();


        // ==================================================
        // LOG
        // ==================================================

        console.log(
          "⚡ GGN Point Verified:",
          locationVerificationResult
        );


        return true;


      } catch (error) {

        console.error(
          "GGN Location Error:",
          error
        );


        locationVerified =
          false;


        locationVerificationResult =
          null;


        if (zoneTitle) {

          zoneTitle.textContent =
            "❌ ไม่สามารถตรวจสอบจุดตรวจได้";

        }


        return false;

      }

    })();


  // ==================================================
  // RETURN SINGLE PROMISE
  // ==================================================

  return locationPromise;

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
   * MANAGEMENT PAGES
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

    /*
     * เริ่มตรวจ Point ทันที
     *
     * ไม่ block การเตรียมหน้า
     */

    if (POINT_ID) {

      loadLocationByPoint();

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

    /*
     * V4.2
     *
     * ไม่ await
     *
     * เพื่อไม่ block หน้า Check-in
     *
     * checkin.js จะเรียก
     * loadLocationByPoint()
     *
     * และได้รับ Promise เดียวกัน
     */

    if (POINT_ID) {

      loadLocationByPoint();

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

    /*
     * V4.2
     *
     * ไม่ await
     *
     * ให้หน้า Checkout ขึ้นทันที
     * แล้ว Location ค่อยมา
     */

    if (POINT_ID) {

      loadLocationByPoint();

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