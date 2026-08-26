// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 3.0
//
// หน้าที่:
// - Common Function
// - Google Apps Script URL
// - Zone
// - Current Page
// - Index Page
// - QR Point ID
// - ตรวจสอบจุดตรวจจาก Backend
//
// QR FLOW:
// QR Code
//   ↓
// pointId
//   ↓
// Backend: locationByPoint
//   ↓
// zone + location
//   ↓
// แสดงจุดตรวจบน Index
//
// IMPORTANT:
// - ยังรักษา Logic เดิมของระบบ
// - Check-in / Check-out เดิมยังทำงานได้
// - ถ้าไม่มี pointId จะใช้ ZONE เดิม
// - ยังไม่แก้ checkin.js
// - ยังไม่แก้ checkout.js
// ==================================================


// ==================================================
// GOOGLE APPS SCRIPT
// ==================================================

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw0JQofeb4nDdIY91oak4YF6wTCEZzG-nuW6_lqLyRk1EwbBAgFZSIFDDgI-4v5C7G5Fg/exec";


// ==================================================
// DEFAULT ZONE
//
// ใช้เป็นค่าเดิมของระบบ
// กรณีเปิดหน้าเว็บโดยไม่มี pointId
// ==================================================

const ZONE =
  "ทดสอบ";


// ==================================================
// CURRENT PAGE
// ==================================================

const currentPage =
  window.location.pathname
    .split("/")
    .pop();


// ==================================================
// QR POINT ID
//
// อ่าน pointId จาก URL
//
// ตัวอย่าง:
// index.html?pointId=POINT-001
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
//
// ค่าเริ่มต้นยังคงใช้ระบบเดิม
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
//
// ให้ไฟล์อื่นเรียกใช้ได้
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


  /*
   * -----------------------------------------------
   * มีข้อมูลจุดจาก QR
   * -----------------------------------------------
   */

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


  /*
   * -----------------------------------------------
   * ไม่มี QR
   *
   * ใช้ระบบเดิม
   * -----------------------------------------------
   */

  zoneTitle.textContent =
    currentZone;

}


// ==================================================
// LOAD LOCATION BY POINT ID
//
// เรียก Backend:
// action=locationByPoint
//
// ตัวอย่าง:
// ?action=locationByPoint&pointId=POINT-001
// ==================================================

async function loadLocationByPoint() {

  /*
   * ถ้าไม่มี pointId
   * ไม่ต้องเรียก Backend
   */

  if (!POINT_ID) {

    updateLocationDisplay();

    return true;

  }


  /*
   * ตรวจ URL Backend
   */

  if (!GOOGLE_APPS_SCRIPT_URL) {

    if (zoneTitle) {

      zoneTitle.textContent =
        "❌ ยังไม่ได้ตั้งค่า Google Apps Script URL";

    }

    return false;

  }


  /*
   * แสดงสถานะกำลังตรวจสอบ
   */

  if (zoneTitle) {

    zoneTitle.textContent =
      "⏳ กำลังตรวจสอบจุดตรวจ...";

  }


  try {

    /*
     * ---------------------------------------------
     * API URL
     * ---------------------------------------------
     */

    const apiUrl =
      `${GOOGLE_APPS_SCRIPT_URL}` +
      `?action=locationByPoint` +
      `&pointId=${encodeURIComponent(POINT_ID)}`;


    console.log(
      "GGN Location API:",
      apiUrl
    );


    /*
     * ---------------------------------------------
     * Request
     * ---------------------------------------------
     */

    const response =
      await fetch(
        apiUrl
      );


    /*
     * ---------------------------------------------
     * ตรวจ HTTP Response
     * ---------------------------------------------
     */

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    /*
     * ---------------------------------------------
     * อ่าน JSON
     * ---------------------------------------------
     */

    const result =
      await response.json();


    console.log(
      "GGN Location Result:",
      result
    );


    /*
     * ---------------------------------------------
     * ตรวจ Success
     * ---------------------------------------------
     */

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


    /*
     * ---------------------------------------------
     * อ่าน Data
     * ---------------------------------------------
     */

    const data =
      result.data || {};


    /*
     * ---------------------------------------------
     * ตรวจ Point ID
     * ---------------------------------------------
     */

    const returnedPointId =
      String(
        data.pointId ||
        POINT_ID
      ).trim();


    /*
     * ---------------------------------------------
     * ตรวจ Zone
     * ---------------------------------------------
     */

    const returnedZone =
      String(
        data.zone ||
        ""
      ).trim();


    /*
     * ---------------------------------------------
     * ตรวจ Location
     * ---------------------------------------------
     */

    const returnedLocation =
      String(
        data.location ||
        ""
      ).trim();


    /*
     * ---------------------------------------------
     * ต้องมี Zone
     * ---------------------------------------------
     */

    if (!returnedZone) {

      throw new Error(
        "Backend ไม่ส่งข้อมูล zone"
      );

    }


    /*
     * ---------------------------------------------
     * อัปเดตข้อมูลปัจจุบัน
     * ---------------------------------------------
     */

    currentZone =
      returnedZone;


    currentLocation =
      returnedLocation;


    /*
     * ---------------------------------------------
     * แสดงข้อมูล
     * ---------------------------------------------
     */

    updateLocationDisplay();


    /*
     * ---------------------------------------------
     * Log
     * ---------------------------------------------
     */

    console.log(
      "GGN Point Verified:",
      {

        pointId:
          returnedPointId,

        zone:
          currentZone,

        location:
          currentLocation

      }
    );


    /*
     * ---------------------------------------------
     * สำเร็จ
     * ---------------------------------------------
     */

    return true;


  } catch (error) {

    console.error(
      "GGN Location Error:",
      error
    );


    /*
     * ---------------------------------------------
     * กรณีตรวจสอบจุดไม่สำเร็จ
     * ---------------------------------------------
     */

    if (zoneTitle) {

      zoneTitle.textContent =
        "❌ ไม่สามารถตรวจสอบจุดตรวจได้";

    }


    return false;

  }

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
   * -----------------------------------------------
   * CHECK-IN
   * -----------------------------------------------
   */

  if (checkinBtn) {

    checkinBtn.addEventListener(
      "click",
      () => {

        /*
         * ถ้ามี pointId
         * ส่ง pointId ต่อไปด้วย
         */

        if (POINT_ID) {

          window.location.href =
            `./checkin.html?pointId=${encodeURIComponent(POINT_ID)}`;

          return;

        }


        /*
         * -----------------------------------------
         * Logic เดิม
         * -----------------------------------------
         */

        window.location.href =
          `./checkin.html?zone=${encodeURIComponent(currentZone)}`;

      }
    );

  }


  /*
   * -----------------------------------------------
   * CHECK-OUT
   * -----------------------------------------------
   */

  if (checkoutBtn) {

    checkoutBtn.addEventListener(
      "click",
      () => {

        /*
         * ถ้ามี pointId
         * ส่ง pointId ต่อไปด้วย
         */

        if (POINT_ID) {

          window.location.href =
            `./checkout.html?pointId=${encodeURIComponent(POINT_ID)}`;

          return;

        }


        /*
         * -----------------------------------------
         * Logic เดิม
         * -----------------------------------------
         */

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
   * -----------------------------------------------
   * INDEX PAGE
   * -----------------------------------------------
   */

  if (
    currentPage === "" ||
    currentPage === "index.html"
  ) {

    /*
     * ถ้ามี QR pointId
     * ตรวจสอบจุดก่อน
     */

    if (POINT_ID) {

      await loadLocationByPoint();

    } else {

      /*
       * ไม่มี QR
       * ใช้ระบบเดิม
       */

      updateLocationDisplay();

    }


    /*
     * เริ่มปุ่ม Index
     */

    initializeIndex();

  }

}


// ==================================================
// START
// ==================================================

startApplication();