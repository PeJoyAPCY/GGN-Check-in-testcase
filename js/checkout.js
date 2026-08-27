// ==================================================
// GGN CHECK-IN
// CHECKOUT.JS
// Version 3.0
//
// หน้าที่:
// - Check-out
// - ชื่อ
// - Preview
// - ส่งข้อมูล
// - รองรับ QR Point ID
// - ใช้ Zone / Location จาก Backend
//
// รูปแบบ Preview / Telegram:
//
// 🔴 CHECK-OUT
//
// 📍 จุด: [Location]
// 👤 ผู้ปฏิบัติงาน: [ชื่อ]
// 🕐 เวลา: [เวลา]
//
// IMPORTANT:
// - Point ID ใช้ภายในระบบ
// - Zone ใช้ภายในระบบเพื่อเลือก Telegram Group
// - ไม่แสดง Point ID
// - ไม่แสดง Zone
// - ไม่มี jobType
// - ไม่มี extraText
// - ไม่มีหมายเหตุ
// ==================================================


// ==================================================
// INITIALIZE CHECK-OUT
// ==================================================

async function initializeCheckout() {

  const previewText =
    getElement("previewText");


  const fullname =
    getElement("fullname");


  const status =
    getElement("status");


  const sendBtn =
    getElement("sendBtn");


  if (
    !fullname ||
    !sendBtn ||
    !status
  ) {

    return;

  }


  // ==================================================
  // QR LOCATION VERIFICATION
  // ==================================================

  try {

    if (
      typeof POINT_ID !== "undefined" &&
      POINT_ID
    ) {

      status.textContent =
        "⏳ กำลังตรวจสอบจุดตรวจ...";


      if (
        typeof loadLocationByPoint === "function"
      ) {

        await loadLocationByPoint();

      }

    }

  } catch (error) {

    console.error(
      "GGN Check-out Point Verification Error:",
      error
    );

  }


  // ==================================================
  // CURRENT LOCATION
  // ==================================================

  function getCheckoutZone() {

    if (
      typeof getCurrentZone === "function"
    ) {

      return (
        getCurrentZone() ||
        "-"
      );

    }


    return (
      typeof ZONE !== "undefined"
        ? ZONE
        : "-"
    );

  }


  function getCheckoutLocation() {

    if (
      typeof getCurrentLocation === "function"
    ) {

      return (
        getCurrentLocation() ||
        "-"
      );

    }


    return "-";

  }


  function getCheckoutPointId() {

    if (
      typeof getCurrentPointId === "function"
    ) {

      return (
        getCurrentPointId() ||
        ""
      );

    }


    if (
      typeof POINT_ID !== "undefined"
    ) {

      return POINT_ID;

    }


    return "";

  }


  // ==================================================
  // PREVIEW
  //
  // รูปแบบเดียวกับ Telegram
  // ==================================================

  function updatePreviewText() {

    const name =
      fullname.value.trim() ||
      "-";


    const location =
      getCheckoutLocation();


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    previewText.textContent =

      "🔴 CHECK-OUT\n\n" +

      `📍 จุด: ${location}\n` +

      `👤 ผู้ปฏิบัติงาน: ${name}\n` +

      `🕐 เวลา: ${nowStr}`;

  }


  // ==================================================
  // INPUT EVENT
  // ==================================================

  fullname.addEventListener(
    "input",
    updatePreviewText
  );


  // ==================================================
  // SEND
  // ==================================================

  async function sendData() {

    const name =
      fullname.value.trim();


    const zone =
      getCheckoutZone();


    const location =
      getCheckoutLocation();


    const pointId =
      getCheckoutPointId();


    // ==================================================
    // VALIDATE NAME
    // ==================================================

    if (!name) {

      status.textContent =
        "❌ กรุณากรอกชื่อ-นามสกุล";

      fullname.focus();

      return;

    }


    if (/\d/.test(name)) {

      status.textContent =
        "❌ ห้ามกรอกตัวเลขในชื่อ-นามสกุล";

      fullname.focus();

      return;

    }


    // ==================================================
    // VALIDATE LOCATION
    // ==================================================

    if (!location || location === "-") {

      status.textContent =
        "❌ ไม่พบจุดตรวจ";

      return;

    }


    // ==================================================
    // VALIDATE POINT
    // ==================================================

    if (!pointId) {

      status.textContent =
        "❌ ไม่พบรหัสจุดตรวจ";

      return;

    }


    // ==================================================
    // VALIDATE ZONE
    // ==================================================

    if (!zone || zone === "-") {

      status.textContent =
        "❌ ไม่พบเขตของจุดตรวจ";

      return;

    }


    // ==================================================
    // API
    // ==================================================

    if (!GOOGLE_APPS_SCRIPT_URL) {

      status.textContent =
        "❌ ยังไม่ได้ตั้งค่า Google Apps Script URL";

      return;

    }


    sendBtn.disabled =
      true;


    try {

      status.textContent =
        "⏳ กำลังส่งข้อมูล...";


      // ==================================================
      // PAYLOAD
      //
      // ส่งเฉพาะข้อมูลที่ Backend จำเป็นต้องใช้
      // ==================================================

      const payload = {

        action:
          "checkout",

        zone:
          zone,

        location:
          location,

        pointId:
          pointId,

        fullname:
          name

      };


      console.log(
        "GGN Check-out Payload:",
        payload
      );


      await sendRequest(
        payload
      );


      // ==================================================
      // SUCCESS
      // ==================================================

      status.textContent =
        "✅ Check-out สำเร็จ";


      resetForm();


    } catch (error) {

      console.error(
        "GGN Check-out Error:",
        error
      );


      status.textContent =
        "❌ ส่งไม่สำเร็จ" +
        (
          error.message
            ? `: ${error.message}`
            : ""
        );


    } finally {

      sendBtn.disabled =
        false;

    }

  }


  // ==================================================
  // REQUEST
  // ==================================================

  async function sendRequest(payload) {

    const response =
      await fetch(
        GOOGLE_APPS_SCRIPT_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "Apps Script:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Apps Script ส่งข้อมูลไม่สำเร็จ"
      );

    }


    return result;

  }


  // ==================================================
  // RESET
  // ==================================================

  function resetForm() {

    fullname.value =
      "";


    updatePreviewText();

  }


  // ==================================================
  // BUTTON
  // ==================================================

  sendBtn.addEventListener(
    "click",
    sendData
  );


  // ==================================================
  // INITIAL PREVIEW
  // ==================================================

  updatePreviewText();

}


// ==================================================
// START CHECK-OUT
// ==================================================

if (
  currentPage === "checkout.html"
) {

  initializeCheckout();

}