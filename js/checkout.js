
// ==================================================
// GGN CHECK-IN
// CHECKOUT.JS
// Version 3.3
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
// V3.3 BUTTON PROTECTION
//
// IMPORTANT:
// - ก่อน Validation → ปุ่มยังใช้งานได้
// - Validation เดิมยังทำงานเหมือนเดิม
// - เมื่อผ่าน Validation และเริ่มส่งข้อมูล
//   → ล็อกปุ่มทันที
// - ป้องกันการกดส่งซ้ำ
// - ระหว่างส่งปุ่ม disabled
// - ส่งสำเร็จ → reset และปลดล็อก
// - ส่งไม่สำเร็จ → ปลดล็อกเพื่อส่งใหม่
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
  // ==================================================

  function updateLocationPreview() {

    updatePreviewText();

  }


  // ==================================================
  // POINT VERIFICATION
  // ==================================================

  function ensurePointVerification() {

    const pointId =
      getCheckoutPointId();


    if (!pointId) {

      return Promise.resolve(
        false
      );

    }


    if (
      isCheckoutLocationVerified()
    ) {

      updateLocationPreview();


      return Promise.resolve(
        true
      );

    }


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
  // ==================================================

  fullname.addEventListener(
    "input",
    updatePreviewText
  );


  // ==================================================
  // SEND
  // ==================================================

  async function sendData() {

    /*
     * IMPORTANT
     *
     * ถ้าปุ่มถูก Lock อยู่
     * ไม่ให้ทำงานซ้ำอีกชั้นหนึ่ง
     *
     * ป้องกันกรณี Event ถูกเรียกซ้ำ
     */

    if (
      sendBtn.disabled
    ) {

      return;

    }


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


    // ==================================================
    // LOCK BUTTON
    //
    // สำคัญ:
    //
    // ล็อกตรงนี้เท่านั้น
    //
    // เพราะ Validation ทั้งหมด
    // ผ่านเรียบร้อยแล้ว
    // ==================================================

    sendBtn.disabled =
      true;


    try {

      // ==================================================
      // SENDING STATUS
      // ==================================================

      status.textContent =
        "⏳ กำลังส่งข้อมูล...";


      // ==================================================
      // PAYLOAD
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


      // ==================================================
      // SEND
      // ==================================================

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

      // ==================================================
      // UNLOCK BUTTON
      //
      // ส่งสำเร็จหรือไม่สำเร็จ
      // จึงปลดล็อกปุ่ม
      // ==================================================

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


  // ==================================================
  // START POINT VERIFICATION
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