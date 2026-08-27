// ==================================================
// GGN CHECK-IN
// CHECKIN.JS
// Version 3.0
//
// หน้าที่:
// - Check-in
// - ชื่อผู้ปฏิบัติงาน
// - รูปภาพ 1 รูป
// - Preview
// - ประมวลผลรูป
// - Base64
// - ส่งข้อมูล
// - รองรับ QR Point ID
// - ใช้ Zone / Location จาก Backend
//
// PREVIEW / TELEGRAM:
//
// 🟢 CHECK-IN
//
// 📍 จุด: [Location]
// 👤 ผู้ปฏิบัติงาน: [ชื่อ]
// 🕐 เวลา: [เวลา]
//
// IMPORTANT:
// - Point ID ใช้ภายในระบบ
// - Zone ใช้ภายในระบบ
// - ไม่แสดง Point ID
// - ไม่แสดง Zone
// - ไม่มี jobType
// - ไม่มี extraText
// - ไม่มีหมายเหตุ
// - ส่งรูปเพียง 1 รูป
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
  // ==================================================

      try {

      if (
        typeof POINT_ID !== "undefined" &&
        POINT_ID
      ) {

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
  // CURRENT ZONE
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


  // ==================================================
  // CURRENT LOCATION
  // ==================================================

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


  // ==================================================
  // CURRENT POINT ID
  // ==================================================

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

  let photo = null;


  // ==================================================
  // PREVIEW TEXT
  //
  // ต้องตรงกับ Telegram Caption
  // ==================================================

  function updatePreviewText() {

    const name =
      fullname.value.trim() ||
      "-";


    const location =
      getCheckinLocation();


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    previewText.textContent =

      "🟢 CHECK-IN\n\n" +

      `📍 จุด: ${location}\n` +

      `👤 ผู้ปฏิบัติงาน: ${name}\n` +

      `🕐 เวลา: ${nowStr}`;

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


    if (!photo) {

      return;

    }


    const img =
      document.createElement(
        "img"
      );


    img.src =
      URL.createObjectURL(
        photo
      );


    img.alt =
      "Preview Check-in";


    previewContainer.appendChild(
      img
    );

  }


  // ==================================================
  // IMAGE SELECT
  // ==================================================

  if (imageInput) {

    imageInput.addEventListener(
      "change",
      event => {

        const files =
          Array.from(
            event.target.files || []
          );


        if (!files.length) {

          photo =
            null;

          updatePreview();

          return;

        }


        const file =
          files[0];


        if (
          file.type === "image/heic" ||
          file.name
            .toLowerCase()
            .endsWith(".heic")
        ) {

          status.textContent =
            "❌ ไม่รองรับไฟล์ .heic กรุณาใช้ .jpg หรือ .png";


          imageInput.value =
            "";


          photo =
            null;


          updatePreview();

          return;

        }


        photo =
          file;


        status.textContent =
          "";


        updatePreview();

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


    const zone =
      getCheckinZone();


    const location =
      getCheckinLocation();


    const pointId =
      getCheckinPointId();


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

    if (
      !location ||
      location === "-"
    ) {

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

    if (
      !zone ||
      zone === "-"
    ) {

      status.textContent =
        "❌ ไม่พบเขตของจุดตรวจ";

      return;

    }


    // ==================================================
    // VALIDATE IMAGE
    // ==================================================

    if (!photo) {

      status.textContent =
        "❌ กรุณาถ่ายรูปหรือเลือกรูปภาพ";

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
        "⏳ กำลังประมวลผลรูปภาพ...";


      const blob =
        await processImage(
          photo
        );


      const imageBase64 =
        await blobToBase64(
          blob
        );


      // ==================================================
      // PAYLOAD
      // ==================================================

      const payload = {

        action:
          "checkin",

        zone:
          zone,

        location:
          location,

        pointId:
          pointId,

        fullname:
          name,

        imageBase64:
          imageBase64,

        imageName:
          `checkin-${Date.now()}.jpg`

      };


      console.log(
        "GGN Check-in Payload:",
        payload
      );


      status.textContent =
        "⏳ กำลังส่งข้อมูล...";


      await sendRequest(
        payload
      );


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


    photo =
      null;


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