// ==================================================
// GGN CHECK-IN
// CHECKOUT.JS
// Version 3.2
//
// หน้าที่:
// - Check-out
// - ชื่อ
// - Preview แสดงทันที
// - ใช้ Point Verification จาก APP.JS V4.2
// - ใช้ Promise / Request เดียวร่วมกับระบบ
// - ใช้ Cache จาก APP.JS
// - ส่งข้อมูล
// - รองรับ QR Point ID
// - ใช้ Zone / Location จาก Backend
//
// รูปแบบ Preview / Telegram:
//
// 🔴 Check out - ออกงาน
// ━━━━━━━━━━━━━━━━━━━━━
// 📍 จุด: [Location]
// 👤 ผู้ปฏิบัติงาน: [ชื่อ]
// 🕐 เวลา: [เวลา]
// ━━━━━━━━━━━━━━━━━━━━━
//
// IMPORTANT:
// - Point ID ใช้ภายในระบบ
// - Zone ใช้ภายในระบบเพื่อเลือก Telegram Group
// - ไม่แสดง Point ID
// - ไม่แสดง Zone
// - ไม่มี jobType
// - ไม่มี extraText
// - ไม่มีหมายเหตุ
//
// V3.2:
//
// - ไม่ตรวจ Point ซ้ำเอง
// - ไม่สร้าง Promise ตรวจ Point เอง
// - ใช้ loadLocationByPoint() จาก APP.JS V4.2
// - ใช้ Verification Result จาก APP.JS
// - รองรับ Promise เดียวของระบบ
// - Preview ไม่รอ Location
// - Location อัปเดตเมื่อ Backend ตรวจสอบสำเร็จ
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
  // CURRENT ZONE
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


  // ==================================================
  // CURRENT LOCATION
  // ==================================================

  function getCheckoutLocation() {

    if (
      typeof getCurrentLocation === "function"
    ) {

      const location =
        getCurrentLocation();


      if (location) {

        return location;

      }

    }


    return "";

  }


  // ==================================================
  // CURRENT POINT ID
  // ==================================================

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

      return (
        POINT_ID ||
        ""
      );

    }


    return "";

  }


  // ==================================================
  // GET VERIFICATION RESULT
  //
  // V3.2
  //
  // ใช้ผลจาก APP.JS V4.2
  //
  // ไม่สร้าง Verification State ใหม่
  // ==================================================

  function getCheckoutVerificationResult() {

    if (
      typeof getLocationVerificationResult ===
      "function"
    ) {

      return (
        getLocationVerificationResult()
      );

    }


    return null;

  }


  // ==================================================
  // CHECK VERIFIED
  //
  // V3.2
  //
  // อ่านสถานะจาก APP.JS
  // ==================================================

  function isCheckoutLocationVerified() {

    if (
      typeof isLocationVerified ===
      "function"
    ) {

      return (
        isLocationVerified()
      );

    }


    return false;

  }


  // ==================================================
  // PREVIEW
  //
  // สำคัญ:
  // Preview ต้องขึ้นทันที
  //
  // ไม่รอ Location
  // ==================================================

  function updatePreviewText() {

    const name =
      fullname.value.trim() ||
      "-";


    const location =
      getCheckoutLocation();


    const displayLocation =
      location ||
      (
        getCheckoutPointId()
          ? "กำลังตรวจสอบ..."
          : "-"
      );


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    if (previewText) {

      previewText.textContent =

        "🔴 Check out - ออกงาน\n" +

        "━━━━━━━━━━━━━━━━━━━━━\n" +

        `📍 จุด: ${displayLocation}\n` +

        `👤 ผู้ปฏิบัติงาน: ${name}\n` +

        `🕐 เวลา: ${nowStr}\n` +

        "━━━━━━━━━━━━━━━━━━━━━";

    }

  }


  // ==================================================
  // UPDATE LOCATION PREVIEW
  //
  // เรียกหลัง APP.JS
  // ตรวจสอบ Point สำเร็จ
  // ==================================================

  function updateLocationPreview() {

    updatePreviewText();

  }


  // ==================================================
  // POINT VERIFICATION
  //
  // V3.2
  //
  // IMPORTANT:
  //
  // Checkout ไม่สร้าง Request เอง
  //
  // ใช้ Promise จาก APP.JS V4.2
  //
  // ถ้า APP.JS เริ่ม Request ไปแล้ว
  // จะได้รับ Promise เดิม
  //
  // ถ้า APP.JS ตรวจเสร็จแล้ว
  // จะได้รับผลที่ตรวจแล้วทันที
  // ==================================================

  function ensurePointVerification() {

    const pointId =
      getCheckoutPointId();


    // ----------------------------------------------
    // ไม่มี Point ID
    // ----------------------------------------------

    if (!pointId) {

      return Promise.resolve(
        false
      );

    }


    // ----------------------------------------------
    // ถ้า APP.JS ตรวจสำเร็จแล้ว
    // ----------------------------------------------

    if (
      isCheckoutLocationVerified()
    ) {

      updateLocationPreview();


      return Promise.resolve(
        true
      );

    }


    // ----------------------------------------------
    // ใช้ Promise จาก APP.JS
    // ----------------------------------------------

    if (
      typeof loadLocationByPoint !==
      "function"
    ) {

      console.warn(
        "GGN: loadLocationByPoint() ไม่พบ"
      );


      return Promise.resolve(
        false
      );

    }


    return loadLocationByPoint()

      .then(
        function(success) {

          updateLocationPreview();


          if (success !== true) {

            return false;

          }


          const result =
            getCheckoutVerificationResult();


          if (
            !result ||
            result.success !== true ||
            result.active !== true
          ) {

            return false;

          }


          return true;

        }
      )

      .catch(
        function(error) {

          console.error(
            "GGN Check-out Point Verification Error:",
            error
          );


          updateLocationPreview();


          return false;

        }
      );

  }


  // ==================================================
  // INPUT EVENT
  //
  // Preview เปลี่ยนทันทีเมื่อพิมพ์ชื่อ
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
    // POINT ID
    // ==================================================

    const pointId =
      getCheckoutPointId();


    if (!pointId) {

      status.textContent =
        "❌ ไม่พบรหัสจุดตรวจ";


      return;

    }


    // ==================================================
    // ENSURE POINT VERIFICATION
    //
    // V3.2
    //
    // ใช้ Promise เดียวจาก APP.JS
    // ==================================================

    if (
      !isCheckoutLocationVerified()
    ) {

      status.textContent =
        "⏳ กำลังตรวจสอบจุดตรวจ กรุณารอสักครู่...";


      const verified =
        await ensurePointVerification();


      if (!verified) {

        status.textContent =
          "❌ ไม่สามารถตรวจสอบจุดตรวจได้";


        return;

      }

    }


    // ==================================================
    // VERIFICATION RESULT
    // ==================================================

    const verificationResult =
      getCheckoutVerificationResult();


    if (
      !verificationResult ||
      verificationResult.success !== true ||
      verificationResult.active !== true
    ) {

      status.textContent =
        "❌ ไม่สามารถตรวจสอบจุดตรวจได้";


      return;

    }


    // ==================================================
    // CURRENT DATA
    //
    // อ่านหลัง Verification
    // เพื่อให้ได้ข้อมูลจาก Backend ล่าสุด
    // ==================================================

    const zone =
      getCheckoutZone();


    const location =
      getCheckoutLocation();


    // ==================================================
    // VALIDATE LOCATION
    // ==================================================

    if (
      !location
    ) {

      status.textContent =
        "❌ ไม่พบจุดตรวจ";


      return;

    }


    // ==================================================
    // VALIDATE ZONE
    // ==================================================

    if (
      !zone ||
      zone === "-"
    ) {

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
      // ไม่เปลี่ยนจาก V3.1
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
  //
  // ใช้สำหรับส่ง Check-out เท่านั้น
  //
  // ไม่เกี่ยวกับ Point Verification
  //
  // Point Verification ใช้ APP.JS
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
  //
  // สำคัญ:
  // ทำก่อนตรวจสอบ Point
  // ==================================================

  updatePreviewText();


  // ==================================================
  // START POINT VERIFICATION
  //
  // V3.2
  //
  // ไม่สร้าง Request ใหม่
  //
  // ใช้ Promise จาก APP.JS V4.2
  // ==================================================

  if (
    typeof POINT_ID !== "undefined" &&
    POINT_ID
  ) {

    status.textContent =
      "⏳ กำลังตรวจสอบจุดตรวจ...";


    ensurePointVerification()

      .then(
        function(success) {

          updateLocationPreview();


          if (!success) {

            status.textContent =
              "❌ ไม่สามารถตรวจสอบจุดตรวจได้";


            return;

          }


          /*
           * ตรวจสำเร็จ
           *
           * ไม่ต้องแสดงข้อความ
           */

          if (
            status.textContent ===
            "⏳ กำลังตรวจสอบจุดตรวจ..."
          ) {

            status.textContent =
              "";

          }

        }
      )

      .catch(
        function(error) {

          console.error(
            "GGN Check-out Verification Error:",
            error
          );


          status.textContent =
            "❌ ไม่สามารถตรวจสอบจุดตรวจได้";


          updateLocationPreview();

        }
      );

  }

}


// ==================================================
// START CHECK-OUT
// ==================================================

if (
  currentPage === "checkout.html"
) {

  initializeCheckout();

}