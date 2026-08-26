// ==================================================
// GGN CHECK-IN
// CHECKIN.JS
// Version 2.0
//
// หน้าที่:
// - Check-in
// - ชื่อ
// - ประเภทงาน
// - รูปภาพ
// - Preview
// - ประมวลผลรูป
// - Base64
// - ส่งข้อมูล
// - รองรับ QR Point ID
// - ใช้ Zone / Location จาก Backend
//
// QR FLOW:
//
// checkin.html?pointId=P001
//        ↓
// app.js
//        ↓
// locationByPoint
//        ↓
// Zone + Location
//        ↓
// checkin.js
//        ↓
// ส่งข้อมูลตาม Zone จริง
//
// IMPORTANT:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก app.js
// - ใช้ POINT_ID จาก app.js
// - ใช้ getCurrentZone()
// - ใช้ getCurrentLocation()
// - ไม่ใช้ ZONE สำหรับ QR
// - Logic รูปภาพเดิมยังคงอยู่
// ==================================================


// ==================================================
// INITIALIZE CHECK-IN
// ==================================================

async function initializeCheckin() {

  const imageInput =
    getElement("imageInput");


  const previewContainer =
    getElement("previewContainer");


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


  const canvas =
    getElement("canvas");


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
      "GGN Check-in Point Verification Error:",
      error
    );

  }


  // ==================================================
  // CURRENT LOCATION
  // ==================================================

  function getCheckinZone() {

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


  function getCheckinLocation() {

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


  function getCheckinPointId() {

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
  // STATE
  // ==================================================

  let photos = [];


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
      getCheckinZone();


    const location =
      getCheckinLocation();


    const pointId =
      getCheckinPointId();


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    const action =
      "เข้างาน";


    /*
     * -----------------------------------------------
     * แสดงข้อมูลจุด
     * -----------------------------------------------
     */

    let locationText =
      `📍 เขต: ${zone}`;


    if (location && location !== "-") {

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
  // IMAGE PREVIEW
  // ==================================================

  function updatePreview() {

    if (!previewContainer) {

      return;

    }


    previewContainer.innerHTML =
      "";


    photos.forEach(
      file => {

        const img =
          document.createElement(
            "img"
          );


        img.src =
          URL.createObjectURL(
            file
          );


        previewContainer.appendChild(
          img
        );

      }
    );

  }


  // ==================================================
  // IMAGE SELECT
  // ==================================================

  if (imageInput) {

    imageInput.addEventListener(
      "change",
      e => {

        photos =
          Array.from(
            e.target.files
          ).filter(
            file => {

              if (
                file.type === "image/heic" ||
                file.name
                  .toLowerCase()
                  .endsWith(".heic")
              ) {

                status.textContent =
                  "❌ ไม่รองรับไฟล์ .heic กรุณาใช้ .jpg หรือ .png";

                return false;

              }


              return true;

            }
          );


        updatePreview();

        updatePreviewText();

      }
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
  // PROCESS IMAGE
  // ==================================================

  async function processImage(file) {

    return new Promise(
      (resolve, reject) => {

        const img =
          new Image();


        const objectUrl =
          URL.createObjectURL(
            file
          );


        img.onload =
          () => {

            try {

              canvas.width =
                img.naturalWidth;

              canvas.height =
                img.naturalHeight;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
              );


              ctx.drawImage(
                img,
                0,
                0
              );


              canvas.toBlob(
                blob => {

                  URL.revokeObjectURL(
                    objectUrl
                  );


                  if (!blob) {

                    reject(
                      new Error(
                        "ไม่สามารถประมวลผลรูปภาพได้"
                      )
                    );

                    return;

                  }


                  resolve(
                    blob
                  );

                },
                "image/jpeg",
                0.9
              );


            } catch (error) {

              URL.revokeObjectURL(
                objectUrl
              );


              reject(
                error
              );

            }

          };


        img.onerror =
          () => {

            URL.revokeObjectURL(
              objectUrl
            );


            reject(
              new Error(
                "ไม่สามารถเปิดรูปภาพได้"
              )
            );

          };


        img.src =
          objectUrl;

      }
    );

  }


  // ==================================================
  // BLOB → BASE64
  // ==================================================

  function blobToBase64(blob) {

    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();


        reader.onload =
          () => {

            resolve(
              reader.result
            );

          };


        reader.onerror =
          () => {

            reject(
              new Error(
                "ไม่สามารถอ่านรูปภาพได้"
              )
            );

          };


        reader.readAsDataURL(
          blob
        );

      }
    );

  }


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
      getCheckinZone();


    const location =
      getCheckinLocation();


    const pointId =
      getCheckinPointId();


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
    // CHECK-IN IMAGE
    // ==================================================

    if (
      photos.length === 0
    ) {

      status.textContent =
        "❌ กรุณาเลือกรูปภาพ";

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

      for (
        let i = 0;
        i < photos.length;
        i++
      ) {

        status.textContent =
          `⏳ กำลังส่งรูป ${i + 1}/${photos.length}...`;


        const blob =
          await processImage(
            photos[i]
          );


        const imageBase64 =
          await blobToBase64(
            blob
          );


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
            "Check in (เข้างาน) - " + job,


          extraText:
            extraMsg,


          imageBase64:
            imageBase64,


          imageName:
            `checkin-${Date.now()}-${i + 1}.jpg`

        };


        console.log(
          "GGN Check-in Payload:",
          payload
        );


        await sendRequest(
          payload
        );

      }


      // ==================================================
      // SUCCESS
      // ==================================================

      status.textContent =
        "✅ Check-in สำเร็จ";


      resetForm();


    } catch (error) {

      console.error(
        "GGN Check-in Error:",
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


    photos =
      [];


    if (imageInput) {

      imageInput.value =
        "";

    }


    updatePreview();


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
// START CHECK-IN
// ==================================================

if (
  currentPage === "checkin.html"
) {

  initializeCheckin();

}
