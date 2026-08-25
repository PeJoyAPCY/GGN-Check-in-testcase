// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 3
//
// หน้าที่:
// - Common Function
// - Google Apps Script URL
// - Zone
// - Point ID
// - Current Page
// - Index Page
// - รองรับข้อมูลจาก QR
//
// โครงสร้าง:
// - zone     = เขต
// - location = จุดตรวจ
// - pointId  = รหัส/ลำดับจุดตรวจ และใช้สร้าง QR
//
// IMPORTANT:
// - ไม่แก้ Backend
// - ไม่แก้ API
// - ยังไม่แก้ Dashboard
// ==================================================


// ==================================================
// GOOGLE APPS SCRIPT
// ==================================================

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw0JQofeb4nDdIY91oak4YF6wTCEZzG-nuW6_lqLyRk1EwbBAgFZSIFDDgI-4v5C7G5Fg/exec";


// ==================================================
// URL PARAMETERS
// ==================================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );


// ==================================================
// ZONE
//
// อ่านจาก URL
//
// ตัวอย่าง:
// ?zone=เขต%201
//
// ถ้าไม่มี zone:
// ใช้ "ทดสอบ" เป็นค่าเริ่มต้น
// ==================================================

const ZONE =
  (
    urlParams.get("zone") ||
    "ทดสอบ"
  ).trim();


// ==================================================
// POINT ID
//
// อ่าน Point ID จาก URL
//
// ตัวอย่าง:
// ?pointId=P001
//
// QR ในอนาคตจะเป็นตัวส่งค่า Point ID เข้ามา
// ==================================================

const POINT_ID =
  (
    urlParams.get("pointId") ||
    ""
  ).trim();


// ==================================================
// PAGE
// ==================================================

const currentPage =
  window.location.pathname
    .split("/")
    .pop();


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
// GET ZONE
// ==================================================

function getZone() {

  return ZONE;

}


// ==================================================
// GET POINT ID
// ==================================================

function getPointId() {

  return POINT_ID;

}


// ==================================================
// CHECK POINT ID
// ==================================================

function hasPointId() {

  return Boolean(
    POINT_ID
  );

}


// ==================================================
// ZONE DISPLAY
// ==================================================

const zoneTitle =
  getElement("zoneTitle");


if (zoneTitle) {

  zoneTitle.textContent =
    ZONE;

}


// ==================================================
// POINT ID DISPLAY
//
// ถ้าหน้าไหนมี:
//
// id="pointId"
//
// ระบบจะแสดง Point ID ให้อัตโนมัติ
// ==================================================

const pointIdElement =
  getElement("pointId");


if (pointIdElement) {

  pointIdElement.textContent =
    POINT_ID || "-";

}


// ==================================================
// BUILD PAGE URL
//
// ใช้ส่ง zone และ pointId
// ไปยังหน้าถัดไป
// ==================================================

function buildPageUrl(
  page
) {

  const params =
    new URLSearchParams();


  if (ZONE) {

    params.set(
      "zone",
      ZONE
    );

  }


  if (POINT_ID) {

    params.set(
      "pointId",
      POINT_ID
    );

  }


  return (
    `./${page}?${params.toString()}`
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


  // --------------------------------------------------
  // CHECK-IN
  // --------------------------------------------------

  if (checkinBtn) {

    checkinBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          buildPageUrl(
            "checkin.html"
          );

      }
    );

  }


  // --------------------------------------------------
  // CHECK-OUT
  // --------------------------------------------------

  if (checkoutBtn) {

    checkoutBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          buildPageUrl(
            "checkout.html"
          );

      }
    );

  }

}


// ==================================================
// START APPLICATION
// ==================================================

if (
  currentPage === "" ||
  currentPage === "index.html"
) {

  initializeIndex();

}