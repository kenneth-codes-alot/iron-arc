/**
 * IRON ARC — Day-1 Free Pass & first-session ignition (vanilla JS).
 *
 * A 24-hour pass with no card on file only works if the first session
 * banks something the person refuses to watch expire: a name, a night
 * window, a sealed oath, a rehearsed panic drill, and a baseline they
 * can see themselves losing.
 *
 * window.Day1Module
 *   .startPass({ source: "paywall" | "pass" })
 *   .renderPassBannerHTML(state)
 *   .renderIgnitionHTML(state)
 *   .renderLockCardHTML(state)
 *   .renderHomeHTML(state)
 *   .renderPaywallCtaHTML(state)
 *   .mount("#slot")
 *   .on("mission-complete" | "perfect-lock" | "upgrade" | "pass-started", fn)
 *
 * Audio and particles go through window.DopamineFX when it is present.
 * Styles ship in one injected <style id="d1-styles"> tag.
 */
(function (root) {
  "use strict";

  var STORAGE_KEY = "ironarc.day1.v1";
  var PASS_MS = 24 * 60 * 60 * 1000;
  var OATH_MS = 1500;
  var DRILL_MS = 15000;
  var DRILL_TAPS = 3;
  var BONUS_XP = 250;
  var RING = 2 * Math.PI * 52;
  var PATH_EVERY_MS = 90000;
  var PATH_TIME_CAP = 16;

  var MISSIONS = [
    {
      id: "callsign",
      n: "01",
      xp: 50,
      kicker: "IDENTITY",
      title: "Claim Your Commander Callsign & Trigger Window",
      why: "A named man loses more than a guest. Arm the hours you actually fold."
    },
    {
      id: "oath",
      n: "02",
      xp: 50,
      kicker: "OATH",
      title: "Seal Your Day-1 Iron Oath",
      why: "The hand seals what the mouth will bargain away tonight."
    },
    {
      id: "drill",
      n: "03",
      xp: 100,
      kicker: "COMBAT",
      title: "Run a 15-Second Red Panic 2.0 Combat Drill",
      why: "Test-fire the button before a real urge hits. The first rep should be a drill."
    },
    {
      id: "checkup",
      n: "04",
      xp: 50,
      kicker: "BASELINE",
      title: "Log Your Day-1 Baseline Neuro-Checkup",
      why: "A number you logged is a number you will hate to abandon on Day 2."
    }
  ];

  var WINDOWS = [
    { id: "prime", label: "11 PM – 2 AM", hint: "The classic crest. Most folds start here." },
    { id: "early", label: "10 PM – 1 AM", hint: "Lights out before the scroll finds you." },
    { id: "grave", label: "12 AM – 3 AM", hint: "The second wind. The house is quiet." },
    { id: "dawn", label: "5 AM – 7 AM", hint: "The lonely morning, before anyone is up." }
  ];

  var SUGGESTIONS = ["SPARTAN-88", "WOLF-07", "IRON-14", "VANGUARD-3"];

  var METRICS = [
    { id: "drive", label: "Morning Drive", low: "Flat", high: "Lit" },
    { id: "clarity", label: "Mental Clarity", low: "Fog", high: "Clear" },
    { id: "urge", label: "Urge Intensity", low: "Quiet", high: "Loud" }
  ];

  var CSS = [
    ".d1-root{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;color:#f8fafc;}",
    ".d1-banner{position:relative;margin:0 0 12px;padding:14px 14px 12px;border-radius:18px;background:radial-gradient(120% 80% at 0% 0%,rgba(245,158,11,.16),transparent 55%),linear-gradient(180deg,#14110c,#0e131f);border:1px solid rgba(245,158,11,.55);box-shadow:0 0 0 1px rgba(0,0,0,.4),0 16px 40px rgba(0,0,0,.28);overflow:hidden;}",
    ".d1-banner.is-expired{border-color:rgba(239,68,68,.65);background:radial-gradient(120% 80% at 0% 0%,rgba(239,68,68,.16),transparent 55%),#140c0e;}",
    ".d1-banner.is-locked{border-color:rgba(16,185,129,.6);background:radial-gradient(120% 80% at 0% 0%,rgba(16,185,129,.18),transparent 55%),#0c1412;}",
    ".d1-banner-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}",
    ".d1-pill{font-size:10px;font-weight:800;letter-spacing:.12em;color:#fbbf24;}",
    ".d1-banner.is-locked .d1-pill{color:#34d399;}",
    ".d1-banner.is-expired .d1-pill{color:#fca5a5;}",
    ".d1-live{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.14em;color:#fbbf24;}",
    ".d1-live i{width:7px;height:7px;border-radius:99px;background:#fbbf24;box-shadow:0 0 0 0 rgba(251,191,36,.7);animation:d1-pulse 1.4s ease-out infinite;}",
    ".d1-banner.is-expired .d1-live{color:#fca5a5;}",
    ".d1-banner.is-expired .d1-live i{background:#ef4444;animation:none;}",
    ".d1-banner.is-locked .d1-live{color:#34d399;}",
    ".d1-banner.is-locked .d1-live i{background:#10b981;animation:none;}",
    ".d1-clock{font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:clamp(26px,8vw,34px);font-weight:800;letter-spacing:.04em;line-height:1;font-variant-numeric:tabular-nums;color:#fff;}",
    ".d1-banner.is-expired .d1-clock{color:#fecaca;}",
    ".d1-banner.is-locked .d1-clock{color:#6ee7b7;font-size:28px;letter-spacing:.16em;}",
    ".d1-sub{margin:6px 0 10px;font-size:12px;line-height:1.4;color:#94a3b8;}",
    ".d1-deplete{height:4px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:10px;}",
    ".d1-deplete b{display:block;height:100%;width:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:inherit;}",
    ".d1-banner.is-expired .d1-deplete b{background:#ef4444;width:0 !important;}",
    ".d1-banner.is-locked .d1-deplete b{background:#10b981;}",
    ".d1-assets{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}",
    ".d1-asset{padding:8px 8px 7px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.06);}",
    ".d1-asset b{display:block;font-size:16px;font-weight:900;color:#f8fafc;font-variant-numeric:tabular-nums;}",
    ".d1-asset span{display:block;margin-top:2px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#94a3b8;line-height:1.25;}",
    ".d1-equity{font-size:12px;color:#e2e8f0;margin-bottom:10px;}",
    ".d1-equity strong{color:#fbbf24;font-variant-numeric:tabular-nums;}",
    ".d1-upgrade,.d1-arm,.d1-log{width:100%;border:0;cursor:pointer;border-radius:12px;padding:12px 12px;font-weight:900;font-size:13.5px;letter-spacing:.01em;color:#1c1003;background:linear-gradient(180deg,#fcd34d,#f59e0b);box-shadow:0 8px 20px rgba(245,158,11,.25);}",
    ".d1-upgrade:active,.d1-arm:active,.d1-log:active{transform:translateY(1px);}",
    ".d1-quest{margin:0 0 12px;padding:14px;border-radius:18px;background:#0e131f;border:1px solid rgba(16,185,129,.35);}",
    ".d1-quest-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:8px;}",
    ".d1-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;color:#34d399;}",
    ".d1-quest h2{margin:2px 0 0;font-size:18px;line-height:1.15;font-weight:900;}",
    ".d1-count{text-align:right;font-size:12px;font-weight:800;color:#e2e8f0;max-width:52%;line-height:1.3;}",
    ".d1-count.is-done{color:#6ee7b7;}",
    ".d1-lead{margin:0 0 10px;font-size:12.5px;line-height:1.45;color:#94a3b8;}",
    ".d1-track{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:12px;}",
    ".d1-track i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#047857,#34d399);}",
    ".d1-mission{width:100%;display:flex;gap:10px;align-items:flex-start;text-align:left;margin:0 0 8px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#121826;color:inherit;cursor:pointer;}",
    ".d1-mission:last-child{margin-bottom:0;}",
    ".d1-mission.is-next{border-color:rgba(16,185,129,.7);box-shadow:0 0 0 1px rgba(16,185,129,.25),0 0 24px rgba(16,185,129,.12);}",
    ".d1-mission.is-locked{opacity:.55;cursor:default;}",
    ".d1-mission.is-done{cursor:default;border-color:rgba(16,185,129,.28);}",
    ".d1-mission.is-done.is-review{cursor:pointer;}",
    ".d1-index{flex:none;width:28px;font-family:ui-monospace,Consolas,monospace;font-size:12px;font-weight:800;color:#6ee7b7;padding-top:2px;}",
    ".d1-mission.is-locked .d1-index{color:#64748b;}",
    ".d1-copy{flex:1;min-width:0;}",
    ".d1-copy small{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;color:#94a3b8;}",
    ".d1-copy strong{display:block;margin:2px 0;font-size:13.5px;line-height:1.3;font-weight:800;}",
    ".d1-copy em{display:block;font-style:normal;font-size:12px;line-height:1.35;color:#94a3b8;}",
    ".d1-status{flex:none;font-size:10px;font-weight:900;letter-spacing:.08em;color:#fbbf24;padding-top:2px;}",
    ".d1-mission.is-done .d1-status{color:#34d399;}",
    ".d1-mission.is-locked .d1-status{color:#64748b;}",
    ".d1-inline{margin:-2px 0 8px;padding:12px;border-radius:14px;background:#10151f;border:1px solid rgba(255,255,255,.08);}",
    ".d1-inline p,.d1-sheet p{margin:0 0 10px;font-size:12.5px;line-height:1.45;color:#94a3b8;}",
    ".d1-hold{position:relative;width:100%;height:52px;border:0;border-radius:12px;overflow:hidden;cursor:pointer;background:#1a120c;color:#fff;font-weight:900;letter-spacing:.04em;font-size:12.5px;touch-action:none;user-select:none;-webkit-user-select:none;}",
    ".d1-hold-fill{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#b45309,#fbbf24);}",
    ".d1-hold span{position:relative;z-index:1;}",
    ".d1-slider{display:block;margin:0 0 10px;}",
    ".d1-slider span{display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-bottom:4px;}",
    ".d1-slider em{font-style:normal;color:#fbbf24;font-variant-numeric:tabular-nums;}",
    ".d1-slider input{width:100%;accent-color:#10b981;}",
    ".d1-range{display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-top:2px;}",
    ".d1-metric{margin:0 0 8px;}",
    ".d1-metric-name{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#cbd5e1;margin-bottom:4px;}",
    ".d1-metric-row{display:grid;grid-template-columns:28px 1fr 22px;gap:6px;align-items:center;margin-bottom:3px;font-size:10px;font-weight:800;color:#94a3b8;}",
    ".d1-meter{height:7px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;}",
    ".d1-meter i{display:block;height:100%;background:#64748b;border-radius:inherit;}",
    ".d1-meter i.is-up{background:#10b981;}",
    ".d1-meter i.is-down{background:#f59e0b;}",
    ".d1-delta{font-size:11px;color:#94a3b8;margin:-2px 0 6px;}",
    ".d1-note{font-size:11.5px;line-height:1.4;color:#94a3b8;margin:4px 0 10px;}",
    ".d1-lock{margin:0 0 12px;padding:14px;border-radius:18px;background:linear-gradient(180deg,rgba(245,158,11,.1),#0e131f 42%);border:1px solid rgba(251,191,36,.45);}",
    ".d1-lock.is-open{border-color:rgba(251,191,36,.75);box-shadow:0 0 32px rgba(245,158,11,.12);}",
    ".d1-medal{display:inline-block;margin-bottom:8px;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.14em;color:#1c1003;background:linear-gradient(90deg,#fde68a,#f59e0b);}",
    ".d1-lock h3{margin:0 0 6px;font-size:16px;line-height:1.25;}",
    ".d1-loss{margin:0 0 8px;font-size:12.5px;line-height:1.45;color:#e2e8f0;}",
    ".d1-loss b{color:#fbbf24;font-variant-numeric:tabular-nums;}",
    ".d1-unlocks{display:grid;gap:8px;margin-bottom:12px;}",
    ".d1-unlock{padding:10px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.06);}",
    ".d1-unlock.is-dim{opacity:.72;}",
    ".d1-unlock span{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;color:#fbbf24;}",
    ".d1-unlock strong{display:block;margin:2px 0;font-size:13.5px;}",
    ".d1-unlock p{margin:0;font-size:12px;line-height:1.4;color:#94a3b8;}",
    ".d1-fine{margin:8px 0 0;text-align:center;font-size:11px;color:#64748b;}",
    ".d1-stow{display:block;width:100%;margin-top:8px;background:none;border:0;color:#64748b;font-size:11px;cursor:pointer;padding:6px;}",
    ".d1-overlay{position:fixed;inset:0;z-index:160;background:rgba(4,6,10,.72);display:flex;align-items:flex-end;justify-content:center;padding:12px;}",
    ".d1-sheet{width:min(440px,100%);max-height:min(88vh,740px);overflow:auto;background:#0e131f;border:1px solid rgba(16,185,129,.45);border-radius:22px 22px 16px 16px;padding:16px 16px 18px;box-shadow:0 -24px 80px rgba(0,0,0,.5);}",
    ".d1-sheet h3{margin:2px 0 8px;font-size:18px;line-height:1.25;}",
    ".d1-label{display:block;margin:8px 0 6px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;}",
    ".d1-input{width:100%;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#080b12;color:#fff;padding:0 12px;font-size:16px;font-weight:800;letter-spacing:.08em;}",
    ".d1-error{min-height:16px;margin:6px 0 0;font-size:12px;color:#fca5a5;}",
    ".d1-suggest{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px;}",
    ".d1-chip{border:1px solid rgba(255,255,255,.12);background:#151c2c;color:#e2e8f0;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;}",
    ".d1-chip.is-on{border-color:#10b981;color:#6ee7b7;background:rgba(16,185,129,.12);}",
    ".d1-windows{display:grid;gap:6px;margin-bottom:12px;}",
    ".d1-window{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 10px;}",
    ".d1-window small{font-weight:600;color:#94a3b8;letter-spacing:0;text-transform:none;}",
    ".d1-ghost{width:100%;margin-top:8px;background:none;border:0;color:#94a3b8;font-size:12px;padding:8px;cursor:pointer;}",
    ".d1-ring-wrap{position:relative;width:148px;height:148px;margin:6px auto 12px;}",
    ".d1-ring{width:148px;height:148px;transform:rotate(-90deg);}",
    ".d1-ring circle{fill:none;stroke-width:8;}",
    ".d1-ring-bg{stroke:rgba(255,255,255,.08);}",
    ".d1-ring-fg{stroke:#ef4444;stroke-linecap:round;}",
    ".d1-ring-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:ui-monospace,Consolas,monospace;font-weight:900;font-size:32px;font-variant-numeric:tabular-nums;}",
    ".d1-ring-num small{font-size:10px;letter-spacing:.14em;color:#fca5a5;font-weight:800;}",
    ".d1-fire{width:100%;border:0;cursor:pointer;border-radius:14px;padding:16px 12px;font-weight:900;letter-spacing:.06em;color:#fff;background:linear-gradient(180deg,#ef4444,#991b1b);box-shadow:0 10px 28px rgba(239,68,68,.35);font-size:15px;}",
    ".d1-fire:active{transform:translateY(1px);}",
    ".d1-fail{margin:0 0 10px;padding:10px;border-radius:12px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);color:#fecaca;font-size:12.5px;line-height:1.4;}",
    ".d1-pass-cta{width:100%;margin:10px 0 4px;padding:12px 12px 11px;border-radius:14px;cursor:pointer;text-align:left;color:#f8fafc;background:rgba(245,158,11,.08);border:1px dashed rgba(245,158,11,.7);}",
    ".d1-pass-cta-kicker{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;color:#fbbf24;margin-bottom:3px;}",
    ".d1-pass-cta-title{display:block;font-size:14.5px;font-weight:900;line-height:1.3;}",
    ".d1-pass-cta-sub{display:block;margin-top:3px;font-size:11.5px;color:#94a3b8;line-height:1.35;}",
    "@keyframes d1-pulse{0%{box-shadow:0 0 0 0 rgba(251,191,36,.65);}100%{box-shadow:0 0 0 8px rgba(251,191,36,0);}}",
    "@media (prefers-reduced-motion:reduce){.d1-live i{animation:none;}}",
    ".d1-root button:focus-visible,.d1-sheet button:focus-visible,.d1-input:focus-visible,.d1-pass-cta:focus-visible{outline:2px solid #10b981;outline-offset:2px;}"
  ].join("");

  function blankMissions() {
    return {
      callsign: { done: false, at: null, xp: 0, callsign: "", windowId: "", windowLabel: "" },
      oath: { done: false, at: null, xp: 0 },
      drill: { done: false, at: null, xp: 0, taps: 0, elapsedMs: 0 },
      checkup: { done: false, at: null, xp: 0, drive: null, clarity: null, urge: null }
    };
  }

  function createState(overrides) {
    var base = {
      v: 1,
      passStartedAt: null,
      passExpiresAt: null,
      source: null,
      upgraded: false,
      upgradedAt: null,
      perfectLockAt: null,
      receiptHidden: false,
      missions: blankMissions()
    };
    return normalize(Object.assign({}, base, overrides || {}));
  }

  function numOrNull(value) {
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function clamp10(value) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 10) return 10;
    return n;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function missionById(id) {
    var i;
    for (i = 0; i < MISSIONS.length; i++) {
      if (MISSIONS[i].id === id) return MISSIONS[i];
    }
    return null;
  }

  function windowById(id) {
    var i;
    for (i = 0; i < WINDOWS.length; i++) {
      if (WINDOWS[i].id === id) return WINDOWS[i];
    }
    return WINDOWS[0];
  }

  function normalize(input) {
    var src = input || {};
    var missionsIn = src.missions || {};
    var missions = blankMissions();
    var i;
    var id;
    var slot;
    var clean;
    for (i = 0; i < MISSIONS.length; i++) {
      id = MISSIONS[i].id;
      slot = missionsIn[id] || {};
      clean = missions[id];
      clean.done = slot.done === true;
      clean.at = numOrNull(slot.at);
      clean.xp = clean.done ? MISSIONS[i].xp : 0;
      if (id === "callsign") {
        clean.callsign = slot.callsign ? String(slot.callsign) : "";
        clean.windowId = slot.windowId ? String(slot.windowId) : "";
        clean.windowLabel = slot.windowLabel ? String(slot.windowLabel) : "";
      } else if (id === "drill") {
        clean.taps = Math.max(0, Math.round(Number(slot.taps) || 0));
        clean.elapsedMs = Math.max(0, Math.round(Number(slot.elapsedMs) || 0));
      } else if (id === "checkup") {
        clean.drive = slot.drive == null ? null : clamp10(slot.drive);
        clean.clarity = slot.clarity == null ? null : clamp10(slot.clarity);
        clean.urge = slot.urge == null ? null : clamp10(slot.urge);
      }
    }
    var started = numOrNull(src.passStartedAt);
    var expires = numOrNull(src.passExpiresAt);
    if (started && !expires) expires = started + PASS_MS;
    return {
      v: 1,
      passStartedAt: started,
      passExpiresAt: expires,
      source: src.source === "paywall" || src.source === "pass" ? src.source : (src.source ? String(src.source) : null),
      upgraded: src.upgraded === true,
      upgradedAt: numOrNull(src.upgradedAt),
      perfectLockAt: numOrNull(src.perfectLockAt),
      receiptHidden: src.receiptHidden === true,
      missions: missions
    };
  }

  function formatCountdown(ms) {
    var n = Math.max(0, Math.floor(Number(ms) || 0));
    var total = Math.floor(n / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return pad2(h) + "h : " + pad2(m) + "m : " + pad2(s) + "s";
  }

  function remaining(src, now) {
    var stateRef = normalize(src);
    var t = typeof now === "number" ? now : Date.now();
    if (!stateRef.passStartedAt || !stateRef.passExpiresAt) {
      return {
        totalMs: PASS_MS,
        h: 24,
        m: 0,
        s: 0,
        label: "24h : 00m : 00s",
        expired: false,
        armed: false,
        ratio: 1
      };
    }
    var left = stateRef.passExpiresAt - t;
    if (left <= 0) {
      return { totalMs: 0, h: 0, m: 0, s: 0, label: "00h : 00m : 00s", expired: true, armed: true, ratio: 0 };
    }
    var total = Math.floor(left / 1000);
    return {
      totalMs: left,
      h: Math.floor(total / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60,
      label: formatCountdown(left),
      expired: false,
      armed: true,
      ratio: Math.min(1, left / PASS_MS)
    };
  }

  function isActive(src, now) {
    var stateRef = normalize(src);
    var clock = remaining(stateRef, now);
    return clock.armed && !clock.expired && !stateRef.upgraded;
  }

  function missionProgress(src) {
    var stateRef = normalize(src);
    var done = 0;
    var xp = 0;
    var i;
    for (i = 0; i < MISSIONS.length; i++) {
      if (stateRef.missions[MISSIONS[i].id].done) {
        done += 1;
        xp += MISSIONS[i].xp;
      }
    }
    return {
      done: done,
      total: MISSIONS.length,
      xp: xp,
      complete: done === MISSIONS.length,
      ratio: done / MISSIONS.length
    };
  }

  function previousDone(src, id) {
    var stateRef = normalize(src);
    var i;
    for (i = 0; i < MISSIONS.length; i++) {
      if (MISSIONS[i].id === id) {
        if (i === 0) return true;
        return stateRef.missions[MISSIONS[i - 1].id].done === true;
      }
    }
    return false;
  }

  /**
   * Sunk-cost equity is a product score, not a clinical measure.
   * Willpower XP is only what the four missions award (50+50+100+50).
   * Pathways kindle on entry, once per 90s up to 16, and +4 per mission.
   * Urges shielded: +1 for the oath, +1 for the drill, +1 per 6h after the oath (cap +2).
   * The squad slot flips the moment a callsign is armed.
   * Weights: pathway 18, shielded urge 70, named slot 140.
   */
  function computeSunkCost(src, now) {
    var stateRef = normalize(src);
    var t = typeof now === "number" ? now : Date.now();
    var elapsed = 0;
    if (stateRef.passStartedAt) {
      var endCap = stateRef.passExpiresAt || (stateRef.passStartedAt + PASS_MS);
      var end = Math.min(t, endCap);
      elapsed = Math.max(0, end - stateRef.passStartedAt);
    }
    var hours = elapsed / 3600000;
    var prog = missionProgress(stateRef);
    var pathwaysLit = 0;
    if (stateRef.passStartedAt) {
      pathwaysLit = 2 + Math.min(PATH_TIME_CAP, Math.floor(elapsed / PATH_EVERY_MS)) + prog.done * 4;
    }
    var urges = 0;
    if (stateRef.missions.oath.done) urges += 1;
    if (stateRef.missions.drill.done) urges += 1;
    if (stateRef.missions.oath.done) urges += Math.min(2, Math.floor(hours / 6));
    var squad = !!(stateRef.missions.callsign.done && stateRef.missions.callsign.callsign);
    var equity = prog.xp + pathwaysLit * 18 + urges * 70 + (squad ? 140 : 0);
    return {
      willpowerXP: prog.xp,
      pathwaysLit: pathwaysLit,
      urgesShielded: urges,
      squadSlotReserved: squad,
      squadLabel: squad ? "RESERVED" : "OPEN",
      equity: equity,
      hoursIn: Math.round(hours * 10) / 10
    };
  }

  function projectBaseline(scores) {
    var src = scores || {};
    var drive = clamp10(src.drive);
    var clarity = clamp10(src.clarity);
    var urge = clamp10(src.urge);
    function toward(value, target, gain) {
      return clamp10(Math.round(value + (target - value) * gain));
    }
    var day30Urge = urge <= 1 ? urge : clamp10(Math.round(urge * 0.45 + 1.2));
    if (day30Urge > urge) day30Urge = urge;
    return {
      day1: { drive: drive, clarity: clarity, urge: urge },
      day30: {
        drive: toward(drive, Math.max(8, drive), 0.55),
        clarity: toward(clarity, Math.max(8, clarity), 0.6),
        urge: day30Urge
      },
      note: "Training projection from this baseline. It assumes the danger window stays armed and the oath gets sealed each night."
    };
  }

  function normalizeCallsign(raw) {
    var value = String(raw == null ? "" : raw).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    value = value.replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!/^[A-Z][A-Z0-9]{1,11}(-[A-Z0-9]{1,4})?$/.test(value)) {
      return {
        ok: false,
        value: value,
        reason: "Use a callsign like SPARTAN-88. Letters first, optional dash and number."
      };
    }
    return { ok: true, value: value, reason: "" };
  }

  function armedWindow(src) {
    var slot = normalize(src).missions.callsign;
    return slot.windowLabel || "11 PM – 2 AM";
  }

  function renderAssetGrid(sunk) {
    return (
      '<div class="d1-assets">' +
        '<div class="d1-asset"><b data-d1-xp>' + sunk.willpowerXP + '</b><span>Willpower XP</span></div>' +
        '<div class="d1-asset"><b data-d1-paths>' + sunk.pathwaysLit + '</b><span>Cortical Pathways Lit</span></div>' +
        '<div class="d1-asset"><b data-d1-urges>' + sunk.urgesShielded + '</b><span>Urges Shielded</span></div>' +
        '<div class="d1-asset"><b data-d1-squad>' + sunk.squadLabel + '</b><span>Squad Slot Reserved</span></div>' +
      "</div>"
    );
  }

  function renderPassBannerHTML(src, now) {
    var stateRef = normalize(src);
    var t = typeof now === "number" ? now : Date.now();
    var clock = remaining(stateRef, t);
    var sunk = computeSunkCost(stateRef, t);
    var mode = "live";
    var pill = "24H FREE PASS";
    var liveLabel = "LIVE";
    var clockText = clock.label;
    var sub = "No card on file. This equity dies when the clock hits zero.";
    if (!clock.armed) {
      mode = "idle";
      pill = "PASS UNARMED";
      liveLabel = "STANDBY";
      sub = "Twenty-four hours, no card. Equity starts the moment the pass is armed.";
    } else if (stateRef.upgraded) {
      mode = "locked";
      pill = "STREAK LOCKED";
      liveLabel = "BANKED";
      clockText = "LOCKED";
      sub = "Day-1 equity is banked. The clock cannot take it.";
    } else if (clock.expired) {
      mode = "expired";
      pill = "FREE PASS ENDED";
      liveLabel = "COOLING";
      sub = "The 24 hours ended. Upgrade to carry Day-1 equity into the streak.";
    }
    var cls = "d1-banner" + (mode === "expired" ? " is-expired" : "") + (mode === "locked" ? " is-locked" : "");
    var upgrade = stateRef.upgraded
      ? ""
      : '<button type="button" class="d1-upgrade" data-d1-action="upgrade" data-d1-from="banner">Lock My Streak Forever (Upgrade)</button>';
    return (
      '<section class="' + cls + '" data-d1-banner data-d1-mode="' + mode + '">' +
        '<div class="d1-banner-top"><span class="d1-pill" data-d1-pass-label>' + pill + '</span>' +
        '<span class="d1-live"><i></i>' + liveLabel + "</span></div>" +
        '<div class="d1-clock" data-d1-clock>' + esc(clockText) + "</div>" +
        '<p class="d1-sub" data-d1-pass-sub>' + sub + "</p>" +
        '<div class="d1-deplete"><b data-d1-deplete style="width:' + Math.round(clock.ratio * 100) + '%"></b></div>' +
        renderAssetGrid(sunk) +
        '<div class="d1-equity">Sunk-cost equity <strong data-d1-equity>' + sunk.equity + "</strong> — leaves with the pass</div>" +
        upgrade +
      "</section>"
    );
  }

  function renderProjectionHTML(proj) {
    var html = "";
    var i;
    var metric;
    var a;
    var b;
    var delta;
    var barClass;
    for (i = 0; i < METRICS.length; i++) {
      metric = METRICS[i];
      a = proj.day1[metric.id];
      b = proj.day30[metric.id];
      if (metric.id === "urge") {
        barClass = b < a ? "is-down" : "";
        delta = b === a ? "Holds at " + a : "Day 30 urge " + b + ", down " + (a - b) + " from today";
      } else {
        barClass = b > a ? "is-up" : "";
        delta = b === a ? "Holds at " + a : "Day 30 " + metric.label.toLowerCase() + " " + b + ", up " + (b - a) + " from today";
      }
      html +=
        '<div class="d1-metric">' +
          '<div class="d1-metric-name">' + esc(metric.label) + "</div>" +
          '<div class="d1-metric-row"><span>D1</span><div class="d1-meter"><i style="width:' + (a * 10) + '%"></i></div><b>' + a + "</b></div>" +
          '<div class="d1-metric-row"><span>D30</span><div class="d1-meter"><i class="' + barClass + '" style="width:' + (b * 10) + '%"></i></div><b>' + b + "</b></div>" +
          '<div class="d1-delta">' + esc(delta) + "</div>" +
        "</div>";
    }
    html += '<p class="d1-note">' + esc(proj.note) + "</p>";
    return html;
  }

  function missionStatus(view) {
    if (view.slot.done) return "DONE";
    if (view.locked) return "LOCKED";
    return "OPEN";
  }

  function missionDetail(spec, slot) {
    if (!slot.done) return spec.why;
    if (spec.id === "callsign") return slot.callsign + " • " + (slot.windowLabel || "Window armed") + " • +50 XP";
    if (spec.id === "oath") return "Iron oath sealed. The hand already voted. • +50 XP";
    if (spec.id === "drill") return "15s drill cleared • " + (slot.taps || DRILL_TAPS) + " contacts • +100 XP";
    var proj = projectBaseline({ drive: slot.drive, clarity: slot.clarity, urge: slot.urge });
    return "Drive " + proj.day1.drive + "→" + proj.day30.drive +
      " • Clarity " + proj.day1.clarity + "→" + proj.day30.clarity +
      " • Urge " + proj.day1.urge + "→" + proj.day30.urge;
  }

  function renderMissionRow(src, spec) {
    var slot = src.missions[spec.id];
    var index = 0;
    var i;
    for (i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === spec.id) index = i;
    var locked = !slot.done && !(index === 0 || src.missions[MISSIONS[index - 1].id].done);
    var next = !slot.done && !locked;
    var cls = "d1-mission" + (slot.done ? " is-done" : "") + (locked ? " is-locked" : "") + (next ? " is-next" : "");
    var tag = slot.done ? "div" : "button";
    var attrs = ' class="' + cls + '" data-d1-mission="' + spec.id + '"';
    if (tag === "button") {
      attrs += ' type="button" data-d1-action="open" data-d1-panel="' + spec.id + '"';
      if (locked) attrs += ' aria-disabled="true"';
    }
    return (
      "<" + tag + attrs + ">" +
        '<span class="d1-index">' + spec.n + "</span>" +
        '<span class="d1-copy"><small>' + spec.kicker + " • +" + spec.xp + " XP</small>" +
        "<strong>" + esc(spec.title) + "</strong>" +
        "<em>" + esc(missionDetail(spec, slot)) + "</em></span>" +
        '<span class="d1-status">' + missionStatus({ slot: slot, locked: locked }) + "</span>" +
      "</" + tag + ">"
    );
  }

  function renderOathPanel() {
    return (
      '<div class="d1-inline" data-d1-panel-body="oath">' +
        "<p>Hold the seal for 1.5 seconds. You are promising the armed window stays a drill, and the negotiation stays unopened.</p>" +
        '<button type="button" class="d1-hold" data-d1-hold>' +
          '<div class="d1-hold-fill" data-d1-hold-fill></div>' +
          "<span>HOLD 1.5s TO SEAL THE DAY-1 OATH</span>" +
        "</button>" +
      "</div>"
    );
  }

  function renderCheckupPanel(src, ui) {
    var slot = src.missions.checkup;
    if (slot.done) {
      var saved = projectBaseline({ drive: slot.drive, clarity: slot.clarity, urge: slot.urge });
      return '<div class="d1-inline" data-d1-projection>' + renderProjectionHTML(saved) + "</div>";
    }
    var sliders = (ui && ui.sliders) || { drive: 4, clarity: 5, urge: 7 };
    var preview = projectBaseline(sliders);
    var fields = "";
    var i;
    var metric;
    var val;
    for (i = 0; i < METRICS.length; i++) {
      metric = METRICS[i];
      val = clamp10(sliders[metric.id]);
      fields +=
        '<label class="d1-slider"><span><b>' + esc(metric.label) + '</b><em data-d1-val="' + metric.id + '">' + val + "</em></span>" +
        '<input type="range" min="0" max="10" step="1" value="' + val + '" data-d1-slider="' + metric.id + '" aria-label="' + esc(metric.label) + '" />' +
        '<span class="d1-range"><i>' + esc(metric.low) + "</i><i>" + esc(metric.high) + "</i></span></label>";
    }
    return (
      '<div class="d1-inline">' +
        "<p>Three sliders. This is today's baseline. The Day-30 bars move while you drag, then lock when you log them.</p>" +
        fields +
        '<div data-d1-projection>' + renderProjectionHTML(preview) + "</div>" +
        '<button type="button" class="d1-log" data-d1-action="log-checkup">Log Baseline • +50 XP</button>' +
      "</div>"
    );
  }

  function renderIgnitionHTML(src, ui) {
    var stateRef = normalize(src);
    var prog = missionProgress(stateRef);
    var panel = ui && ui.panel;
    var countCls = "d1-count" + (prog.complete ? " is-done" : "");
    var countText = prog.complete
      ? "4/4 Complete • +250 Bonus XP"
      : prog.done + "/4";
    var side = prog.complete ? "" : '<div class="d1-count">+' + prog.xp + " / 250 XP</div>";
    var rows = "";
    var i;
    for (i = 0; i < MISSIONS.length; i++) {
      rows += renderMissionRow(stateRef, MISSIONS[i]);
      if (panel === "oath" && MISSIONS[i].id === "oath" && !stateRef.missions.oath.done) rows += renderOathPanel();
      if (MISSIONS[i].id === "checkup" && (stateRef.missions.checkup.done || panel === "checkup")) {
        rows += renderCheckupPanel(stateRef, ui);
      }
    }
    var next = "";
    if (!prog.complete) {
      for (i = 0; i < MISSIONS.length; i++) {
        if (!stateRef.missions[MISSIONS[i].id].done) {
          next = MISSIONS[i].title;
          break;
        }
      }
    }
    return (
      '<section class="d1-quest" data-d1-quest>' +
        '<div class="d1-quest-head"><div><div class="d1-kicker">60-SECOND PROTOCOL</div><h2>Day-1 Ignition</h2></div>' +
        '<div class="' + countCls + '" data-d1-progress-label>' + countText + "</div></div>" +
        (side ? '<div style="display:flex;justify-content:flex-end;margin:-4px 0 6px;">' + side + "</div>" : "") +
        '<p class="d1-lead">' + (prog.complete
          ? "Four missions banked. The pass now has a name, an oath, a drill, and a baseline."
          : "Four missions. Finish the next one before the urge has a chance to introduce itself." + (next ? " Next: " + esc(next) + "." : "")) +
        "</p>" +
        '<div class="d1-track" aria-hidden="true"><i data-d1-progress-fill style="width:' + Math.round(prog.ratio * 100) + '%"></i></div>' +
        rows +
      "</section>"
    );
  }

  function renderUnlocks(src, dim) {
    var win = esc(armedWindow(src));
    var dimCls = dim ? " d1-unlock is-dim" : " d1-unlock";
    return (
      '<div class="d1-unlocks">' +
        '<div class="' + dimCls.trim() + '"><span>DAY 2</span><strong>Trigger Sentry</strong>' +
        "<p>The window you armed (" + win + ") gets a sentry before the scroll starts. The squad slot stays in your callsign. The oath carries into night two.</p></div>" +
        '<div class="' + dimCls.trim() + '"><span>DAY 3</span><strong>Withdrawal Crest Shielding</strong>' +
        "<p>The cue still fires on night three. Withdrawal Crest Shielding is the brake you drilled today, held across the loudest stretch of the first 72 hours.</p></div>" +
      "</div>"
    );
  }

  function renderLockCardHTML(src, now) {
    var stateRef = normalize(src);
    var prog = missionProgress(stateRef);
    var t = typeof now === "number" ? now : Date.now();
    var sunk = computeSunkCost(stateRef, t);
    var clock = remaining(stateRef, t);
    if (!prog.complete) {
      return (
        '<section class="d1-lock" data-d1-lock="teaser">' +
          '<div class="d1-kicker">SEALS AT 4/4</div>' +
          "<h3>Day 1 Perfect Lock is waiting on the last missions.</h3>" +
          '<p class="d1-loss">Equity already on this pass: <b data-d1-equity>' + sunk.equity + "</b>. It leaves when the clock hits zero.</p>" +
          renderUnlocks(stateRef, true) +
        "</section>"
      );
    }
    var loss = stateRef.upgraded
      ? "This equity is banked with the streak."
      : 'If the pass dies at <b data-d1-clock>' + esc(clock.expired ? "00h : 00m : 00s" : clock.label) + "</b>, this stops being yours:";
    var upgrade = stateRef.upgraded
      ? '<button type="button" class="d1-stow" data-d1-action="stow">Stow receipt</button>'
      : '<button type="button" class="d1-upgrade" data-d1-action="upgrade" data-d1-from="lock">Lock My Streak Forever (Upgrade)</button>' +
        '<p class="d1-fine">No card was needed for these 24 hours. Day 2 is the lock.</p>';
    return (
      '<section class="d1-lock is-open" data-d1-lock="perfect">' +
        '<div class="d1-medal">DAY 1 PERFECT LOCK</div>' +
        "<h3>Four missions. The streak has a name, an oath, a drill, and a baseline.</h3>" +
        '<p class="d1-loss">' + loss + "</p>" +
        renderAssetGrid(sunk) +
        '<div class="d1-equity">Sunk-cost equity <strong data-d1-equity>' + sunk.equity + "</strong></div>" +
        renderUnlocks(stateRef, false) +
        upgrade +
      "</section>"
    );
  }

  function renderCallsignSheet(ui) {
    var draft = esc((ui && ui.draftName) || "SPARTAN-88");
    var selected = (ui && ui.windowId) || "prime";
    var error = ui && ui.nameError ? '<p class="d1-error" data-d1-name-error>' + esc(ui.nameError) + "</p>" : '<p class="d1-error" data-d1-name-error></p>';
    var chips = "";
    var windows = "";
    var i;
    var win;
    for (i = 0; i < SUGGESTIONS.length; i++) {
      chips += '<button type="button" class="d1-chip' + (SUGGESTIONS[i] === (ui && ui.draftName) ? " is-on" : "") +
        '" data-d1-action="suggest" data-d1-suggest="' + esc(SUGGESTIONS[i]) + '">' + esc(SUGGESTIONS[i]) + "</button>";
    }
    for (i = 0; i < WINDOWS.length; i++) {
      win = WINDOWS[i];
      windows += '<button type="button" class="d1-chip d1-window' + (win.id === selected ? " is-on" : "") +
        '" data-d1-action="window" data-d1-window="' + win.id + '"><b>' + esc(win.label) + "</b><small>" + esc(win.hint) + "</small></button>";
    }
    return (
      '<div class="d1-overlay" data-d1-backdrop="1">' +
        '<div class="d1-sheet" role="dialog" aria-modal="true" aria-labelledby="d1-callsign-title">' +
          '<div class="d1-kicker">MISSION 01 • IDENTITY • +50 XP</div>' +
          '<h3 id="d1-callsign-title">Claim your commander callsign</h3>' +
          "<p>The squad board and the night log will use this name. Pick one you would hate to see fail, then arm the hours the urge actually shows up.</p>" +
          '<label class="d1-label" for="d1-callsign-input">Callsign</label>' +
          '<input id="d1-callsign-input" class="d1-input" data-d1-callsign maxlength="16" autocomplete="off" autocapitalize="characters" value="' + draft + '" />' +
          error +
          '<div class="d1-suggest">' + chips + "</div>" +
          '<div class="d1-label">Arm your danger window</div>' +
          '<div class="d1-windows">' + windows + "</div>" +
          '<button type="button" class="d1-arm" data-d1-action="arm">Arm Callsign • +50 XP</button>' +
          '<button type="button" class="d1-ghost" data-d1-action="close">Not yet</button>' +
        "</div></div>"
    );
  }

  function renderDrillSheet(ui) {
    var drill = ui && ui.drill;
    var failed = !!(drill && drill.failed);
    var liveDrill = !!(drill && drill.started && !failed);
    var taps = drill ? drill.taps : 0;
    var remain = DRILL_MS;
    if (liveDrill) {
      remain = Math.max(0, DRILL_MS - (nowMs() - drill.started));
    }
    var offset = liveDrill ? RING * (1 - remain / DRILL_MS) : 0;
    var body;
    if (!liveDrill && !failed) {
      body =
        "<p>Test-fire Red Panic 2.0 before a real urge hits. The drill lasts 15 seconds. Land 3 contacts on the glass before the ring closes. Leaving early banks nothing.</p>" +
        '<button type="button" class="d1-fire" data-d1-action="fire" data-d1-drill-anchor>TEST-FIRE RED PANIC 2.0</button>';
    } else if (failed) {
      body =
        '<p class="d1-fail">The clock closed with fewer than 3 contacts. The urge will not extend the window. Run the drill again.</p>' +
        '<button type="button" class="d1-fire" data-d1-action="retry-drill">RUN THE 15s DRILL AGAIN</button>';
    } else {
      body =
        '<div class="d1-ring-wrap" data-d1-drill-anchor>' +
          '<svg class="d1-ring" viewBox="0 0 120 120" aria-hidden="true">' +
            '<circle class="d1-ring-bg" cx="60" cy="60" r="52"></circle>' +
            '<circle class="d1-ring-fg" data-d1-ring cx="60" cy="60" r="52" stroke-dasharray="' + RING.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"></circle>' +
          "</svg>" +
          '<div class="d1-ring-num"><span data-d1-drill-clock>' + (remain / 1000).toFixed(1) + '</span><small>SECONDS</small></div>' +
        "</div>" +
        '<button type="button" class="d1-fire" data-d1-action="contact"><span data-d1-contact-label>' +
          (taps >= DRILL_TAPS ? "LINE HELD • " + taps + "/" + DRILL_TAPS : "CONTACT " + taps + "/" + DRILL_TAPS) +
        "</span></button>";
    }
    return (
      '<div class="d1-overlay" data-d1-backdrop="1">' +
        '<div class="d1-sheet" role="dialog" aria-modal="true" aria-labelledby="d1-drill-title">' +
          '<div class="d1-kicker">MISSION 03 • COMBAT • +100 XP</div>' +
          '<h3 id="d1-drill-title">15-Second Red Panic 2.0 Combat Drill</h3>' +
          body +
          '<button type="button" class="d1-ghost" data-d1-action="close">Abort drill</button>' +
        "</div></div>"
    );
  }

  function renderOverlayHTML(src, ui) {
    if (!ui || !ui.panel) return "";
    if (ui.panel === "callsign" && !normalize(src).missions.callsign.done) return renderCallsignSheet(ui);
    if (ui.panel === "drill" && !normalize(src).missions.drill.done) return renderDrillSheet(ui);
    return "";
  }

  function renderHomeHTML(src, nowOrUi) {
    var ui = {};
    var now = Date.now();
    if (typeof nowOrUi === "number") now = nowOrUi;
    else if (nowOrUi && typeof nowOrUi === "object") {
      ui = nowOrUi;
      if (typeof ui.now === "number") now = ui.now;
    }
    var stateRef = normalize(src);
    return renderPassBannerHTML(stateRef, now) +
      renderIgnitionHTML(stateRef, ui) +
      renderLockCardHTML(stateRef, now) +
      renderOverlayHTML(stateRef, ui);
  }

  function renderPaywallCtaHTML(src) {
    injectStyles();
    var stateRef = normalize(src);
    var clock = remaining(stateRef, Date.now());
    var kicker = "NO CARD NEEDED FOR 24H";
    var title = "Try Day 1 Free — No Card Needed for 24h";
    var sub = "Ignition protocol • 4 missions • streak equity starts the moment you enter";
    if (stateRef.upgraded) {
      kicker = "DAY-1 EQUITY BANKED";
      title = "Day-1 Streak Locked";
      sub = "The free-pass assets already sit on the streak.";
    } else if (stateRef.passStartedAt && clock.armed && !clock.expired) {
      kicker = "PASS STILL LIVE • " + clock.label;
      title = "Resume Day-1 Free Pass";
      sub = "Your countdown is still running. No card on file.";
    } else if (stateRef.passStartedAt) {
      kicker = "24 HOURS ENDED";
      title = "Day-1 Pass Ended — Lock the Equity";
      sub = "The free day is over. Upgrade to keep what you built.";
    }
    return (
      '<button type="button" class="d1-pass-cta" data-d1-start-pass>' +
        '<span class="d1-pass-cta-kicker">' + esc(kicker) + "</span>" +
        '<span class="d1-pass-cta-title">' + esc(title) + "</span>" +
        '<span class="d1-pass-cta-sub">' + esc(sub) + "</span>" +
      "</button>"
    );
  }

  var state = createState();
  var listeners = {};
  var live = {
    root: null,
    timer: 0,
    panel: null,
    draftName: "SPARTAN-88",
    windowId: "prime",
    nameError: "",
    sliders: { drive: 4, clarity: 5, urge: 7 },
    holding: false,
    holdRaf: 0,
    drill: null,
    coachTimer: 0,
    onUpgrade: null,
    bound: null,
    holdBtn: null
  };

  function storage() {
    try {
      if (typeof localStorage === "undefined") return null;
      var box = localStorage;
      box.setItem("__d1__", "1");
      box.removeItem("__d1__");
      return box;
    } catch (err) {
      return null;
    }
  }

  function commit() {
    var box = storage();
    if (!box) return;
    try { box.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) {}
  }

  function load() {
    var box = storage();
    if (!box) return;
    try {
      var raw = JSON.parse(box.getItem(STORAGE_KEY) || "null");
      if (raw && raw.v === 1) state = normalize(raw);
    } catch (err) {
      state = createState();
    }
  }

  function emit(event, detail) {
    var list = listeners[event] || [];
    var i;
    for (i = 0; i < list.length; i++) {
      try { list[i](detail); } catch (err) {}
    }
    if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") {
      try {
        root.dispatchEvent(new root.CustomEvent("ironarc:day1:" + event, { detail: detail }));
      } catch (err) {}
    }
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return function () { off(event, fn); };
  }

  function off(event, fn) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (item) { return item !== fn; });
  }

  function getState() {
    var copy = normalize(state);
    var now = Date.now();
    copy.remaining = remaining(copy, now);
    copy.sunk = computeSunkCost(copy, now);
    copy.progress = missionProgress(copy);
    copy.active = isActive(copy, now);
    copy.expired = !!(copy.passStartedAt && !copy.upgraded && !copy.active);
    copy.perfect = !!(copy.perfectLockAt || copy.progress.complete);
    return copy;
  }

  function shouldSurface(src) {
    var stateRef = src ? normalize(src) : state;
    if (!stateRef.passStartedAt) return false;
    if (stateRef.receiptHidden && stateRef.upgraded) return false;
    return true;
  }

  function fxAudio() {
    return root.DopamineFX || null;
  }

  function nowMs() {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  }

  function raf(fn) {
    if (typeof root.requestAnimationFrame === "function") return root.requestAnimationFrame(fn);
    return setTimeout(function () { fn(nowMs()); }, 16);
  }

  function caf(id) {
    if (!id) return;
    if (typeof root.cancelAnimationFrame === "function") root.cancelAnimationFrame(id);
    else clearTimeout(id);
  }

  function celebrate(id, anchor, perfect) {
    var audio = fxAudio();
    if (!audio) return;
    try {
      if (audio.vibrate) audio.vibrate(perfect ? [18, 30, 18, 40] : [14]);
      if (id === "callsign") {
        if (audio.playTick) audio.playTick(740, 0.05);
        if (audio.burstParticles) audio.burstParticles({ anchor: anchor, mode: "rank" });
      } else if (id === "oath") {
        if (audio.playOathSealed) audio.playOathSealed();
        if (audio.burstParticles) audio.burstParticles({ anchor: anchor, mode: "seal" });
      } else if (id === "drill") {
        if (audio.playRankUp) audio.playRankUp();
        if (audio.burstParticles) audio.burstParticles({ anchor: anchor, mode: "ember" });
      } else if (id === "checkup") {
        if (audio.playTick) audio.playTick(660, 0.05);
        if (audio.burstParticles) audio.burstParticles({ anchor: anchor, mode: "rank" });
      }
      if (perfect) {
        if (audio.playRankUp && id !== "drill") audio.playRankUp();
        if (audio.burstParticles) audio.burstParticles({ mode: "confetti" });
        if (audio.speakCoach) audio.speakCoach("Day one perfect lock. This is the progress day two will try to take.");
      } else if (audio.speakCoach) {
        if (id === "callsign") audio.speakCoach("Callsign locked. The night has a name now.");
        else if (id === "oath") audio.speakCoach("Oath sealed. Do not negotiate after the window opens.");
        else if (id === "drill") audio.speakCoach("Panic drill cleared. Use the same motion when it is real.");
        else if (id === "checkup") audio.speakCoach("Baseline logged. Day thirty is a projection. Tonight is the rep.");
      }
    } catch (err) {}
  }

  function award(id, extra) {
    var spec = missionById(id);
    if (!spec) return { ok: false, perfect: false };
    if (!state.missions[id] || state.missions[id].done) return { ok: false, perfect: false };
    if (!previousDone(state, id)) return { ok: false, perfect: false };
    var slot = state.missions[id];
    slot.done = true;
    slot.at = Date.now();
    slot.xp = spec.xp;
    if (extra) {
      var key;
      for (key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) slot[key] = extra[key];
      }
    }
    var prog = missionProgress(state);
    var perfect = false;
    if (prog.complete && !state.perfectLockAt) {
      state.perfectLockAt = Date.now();
      perfect = true;
    }
    commit();
    var detail = {
      id: id,
      xp: spec.xp,
      totalXP: prog.xp,
      perfect: perfect,
      callsign: state.missions.callsign.callsign || "",
      windowLabel: state.missions.callsign.windowLabel || "",
      sunk: computeSunkCost(state, Date.now())
    };
    emit("mission-complete", detail);
    if (perfect) emit("perfect-lock", getState());
    return { ok: true, perfect: perfect, detail: detail };
  }

  function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("d1-styles")) return;
    var style = document.createElement("style");
    style.id = "d1-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function view() {
    return {
      now: Date.now(),
      panel: live.panel,
      draftName: live.draftName,
      windowId: live.windowId,
      nameError: live.nameError,
      sliders: live.sliders,
      drill: live.drill
    };
  }

  function unbind() {
    if (live.bound) {
      live.bound.removeEventListener("click", onClick);
      live.bound.removeEventListener("input", onInput);
    }
    if (live.holdBtn) {
      live.holdBtn.removeEventListener("pointerdown", onHoldDown);
      live.holdBtn.removeEventListener("pointerup", onHoldUp);
      live.holdBtn.removeEventListener("pointercancel", onHoldUp);
    }
    if (typeof document !== "undefined") document.removeEventListener("keydown", onKey);
    live.bound = null;
    live.holdBtn = null;
  }

  function bind(node) {
    unbind();
    live.bound = node;
    node.addEventListener("click", onClick);
    node.addEventListener("input", onInput);
    var hold = node.querySelector("[data-d1-hold]");
    live.holdBtn = hold;
    if (hold) {
      hold.addEventListener("pointerdown", onHoldDown);
      hold.addEventListener("pointerup", onHoldUp);
      hold.addEventListener("pointercancel", onHoldUp);
    }
    if (typeof document !== "undefined") document.addEventListener("keydown", onKey);
  }

  function paint() {
    if (!live.root) return;
    live.root.innerHTML = renderHomeHTML(state, view());
    bind(live.root);
    var input = live.root.querySelector("[data-d1-callsign]");
    if (input && live.panel === "callsign") {
      try {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      } catch (err) {}
    }
    if (live.drill && live.drill.started && !live.drill.failed) kickDrillLoop();
  }

  function stopDrillRaf() {
    if (live.drill && live.drill.raf) caf(live.drill.raf);
    if (live.drill) live.drill.raf = 0;
    if (live.coachTimer) {
      clearTimeout(live.coachTimer);
      live.coachTimer = 0;
    }
  }

  function stopHold() {
    live.holding = false;
    if (live.holdRaf) caf(live.holdRaf);
    live.holdRaf = 0;
    var audio = fxAudio();
    try { if (audio && audio.stopChargeHum) audio.stopChargeHum(); } catch (err) {}
  }

  function unmount() {
    stopHold();
    stopDrillRaf();
    live.drill = null;
    live.panel = null;
    if (live.timer) {
      clearInterval(live.timer);
      live.timer = 0;
    }
    unbind();
    if (live.root) live.root.innerHTML = "";
    live.root = null;
    live.onUpgrade = null;
  }

  function setAll(sel, text) {
    if (!live.root) return;
    var nodes = live.root.querySelectorAll(sel);
    var i;
    for (i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  function tick() {
    if (!live.root) return;
    var now = Date.now();
    var clock = remaining(state, now);
    var sunk = computeSunkCost(state, now);
    var banner = live.root.querySelector("[data-d1-banner]");
    if (!banner) return;
    var mode = banner.getAttribute("data-d1-mode");
    if (state.upgraded) {
      setAll("[data-d1-clock]", "LOCKED");
    } else if (clock.armed) {
      setAll("[data-d1-clock]", clock.label);
    }
    var bars = live.root.querySelectorAll("[data-d1-deplete]");
    var i;
    for (i = 0; i < bars.length; i++) {
      bars[i].style.width = (state.upgraded ? 100 : Math.round(clock.ratio * 100)) + "%";
    }
    setAll("[data-d1-xp]", String(sunk.willpowerXP));
    setAll("[data-d1-paths]", String(sunk.pathwaysLit));
    setAll("[data-d1-urges]", String(sunk.urgesShielded));
    setAll("[data-d1-squad]", sunk.squadLabel);
    setAll("[data-d1-equity]", String(sunk.equity));
    var nextMode = mode;
    if (state.upgraded) nextMode = "locked";
    else if (clock.expired) nextMode = "expired";
    else if (clock.armed) nextMode = "live";
    if (nextMode !== mode) paint();
  }

  function resolveEl(el) {
    if (!el) return null;
    if (typeof el === "string") {
      if (typeof document === "undefined" || !document.querySelector) return null;
      return document.querySelector(el);
    }
    return el;
  }

  function mount(el, opts) {
    injectStyles();
    var node = resolveEl(el);
    if (!node) return api;
    unmount();
    opts = opts || {};
    live.onUpgrade = typeof opts.onUpgrade === "function" ? opts.onUpgrade : null;
    live.root = node;
    if (node.classList) node.classList.add("d1-root");
    paint();
    live.timer = setInterval(tick, 1000);
    return api;
  }

  function startPass(opts) {
    opts = opts || {};
    var now = typeof opts.now === "number" ? opts.now : Date.now();
    if (state.passStartedAt && !opts.force) return getState();
    state = createState({
      passStartedAt: now,
      passExpiresAt: now + PASS_MS,
      source: opts.source === "paywall" ? "paywall" : "pass"
    });
    live.panel = null;
    live.drill = null;
    live.draftName = "SPARTAN-88";
    live.windowId = "prime";
    live.nameError = "";
    live.sliders = { drive: 4, clarity: 5, urge: 7 };
    commit();
    emit("pass-started", getState());
    paint();
    return getState();
  }

  function markUpgraded() {
    if (!state.passStartedAt) return getState();
    state.upgraded = true;
    state.upgradedAt = Date.now();
    commit();
    emit("upgraded", getState());
    paint();
    return getState();
  }

  function reset() {
    stopHold();
    stopDrillRaf();
    state = createState();
    live.panel = null;
    live.drill = null;
    live.draftName = "SPARTAN-88";
    live.windowId = "prime";
    live.nameError = "";
    live.sliders = { drive: 4, clarity: 5, urge: 7 };
    var box = storage();
    if (box) {
      try { box.removeItem(STORAGE_KEY); } catch (err) {}
    }
    emit("reset", getState());
    paint();
    return getState();
  }

  function sync(patch) {
    patch = patch || {};
    if (patch.callsign && state.missions.callsign.done) {
      state.missions.callsign.callsign = String(patch.callsign);
    }
    if (typeof patch.receiptHidden === "boolean") state.receiptHidden = patch.receiptHidden;
    commit();
    paint();
    return getState();
  }

  function requestUpgrade(from, anchor) {
    var audio = fxAudio();
    try { if (audio && audio.playTick) audio.playTick(840, 0.05); } catch (err) {}
    var detail = { from: from || "banner", state: getState() };
    emit("upgrade", detail);
    if (typeof live.onUpgrade === "function") {
      try { live.onUpgrade(detail, anchor); } catch (err) {}
    }
  }

  function actionNode(node) {
    var el = node;
    while (el && el !== live.root) {
      if (el.getAttribute && el.getAttribute("data-d1-action")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function closePanel() {
    if (live.panel === "drill") {
      stopDrillRaf();
      live.drill = null;
    }
    stopHold();
    live.panel = null;
    live.nameError = "";
    paint();
  }

  function openPanel(id) {
    var spec = missionById(id);
    if (!spec) return;
    var slot = state.missions[id];
    if (slot.done && id !== "checkup") return;
    if (!slot.done && !previousDone(state, id)) {
      var audio = fxAudio();
      try { if (audio && audio.playTick) audio.playTick(220, 0.03); } catch (err) {}
      return;
    }
    if (live.panel === "drill" && id !== "drill") {
      stopDrillRaf();
      live.drill = null;
    }
    stopHold();
    live.panel = id;
    live.nameError = "";
    paint();
  }

  function markWindows() {
    if (!live.root) return;
    var nodes = live.root.querySelectorAll("[data-d1-window]");
    var i;
    for (i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle("is-on", nodes[i].getAttribute("data-d1-window") === live.windowId);
    }
  }

  function armCallsign(anchor) {
    var named = normalizeCallsign(live.draftName);
    if (!named.ok) {
      live.nameError = named.reason;
      paint();
      return;
    }
    var win = windowById(live.windowId);
    live.panel = null;
    live.nameError = "";
    var result = award("callsign", {
      callsign: named.value,
      windowId: win.id,
      windowLabel: win.label
    });
    if (result.ok) celebrate("callsign", anchor, result.perfect);
    paint();
  }

  function onHoldDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (state.missions.oath.done || live.holding) return;
    if (!previousDone(state, "oath")) return;
    if (e.cancelable) e.preventDefault();
    live.holding = true;
    var start = nowMs();
    var btn = e.currentTarget;
    try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    var audio = fxAudio();
    try { if (audio && audio.startChargeHum) audio.startChargeHum(); } catch (err2) {}
    function frame() {
      if (!live.holding) return;
      var p = Math.min(1, (nowMs() - start) / OATH_MS);
      var fill = btn.querySelector("[data-d1-hold-fill]");
      if (fill) fill.style.width = (p * 100).toFixed(1) + "%";
      try { if (audio && audio.updateChargePitch) audio.updateChargePitch(p); } catch (err3) {}
      if (p >= 1) {
        live.holding = false;
        live.holdRaf = 0;
        try { if (audio && audio.stopChargeHum) audio.stopChargeHum(); } catch (err4) {}
        live.panel = null;
        var result = award("oath", {});
        if (result.ok) celebrate("oath", btn, result.perfect);
        paint();
        return;
      }
      live.holdRaf = raf(frame);
    }
    live.holdRaf = raf(frame);
  }

  function onHoldUp() {
    if (!live.holding) return;
    stopHold();
    if (!live.root) return;
    var fill = live.root.querySelector("[data-d1-hold-fill]");
    if (fill) fill.style.width = "0%";
  }

  function updateDrillDom(remain) {
    if (!live.root || !live.drill) return;
    var clock = live.root.querySelector("[data-d1-drill-clock]");
    if (clock) clock.textContent = (remain / 1000).toFixed(1);
    var ring = live.root.querySelector("[data-d1-ring]");
    if (ring) ring.style.strokeDashoffset = String(RING * (1 - remain / DRILL_MS));
    var label = live.root.querySelector("[data-d1-contact-label]");
    if (label) {
      var taps = live.drill.taps;
      label.textContent = taps >= DRILL_TAPS ? "LINE HELD • " + taps + "/" + DRILL_TAPS : "CONTACT " + taps + "/" + DRILL_TAPS;
    }
  }

  function kickDrillLoop() {
    if (!live.drill || live.drill.failed || !live.drill.started) return;
    if (live.drill.raf) caf(live.drill.raf);
    function frame() {
      if (!live.drill || !live.root || live.drill.failed) return;
      var remain = Math.max(0, DRILL_MS - (nowMs() - live.drill.started));
      updateDrillDom(remain);
      if (remain <= 0) {
        live.drill.raf = 0;
        if (live.drill.taps >= DRILL_TAPS) finishDrill();
        else {
          live.drill.failed = true;
          var audio = fxAudio();
          try { if (audio && audio.playTick) audio.playTick(180, 0.05); } catch (err) {}
          paint();
        }
        return;
      }
      live.drill.raf = raf(frame);
    }
    live.drill.raf = raf(frame);
  }

  function beginDrill() {
    if (state.missions.drill.done || !previousDone(state, "drill")) return;
    stopDrillRaf();
    live.drill = { started: nowMs(), taps: 0, raf: 0, failed: false };
    var audio = fxAudio();
    try {
      if (audio && audio.playPanicSiren) audio.playPanicSiren();
      if (audio && audio.speakCoach) {
        live.coachTimer = setTimeout(function () {
          live.coachTimer = 0;
          try {
            if (root.DopamineFX && root.DopamineFX.speakCoach) {
              root.DopamineFX.speakCoach("Fifteen seconds. Three contacts. Eyes up.");
            }
          } catch (err) {}
        }, 1200);
      }
    } catch (err2) {}
    paint();
  }

  function finishDrill() {
    var taps = live.drill ? live.drill.taps : DRILL_TAPS;
    var anchor = live.root ? live.root.querySelector("[data-d1-drill-anchor]") : null;
    stopDrillRaf();
    live.drill = null;
    live.panel = null;
    var result = award("drill", { taps: taps, elapsedMs: DRILL_MS });
    if (result.ok) celebrate("drill", anchor, result.perfect);
    paint();
  }

  function tapDrill() {
    if (!live.drill || live.drill.failed || !live.drill.started) return;
    var elapsed = nowMs() - live.drill.started;
    if (elapsed > DRILL_MS + 80) return;
    if (live.drill.taps >= DRILL_TAPS) return;
    live.drill.taps += 1;
    var audio = fxAudio();
    try {
      if (audio && audio.playTick) audio.playTick(480 + live.drill.taps * 70, 0.04);
      if (audio && audio.vibrate) audio.vibrate([10]);
    } catch (err) {}
    updateDrillDom(Math.max(0, DRILL_MS - elapsed));
  }

  function paintProjection() {
    if (!live.root) return;
    var box = live.root.querySelector("[data-d1-projection]");
    if (!box || state.missions.checkup.done) return;
    box.innerHTML = renderProjectionHTML(projectBaseline(live.sliders));
  }

  function logCheckup(anchor) {
    if (state.missions.checkup.done || !previousDone(state, "checkup")) return;
    var scores = {
      drive: clamp10(live.sliders.drive),
      clarity: clamp10(live.sliders.clarity),
      urge: clamp10(live.sliders.urge)
    };
    live.panel = null;
    var result = award("checkup", scores);
    if (result.ok) celebrate("checkup", anchor, result.perfect);
    paint();
  }

  function onInput(e) {
    var target = e.target;
    if (!target || !target.getAttribute) return;
    var slider = target.getAttribute("data-d1-slider");
    if (slider && live.sliders[slider] != null) {
      live.sliders[slider] = clamp10(target.value);
      var out = live.root && live.root.querySelector('[data-d1-val="' + slider + '"]');
      if (out) out.textContent = String(live.sliders[slider]);
      paintProjection();
      return;
    }
    if (target.hasAttribute && target.hasAttribute("data-d1-callsign")) {
      live.draftName = target.value;
    }
  }

  function onKey(e) {
    if (!e || e.key !== "Escape" || !live.panel) return;
    if (live.drill && live.drill.started && !live.drill.failed) return;
    closePanel();
  }

  function onClick(e) {
    if (!live.root) return;
    var target = e.target;
    if (target && target.getAttribute && target.getAttribute("data-d1-backdrop") === "1") {
      if (live.drill && live.drill.started && !live.drill.failed) return;
      closePanel();
      return;
    }
    var node = actionNode(target);
    if (!node) return;
    var action = node.getAttribute("data-d1-action");
    if (action === "upgrade") {
      e.preventDefault();
      requestUpgrade(node.getAttribute("data-d1-from") || "banner", node);
      return;
    }
    if (action === "open") {
      openPanel(node.getAttribute("data-d1-panel"));
      return;
    }
    if (action === "close") {
      closePanel();
      return;
    }
    if (action === "suggest") {
      live.draftName = node.getAttribute("data-d1-suggest") || live.draftName;
      live.nameError = "";
      var input = live.root.querySelector("[data-d1-callsign]");
      if (input) input.value = live.draftName;
      var chips = live.root.querySelectorAll("[data-d1-suggest]");
      var c;
      for (c = 0; c < chips.length; c++) {
        chips[c].classList.toggle("is-on", chips[c].getAttribute("data-d1-suggest") === live.draftName);
      }
      var err = live.root.querySelector("[data-d1-name-error]");
      if (err) err.textContent = "";
      return;
    }
    if (action === "window") {
      live.windowId = node.getAttribute("data-d1-window") || "prime";
      var audioWin = fxAudio();
      try { if (audioWin && audioWin.playTick) audioWin.playTick(620, 0.03); } catch (err) {}
      markWindows();
      return;
    }
    if (action === "arm") {
      armCallsign(node);
      return;
    }
    if (action === "fire") {
      beginDrill();
      return;
    }
    if (action === "contact") {
      tapDrill();
      return;
    }
    if (action === "retry-drill") {
      live.drill = null;
      paint();
      return;
    }
    if (action === "log-checkup") {
      logCheckup(node);
      return;
    }
    if (action === "stow") {
      state.receiptHidden = true;
      commit();
      emit("stowed", getState());
      unmount();
    }
  }

  function selfTest() {
    var failed = [];
    function check(name, ok) {
      if (!ok) failed.push(name);
    }
    check("clock", formatCountdown((23 * 3600 + 58 * 60 + 14) * 1000) === "23h : 58m : 14s");
    check("zero", formatCountdown(0) === "00h : 00m : 00s");
    check("neg", formatCountdown(-5) === "00h : 00m : 00s");
    check("xp sum", MISSIONS[0].xp + MISSIONS[1].xp + MISSIONS[2].xp + MISSIONS[3].xp === BONUS_XP);

    var t0 = 1700000000000;
    var fresh = createState({ passStartedAt: t0, passExpiresAt: t0 + PASS_MS, source: "paywall" });
    check("remain", remaining(fresh, t0 + 106000).label === "23h : 58m : 14s");
    check("active", isActive(fresh, t0 + 1000) === true);
    check("boundary", isActive(fresh, t0 + PASS_MS) === false);

    var sunk0 = computeSunkCost(fresh, t0);
    check("entry pathways", sunk0.pathwaysLit === 2 && sunk0.willpowerXP === 0 && sunk0.squadSlotReserved === false && sunk0.equity === 36);

    var named = normalize(fresh);
    named.missions.callsign = { done: true, at: t0, xp: 50, callsign: "SPARTAN-88", windowId: "prime", windowLabel: "11 PM – 2 AM" };
    var sunk1 = computeSunkCost(named, t0);
    check("callsign equity", sunk1.willpowerXP === 50 && sunk1.squadSlotReserved === true && sunk1.pathwaysLit === 6);

    var timed = computeSunkCost(fresh, t0 + 180000);
    check("time pathways", timed.pathwaysLit === 4);

    named.missions.oath = { done: true, at: t0, xp: 50 };
    named.missions.drill = { done: true, at: t0, xp: 100, taps: 3, elapsedMs: DRILL_MS };
    named.missions.checkup = { done: true, at: t0, xp: 50, drive: 4, clarity: 5, urge: 7 };
    var prog = missionProgress(named);
    check("complete", prog.done === 4 && prog.xp === 250 && prog.complete === true);
    var sunkAll = computeSunkCost(named, t0);
    check("full equity", sunkAll.urgesShielded === 2 && sunkAll.pathwaysLit === 18 && sunkAll.equity === 854);

    var proj = projectBaseline({ drive: 4, clarity: 5, urge: 7 });
    check("urge drops", proj.day30.urge < proj.day1.urge);
    check("drive rises", proj.day30.drive > proj.day1.drive);
    check("urge high holds floor", projectBaseline({ drive: 10, clarity: 10, urge: 0 }).day30.urge === 0);

    var html = renderPassBannerHTML(fresh, t0 + 106000);
    check("banner clock", html.indexOf("23h : 58m : 14s") !== -1);
    check("upgrade copy", html.indexOf("Lock My Streak Forever (Upgrade)") !== -1);
    check("asset labels", html.indexOf("Willpower XP") !== -1 && html.indexOf("Cortical Pathways Lit") !== -1 && html.indexOf("Urges Shielded") !== -1 && html.indexOf("Squad Slot Reserved") !== -1);

    var ign = renderIgnitionHTML(named);
    check("bonus label", ign.indexOf("4/4 Complete • +250 Bonus XP") !== -1);
    var early = renderIgnitionHTML(fresh);
    check("zero progress", early.indexOf("0/4") !== -1 && early.indexOf("4/4 Complete") === -1);

    var lock = renderLockCardHTML(named, t0 + 106000);
    check("badge", lock.indexOf("DAY 1 PERFECT LOCK") !== -1);
    check("crest", lock.indexOf("Withdrawal Crest Shielding") !== -1);
    check("day2", lock.indexOf("Trigger Sentry") !== -1);
    var teaser = renderLockCardHTML(fresh, t0);
    check("teaser hidden badge", teaser.indexOf("DAY 1 PERFECT LOCK") === -1 && teaser.indexOf("Withdrawal Crest Shielding") !== -1);

    var dirty = createState({
      passStartedAt: t0,
      passExpiresAt: t0 + PASS_MS,
      missions: {
        callsign: { done: true, xp: 50, callsign: '<img alt="x">', windowLabel: "11 PM – 2 AM", windowId: "prime", at: t0 },
        oath: { done: false },
        drill: { done: false },
        checkup: { done: false }
      }
    });
    check("escape", renderIgnitionHTML(dirty).indexOf("<img") === -1);

    check("name", normalizeCallsign("spartan-88").ok === true && normalizeCallsign("spartan-88").value === "SPARTAN-88");
    check("name bad", normalizeCallsign("!!!").ok === false);
    check("order", previousDone(fresh, "drill") === false && previousDone(fresh, "callsign") === true);

    var cta = renderPaywallCtaHTML(createState());
    check("cta", cta.indexOf("Try Day 1 Free — No Card Needed for 24h") !== -1);

    var home = renderHomeHTML(named, t0);
    check("home bundles", home.indexOf("data-d1-banner") !== -1 && home.indexOf("data-d1-quest") !== -1 && home.indexOf("data-d1-lock") !== -1);

    return { ok: failed.length === 0, failed: failed };
  }

  load();

  var api = {
    version: "1.0.0",
    PASS_MS: PASS_MS,
    BONUS_XP: BONUS_XP,
    OATH_HOLD_MS: OATH_MS,
    DRILL_MS: DRILL_MS,
    DRILL_TAPS: DRILL_TAPS,
    missions: MISSIONS,
    windows: WINDOWS,
    createState: createState,
    getState: getState,
    startPass: startPass,
    isActive: function (src, now) { return isActive(src || state, now); },
    shouldSurface: function (src) { return shouldSurface(src); },
    remaining: function (src, now) { return remaining(src || state, now); },
    formatCountdown: formatCountdown,
    computeSunkCost: function (src, now) { return computeSunkCost(src || state, now); },
    projectBaseline: projectBaseline,
    normalizeCallsign: normalizeCallsign,
    missionProgress: function (src) { return missionProgress(src || state); },
    renderPassBannerHTML: function (src, now) { return renderPassBannerHTML(src || state, now); },
    renderIgnitionHTML: function (src, ui) { return renderIgnitionHTML(src || state, ui); },
    renderLockCardHTML: function (src, now) { return renderLockCardHTML(src || state, now); },
    renderHomeHTML: function (src, nowOrUi) { return renderHomeHTML(src || state, nowOrUi); },
    renderPaywallCtaHTML: function (src) { return renderPaywallCtaHTML(src || state); },
    mount: mount,
    unmount: unmount,
    sync: sync,
    reset: reset,
    markUpgraded: markUpgraded,
    on: on,
    off: off,
    injectStyles: injectStyles,
    selfTest: selfTest
  };

  root.Day1Module = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
