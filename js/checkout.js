// ==================================================
// GGN CHECK-IN
// CHECKOUT.JS
// Version 1
//
// หน้าที่:
// - Check-out
// - ชื่อ
// - ประเภทงาน
// - หมายเหตุ
// - ส่งข้อมูล
// ==================================================


// ==================================================
// INITIALIZE CHECK-OUT
// ==================================================

function initializeCheckout() {

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


  // =================================================
  // PREVIEW TEXT
  // =================================================

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


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    const action =
      "ออกงาน";


    previewText.textContent =

      `📅 ${nowStr}\n` +

      `📍 จุด: ${ZONE}\n` +

      `👤 ชื่อ: ${name}\n` +

      `📌 งาน: ${job}\n` +

      `🔄 รายการ: ${action}` +

      (
        extra
          ? `\n📝 ${extra}`
          : ""
      );

  }


  // =================================================
  // INPUT EVENTS
  // =================================================

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


  // =================================================
  // SEND
  // =================================================

  async function sendData() {

    const name =
      fullname.value.trim();


    const job =
      getSelectedJob();


    const extraMsg =
      extraText
        ? extraText.value.trim()
        : "";


    // -----------------------------------------------
    // NAME
    // -----------------------------------------------

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


    // -----------------------------------------------
    // JOB
    // -----------------------------------------------

    if (!job) {

      status.textContent =
        "❌ กรุณาเลือกประเภทงาน";

      return;

    }


    // -----------------------------------------------
    // API
    // -----------------------------------------------

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


      const payload = {

        zone:
          ZONE,

        fullname:
          name,

        jobType:
          "Check out (ออกงาน) - " + job,

        extraText:
          extraMsg

      };


      await sendRequest(
        payload
      );


      // =================================================
      // SUCCESS
      // =================================================

      status.textContent =
        "✅ Check-out สำเร็จ";


      resetForm();


    } catch (error) {

      console.error(
        "GGN Check Error:",
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


  // =================================================
  // REQUEST
  // =================================================

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


  // =================================================
  // RESET
  // =================================================

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


  // =================================================
  // BUTTON
  // =================================================

  sendBtn.addEventListener(
    "click",
    sendData
  );


  // =================================================
  // INITIAL
  // =================================================

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