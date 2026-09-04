
// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 5.5
//
// หน้าที่:
// - Dashboard
// - Summary
// - Zone
// - Point Status
// - Status Dashboard
// - Refresh
// - Menu Navigation
//
// V5.5 CHANGE:
// - ใช้ GOOGLE_APPS_SCRIPT_URL จาก APP.JS
// - Dashboard API + Status Dashboard API เรียกพร้อมกัน
// - ใช้ Promise.all()
// - ใช้ cache: "no-store"
// - Cache Busting ด้วย timestamp
// - เอา Custom Headers ออก เพื่อป้องกัน CORS Preflight
// - แสดงเวลา API แยกรายตัว
// - แสดงเวลารวมของ Dashboard
// - ตรวจสอบ Response ก่อน JSON Parse
//
// IMPORTANT
// - ไม่เปลี่ยน Backend
// - ไม่เปลี่ยน API
// - ไม่เปลี่ยน Payload
// - ไม่เปลี่ยน Status Logic
// - ไม่เปลี่ยน UI Structure
// ==================================================


// ==================================================
// GLOBAL
// ==================================================

let dashboardLoading = false;


// ==================================================
// ELEMENTS
// ==================================================

const dashboardStatus =
  document.getElementById("dashboardStatus");

const dashboardSummary =
  document.getElementById("dashboardSummary");

const dashboardZones =
  document.getElementById("dashboardZones");

const refreshDashboardBtn =
  document.getElementById("refreshDashboardBtn");

const dashboardMenuBtn =
  document.getElementById("dashboardMenuBtn");

const qrManagementMenuBtn =
  document.getElementById("qrManagementMenuBtn");


// ==================================================
// LOAD DASHBOARD
// V5.5
// ==================================================

async function loadDashboard() {

  // ------------------------------------------------
  // Prevent duplicate loading
  // ------------------------------------------------

  if (dashboardLoading) {

    console.warn(
      "⚠️ Dashboard is already loading"
    );

    return;
  }

  dashboardLoading = true;


  // ------------------------------------------------
  // TOTAL TIMER
  // ------------------------------------------------

  const totalStart =
    performance.now();


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  setDashboardStatus(
    "กำลังโหลดข้อมูล..."
  );

  setRefreshButtonLoading(
    true
  );


  // ------------------------------------------------
  // CACHE BUST
  // ------------------------------------------------

  const cacheBust =
    Date.now();


  // ==================================================
  // IMPORTANT
  //
  // ใช้ URL ตัวจริงจาก APP.JS V4.2
  //
  // GOOGLE_APPS_SCRIPT_URL
  // ==================================================

  if (
    typeof GOOGLE_APPS_SCRIPT_URL === "undefined" ||
    !GOOGLE_APPS_SCRIPT_URL
  ) {

    const error =
      new Error(
        "ไม่พบ GOOGLE_APPS_SCRIPT_URL จาก app.js"
      );

    console.error(
      "❌ Dashboard Configuration Error:",
      error
    );

    setDashboardStatus(
      "❌ ไม่พบ Google Apps Script URL"
    );

    setRefreshButtonLoading(
      false
    );

    dashboardLoading =
      false;

    return;
  }


  // ------------------------------------------------
  // API URL
  // ------------------------------------------------

  const dashboardUrl =
    `${GOOGLE_APPS_SCRIPT_URL}` +
    `?action=dashboard` +
    `&_ts=${cacheBust}`;

  const statusDashboardUrl =
    `${GOOGLE_APPS_SCRIPT_URL}` +
    `?action=statusdashboard` +
    `&_ts=${cacheBust}`;


  console.log(
    "🚀 GGN Dashboard V5.5"
  );

  console.log(
    "📡 Dashboard URL:",
    dashboardUrl
  );

  console.log(
    "📡 Status Dashboard URL:",
    statusDashboardUrl
  );


  // ==================================================
  // API TIMERS
  // ==================================================

  const dashboardStart =
    performance.now();

  const statusStart =
    performance.now();


  try {

    // ==================================================
    // DASHBOARD API
    //
    // IMPORTANT:
    // ไม่มี custom headers
    //
    // เพื่อไม่ให้ Browser ส่ง CORS Preflight
    // ==================================================

    const dashboardPromise =
      fetch(
        dashboardUrl,
        {
          method: "GET",
          cache: "no-store"
        }
      )
      .then(
        async response => {

          const elapsed =
            Math.round(
              performance.now() -
              dashboardStart
            );

          console.log(
            `⏱️ Dashboard API response: ${elapsed} ms`
          );


          if (!response.ok) {

            throw new Error(
              `Dashboard API HTTP ${response.status}`
            );
          }


          // ------------------------------------------------
          // Read as text first
          //
          // ป้องกัน Unexpected token '<'
          // และช่วยตรวจว่า Backend ส่งอะไรกลับมา
          // ------------------------------------------------

          const text =
            await response.text();

          const trimmed =
            text.trim();


          if (
            !trimmed
          ) {

            throw new Error(
              "Dashboard API returned empty response"
            );
          }


          // ------------------------------------------------
          // ตรวจ JSON
          // ------------------------------------------------

          let json;

          try {

            json =
              JSON.parse(
                trimmed
              );

          } catch (parseError) {

            console.error(
              "❌ Dashboard API returned non-JSON:",
              trimmed.substring(
                0,
                500
              )
            );

            throw new Error(
              "Dashboard API ไม่ได้ส่ง JSON กลับมา"
            );
          }


          console.log(
            "GGN Dashboard API:",
            json
          );


          return json;
        }
      );


    // ==================================================
    // STATUS DASHBOARD API
    //
    // IMPORTANT:
    // ไม่มี custom headers
    //
    // เพื่อไม่ให้ Browser ส่ง CORS Preflight
    // ==================================================

    const statusPromise =
      fetch(
        statusDashboardUrl,
        {
          method: "GET",
          cache: "no-store"
        }
      )
      .then(
        async response => {

          const elapsed =
            Math.round(
              performance.now() -
              statusStart
            );

          console.log(
            `⏱️ Status Dashboard API response: ${elapsed} ms`
          );


          if (!response.ok) {

            throw new Error(
              `Status Dashboard API HTTP ${response.status}`
            );
          }


          // ------------------------------------------------
          // Read as text first
          // ------------------------------------------------

          const text =
            await response.text();

          const trimmed =
            text.trim();


          if (
            !trimmed
          ) {

            throw new Error(
              "Status Dashboard API returned empty response"
            );
          }


          // ------------------------------------------------
          // Parse JSON
          // ------------------------------------------------

          let json;

          try {

            json =
              JSON.parse(
                trimmed
              );

          } catch (parseError) {

            console.error(
              "❌ Status Dashboard API returned non-JSON:",
              trimmed.substring(
                0,
                500
              )
            );

            throw new Error(
              "Status Dashboard API ไม่ได้ส่ง JSON กลับมา"
            );
          }


          console.log(
            "GGN Status Dashboard API:",
            json
          );


          return json;
        }
      );


    // ==================================================
    // RUN BOTH API AT THE SAME TIME
    // ==================================================

    const [
      dashboardResponse,
      statusResponse
    ] =
      await Promise.all([
        dashboardPromise,
        statusPromise
      ]);


    // ==================================================
    // VALIDATE DASHBOARD RESPONSE
    // ==================================================

    if (
      !dashboardResponse ||
      dashboardResponse.success !== true
    ) {

      throw new Error(
        dashboardResponse?.message ||
        "Dashboard API failed"
      );
    }


    // ==================================================
    // VALIDATE STATUS RESPONSE
    // ==================================================

    if (
      !statusResponse ||
      statusResponse.success !== true
    ) {

      throw new Error(
        statusResponse?.message ||
        "Status Dashboard API failed"
      );
    }


    // ==================================================
    // DATA
    // ==================================================

    const dashboardData =
      dashboardResponse.data || {};

    const statusData =
      statusResponse.data || {};


    // ==================================================
    // MERGE
    // ==================================================

    const mergedData =
      mergeDashboardStatus(
        dashboardData,
        statusData
      );


    // ==================================================
    // RENDER SUMMARY
    // ==================================================

    renderSummary(
      mergedData.summary
    );


    // ==================================================
    // RENDER ZONES
    // ==================================================

    renderZones(
      mergedData.zones
    );


    // ==================================================
    // TOTAL TIME
    // ==================================================

    const totalElapsed =
      Math.round(
        performance.now() -
        totalStart
      );

    const dashboardElapsed =
      Math.round(
        performance.now() -
        dashboardStart
      );

    const statusElapsed =
      Math.round(
        performance.now() -
        statusStart
      );


    console.log(
      `⚡ Dashboard loaded in ${totalElapsed} ms`
    );

    console.log(
      "📊 Dashboard timing:",
      {
        totalMs:
          totalElapsed,

        dashboardApiMs:
          dashboardElapsed,

        statusApiMs:
          statusElapsed
      }
    );


    // ==================================================
    // SUCCESS
    // ==================================================

    setDashboardStatus(
      `อัปเดตล่าสุด ${formatDashboardTime(new Date())}`
    );


  } catch (error) {

    console.error(
      "❌ Dashboard load error:",
      error
    );


    setDashboardStatus(
      "ไม่สามารถโหลดข้อมูล Dashboard ได้"
    );


    if (
      dashboardZones
    ) {

      dashboardZones.innerHTML = `
        <div class="dashboard-error">

          <div class="dashboard-error-title">
            ⚠️ ไม่สามารถโหลดข้อมูลได้
          </div>

          <div class="dashboard-error-message">
            ${escapeHtml(
              error?.message ||
              "เกิดข้อผิดพลาดในการเชื่อมต่อ"
            )}
          </div>

        </div>
      `;
    }


  } finally {

    dashboardLoading =
      false;

    setRefreshButtonLoading(
      false
    );
  }
}


// ==================================================
// SET DASHBOARD STATUS
// ==================================================

function setDashboardStatus(
  message
) {

  if (
    !dashboardStatus
  ) {

    return;
  }


  dashboardStatus.textContent =
    message;
}


// ==================================================
// REFRESH BUTTON STATE
// ==================================================

function setRefreshButtonLoading(
  loading
) {

  if (
    !refreshDashboardBtn
  ) {

    return;
  }


  refreshDashboardBtn.disabled =
    loading;


  if (
    loading
  ) {

    refreshDashboardBtn.dataset.originalText =
      refreshDashboardBtn.textContent;

    refreshDashboardBtn.textContent =
      "กำลังโหลด...";

  } else {

    refreshDashboardBtn.textContent =
      refreshDashboardBtn.dataset.originalText ||
      "รีเฟรช";
  }
}


// ==================================================
// MERGE DASHBOARD + STATUS
// ==================================================

function mergeDashboardStatus(
  dashboardData,
  statusData
) {

  const statuses =
    Array.isArray(
      statusData?.statuses
    )
      ? statusData.statuses
      : [];


  // ------------------------------------------------
  // Summary
  // ------------------------------------------------

  const summary =
    buildDashboardSummaryFromStatus(
      statuses
    );


  // ------------------------------------------------
  // Base Zones
  // ------------------------------------------------

  const baseZones =
    Array.isArray(
      dashboardData?.zones
    )
      ? dashboardData.zones
      : [];


  // ------------------------------------------------
  // Status Map
  // ------------------------------------------------

  const statusMap =
    new Map();


  statuses.forEach(
    status => {

      if (
        status &&
        status.pointId
      ) {

        statusMap.set(
          String(
            status.pointId
          ),
          status
        );
      }
    }
  );


  // ------------------------------------------------
  // Merge Points
  // ------------------------------------------------

  const zones =
    baseZones.map(
      zone => {

        const points =
          Array.isArray(
            zone.points
          )
            ? zone.points
            : [];


        const mergedPoints =
          points.map(
            point => {

              const pointId =
                String(
                  point.pointId ||
                  ""
                );


              const status =
                statusMap.get(
                  pointId
                );


              if (
                status
              ) {

                return applyStatusToPoint(
                  point,
                  status
                );
              }


              return {
                ...point
              };
            }
          );


        const zoneSummary =
          updateZoneSummary(
            mergedPoints
          );


        return {
          ...zone,

          points:
            mergedPoints,

          summary:
            zoneSummary
        };
      }
    );


  return {
    ...dashboardData,

    summary,

    zones
  };
}


// ==================================================
// BUILD SUMMARY FROM STATUS
// ==================================================

function buildDashboardSummaryFromStatus(
  statuses
) {

  let total =
    statuses.length;

  let complete =
    0;

  let partial =
    0;

  let notStarted =
    0;

  let noSetting =
    0;

  let error =
    0;


  statuses.forEach(
    status => {

      const value =
        String(
          status?.status ||
          ""
        ).toUpperCase();


      switch (value) {

        case "COMPLETE":

          complete++;

          break;


        case "PARTIAL":

          partial++;

          break;


        case "NOT_STARTED":

          notStarted++;

          break;


        case "NO_SETTING":

          noSetting++;

          break;


        case "ERROR":

          error++;

          break;


        default:

          break;
      }
    }
  );


  const checkIn =
    complete +
    partial;


  const noData =
    notStarted +
    noSetting +
    error;


  return {

    total,

    checkIn,

    checkOut: 0,

    noData,

    complete,

    partial,

    notStarted,

    noSetting,

    error
  };
}


// ==================================================
// APPLY STATUS TO POINT
// ==================================================

function applyStatusToPoint(
  point,
  status
) {

  const persons =
    Array.isArray(
      status?.persons
    )
      ? status.persons
      : [];


  let fullname =
    "";

  let timestamp =
    "";


  if (
    persons.length
  ) {

    fullname =
      persons
        .map(
          person =>
            person.fullname ||
            person.name ||
            ""
        )
        .filter(Boolean)
        .join(", ");


    timestamp =
      persons[0]?.timestamp ||
      persons[0]?.time ||
      "";
  }


  return {

    ...point,

    status:
      status.status,

    statusText:
      status.statusText,

    requiredCount:
      status.requiredCount,

    checkedInCount:
      status.checkedInCount,

    remainingCount:
      status.remainingCount,

    hasSetting:
      status.hasSetting,

    dayType:
      status.dayType,

    shift:
      status.shift,

    persons,

    fullname,

    timestamp,

    statusIcon:
      getDashboardStatusIcon(
        status.status
      )
  };
}


// ==================================================
// STATUS ICON
// ==================================================

function getDashboardStatusIcon(
  status
) {

  switch (
    String(
      status || ""
    ).toUpperCase()
  ) {

    case "COMPLETE":

      return "🟢";


    case "PARTIAL":

      return "🟡";


    case "NOT_STARTED":

      return "⚪";


    case "NO_SETTING":

      return "⚫";


    case "ERROR":

      return "🔴";


    default:

      return "⚪";
  }
}


// ==================================================
// UPDATE ZONE SUMMARY
// ==================================================

function updateZoneSummary(
  points
) {

  let total =
    points.length;

  let complete =
    0;

  let partial =
    0;

  let notStarted =
    0;

  let noSetting =
    0;

  let error =
    0;


  points.forEach(
    point => {

      const status =
        String(
          point?.status ||
          ""
        ).toUpperCase();


      switch (status) {

        case "COMPLETE":

          complete++;

          break;


        case "PARTIAL":

          partial++;

          break;


        case "NOT_STARTED":

          notStarted++;

          break;


        case "NO_SETTING":

          noSetting++;

          break;


        case "ERROR":

          error++;

          break;


        default:

          break;
      }
    }
  );


  return {

    total,

    complete,

    partial,

    notStarted,

    noSetting,

    error,

    checkIn:
      complete +
      partial,

    noData:
      notStarted +
      noSetting +
      error
  };
}


// ==================================================
// RENDER SUMMARY
// ==================================================

function renderSummary(
  summary
) {

  if (
    !dashboardSummary
  ) {

    return;
  }


  const data =
    summary || {};


  dashboardSummary.innerHTML = `
    <div class="dashboard-summary-card">

      <div class="dashboard-summary-label">
        จุดทั้งหมด
      </div>

      <div class="dashboard-summary-value">
        ${Number(
          data.total || 0
        )}
      </div>

    </div>


    <div class="dashboard-summary-card">

      <div class="dashboard-summary-label">
        เข้างาน
      </div>

      <div class="dashboard-summary-value">
        ${Number(
          data.checkIn || 0
        )}
      </div>

    </div>


    <div class="dashboard-summary-card">

      <div class="dashboard-summary-label">
        ออกงาน
      </div>

      <div class="dashboard-summary-value">
        ${Number(
          data.checkOut || 0
        )}
      </div>

    </div>


    <div class="dashboard-summary-card">

      <div class="dashboard-summary-label">
        ไม่มีข้อมูล
      </div>

      <div class="dashboard-summary-value">
        ${Number(
          data.noData || 0
        )}
      </div>

    </div>
  `;
}


// ==================================================
// RENDER ZONES
// ==================================================

function renderZones(
  zones
) {

  if (
    !dashboardZones
  ) {

    return;
  }


  if (
    !Array.isArray(zones) ||
    zones.length === 0
  ) {

    dashboardZones.innerHTML = `
      <div class="dashboard-empty">
        ไม่พบข้อมูลจุด
      </div>
    `;

    return;
  }


  dashboardZones.innerHTML =
    zones
      .map(
        zone => {

          const zoneName =
            zone.zone ||
            zone.name ||
            "ไม่ระบุเขต";


          const points =
            Array.isArray(
              zone.points
            )
              ? zone.points
              : [];


          const summary =
            zone.summary ||
            updateZoneSummary(
              points
            );


          return `
            <section class="dashboard-zone">

              <div class="dashboard-zone-header">

                <div class="dashboard-zone-title">
                  ${escapeHtml(
                    zoneName
                  )}
                </div>

                <div class="dashboard-zone-summary">
                  ${Number(
                    summary.checkIn || 0
                  )}/${Number(
                    summary.total || 0
                  )}
                </div>

              </div>


              <div class="dashboard-points-grid">

                ${
                  points.length
                    ? points
                        .map(
                          createPointCard
                        )
                        .join("")
                    : `
                      <div class="dashboard-empty">
                        ไม่พบจุดในเขตนี้
                      </div>
                    `
                }

              </div>

            </section>
          `;
        }
      )
      .join("");
}


// ==================================================
// CREATE POINT CARD
// ==================================================

function createPointCard(
  point
) {

  const status =
    String(
      point?.status ||
      ""
    ).toUpperCase();


  const icon =
    point?.statusIcon ||
    getDashboardStatusIcon(
      status
    );


  const pointId =
    point?.pointId ||
    "-";


  const location =
    point?.location ||
    "-";


  const statusText =
    point?.statusText ||
    "";


  const required =
    Number(
      point?.requiredCount || 0
    );


  const checkedIn =
    Number(
      point?.checkedInCount || 0
    );


  const hasSetting =
    point?.hasSetting !== false;


  let manpowerHtml =
    "";


  if (
    hasSetting
  ) {

    manpowerHtml = `
      <div class="dashboard-point-manpower">
        👥 ${checkedIn}/${required}
      </div>
    `;

  } else {

    manpowerHtml = `
      <div class="dashboard-point-manpower">
        👥 ไม่มีการตั้งกำลัง
      </div>
    `;
  }


  const persons =
    Array.isArray(
      point?.persons
    )
      ? point.persons
      : [];


  let personsHtml =
    "";


  if (
    persons.length
  ) {

    personsHtml =
      persons
        .map(
          person => {

            const name =
              person?.fullname ||
              person?.name ||
              "-";


            const time =
              formatDashboardTime(
                person?.timestamp ||
                person?.time
              );


            return `
              <div class="dashboard-point-person">

                👤 ${escapeHtml(name)}

                ${
                  time
                    ? ` · ${escapeHtml(time)}`
                    : ""
                }

              </div>
            `;
          }
        )
        .join("");
  }


  if (
    !personsHtml &&
    point?.fullname
  ) {

    const formattedTime =
      point.timestamp
        ? formatDashboardTime(
            point.timestamp
          )
        : "";


    personsHtml = `
      <div class="dashboard-point-person">

        👤 ${escapeHtml(
          point.fullname
        )}

        ${
          formattedTime
            ? ` · ${escapeHtml(
                formattedTime
              )}`
            : ""
        }

      </div>
    `;
  }


  if (
    !personsHtml &&
    point?.timestamp
  ) {

    personsHtml = `
      <div class="dashboard-point-person">

        ${escapeHtml(
          formatDashboardTime(
            point.timestamp
          )
        )}

      </div>
    `;
  }


  return `
    <div
      class="dashboard-point-card"
      data-point-id="${escapeHtml(
        pointId
      )}"
      data-status="${escapeHtml(
        status
      )}"
    >

      <div class="dashboard-point-header">

        <div class="dashboard-point-id">

          ${icon}

          ${escapeHtml(
            pointId
          )}

        </div>

      </div>


      <div class="dashboard-point-location">

        ${escapeHtml(
          location
        )}

      </div>


      ${
        statusText
          ? `
            <div class="dashboard-point-status">

              ${escapeHtml(
                statusText
              )}

            </div>
          `
          : ""
      }


      ${manpowerHtml}


      ${
        personsHtml
          ? `
            <div class="dashboard-point-persons">

              ${personsHtml}

            </div>
          `
          : ""
      }

    </div>
  `;
}


// ==================================================
// FORMAT TIME
// ==================================================

function formatDashboardTime(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "";
  }


  // ------------------------------------------------
  // Date object
  // ------------------------------------------------

  if (
    value instanceof Date
  ) {

    return formatDateObjectTime(
      value
    );
  }


  const text =
    String(
      value
    ).trim();


  if (
    !text
  ) {

    return "";
  }


  // ------------------------------------------------
  // HH:mm:ss
  // ------------------------------------------------

  const timeOnly =
    text.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );


  if (
    timeOnly
  ) {

    const hh =
      String(
        timeOnly[1]
      ).padStart(
        2,
        "0"
      );


    const mm =
      String(
        timeOnly[2]
      ).padStart(
        2,
        "0"
      );


    const ss =
      String(
        timeOnly[3] || "00"
      ).padStart(
        2,
        "0"
      );


    return `${hh}:${mm}:${ss}`;
  }


  // ------------------------------------------------
  // Native Date
  // ------------------------------------------------

  const parsed =
    new Date(
      text
    );


  if (
    !isNaN(
      parsed.getTime()
    )
  ) {

    return formatDateObjectTime(
      parsed
    );
  }


  // ------------------------------------------------
  // DD/MM/YYYY HH:mm:ss
  // ------------------------------------------------

  const thaiDate =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );


  if (
    thaiDate
  ) {

    const hh =
      String(
        thaiDate[4] || "00"
      ).padStart(
        2,
        "0"
      );


    const mm =
      String(
        thaiDate[5] || "00"
      ).padStart(
        2,
        "0"
      );


    const ss =
      String(
        thaiDate[6] || "00"
      ).padStart(
        2,
        "0"
      );


    return `${hh}:${mm}:${ss}`;
  }


  return text;
}


// ==================================================
// DATE OBJECT → TIME
// ==================================================

function formatDateObjectTime(
  date
) {

  if (
    !(date instanceof Date) ||
    isNaN(
      date.getTime()
    )
  ) {

    return "";
  }


  const hh =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );


  const mm =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );


  const ss =
    String(
      date.getSeconds()
    ).padStart(
      2,
      "0"
    );


  return `${hh}:${mm}:${ss}`;
}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


// ==================================================
// MENU
// ==================================================

function setupDashboardMenu() {

  if (
    dashboardMenuBtn
  ) {

    dashboardMenuBtn.addEventListener(
      "click",
      event => {

        event.preventDefault();


        if (
          currentPage === "dashboard.html"
        ) {

          return;
        }


        window.location.href =
          "./dashboard.html";
      }
    );
  }


  if (
    qrManagementMenuBtn
  ) {

    qrManagementMenuBtn.addEventListener(
      "click",
      event => {

        event.preventDefault();


        if (
          currentPage === "qr.html"
        ) {

          return;
        }


        window.location.href =
          "./qr.html";
      }
    );
  }
}


// ==================================================
// REFRESH BUTTON
// ==================================================

function setupDashboardRefresh() {

  if (
    !refreshDashboardBtn
  ) {

    return;
  }


  refreshDashboardBtn.addEventListener(
    "click",
    async () => {

      if (
        dashboardLoading
      ) {

        return;
      }


      await loadDashboard();
    }
  );
}


// ==================================================
// INITIALIZE
// ==================================================

function initDashboard() {

  setupDashboardMenu();

  setupDashboardRefresh();

  loadDashboard();
}


// ==================================================
// START
// ==================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      if (
        window.location.pathname
          .toLowerCase()
          .includes(
            "dashboard.html"
          )
      ) {

        initDashboard();
      }
    }
  );

} else {

  if (
    window.location.pathname
      .toLowerCase()
      .includes(
        "dashboard.html"
      )
  ) {

    initDashboard();
  }
}