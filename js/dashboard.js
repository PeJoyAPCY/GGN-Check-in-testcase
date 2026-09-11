// ==================================================
// GGN CHECK-IN
// DASHBOARD.JS
// Version 5.8
//
// หน้าที่:
// - Dashboard
// - Summary
// - Zone
// - Point Status
// - Status Dashboard
// - Refresh
// - Menu Navigation
// - Dashboard Base Cache
//
// V5.8 CHANGE:
// - แก้การแสดงเวลา person ที่เป็น Unix Timestamp milliseconds
// - รองรับ timestamp เช่น 1789084720686
// - แปลงเป็น HH:mm:ss ก่อนแสดงบน Card
//
// IMPORTANT
// - ไม่เปลี่ยน Backend
// - ไม่เปลี่ยน API
// - ไม่เปลี่ยน Status Logic
// - ไม่เปลี่ยน UI Structure
// - ไม่เปลี่ยน Card Design
// ==================================================


// ==================================================
// GLOBAL
// ==================================================

let dashboardLoading = false;


// ==================================================
// CACHE
// ==================================================

const DASHBOARD_CACHE_KEY =
  "GGN_DASHBOARD_BASE_V5_7";

const DASHBOARD_CACHE_VERSION =
  "5.7";


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
// NORMALIZE POINT ID
// V5.7
// ==================================================

function normalizePointId(value) {

  return String(value ?? "")
    .trim()
    .toUpperCase();

}


// ==================================================
// CACHE VALIDATION
// ==================================================

function isValidDashboardBase(data) {

  if (!data || typeof data !== "object") {
    return false;
  }

  if (!Array.isArray(data.zones)) {
    return false;
  }

  if (data.zones.length === 0) {
    return false;
  }

  return data.zones.some(zone =>
    Array.isArray(zone?.points) &&
    zone.points.length > 0
  );

}


// ==================================================
// SAVE DASHBOARD BASE CACHE
// ==================================================

function saveDashboardBaseCache(
  dashboardData
) {

  try {

    if (!isValidDashboardBase(dashboardData)) {

      console.warn(
        "⚠️ Dashboard cache skipped: invalid base data"
      );

      return false;
    }

    const cachePayload = {

      version:
        DASHBOARD_CACHE_VERSION,

      savedAt:
        Date.now(),

      data: {

        ...dashboardData,

        // ------------------------------------------------
        // Base Cache ต้องไม่เก็บข้อมูล Status สด
        // ------------------------------------------------

        zones:

          Array.isArray(
            dashboardData.zones
          )

            ? dashboardData.zones.map(
                zone => ({

                  ...zone,

                  points:

                    Array.isArray(
                      zone?.points
                    )

                      ? zone.points.map(
                          point => {

                            // --------------------------------
                            // เก็บเฉพาะ Base Point Data
                            // --------------------------------

                            const {

                              status,
                              statusText,
                              requiredCount,
                              checkedInCount,
                              remainingCount,
                              hasSetting,
                              dayType,
                              shift,
                              persons,
                              fullname,
                              timestamp,
                              statusIcon,

                              ...basePoint

                            } = point || {};

                            return {
                              ...basePoint
                            };

                          }
                        )

                      : []

                })
              )

            : []

      }

    };


    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify(
        cachePayload
      )
    );


    console.log(
      "💾 Dashboard base cache saved:",
      {

        version:
          cachePayload.version,

        pointCount:
          getDashboardPointCount(
            cachePayload.data
          )

      }
    );


    return true;

  } catch (error) {

    console.warn(
      "⚠️ Dashboard cache save failed:",
      error
    );

    return false;

  }

}


// ==================================================
// LOAD DASHBOARD BASE CACHE
// ==================================================

function loadDashboardBaseCache() {

  try {

    const raw =
      localStorage.getItem(
        DASHBOARD_CACHE_KEY
      );


    if (!raw) {
      return null;
    }


    const parsed =
      JSON.parse(raw);


    if (
      !parsed ||
      typeof parsed !== "object"
    ) {

      return null;

    }


    if (
      parsed.version !==
      DASHBOARD_CACHE_VERSION
    ) {

      console.log(
        "♻️ Dashboard cache version mismatch"
      );

      return null;

    }


    if (
      !parsed.data ||
      !isValidDashboardBase(
        parsed.data
      )
    ) {

      console.log(
        "♻️ Dashboard cache invalid"
      );

      return null;

    }


    console.log(
      "⚡ Dashboard base cache hit:",
      {

        ageMs:
          Date.now() -
          Number(
            parsed.savedAt || 0
          ),

        pointCount:
          getDashboardPointCount(
            parsed.data
          )

      }
    );


    return parsed.data;

  } catch (error) {

    console.warn(
      "⚠️ Dashboard cache load failed:",
      error
    );

    return null;

  }

}


// ==================================================
// CLEAR DASHBOARD CACHE
// ==================================================

function clearDashboardBaseCache() {

  try {

    localStorage.removeItem(
      DASHBOARD_CACHE_KEY
    );

    console.log(
      "🗑️ Dashboard base cache cleared"
    );

  } catch (error) {

    console.warn(
      "⚠️ Dashboard cache clear failed:",
      error
    );

  }

}


// ==================================================
// GET DASHBOARD POINT COUNT
// ==================================================

function getDashboardPointCount(
  dashboardData
) {

  if (
    !dashboardData ||
    !Array.isArray(
      dashboardData.zones
    )
  ) {

    return 0;

  }


  return dashboardData.zones.reduce(
    (
      total,
      zone
    ) => {

      return total +

        (
          Array.isArray(
            zone?.points
          )

            ? zone.points.length
            : 0
        );

    },
    0
  );

}


// ==================================================
// LOAD DASHBOARD
// V5.7
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
  // GOOGLE APPS SCRIPT URL
  // ==================================================

  if (
    typeof GOOGLE_APPS_SCRIPT_URL ===
      "undefined" ||
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
    "🚀 GGN Dashboard V5.7"
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
  // CACHE
  // ==================================================

  const cachedDashboardData =
    loadDashboardBaseCache();


  // ==================================================
  // API TIMERS
  // ==================================================

  let dashboardApiMs =
    null;

  let statusApiMs =
    null;


  // ==================================================
  // DASHBOARD API PROMISE
  // ==================================================

  const dashboardStart =
    performance.now();


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

        if (!response.ok) {

          throw new Error(
            `Dashboard API HTTP ${response.status}`
          );

        }


        const text =
          await response.text();


        const trimmed =
          text.trim();


        if (!trimmed) {

          throw new Error(
            "Dashboard API returned empty response"
          );

        }


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


        dashboardApiMs =
          Math.round(
            performance.now() -
            dashboardStart
          );


        console.log(
          `⏱️ Dashboard API response: ${dashboardApiMs} ms`
        );


        if (
          json &&
          json.success === true
        ) {

          const pointCount =
            getDashboardPointCount(
              json.data
            );


          console.log(
            "📡 GGN Dashboard API:",
            {

              success:
                true,

              zones:
                Array.isArray(
                  json.data?.zones
                )
                  ? json.data.zones.length
                  : 0,

              points:
                pointCount

            }
          );

        } else {

          console.warn(
            "⚠️ Dashboard API:",
            {

              success:
                json?.success,

              message:
                json?.message

            }
          );

        }


        return json;

      }
    );


  // ==================================================
  // STATUS DASHBOARD API PROMISE
  // ==================================================

  const statusStart =
    performance.now();


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

        if (!response.ok) {

          throw new Error(
            `Status Dashboard API HTTP ${response.status}`
          );

        }


        const text =
          await response.text();


        const trimmed =
          text.trim();


        if (!trimmed) {

          throw new Error(
            "Status Dashboard API returned empty response"
          );

        }


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


        statusApiMs =
          Math.round(
            performance.now() -
            statusStart
          );


        console.log(
          `⏱️ Status Dashboard API response: ${statusApiMs} ms`
        );


        if (
          json &&
          json.success === true
        ) {

          console.log(
            "📡 GGN Status Dashboard API:",
            {

              success:
                true,

              count:
                Number(
                  json.data?.count ||

                  (
                    Array.isArray(
                      json.data?.statuses
                    )

                      ? json.data.statuses.length

                      : (
                          json.data?.statuses &&
                          typeof json.data.statuses === "object"

                            ? Object.keys(
                                json.data.statuses
                              ).length

                            : 0
                        )
                  )
                ),

              date:
                json.data?.date || ""

            }
          );

        } else {

          console.warn(
            "⚠️ Status Dashboard API:",
            {

              success:
                json?.success,

              message:
                json?.message

            }
          );

        }


        return json;

      }
    );


  // ==================================================
  // RUN BOTH API AT THE SAME TIME
  // ==================================================

  try {

    const [
      dashboardResponse,
      statusResponse
    ] =
      await Promise.all([
        dashboardPromise,
        statusPromise
      ]);


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
    // VALIDATE DASHBOARD RESPONSE
    // ==================================================

    if (
      !dashboardResponse ||
      dashboardResponse.success !== true
    ) {

      if (
        cachedDashboardData
      ) {

        console.warn(
          "⚠️ Dashboard API failed, using cached base"
        );

      } else {

        throw new Error(
          dashboardResponse?.message ||
          "Dashboard API failed"
        );

      }

    }


    // ==================================================
    // DATA
    // ==================================================

    let dashboardData;


    if (
      dashboardResponse &&
      dashboardResponse.success === true &&
      dashboardResponse.data
    ) {

      dashboardData =
        dashboardResponse.data;


      // ------------------------------------------------
      // Update Base Cache
      // ------------------------------------------------

      saveDashboardBaseCache(
        dashboardData
      );

    } else {

      dashboardData =
        cachedDashboardData ||
        {};

    }


    const statusData =
      statusResponse.data || {};


    // ==================================================
    // DEBUG STATUS SHAPE
    // ==================================================

    console.log(
      "📦 Status Dashboard:",
      {

        date:
          statusData?.date ||
          "",

        count:
          Number(
            statusData?.count ||
            0
          )

      }
    );


    // ==================================================
    // MERGE TIMER
    // ==================================================

    const mergeStart =
      performance.now();


    // ==================================================
    // MERGE
    // ==================================================

    const mergedData =
      mergeDashboardStatus(
        dashboardData,
        statusData
      );


    const mergeMs =
      Math.round(
        performance.now() -
        mergeStart
      );


    // ==================================================
    // RENDER TIMER
    // ==================================================

    const renderStart =
      performance.now();


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


    const renderMs =
      Math.round(
        performance.now() -
        renderStart
      );


    // ==================================================
    // TOTAL TIME
    // ==================================================

    const totalElapsed =
      Math.round(
        performance.now() -
        totalStart
      );


    // ==================================================
    // TIMING
    // ==================================================

    console.log(
      "📊 Dashboard timing:",
      {

        totalMs:
          totalElapsed,

        dashboardApiMs:
          dashboardApiMs,

        statusApiMs:
          statusApiMs,

        mergeMs:
          mergeMs,

        renderMs:
          renderMs,

        baseSource:
          (
            dashboardResponse &&
            dashboardResponse.success === true
          )
            ? "API"
            : "CACHE",

        pointCount:
          getDashboardPointCount(
            mergedData
          )

      }
    );


    console.log(
      `⚡ Dashboard loaded in ${totalElapsed} ms`
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


    // ------------------------------------------------
    // ถ้ามี Cache ให้ลองแสดง Base
    // ------------------------------------------------

    if (
      cachedDashboardData &&
      dashboardZones &&
      !dashboardZones.innerHTML.trim()
    ) {

      renderSummary(
        buildDashboardSummaryFromStatus([])
      );

      renderZones(
        cachedDashboardData.zones
      );

    }


    setDashboardStatus(
      "ไม่สามารถโหลดข้อมูล Dashboard ได้"
    );


    if (dashboardZones) {

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

  if (!dashboardStatus) {
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

  if (!refreshDashboardBtn) {
    return;
  }


  refreshDashboardBtn.disabled =
    loading;


  if (loading) {

    if (
      !refreshDashboardBtn.dataset.originalText
    ) {

      refreshDashboardBtn.dataset.originalText =
        refreshDashboardBtn.textContent;

    }


    refreshDashboardBtn.textContent =
      "กำลังโหลด...";


  } else {

    refreshDashboardBtn.textContent =
      refreshDashboardBtn.dataset.originalText ||
      "รีเฟรช";

  }

}


// ==================================================
// NORMALIZE STATUS LIST
// V5.7
// ==================================================

function normalizeStatusList(
  statuses
) {

  if (!statuses) {
    return [];
  }


  // ------------------------------------------------
  // Array
  // ------------------------------------------------

  if (
    Array.isArray(statuses)
  ) {

    return statuses.filter(
      status =>
        status &&
        typeof status === "object"
    );

  }


  // ------------------------------------------------
  // Object
  // ------------------------------------------------

  if (
    typeof statuses === "object"
  ) {

    return Object.values(
      statuses
    ).filter(
      status =>
        status &&
        typeof status === "object"
    );

  }


  return [];

}


// ==================================================
// MERGE DASHBOARD + STATUS
// V5.7
// ==================================================

function mergeDashboardStatus(
  dashboardData,
  statusData
) {

  // ------------------------------------------------
  // Status Dashboard
  // ------------------------------------------------

  const statuses =
    normalizeStatusList(
      statusData?.statuses
    );


  console.log(
    "📊 Normalized status count:",
    statuses.length
  );


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

      const key =
        normalizePointId(
          status?.pointId
        );


      if (!key) {
        return;
      }


      statusMap.set(
        key,
        status
      );

    }
  );


  console.log(
    "🗺️ Status map size:",
    statusMap.size
  );


  // ------------------------------------------------
  // Merge Points
  // ------------------------------------------------

  const zones =
    baseZones.map(
      zone => {

        const points =
          Array.isArray(
            zone?.points
          )

            ? zone.points
            : [];


        const mergedPoints =
          points.map(
            point => {

              const pointKey =
                normalizePointId(
                  point?.pointId
                );


              const status =
                statusMap.get(
                  pointKey
                );


              // --------------------------------------
              // มี Status Dashboard
              // --------------------------------------

              if (status) {

                return applyStatusToPoint(
                  point,
                  status
                );

              }


              // --------------------------------------
              // ไม่มี Status
              // --------------------------------------

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


  // ------------------------------------------------
  // Diagnostic
  // ------------------------------------------------

  const mergedPointCount =
    zones.reduce(
      (
        total,
        zone
      ) =>
        total +

        (
          Array.isArray(
            zone?.points
          )

            ? zone.points.length
            : 0
        ),

      0
    );


  console.log(
    "🔗 Dashboard merge:",
    {

      statusCount:
        statuses.length,

      statusMapSize:
        statusMap.size,

      baseZoneCount:
        baseZones.length,

      mergedPointCount

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

  const list =
    Array.isArray(
      statuses
    )
      ? statuses
      : [];


  const total =
    list.length;


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


  list.forEach(
    status => {

      const value =
        String(
          status?.status ||
          ""
        )
          .trim()
          .toUpperCase();


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

    checkOut:
      0,

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
            person?.fullname ||
            person?.name ||
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

    // ------------------------------------------------
    // Status จาก Status Dashboard เท่านั้น
    // ------------------------------------------------

    status:
      status?.status || "",

    statusText:
      status?.statusText || "",

    requiredCount:
      status?.requiredCount ?? 0,

    checkedInCount:
      status?.checkedInCount ?? 0,

    remainingCount:
      status?.remainingCount ?? 0,

    hasSetting:
      status?.hasSetting,

    dayType:
      status?.dayType || "",

    shift:
      status?.shift || "",

    persons,

    fullname,

    timestamp,

    statusIcon:
      getDashboardStatusIcon(
        status?.status
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
    )
      .trim()
      .toUpperCase()
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

  const list =
    Array.isArray(
      points
    )
      ? points
      : [];


  const total =
    list.length;


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


  list.forEach(
    point => {

      const status =
        String(
          point?.status ||
          ""
        )
          .trim()
          .toUpperCase();


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

  if (!dashboardSummary) {
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

  if (!dashboardZones) {
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
            zone?.zone ||
            zone?.name ||
            "ไม่ระบุเขต";


          const points =
            Array.isArray(
              zone?.points
            )
              ? zone.points
              : [];


          const summary =
            zone?.summary ||
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
    )
      .trim()
      .toUpperCase();


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


  if (hasSetting) {

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

                👤 ${escapeHtml(
                  name
                )}

                ${
                  time

                    ? ` · ${escapeHtml(
                        time
                      )}`

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
      point?.timestamp
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
// V5.8
//
// รองรับ:
// - Date object
// - Unix timestamp milliseconds
// - Unix timestamp seconds
// - HH:mm
// - HH:mm:ss
// - DD/MM/YYYY HH:mm:ss
// - ISO Date
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


  // ------------------------------------------------
  // Numeric Unix Timestamp
  //
  // เช่น:
  // 1789084720686
  //
  // milliseconds
  // ------------------------------------------------

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {

    return formatUnixTimestamp(
      value
    );

  }


  const text =
    String(
      value
    ).trim();


  if (!text) {
    return "";
  }


  // ------------------------------------------------
  // Numeric string Unix Timestamp
  //
  // เช่น:
  // "1789084720686"
  // ------------------------------------------------

  if (
    /^\d+$/.test(text)
  ) {

    const numericValue =
      Number(text);


    if (
      Number.isFinite(
        numericValue
      )
    ) {

      // Unix timestamp ต้องมีขนาดสมเหตุสมผล
      // รองรับทั้ง milliseconds และ seconds

      if (
        numericValue >= 1000000000
      ) {

        return formatUnixTimestamp(
          numericValue
        );

      }

    }

  }


  // ------------------------------------------------
  // HH:mm:ss
  // ------------------------------------------------

  const timeOnly =
    text.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );


  if (timeOnly) {

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
        timeOnly[3] ||
        "00"
      ).padStart(
        2,
        "0"
      );


    return `${hh}:${mm}:${ss}`;

  }


  // ------------------------------------------------
  // DD/MM/YYYY HH:mm:ss
  //
  // ตรวจรูปแบบไทยก่อน Native Date
  // ------------------------------------------------

  const thaiDate =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );


  if (thaiDate) {

    const hh =
      String(
        thaiDate[4] ||
        "00"
      ).padStart(
        2,
        "0"
      );


    const mm =
      String(
        thaiDate[5] ||
        "00"
      ).padStart(
        2,
        "0"
      );


    const ss =
      String(
        thaiDate[6] ||
        "00"
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


  return text;

}


// ==================================================
// UNIX TIMESTAMP → TIME
// V5.8
// ==================================================

function formatUnixTimestamp(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "";

  }


  let milliseconds =
    Number(value);


  if (
    !Number.isFinite(
      milliseconds
    )
  ) {

    return "";

  }


  // ------------------------------------------------
  // ถ้าเป็น Unix timestamp แบบ seconds
  // ให้แปลงเป็น milliseconds
  //
  // 1789084720
  // →
  // 1789084720000
  // ------------------------------------------------

  if (
    milliseconds < 100000000000
  ) {

    milliseconds *= 1000;

  }


  const date =
    new Date(
      milliseconds
    );


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return formatDateObjectTime(
    date
  );

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
          currentPage ===
          "dashboard.html"
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
          currentPage ===
          "qr.html"
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