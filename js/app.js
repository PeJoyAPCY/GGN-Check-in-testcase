// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 1 - Base
// ==================================================


// ==================================================
// GOOGLE APPS SCRIPT
// ==================================================

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx2m2LxgDZfEjaHf3RJLF7MU6004tA_6vP_dFp3aDSuefSgbq5k__nUpfPPp2Y-Lj2Pig/exec";


// ==================================================
// ZONE
// ==================================================

const ZONE =
  "ทดสอบ";


// ==================================================
// ELEMENTS
// ==================================================

const imageInput =
  document.getElementById(
    "imageInput"
  );


const previewContainer =
  document.getElementById(
    "previewContainer"
  );


const previewText =
  document.getElementById(
    "previewText"
  );


const extraText =
  document.getElementById(
    "text"
  );


const fullname =
  document.getElementById(
    "fullname"
  );


const status =
  document.getElementById(
    "status"
  );


const sendBtn =
  document.getElementById(
    "sendBtn"
  );


const canvas =
  document.getElementById(
    "canvas"
  );


const ctx =
  canvas.getContext(
    "2d"
  );


// ==================================================
// PHOTOS
// ==================================================

let photos = [];


// ==================================================
// GET JOB TYPE
// ==================================================

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
// IMAGE SELECT
// ==================================================

imageInput.addEventListener(
  "change",
  (e) => {

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
              "❌ ส่งไม่สำเร็จ: ไม่รองรับไฟล์ .heic กรุณาใช้ .jpg หรือ .png";

            return false;

          }

          return true;

        }
      );


    updatePreview();

    updatePreviewText();

  }
);


// ==================================================
// IMAGE PREVIEW
// ==================================================

function updatePreview() {

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
// TEXT PREVIEW
// ==================================================

function updatePreviewText() {

  const job =
    getSelectedJob() ||
    "-";


  const extra =
    extraText.value.trim();


  const name =
    fullname.value.trim() ||
    "-";


  const now =
    new Date();


  const nowStr =
    now.toLocaleString(
      "th-TH"
    );


  previewText.textContent =

    `📅 ${nowStr}\n` +

    `👤 ชื่อ: ${name}\n` +

    `📌 งาน: ${job}` +

    (
      extra
        ? `\n📝 จุดรักษาการณ์ ${extra}`
        : ""
    );

}


// ==================================================
// EVENTS
// ==================================================

extraText.addEventListener(
  "input",
  updatePreviewText
);


fullname.addEventListener(
  "input",
  updatePreviewText
);


document
  .querySelectorAll(
    'input[name="jobType"]'
  )
  .forEach(
    el => {

      el.addEventListener(
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


      img.onload =
        () => {

          try {

            canvas.width =
              img.naturalWidth;

            canvas.height =
              img.naturalHeight;


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

            reject(
              error
            );

          }

        };


      img.onerror =
        () => {

          reject(
            new Error(
              "ไม่สามารถเปิดรูปภาพได้"
            )
          );

        };


      img.src =
        URL.createObjectURL(
          file
        );

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
// SEND TO GOOGLE APPS SCRIPT
// ==================================================

async function sendToGoogleAppsScript() {


  const name =
    fullname.value.trim();


  const job =
    getSelectedJob();


  const extraMsg =
    extraText.value.trim();


  // -----------------------------------------------
  // VALIDATE NAME
  // -----------------------------------------------

  if (!name) {

    status.textContent =
      "❌ ส่งไม่สำเร็จ: กรุณากรอกชื่อ-นามสกุล";

    fullname.focus();

    return;

  }


  if (/\d/.test(name)) {

    status.textContent =
      "❌ ส่งไม่สำเร็จ: ห้ามกรอกตัวเลขในชื่อ-นามสกุล";

    fullname.focus();

    return;

  }


  // -----------------------------------------------
  // VALIDATE JOB
  // -----------------------------------------------

  if (!job) {

    status.textContent =
      "❌ ส่งไม่สำเร็จ: กรุณาเลือกประเภทงาน";

    return;

  }


  // -----------------------------------------------
  // VALIDATE IMAGE
  // -----------------------------------------------

  if (
    photos.length === 0
  ) {

    status.textContent =
      "❌ ส่งไม่สำเร็จ: กรุณาเลือกรูปภาพ";

    return;

  }


  // -----------------------------------------------
  // CHECK API URL
  // -----------------------------------------------

  if (
    !GOOGLE_APPS_SCRIPT_URL ||
    GOOGLE_APPS_SCRIPT_URL.includes(
      "https://script.google.com/macros/s/AKfycbx2m2LxgDZfEjaHf3RJLF7MU6004tA_6vP_dFp3aDSuefSgbq5k__nUpfPPp2Y-Lj2Pig/exec"
    )
  ) {

    status.textContent =
      "❌ ส่งไม่สำเร็จ: ยังไม่ได้ตั้งค่า Google Apps Script URL";

    return;

  }


  // -----------------------------------------------
  // UI
  // -----------------------------------------------

  sendBtn.disabled =
    true;


  status.textContent =
    `⏳ กำลังส่งรูป 1/${photos.length}...`;


  updatePreviewText();


  try {


    // -------------------------------------------
    // SEND EACH PHOTO
    // -------------------------------------------

    for (
      let i = 0;
      i < photos.length;
      i++
    ) {


      status.textContent =
        `⏳ กำลังส่งรูป ${i + 1}/${photos.length}...`;


      // -----------------------------------------
      // PROCESS IMAGE
      // -----------------------------------------

      const blob =
        await processImage(
          photos[i]
        );


      // -----------------------------------------
      // BASE64
      // -----------------------------------------

      const imageBase64 =
        await blobToBase64(
          blob
        );


      // -----------------------------------------
      // DATA
      // -----------------------------------------

      const payload = {

        zone:
          ZONE,

        fullname:
          name,

        jobType:
          job,

        extraText:
          extraMsg,

        imageBase64:
          imageBase64,

        imageName:
          `checkin-${Date.now()}-${i + 1}.jpg`

      };


      console.log(
        "กำลังส่งข้อมูลไป Apps Script",
        payload
      );


      // -----------------------------------------
      // API REQUEST
      // -----------------------------------------

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


      // -----------------------------------------
      // RESPONSE
      // -----------------------------------------

      const result =
        await response.json();


      console.log(
        "Apps Script response:",
        result
      );


      // -----------------------------------------
      // CHECK RESULT
      // -----------------------------------------

      if (
        !result.success
      ) {

        throw new Error(
          result.message ||
          "Apps Script ส่งข้อมูลไม่สำเร็จ"
        );

      }

    }


    // =========================================
    // SUCCESS
    // =========================================

    status.textContent =
      "✅ ส่งสำเร็จ";


    // =========================================
    // RESET FORM
    // =========================================

    photos = [];


    updatePreview();


    previewText.textContent =
      "";


    extraText.value =
      "";


    fullname.value =
      "";


    imageInput.value =
      "";


    document
      .querySelectorAll(
        'input[name="jobType"]'
      )
      .forEach(
        el => {

          el.checked =
            false;

        }
      );


  } catch (error) {


    // =========================================
    // ERROR
    // =========================================

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
// BUTTON
// ==================================================

sendBtn.addEventListener(
  "click",
  sendToGoogleAppsScript
);


// ==================================================
// INITIAL PREVIEW
// ==================================================

updatePreviewText();
