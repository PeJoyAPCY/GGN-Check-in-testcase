// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 3
//
// หน้าที่:
// - Common Function
// - Google Apps Script URL
// - Zone
// - Point ID จาก QR
// - Current Page
// - Index Page
// - Page Navigation
// ==================================================


// ==================================================
// GOOGLE APPS SCRIPT
// ==================================================

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw0JQofeb4nDdIY91oak4Y6FwTCEZzG-nuW6_lqLyRk1EwbBAgFZSIFDDgI-4v5C7G5Fg/exec";


// ==================================================
// ZONE
// ==================================================

const ZONE =
  "ทดสอบ";


// ==================================================
// URL PARAMETERS
// ==================================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );


// ==================================================
// POINT ID
//
// รับจาก QR Code
//
// ตัวอย่าง:
// index.html?pointId=P001
// ==================================================

const POINT_ID =
  String(
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
// ZONE DISPLAY
// ==================================================

const zoneTitle =
  getElement("zoneTitle");


if (zoneTitle) {

  zoneTitle.textContent =
    ZONE;

}


// ==================================================
// INDEX PAGE
// ==================================================

function initializeIndex() {

  const checkinBtn =
    getElement("checkinBtn");


  const checkoutBtn =
    getElement("checkoutBtn");


  // =================================================
  // CHECK-IN
  // =================================================

  if (checkinBtn) {

    checkinBtn.addEventListener(
      "click",
      () => {

        const params =
          new URLSearchParams();


        params.set(
          "zone",
          ZONE
        );


        if (POINT_ID) {

          params.set(
            "pointId",
            POINT_ID
          );

        }


        window.location.href =
          `./checkin.html?${params.toString()}`;

      }
    );

  }


  // =================================================
  // CHECK-OUT
  // =================================================

  if (checkoutBtn) {

    checkoutBtn.addEventListener(
      "click",
      () => {

        const params =
          new URLSearchParams();


        params.set(
          "zone",
          ZONE
        );


        if (POINT_ID) {

          params.set(
            "pointId",
            POINT_ID
          );

        }


        window.location.href =
          `./checkout.html?${params.toString()}`;

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