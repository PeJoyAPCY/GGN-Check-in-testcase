// ==================================================
// GGN CHECK-IN
// APP.JS
// Version 2
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
// CHECK-IN / CHECK-OUT INITIALIZE
// ==================================================

function initializeForm() {

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


  let photos = [];


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
      currentPage === "checkin.html"
        ? "เข้างาน"
        : "ออกงาน";


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
  // IMAGE PREVIEW
  // =================================================

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


  // =================================================
  // IMAGE SELECT
  // =================================================

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
  // PROCESS IMAGE
  // =================================================

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


  // =================================================
  // BLOB → BASE64
  // =================================================

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


    const isCheckin =
      currentPage === "checkin.html";


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
    // CHECK-IN IMAGE
    // -----------------------------------------------

    if (
      isCheckin &&
      photos.length === 0
    ) {

      status.textContent =
        "❌ กรุณาเลือกรูปภาพ";

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

      // =================================================
      // CHECK-IN
      // =================================================

      if (isCheckin) {

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


          const payload = {

            zone:
              ZONE,

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


          await sendRequest(
            payload
          );

        }

      }


      // =================================================
      // CHECK-OUT
      // =================================================

      else {

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

      }


      // =================================================
      // SUCCESS
      // =================================================

      status.textContent =
        isCheckin
          ? "✅ Check-in สำเร็จ"
          : "✅ Check-out สำเร็จ";


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


    photos =
      [];


    if (imageInput) {

      imageInput.value =
        "";

    }


    updatePreview();


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
// START APPLICATION
// ==================================================

if (
  currentPage === "" ||
  currentPage === "index.html"
) {

  initializeIndex();

}


if (
  currentPage === "checkin.html" ||
  currentPage === "checkout.html"
) {

  initializeForm();

}