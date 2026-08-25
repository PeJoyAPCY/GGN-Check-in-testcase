// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 3
//
// หน้าที่:
// - Common Function
// - Google Apps Script URL
// - Zone
// - Current Page
// - Page Navigation
// - Index Page
// ==================================================


// ==================================================
// GOOGLE APPS SCRIPT
// ==================================================

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw0JQofeb4nDdIY91oak4YF6wTCEZzG-nuW6_lqLyRk1EwbBAgFZSIFDDgI-4v5C7G5Fg/exec";


// ==================================================
// ZONE
// ==================================================

const ZONE =
  "ทดสอบ";


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
// PAGE NAVIGATION
// ==================================================

function goToDashboard() {

  window.location.href =
    "./dashboard.html";

}


function goToQRManagement() {

  window.location.href =
    "./qr.html";

}


// ==================================================
// INDEX PAGE
// ==================================================

function initializeIndex() {

  const checkinBtn =
    getElement("checkinBtn");


  const checkoutBtn =
    getElement("checkoutBtn");


  if (checkinBtn) {

    checkinBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          `./checkin.html?zone=${encodeURIComponent(ZONE)}`;

      }
    );

  }


  if (checkoutBtn) {

    checkoutBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          `./checkout.html?zone=${encodeURIComponent(ZONE)}`;

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