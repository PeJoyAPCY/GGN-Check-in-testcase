// ==================================================
// GGN CHECK-IN
// CHECKOUT.JS
// Version 2.0
//
// หน้าที่:
// - Check-out
// - ชื่อ
// - ประเภทงาน
// - หมายเหตุ
// - ส่งข้อมูล
// - รองรับ QR Point ID
// - ใช้ Zone / Location จาก Backend
//
// QR FLOW:
//
// checkout.html?pointId=P001
//        ↓
// app.js
//        ↓
// locationByPoint
//        ↓
// Zone + Location
//        ↓
// checkout.js
//        ↓
// ส่งข้อมูลตาม Zone จริง
//
// IMPORTANT:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ใช้ POINT_ID จาก app.js
// - ใช้ getCurrentZone()
// - ใช้ getCurrentLocation()
// - ไม่ใช้ ZONE สำหรับ QR
// - Logic Check-out เดิมยังคงอยู่
// ==================================================


// ==================================================
// INITIALIZE CHECK-OUT
// ==================================================

async function initializeCheckout() {

  const previewText =
    getElement("previewText");


  const extraText =
    getElement("text");


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
  //
  // ถ้ามี pointId
  // ต้องตรวจสอบ Backend ก่อน
  // ==================================================

  try {

    if (
      typeof POINT_ID !== "undefined" &&
      POINT_ID
    ) {

      status.textContent =
        "⏳ กำลังตรวจสอบจุดตรวจ...";


      /*
       * เรียก Backend ผ่าน app.js
       *
       * เพื่อให้แน่ใจว่า
       * currentZone
       * currentLocation
       *
       * เป็นค่าจริงของ pointId
       */

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
  // PREVIEW TEXT
  // ==================================================

  function updatePreviewText() {

    const job =
      getSelectedJob() ||
      "-";


    const extra =
      extraText
        ? extraText.value.trim()
        : "";


    const name =
      fullname.value.trim() ||
      "-";


    const zone =
      getCheckoutZone();


    const location =
      getCheckoutLocation();


    const pointId =
      getCheckoutPointId();


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    const action =
      "ออกงาน";


    /*
     * -----------------------------------------------
     * แสดงข้อมูลจุด
     * -----------------------------------------------
     */

    let locationText =
      `📍 เขต: ${zone}`;


    if (
      location &&
      location !== "-"
    ) {

      locationText +=
        `\n📌 จุดตรวจ: ${location}`;

    }


    if (pointId) {

      locationText +=
        `\n🔖 Point ID: ${pointId}`;

    }


    previewText.textContent =

      `📅 ${nowStr}\n` +

      locationText +
      `\n` +

      `👤 ชื่อ: ${name}\n` +

      `📌 งาน: ${job}\n` +

      `🔄 รายการ: ${action}` +

      (
        extra
          ? `\n📝 ${extra}`
          : ""
      );

  }


  // ==================================================
  // INPUT EVENTS
  // ==================================================

  fullname.addEventListener(
    "input",
    updatePreviewText
  );


  if (extraText) {

    extraText.addEventListener(
      "input",
      updatePreviewText
    );

  }


  document
    .querySelectorAll(
      'input[name="jobType"]'
    )
    .forEach(
      radio => {

        radio.addEventListener(
          "change",
          updatePreviewText
        );

      }
    );


  // ==================================================
  // SEND
  // ==================================================

  async function sendData() {

    const name =
      fullname.value.trim();


    const job =
      getSelectedJob();


    const extraMsg =
      extraText
        ? extraText.value.trim()
        : "";


    const zone =
      getCheckoutZone();


    const location =
      getCheckoutLocation();


    const pointId =
      getCheckoutPointId();


    // ==================================================
    // NAME
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
    // JOB
    // ==================================================

    if (!job) {

      status.textContent =
        "❌ กรุณาเลือกประเภทงาน";

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
      // ==================================================

      const payload = {

        /*
         * Zone จริงจาก Backend
         */

        zone:
          zone,


        /*
         * จุดตรวจจริง
         */

        location:
          location,


        /*
         * Point ID จาก QR
         */

        pointId:
          pointId,


        fullname:
          name,


        jobType:
          "Check out (ออกงาน) - " + job,


        extraText:
          extraMsg

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


    if (extraText) {

      extraText.value =
        "";

    }


    document
      .querySelectorAll(
        'input[name="jobType"]'
      )
      .forEach(
        radio => {

          radio.checked =
            false;

        }
      );


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
  // INITIAL
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
