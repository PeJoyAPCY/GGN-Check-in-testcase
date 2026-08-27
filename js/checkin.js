// ==================================================
// GGN CHECK-IN
// CHECKIN.JS
// Version 3.2
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
// V3.2 PERFORMANCE
//
// IMPORTANT CHANGE:
// - Preview แสดงทันที
// - ไม่รอ Location ก่อนเริ่มหน้า
// - ไม่สร้าง Location Request เอง
// - ใช้ loadLocationByPoint() จาก app.js V4.2
// - ใช้ Promise เดียวกับ App
// - ไม่ยิง Point API ซ้ำ
// - ถ้า Location ยังโหลดอยู่ตอนกดส่ง
//   → รอ Promise เดิม
// - เมื่อ Backend ตอบกลับ
//   → Update Preview ทันที
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
  // LOCATION STATE
  //
  // V3.2
  //
  // ใช้สถานะจาก App เป็นหลัก
  // ==================================================

  let locationError =
    false;


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
        ""
      );

    }


    return "";

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

      return (
        POINT_ID ||
        ""
      );

    }


    return "";

  }


  // ==================================================
  // PREVIEW TEXT
  //
  // สำคัญ:
  //
  // ฟังก์ชันนี้ต้องทำงานได้ทันที
  // โดยไม่ต้องรอ Location
  // ==================================================

  function updatePreviewText() {

    const name =
      fullname.value.trim() ||
      "-";


    const location =
      getCheckinLocation();


    const displayLocation =
      location ||
      "กำลังค้นหาจุดตรวจ...";


    const now =
      new Date();


    const nowStr =
      now.toLocaleString(
        "th-TH"
      );


    if (previewText) {

      previewText.textContent =

        "🟢 CHECK-IN\n\n" +

        `📍 จุด: ${displayLocation}\n` +

        `👤 ผู้ปฏิบัติงาน: ${name}\n` +

        `🕐 เวลา: ${nowStr}`;

    }

  }


  // ==================================================
  // STATE
  // ==================================================

  let photo =
    null;


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


        // ----------------------------------------------
        // HEIC
        // ----------------------------------------------

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


        // ----------------------------------------------
        // SAVE PHOTO
        // ----------------------------------------------

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
  // LOCATION REQUEST
  //
  // V3.2
  //
  // ไม่สร้าง Request ใหม่
  //
  // ใช้ loadLocationByPoint()
  // จาก app.js V4.2
  //
  // app.js เป็นผู้จัดการ Promise
  // ==================================================

  function startLocationVerification() {

    const pointId =
      getCheckinPointId();


    if (!pointId) {

      locationError =
        true;


      updatePreviewText();


      return null;

    }


    if (
      typeof loadLocationByPoint !== "function"
    ) {

      console.warn(
        "GGN: loadLocationByPoint() ไม่พบ"
      );


      locationError =
        true;


      updatePreviewText();


      return null;

    }


    /*
     * สำคัญ:
     *
     * ไม่ await
     *
     * และไม่สร้าง fetch ใหม่
     *
     * loadLocationByPoint()
     * จะคืน Promise เดิมจาก app.js
     */

    const promise =
      loadLocationByPoint();


    if (
      !promise ||
      typeof promise.then !== "function"
    ) {

      console.warn(
        "GGN: loadLocationByPoint() ไม่คืน Promise"
      );


      locationError =
        true;


      updatePreviewText();


      return null;

    }


    promise.then(
      success => {

        if (!success) {

          locationError =
            true;


          updatePreviewText();


          return;

        }


        const loadedLocation =
          getCheckinLocation();


        const loadedZone =
          getCheckinZone();


        if (
          loadedLocation &&
          loadedLocation !== "-"
        ) {

          locationError =
            false;


          console.log(
            "⚡ GGN Check-in Location Ready:",
            {

              pointId:
                pointId,

              zone:
                loadedZone,

              location:
                loadedLocation

            }
          );


          /*
           * Location มาแล้ว
           *
           * Update Preview ทันที
           */

          updatePreviewText();


        } else {

          locationError =
            true;


          console.warn(
            "GGN Check-in: ไม่พบ Location",
            pointId
          );


          updatePreviewText();

        }

      }
    ).catch(
      error => {

        locationError =
          true;


        console.error(
          "GGN Check-in Point Verification Error:",
          error
        );


        updatePreviewText();

      }
    );


    return promise;

  }


  // ==================================================
  // WAIT FOR LOCATION
  //
  // V3.2
  //
  // ใช้ Promise เดิมจาก app.js
  //
  // ไม่มี Request ใหม่
  // ==================================================

  async function waitForLocation() {

    const pointId =
      getCheckinPointId();


    if (!pointId) {

      throw new Error(
        "ไม่พบรหัสจุดตรวจ"
      );

    }


    /*
     * ถ้ามีผลตรวจสอบสำเร็จแล้ว
     * ไม่ต้องรอ
     */

    if (
      typeof isLocationVerified === "function" &&
      isLocationVerified()
    ) {

      return true;

    }


    /*
     * ขอ Promise เดิมจาก App
     */

    if (
      typeof loadLocationByPoint !== "function"
    ) {

      throw new Error(
        "ไม่พบระบบตรวจสอบจุดตรวจ"
      );

    }


    const result =
      await loadLocationByPoint();


    if (!result) {

      throw new Error(
        "ไม่สามารถตรวจสอบจุดตรวจได้"
      );

    }


    const location =
      getCheckinLocation();


    const zone =
      getCheckinZone();


    if (
      !location ||
      location === "-"
    ) {

      throw new Error(
        "ไม่พบจุดตรวจ"
      );

    }


    if (
      !zone ||
      zone === "-"
    ) {

      throw new Error(
        "ไม่พบเขตของจุดตรวจ"
      );

    }


    locationError =
      false;


    updatePreviewText();


    return true;

  }


  // ==================================================
  // SEND
  // ==================================================

  async function sendData() {

    const name =
      fullname.value.trim();


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
    // VALIDATE POINT
    // ==================================================

    if (!pointId) {

      status.textContent =
        "❌ ไม่พบรหัสจุดตรวจ";


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

      // ==================================================
      // VERIFY LOCATION
      //
      // ถ้ายังไม่เสร็จ
      // → รอ Promise เดิม
      //
      // ไม่ยิง API ใหม่
      // ==================================================

      status.textContent =
        "⏳ กำลังตรวจสอบจุดตรวจ...";


      await waitForLocation();


      // ==================================================
      // GET VERIFIED DATA
      // ==================================================

      const zone =
        getCheckinZone();


      const location =
        getCheckinLocation();


      // ==================================================
      // FINAL VALIDATION
      // ==================================================

      if (
        locationError ||
        !location ||
        location === "-"
      ) {

        throw new Error(
          "ไม่พบจุดตรวจ"
        );

      }


      if (
        !zone ||
        zone === "-"
      ) {

        throw new Error(
          "ไม่พบเขตของจุดตรวจ"
        );

      }


      // ==================================================
      // PROCESS IMAGE
      // ==================================================

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


      // ==================================================
      // SEND
      // ==================================================

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
  //
  // สำคัญ:
  //
  // Preview ขึ้นก่อน Location
  // ==================================================

  updatePreviewText();


  // ==================================================
  // BACKGROUND LOCATION VERIFICATION
  //
  // V3.2
  //
  // ไม่ await
  //
  // ใช้ Promise เดียวกับ app.js
  // ==================================================

  if (
    typeof POINT_ID !== "undefined" &&
    POINT_ID
  ) {

    startLocationVerification();

  }

}


// ==================================================
// START CHECK-IN
// ==================================================

if (
  currentPage === "checkin.html"
) {

  initializeCheckin();

}