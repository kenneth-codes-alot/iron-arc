/**
 * Panic2Engine — Red Panic Button 2.0.
 * Standalone urge-intervention overlay. No dependencies. CSS is injected.
 *
 *   <script src="./dopamine-fx.js"></script>
 *   <script src="./panic2-engine.js"></script>
 *   Panic2Engine.on("urge-defeated", function (detail) { });
 *   Panic2Engine.open({ streakDay: 14, willpowerXP: 450 });
 *   Panic2Engine.close();
 *
 * Events: open, close, mode, progress, camera, quote, checkpoint, lock,
 * ready, victory, urge-defeated, claim.
 * Completing any mode arms the emerald claim. Claiming plays
 * DopamineFX.playRankUp() and burstParticles({ mode: "rank" }) when present.
 */
(function (root) {
  "use strict";

  if (root.Panic2Engine && root.Panic2Engine.__built) return;

  var QUOTES = [
    "DAY {DAY}. LOOK AT THE MAN IN THE GLASS. DO NOT SELL HIM FOR A SCREEN.",
    "THE URGE PEAKS. YOU DO NOT.",
    "STARVE THE THOUGHT. FEED THE MINUTE.",
    "FEET ON THE FLOOR BEFORE THE MIND BEGINS TO BEG.",
    "THIS WAVE IS NINETY SECONDS. REGRET IS A SEASON.",
    "MORNING RESPECT IS BUILT IN ROOMS LIKE THIS.",
    "YOU ARE NOT REQUIRED TO FEEL READY. YOU ARE REQUIRED TO STAY.",
    "THE OBSTACLE IS THE REP. STRIKE IT UNTIL IT BREAKS."
  ];

  var RANKS = [
    { min: 0, name: "INITIATE" },
    { min: 3, name: "SURGE" },
    { min: 7, name: "IRON MONK" },
    { min: 14, name: "SPARTAN" },
    { min: 30, name: "NNN TITAN" },
    { min: 60, name: "WINTER GUARD" },
    { min: 90, name: "SOVEREIGN" }
  ];

  var BREATH = [
    { id: "inhale", label: "INHALE", seconds: 4, ms: 4000, from: 0.62, to: 1, cue: "IN THROUGH THE NOSE. FOUR." },
    { id: "hold", label: "HOLD", seconds: 7, ms: 7000, from: 1, to: 1, cue: "STILLNESS. LET THE PULSE DROP." },
    { id: "exhale", label: "EXHALE", seconds: 8, ms: 8000, from: 1, to: 0.58, cue: "LONG EXHALE. EIGHT. EMPTY THE URGE." }
  ];
  var BREATH_CYCLE = 19000;

  var CHECKS = [
    { at: 15000, label: "CHARGE" },
    { at: 30000, label: "CLIMB" },
    { at: 45000, label: "CREST" },
    { at: 60000, label: "BREAK" },
    { at: 75000, label: "FADE" },
    { at: 90000, label: "CLEAR" }
  ];

  var SHIELD_SVG = '<svg class="p2-shield" viewBox="0 0 64 72" aria-hidden="true"><path d="M32 3 L58 14 V34 C58 52 46 63 32 69 C18 63 6 52 6 34 V14 Z" fill="rgba(251,191,36,.16)" stroke="#fbbf24" stroke-width="2"/><path d="M22 36 L29 43 L44 26" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var listeners = {};
  var session = null;
  var scrollLock = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function pad3(n) {
    if (n < 10) return "00" + n;
    if (n < 100) return "0" + n;
    return String(n);
  }

  function now() {
    return root.performance && root.performance.now ? root.performance.now() : Date.now();
  }

  function raf(fn) {
    if (root.requestAnimationFrame) return root.requestAnimationFrame(fn);
    return root.setTimeout(function () { fn(now()); }, 16);
  }

  function caf(id) {
    if (root.cancelAnimationFrame) root.cancelAnimationFrame(id);
    else root.clearTimeout(id);
  }

  function prefersReduced() {
    try {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) {
      return false;
    }
  }

  function cleanDay(value) {
    var n = Math.floor(Number(value));
    if (!isFinite(n)) return 1;
    if (n < 0) return 0;
    if (n > 9999) return 9999;
    return n;
  }

  function cleanXp(value) {
    var n = Math.round(Number(value));
    if (!isFinite(n) || n <= 0) return 50;
    if (n > 9999) return 9999;
    return n;
  }

  function rankName(day, override) {
    if (override != null && String(override).trim()) {
      return String(override).replace(/\s+/g, " ").trim().slice(0, 24);
    }
    var name = RANKS[0].name;
    var i;
    for (i = 0; i < RANKS.length; i++) {
      if (day >= RANKS[i].min) name = RANKS[i].name;
    }
    return name;
  }

  function cleanMode(value) {
    var mode = String(value || "shatter").toLowerCase();
    if (mode === "body" || mode === "sigh" || mode === "push" || mode === "pushups") return "breath";
    if (mode === "wave" || mode === "urge") return "surf";
    if (mode === "consequence" || mode === "split" || mode === "forward") return "tape";
    if (mode === "shatter" || mode === "breath" || mode === "surf" || mode === "tape") return mode;
    return "shatter";
  }

  function applyDay(text, day) {
    return String(text).replace(/\{DAY\}/g, String(day));
  }

  function toSpeech(text) {
    var lower = String(text).toLowerCase().replace(/\s+/g, " ").trim();
    return lower.replace(/(^|[.!?]\s+)([a-z])/g, function (_m, lead, ch) {
      return lead + ch.toUpperCase();
    });
  }

  function lerpHex(a, b, t) {
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    var out = "#";
    var i;
    for (i = 0; i < 3; i++) {
      var av = parseInt(a.substr(1 + i * 2, 2), 16);
      var bv = parseInt(b.substr(1 + i * 2, 2), 16);
      var v = Math.round(av + (bv - av) * t);
      var h = v.toString(16);
      out += h.length < 2 ? "0" + h : h;
    }
    return out;
  }

  function bpmFor(ms) {
    var t = ms <= 0 ? 0 : ms / 90000;
    if (t > 1) t = 1;
    var eased = 1 - (1 - t) * (1 - t);
    return Math.round(118 + (72 - 118) * eased);
  }

  function formatMission(ms) {
    if (ms < 0) ms = 0;
    ms = Math.floor(ms);
    var mins = Math.floor(ms / 60000);
    var secs = Math.floor(ms / 1000) % 60;
    return pad2(mins) + ":" + pad2(secs) + "." + pad3(ms % 1000);
  }

  function formatShort(ms) {
    var secs = Math.floor(ms / 1000);
    if (secs < 0) secs = 0;
    if (secs > 90) secs = 90;
    return pad2(Math.floor(secs / 60)) + ":" + pad2(secs % 60);
  }

  function gauss(phase, center, width, amp) {
    var d = (phase - center) / width;
    return Math.exp(-d * d) * amp;
  }

  function ecgSample(phase) {
    return gauss(phase, 0.18, 0.035, 0.15)
      - gauss(phase, 0.34, 0.012, 0.16)
      + gauss(phase, 0.37, 0.009, 1)
      - gauss(phase, 0.415, 0.013, 0.28)
      + gauss(phase, 0.62, 0.05, 0.24);
  }

  function ecgPath(stamp, bpm) {
    var beat = 60000 / Math.max(48, bpm);
    var windowMs = beat * 3.15;
    var steps = 84;
    var parts = new Array(steps + 1);
    var i;
    for (i = 0; i <= steps; i++) {
      var x = (i / steps) * 360;
      var t = stamp - (1 - i / steps) * windowMs;
      var phase = ((t % beat) + beat) % beat / beat;
      var y = 30 - ecgSample(phase) * 22;
      parts[i] = (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return parts.join("");
  }

  function urgeAmp(ms) {
    var t = ms <= 0 ? 0 : ms / 1000;
    if (t > 90) t = 90;
    if (t <= 45) return 0.3 + 0.7 * Math.sin((t / 45) * Math.PI / 2);
    return 0.3 + 0.7 * Math.cos(((t - 45) / 45) * Math.PI / 2);
  }

  function waveY(x, timeSec, amp) {
    var swell = Math.sin(x * 0.045 + timeSec * 2.8) * 14 * amp;
    var ripple = Math.sin(x * 0.02 - timeSec * 1.5) * 8 * amp;
    var crest = Math.exp(-Math.pow((x - 188) / 78, 2)) * 26 * amp;
    var y = 74 - swell - ripple - crest;
    if (y < 12) y = 12;
    if (y > 106) y = 106;
    return y;
  }

  function buildWave(timeSec, amp) {
    var steps = 48;
    var parts = new Array(steps + 1);
    var i;
    for (i = 0; i <= steps; i++) {
      var x = (i / steps) * 360;
      var y = waveY(x, timeSec, amp);
      parts[i] = (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    }
    var line = parts.join("");
    return { line: line, fill: line + "L360 120L0 120Z" };
  }

  function surfPhrase(ms) {
    var s = ms / 1000;
    if (s < 18) return "URGE RISING";
    if (s < 40) return "CLIMBING THE CREST";
    if (s < 52) return "CRAVING CREST";
    if (s < 75) return "CREST BREAKING";
    return "DOPAMINE SUBSIDING";
  }

  function breathAt(ms) {
    if (ms < 0) ms = 0;
    var into = ms % BREATH_CYCLE;
    var acc = 0;
    var i;
    for (i = 0; i < BREATH.length; i++) {
      var phase = BREATH[i];
      var end = acc + phase.ms;
      if (into < end || i === BREATH.length - 1) {
        var local = into - acc;
        if (local < 0) local = 0;
        var p = local / phase.ms;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        var eased = 0.5 - 0.5 * Math.cos(Math.PI * p);
        var scale = phase.from + (phase.to - phase.from) * eased;
        if (phase.id === "hold") scale = 1 + Math.sin(ms / 170) * 0.014;
        var left = Math.ceil((phase.ms - local) / 1000);
        if (left < 1) left = 1;
        var ring = phase.id === "exhale" ? (1 - p) : (phase.id === "hold" ? 1 : p);
        return {
          phase: phase,
          scale: scale,
          left: left,
          ring: ring,
          cycle: Math.floor(ms / BREATH_CYCLE) + 1
        };
      }
      acc = end;
    }
    return null;
  }

  function makeCracks() {
    var wobble = [0.34, -0.28, 0.22, -0.4, 0.3, -0.18, 0.26, -0.32, 0.16, -0.24];
    var paths = [];
    var i;
    for (i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / 10);
      var x = 160;
      var y = 160;
      var d = "M160 160";
      var s;
      for (s = 1; s <= 4; s++) {
        a += wobble[i] * (s % 2 === 0 ? 1 : -0.55);
        var len = 14 + s * 9 + (i % 3) * 2;
        x += Math.cos(a) * len;
        y += Math.sin(a) * len;
        d += "L" + x.toFixed(1) + " " + y.toFixed(1);
        if (s === 2) {
          var ba = a + wobble[i] * 2.1;
          var bx = x + Math.cos(ba) * (16 + (i % 4) * 3);
          var by = y + Math.sin(ba) * (14 + (i % 3) * 4);
          d += "M" + x.toFixed(1) + " " + y.toFixed(1) + "L" + bx.toFixed(1) + " " + by.toFixed(1) + "M" + x.toFixed(1) + " " + y.toFixed(1);
        }
      }
      paths.push(d);
    }
    return paths;
  }

  function cracksMarkup() {
    var paths = makeCracks();
    var html = "";
    var i;
    for (i = 0; i < paths.length; i++) {
      html += '<path class="p2-crack" d="' + paths[i] + '"></path>';
    }
    return html;
  }

  function ticksMarkup() {
    var html = "";
    var i;
    for (i = 0; i < 10; i++) html += "<i></i>";
    return html;
  }

  function nodesMarkup() {
    var html = "";
    var i;
    for (i = 0; i < CHECKS.length; i++) {
      html += '<button type="button" class="p2-node" data-act="hold" data-index="' + i + '">' +
        "<i></i><b>" + (CHECKS[i].at / 1000) + "</b><span>" + CHECKS[i].label + "</span></button>";
    }
    return html;
  }

  var CSS = [
    "#p2-overlay{--p2-alert:#ff2d55;--p2-ink:#f8fafc;--p2-muted:#94a3b8;position:fixed;inset:0;z-index:9000;overflow:auto;overscroll-behavior:contain;color:var(--p2-ink);color-scheme:dark;font-family:Inter,'Segoe UI',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;user-select:none;background:radial-gradient(ellipse at 50% -10%,rgba(225,29,72,.22),transparent 42%),radial-gradient(ellipse at 100% 100%,rgba(16,185,129,.07),transparent 36%),#05060a}",
    "#p2-overlay.is-victory{--p2-alert:#34d399;background:radial-gradient(ellipse at 50% -8%,rgba(16,185,129,.24),transparent 46%),radial-gradient(ellipse at 90% 100%,rgba(251,191,36,.1),transparent 38%),#05060a}",
    "#p2-overlay *{box-sizing:border-box}",
    "#p2-overlay button{font-family:inherit;-webkit-appearance:none;appearance:none}",
    "#p2-overlay button:focus-visible{outline:2px solid #f8fafc;outline-offset:2px}",
    "#p2-overlay .p2-sheet{width:min(480px,100%);margin:0 auto;min-height:100%;display:flex;flex-direction:column;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom))}",
    "#p2-overlay .p2-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}",
    "#p2-overlay .p2-kicker{margin:0 0 3px;font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--p2-alert)}",
    "#p2-overlay h2{margin:0;font-size:22px;line-height:1.05;letter-spacing:.02em}",
    "#p2-overlay .p2-ghost{border:1px solid rgba(255,255,255,.16);background:rgba(8,10,16,.55);color:#e2e8f0;border-radius:999px;padding:8px 12px;font-size:10px;font-weight:800;letter-spacing:.12em;cursor:pointer}",
    "#p2-overlay .p2-pills{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}",
    "#p2-overlay .p2-pill{border-radius:999px;padding:8px 2px;font-size:10px;font-weight:800;letter-spacing:.02em;color:#cbd5e1;background:rgba(16,20,32,.92);border:1px solid rgba(255,255,255,.1);cursor:pointer;white-space:nowrap}",
    "#p2-overlay .p2-pill.is-on{color:#fff;border-color:transparent;background:linear-gradient(180deg,#ff6b84,#e11d48);box-shadow:0 6px 16px rgba(225,29,72,.38)}",
    "#p2-overlay[data-mode='breath'] .p2-pill.is-on{color:#04130c;background:linear-gradient(180deg,#6ee7b7,#059669);box-shadow:0 6px 16px rgba(16,185,129,.35)}",
    "#p2-overlay[data-mode='surf'] .p2-pill.is-on{color:#041018;background:linear-gradient(180deg,#7dd3fc,#0284c7);box-shadow:0 6px 16px rgba(14,165,233,.35)}",
    "#p2-overlay[data-mode='tape'] .p2-pill.is-on{color:#1c1303;background:linear-gradient(180deg,#fde68a,#d97706);box-shadow:0 6px 16px rgba(245,158,11,.32)}",
    "#p2-overlay .p2-stage{position:relative;height:clamp(196px,32vh,268px);border-radius:18px;overflow:hidden;border:1px solid rgba(255,45,85,.72);box-shadow:0 0 0 1px rgba(255,45,85,.18),0 16px 40px rgba(0,0,0,.45);background:radial-gradient(ellipse at 50% 40%,rgba(90,16,32,.7),rgba(5,6,10,.12) 48%,#05060a 74%)}",
    "#p2-overlay.is-victory .p2-stage{border-color:rgba(52,211,153,.75);box-shadow:0 0 0 1px rgba(52,211,153,.28),0 16px 40px rgba(0,0,0,.45)}",
    "#p2-overlay .p2-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);opacity:0;z-index:0;background:#05060a;transition:opacity .4s linear}",
    "#p2-overlay .p2-stage.is-live .p2-video{opacity:1}",
    "#p2-overlay .p2-grid{position:absolute;inset:0;z-index:1;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:26px 26px;-webkit-mask-image:radial-gradient(ellipse at 50% 42%,#000 18%,transparent 72%);mask-image:radial-gradient(ellipse at 50% 42%,#000 18%,transparent 72%);transition:opacity .35s linear}",
    "#p2-overlay .p2-sil{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;transition:opacity .35s linear}",
    "#p2-overlay .p2-stage.is-live .p2-sil,#p2-overlay .p2-stage.is-live .p2-grid{opacity:0}",
    "#p2-overlay .p2-bust{transform-box:fill-box;transform-origin:center;animation:p2-breathe 4.6s ease-in-out infinite}",
    "#p2-overlay .p2-wire{stroke-dasharray:3 5;animation:p2-dash 2.4s linear infinite}",
    "#p2-overlay .p2-eye{transform-origin:center;transform-box:fill-box;animation:p2-eye 1.6s ease-in-out infinite}",
    "#p2-overlay .p2-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at 50% 42%,transparent 36%,rgba(5,6,10,.78) 100%)}",
    "#p2-overlay .p2-scan{position:absolute;inset:0;z-index:3;overflow:hidden;pointer-events:none;mix-blend-mode:screen}",
    "#p2-overlay .p2-scan i{position:absolute;left:0;right:0;height:22%;background:linear-gradient(180deg,transparent 0%,rgba(255,45,85,.08) 28%,rgba(255,255,255,.95) 50%,rgba(255,45,85,.55) 64%,transparent 100%);animation:p2-scan 2.5s linear infinite;will-change:transform}",
    "#p2-overlay.is-victory .p2-scan i{background:linear-gradient(180deg,transparent 0%,rgba(52,211,153,.08) 28%,rgba(255,255,255,.95) 50%,rgba(52,211,153,.6) 64%,transparent 100%)}",
    "#p2-overlay .p2-reticle{position:absolute;inset:12px;z-index:4;pointer-events:none}",
    "#p2-overlay .p2-reticle .c{position:absolute;width:16px;height:16px;border:2px solid var(--p2-alert);filter:drop-shadow(0 0 4px var(--p2-alert))}",
    "#p2-overlay .p2-reticle .tl{top:0;left:0;border-right:0;border-bottom:0}",
    "#p2-overlay .p2-reticle .tr{top:0;right:0;border-left:0;border-bottom:0}",
    "#p2-overlay .p2-reticle .bl{bottom:0;left:0;border-right:0;border-top:0}",
    "#p2-overlay .p2-reticle .br{bottom:0;right:0;border-left:0;border-top:0}",
    "#p2-overlay .p2-cross{position:absolute;left:50%;top:40%;width:18px;height:18px;transform:translate(-50%,-50%)}",
    "#p2-overlay .p2-cross:before,#p2-overlay .p2-cross:after{content:'';position:absolute;background:var(--p2-alert)}",
    "#p2-overlay .p2-cross:before{left:8px;top:0;width:1px;height:18px}",
    "#p2-overlay .p2-cross:after{top:8px;left:0;height:1px;width:18px}",
    "#p2-overlay .p2-ecg{position:absolute;left:0;right:0;bottom:0;width:100%;height:42px;z-index:5;pointer-events:none}",
    "#p2-overlay .p2-hud{position:absolute;top:8px;left:8px;right:8px;z-index:6;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}",
    "#p2-overlay .p2-hud-left{display:flex;flex-direction:column;gap:6px;align-items:flex-start}",
    "#p2-overlay .p2-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 7px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:.12em;background:rgba(45,212,191,.92);color:#042f2e}",
    "#p2-overlay .p2-chip.is-live{background:rgba(225,29,72,.94);color:#fff}",
    "#p2-overlay .p2-chip.is-arming{background:rgba(245,158,11,.94);color:#1c1303}",
    "#p2-overlay .p2-chip:before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor;animation:p2-blink 1.1s steps(2,start) infinite}",
    "#p2-overlay .p2-bpm{font-family:ui-monospace,'SF Mono','Cascadia Mono',Consolas,monospace;font-variant-numeric:tabular-nums;font-size:12px;font-weight:800;color:#fff;letter-spacing:.04em;text-shadow:0 1px 8px #000}",
    "#p2-overlay .p2-bpm b{font-size:18px;font-weight:900}",
    "#p2-overlay .p2-bpm small{font-size:9px;letter-spacing:.14em;color:#fda4af;margin-left:4px}",
    "#p2-overlay .p2-clock{font-family:ui-monospace,'SF Mono','Cascadia Mono',Consolas,monospace;font-variant-numeric:tabular-nums;font-weight:800;font-size:12px;letter-spacing:.06em;min-width:9.4ch;text-align:right;color:#fff;text-shadow:0 1px 8px #000}",
    "#p2-overlay .p2-quote{position:absolute;left:12px;right:12px;bottom:46px;z-index:6;margin:0;padding:0;display:block;width:auto;text-align:center;background:none;border:0;color:#fff;font-weight:900;font-size:clamp(13px,3.5vw,18px);line-height:1.12;letter-spacing:.045em;text-transform:uppercase;text-shadow:0 2px 16px rgba(0,0,0,.92),0 0 18px rgba(255,45,85,.35);cursor:pointer}",
    "#p2-overlay .p2-quote span{display:inline-block;margin:0 .16em;animation:p2-word .48s cubic-bezier(.2,.8,.2,1) both}",
    "#p2-overlay .p2-path{margin:2px 0 2px;font-size:11px;font-weight:800;letter-spacing:.08em;color:#e2e8f0}",
    "#p2-overlay .p2-help{margin:0 0 8px;font-size:12px;line-height:1.4;color:var(--p2-muted)}",
    "#p2-overlay .p2-panel.is-hidden{display:none}",
    "#p2-overlay .p2-panel:not(.is-hidden){animation:p2-rise .34s cubic-bezier(.2,.8,.2,1)}",
    "#p2-overlay .p2-core-wrap{display:grid;place-items:center;padding:4px 0 0}",
    "#p2-overlay .p2-core{width:min(228px,68vw);aspect-ratio:1;border-radius:50%;position:relative;display:grid;place-items:center;cursor:pointer;border:0;color:#fff;overflow:visible;touch-action:manipulation;background:radial-gradient(circle at 50% 42%,rgba(255,90,120,.75),rgba(120,12,32,.3) 42%,rgba(8,6,10,.2) 70%);box-shadow:inset 0 0 24px rgba(255,45,85,.5),0 0 0 1px rgba(255,255,255,.16),0 0 28px rgba(255,45,85,.48)}",
    "#p2-overlay .p2-core:before{content:'';position:absolute;inset:12px;border-radius:50%;border:1px dashed rgba(255,255,255,.42);animation:p2-spin 12s linear infinite;pointer-events:none}",
    "#p2-overlay .p2-core.is-hot{box-shadow:inset 0 0 28px rgba(255,45,85,.65),0 0 0 1px rgba(255,255,255,.24),0 0 42px rgba(255,45,85,.72)}",
    "#p2-overlay .p2-core.is-critical{box-shadow:inset 0 0 32px rgba(255,255,255,.28),0 0 0 1px #fff,0 0 56px rgba(255,45,85,.92)}",
    "#p2-overlay .p2-core.is-hit{animation:p2-punch .12s ease-out}",
    "#p2-overlay .p2-core.is-shattered{background:radial-gradient(circle at 50% 50%,rgba(52,211,153,.28),rgba(5,6,10,.25) 62%);box-shadow:0 0 0 1px rgba(52,211,153,.6),0 0 32px rgba(16,185,129,.4);color:#34d399}",
    "#p2-overlay .p2-core.is-shattered:before{animation:none;opacity:.35;border-color:rgba(52,211,153,.55)}",
    "#p2-overlay .p2-crack-svg{position:absolute;width:148%;height:148%;left:50%;top:50%;transform:translate(-50%,-50%);overflow:visible;pointer-events:none;z-index:2}",
    "#p2-overlay .p2-crack{fill:none;stroke:#fff7f8;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(255,60,90,.95));transition:stroke-dashoffset .26s cubic-bezier(.2,.7,.2,1)}",
    "#p2-overlay .p2-core-read{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;pointer-events:none}",
    "#p2-overlay .p2-core-read strong{font-size:62px;font-weight:900;line-height:.85;letter-spacing:-.04em}",
    "#p2-overlay .p2-core-read em{font-style:normal;font-size:12px;font-weight:800;letter-spacing:.14em;opacity:.8}",
    "#p2-overlay .p2-core-read span{margin-top:6px;font-size:9px;font-weight:800;letter-spacing:.18em;opacity:.78}",
    "#p2-overlay .p2-flash{display:none}",
    "#p2-overlay .p2-core.is-shattered .p2-flash{display:block;position:absolute;inset:0;border-radius:50%;z-index:4;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.92),rgba(255,70,100,.28) 42%,transparent 68%);animation:p2-flash .48s ease-out forwards}",
    "#p2-overlay .p2-shard{position:absolute;left:50%;top:50%;width:3px;height:14px;margin:-7px 0 0 -1.5px;border-radius:2px;pointer-events:none;z-index:5;animation:p2-shard .72s cubic-bezier(.12,.7,.2,1) forwards}",
    "#p2-overlay .p2-ticks{display:flex;gap:4px;justify-content:center;margin-top:8px}",
    "#p2-overlay .p2-ticks i{width:14px;height:4px;border-radius:99px;background:rgba(255,255,255,.12);display:block}",
    "#p2-overlay .p2-ticks i.is-on{background:#ff4d6d;box-shadow:0 0 8px rgba(255,77,109,.85)}",
    "#p2-overlay .p2-note{margin:8px 0 0;text-align:center;font-size:11px;font-weight:800;letter-spacing:.08em;color:#fda4af}",
    "#p2-overlay .p2-cycle{display:block;text-align:center;font-size:10px;font-weight:800;letter-spacing:.14em;color:#94a3b8;margin:0 0 2px}",
    "#p2-overlay .p2-ring-slot{height:188px;display:grid;place-items:center}",
    "#p2-overlay .p2-ring{width:168px;height:168px;position:relative;display:grid;place-items:center;color:#fb7185;filter:drop-shadow(0 0 12px rgba(255,45,85,.4));will-change:transform}",
    "#p2-overlay .p2-ring svg{position:absolute;inset:0;width:100%;height:100%}",
    "#p2-overlay .p2-ring-core{position:relative;z-index:1;text-align:center}",
    "#p2-overlay .p2-ring-core b{display:block;font-size:54px;font-weight:900;line-height:.9;font-variant-numeric:tabular-nums}",
    "#p2-overlay .p2-ring-core span{display:block;font-size:12px;font-weight:800;letter-spacing:.16em}",
    "#p2-overlay .p2-ring[data-phase='hold']{color:#fbbf24;filter:drop-shadow(0 0 12px rgba(251,191,36,.45))}",
    "#p2-overlay .p2-ring[data-phase='exhale']{color:#34d399;filter:drop-shadow(0 0 14px rgba(16,185,129,.45))}",
    "#p2-overlay .p2-phases{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}",
    "#p2-overlay .p2-phases span{font-size:10px;font-weight:800;letter-spacing:.08em;color:#64748b;border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:4px 8px}",
    "#p2-overlay .p2-phases span.is-on[data-phase='inhale']{color:#fff;background:#e11d48;border-color:transparent}",
    "#p2-overlay .p2-phases span.is-on[data-phase='hold']{color:#1c1303;background:#fbbf24;border-color:transparent}",
    "#p2-overlay .p2-phases span.is-on[data-phase='exhale']{color:#04130c;background:#34d399;border-color:transparent}",
    "#p2-overlay .p2-cue{text-align:center;min-height:2.4em;margin:6px 0 8px;font-size:12px;font-weight:700;letter-spacing:.04em;color:#cbd5e1}",
    "#p2-overlay .p2-rep-count{display:flex;align-items:baseline;gap:6px}",
    "#p2-overlay .p2-rep-count b{font-size:42px;font-weight:900;line-height:1;color:#fff;font-variant-numeric:tabular-nums}",
    "#p2-overlay .p2-rep-count b.is-pop{animation:p2-pop .28s cubic-bezier(.2,.8,.2,1)}",
    "#p2-overlay .p2-rep-count span{font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--p2-muted)}",
    "#p2-overlay .p2-reps.is-done .p2-rep-count b{color:#34d399}",
    "#p2-overlay .p2-rep-bar{height:8px;border-radius:99px;background:#1e293b;overflow:hidden;margin:8px 0}",
    "#p2-overlay .p2-rep-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#34d399,#fbbf24);border-radius:inherit}",
    "#p2-overlay .p2-rep-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    "#p2-overlay .p2-rep-row .p2-btn:last-child{grid-column:1 / -1}",
    "#p2-overlay .p2-btn{border-radius:12px;padding:12px 8px;font-weight:800;font-size:12px;letter-spacing:.03em;background:#141a27;color:#f8fafc;border:1px solid rgba(255,255,255,.1);cursor:pointer;touch-action:manipulation}",
    "#p2-overlay .p2-btn:active{transform:translateY(1px) scale(.985)}",
    "#p2-overlay .p2-btn:disabled{opacity:.45;cursor:default;transform:none}",
    "#p2-overlay .p2-btn-gold{background:linear-gradient(180deg,#fde68a,#f59e0b);color:#1c1303;border-color:transparent}",
    "#p2-overlay .p2-legend{display:flex;justify-content:space-between;gap:6px;font-size:9px;font-weight:800;letter-spacing:.06em;color:#fda4af}",
    "#p2-overlay .p2-legend span:nth-child(2){color:#fff;text-align:center}",
    "#p2-overlay .p2-legend span:last-child{color:#6ee7b7;text-align:right}",
    "#p2-overlay .p2-wave{width:100%;height:112px;display:block}",
    "#p2-overlay .p2-rail{height:4px;border-radius:99px;background:#1e293b;margin-top:4px;overflow:hidden}",
    "#p2-overlay .p2-rail i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff4d6d,#fbbf24,#34d399)}",
    "#p2-overlay .p2-nodes{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:6px}",
    "#p2-overlay .p2-node{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0;background:transparent;color:#64748b;border:0;cursor:pointer}",
    "#p2-overlay .p2-node i{width:10px;height:10px;border-radius:50%;border:2px solid rgba(255,255,255,.22);display:block}",
    "#p2-overlay .p2-node b{font-size:10px;font-weight:800}",
    "#p2-overlay .p2-node span{font-size:8px;font-weight:800;letter-spacing:.04em}",
    "#p2-overlay .p2-node.is-due{color:#fff}",
    "#p2-overlay .p2-node.is-due i{background:#ff4d6d;border-color:#ff4d6d;box-shadow:0 0 10px #ff4d6d;animation:p2-blink .8s ease-in-out infinite}",
    "#p2-overlay .p2-node.is-held{color:#6ee7b7}",
    "#p2-overlay .p2-node.is-held i{background:#34d399;border-color:#34d399;box-shadow:none;animation:none}",
    "#p2-overlay .p2-read{margin:8px 0 0;text-align:center;font-size:12px;font-weight:800;letter-spacing:.08em;color:#e2e8f0}",
    "#p2-overlay .p2-hold{width:100%;margin-top:10px;border-radius:14px;padding:14px 12px;font-weight:900;letter-spacing:.08em;font-size:13px;color:#fecdd3;background:#1a0b12;border:1px solid rgba(255,45,85,.4);cursor:pointer}",
    "#p2-overlay .p2-hold.is-hot{color:#fff;background:linear-gradient(180deg,#fb7185,#e11d48);border-color:transparent;box-shadow:0 0 22px rgba(225,29,72,.5);animation:p2-hot 1s ease-in-out infinite}",
    "#p2-overlay .p2-hold.is-done{color:#04130c;background:linear-gradient(180deg,#6ee7b7,#10b981);border-color:transparent;animation:none;box-shadow:none}",
    "#p2-overlay .p2-split{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    "#p2-overlay .p2-col{position:relative;border-radius:16px;padding:12px 10px 38px;overflow:hidden;min-height:236px}",
    "#p2-overlay .p2-col-head{display:flex;justify-content:space-between;align-items:flex-start;gap:6px}",
    "#p2-overlay .p2-col h3{margin:0;font-size:12px;line-height:1.25;letter-spacing:.06em}",
    "#p2-overlay .p2-col ul{list-style:none;margin:8px 0 0;padding:0}",
    "#p2-overlay .p2-col li{font-size:13px;font-weight:800;padding:8px 0;border-top:1px solid rgba(255,255,255,.08)}",
    "#p2-overlay .is-fold{background:linear-gradient(180deg,rgba(127,29,29,.75),rgba(12,8,10,.96));border:1px solid rgba(248,113,113,.5);color:#ffe4e6;animation:p2-glitch 3.4s infinite}",
    "#p2-overlay .is-win{background:linear-gradient(180deg,rgba(6,78,59,.66),rgba(7,12,16,.96));border:1px solid rgba(52,211,153,.55);color:#ecfdf5}",
    "#p2-overlay .p2-shield{width:36px;height:40px;flex:none}",
    "#p2-overlay .p2-tape.is-locked .is-fold{filter:grayscale(.35) brightness(.72);animation:none}",
    "#p2-overlay .p2-tape.is-locked .is-fold li{text-decoration:line-through;opacity:.55}",
    "#p2-overlay .p2-tape.is-locked .is-win{box-shadow:0 0 24px rgba(16,185,129,.35)}",
    "#p2-overlay .p2-tape.is-locked .is-win:after{content:'LOCKED';position:absolute;right:8px;bottom:12px;border:2px solid #fbbf24;color:#fbbf24;font-size:11px;font-weight:900;letter-spacing:.16em;padding:3px 6px;transform:rotate(-8deg);background:rgba(0,0,0,.4)}",
    "#p2-overlay .p2-tape.is-locked .is-fold:after{content:'REJECTED';position:absolute;left:8px;bottom:12px;border:2px solid rgba(254,202,202,.75);color:#fecaca;font-size:11px;font-weight:900;letter-spacing:.12em;padding:3px 6px;transform:rotate(8deg)}",
    "#p2-overlay .p2-lock{width:100%;margin-top:8px;padding:14px 12px;font-size:13px;letter-spacing:.1em;text-transform:uppercase}",
    "#p2-overlay .p2-lock:disabled{opacity:1;cursor:default;background:#064e3b;color:#a7f3d0}",
    "#p2-overlay .p2-foot{position:sticky;bottom:0;z-index:7;padding:10px 0 2px;background:linear-gradient(180deg,rgba(5,6,10,0),#05060a 32%)}",
    "#p2-overlay .p2-claim{position:relative;overflow:hidden;width:100%;border-radius:14px;padding:15px 12px;font-size:12px;font-weight:900;letter-spacing:.04em;line-height:1.25;text-align:center;text-transform:uppercase;background:#141a27;color:#94a3b8;border:1px solid rgba(255,255,255,.08);cursor:pointer}",
    "#p2-overlay .p2-claim span{position:relative;z-index:1}",
    "#p2-overlay .p2-claim:disabled{cursor:not-allowed}",
    "#p2-overlay .p2-claim.is-ready{color:#04130c;border-color:transparent;cursor:pointer;background:linear-gradient(180deg,#6ee7b7,#10b981 42%,#047857);box-shadow:0 0 24px rgba(16,185,129,.55);animation:p2-glow 1.3s ease-in-out infinite}",
    "#p2-overlay .p2-claim.is-ready:after{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.5) 48%,transparent 62%);transform:translateX(-120%);animation:p2-sheen 1.8s ease-in-out infinite}",
    "#p2-overlay .p2-claim.is-banked,#p2-overlay .p2-claim.is-banked:disabled{opacity:1;cursor:default;animation:none;color:#d1fae5;background:linear-gradient(180deg,#065f46,#022c22);border:1px solid rgba(52,211,153,.5);box-shadow:inset 0 0 20px rgba(16,185,129,.25)}",
    "#p2-overlay .p2-claim.is-banked:after{display:none}",
    "#p2-overlay .p2-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
    "#p2-overlay.is-shaking{animation:p2-shake var(--p2-shake-dur,.16s) linear}",
    "@keyframes p2-scan{0%{transform:translate3d(0,-130%,0)}100%{transform:translate3d(0,460%,0)}}",
    "@keyframes p2-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.028)}}",
    "@keyframes p2-dash{to{stroke-dashoffset:-64}}",
    "@keyframes p2-eye{0%,100%{opacity:.5}50%{opacity:1}}",
    "@keyframes p2-blink{50%{opacity:.2}}",
    "@keyframes p2-word{from{opacity:0;transform:translateY(8px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}",
    "@keyframes p2-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
    "@keyframes p2-spin{to{transform:rotate(360deg)}}",
    "@keyframes p2-punch{0%{transform:scale(1)}45%{transform:scale(.955)}100%{transform:scale(1)}}",
    "@keyframes p2-flash{from{opacity:1;transform:scale(.55)}to{opacity:0;transform:scale(1.35)}}",
    "@keyframes p2-shard{0%{opacity:1;transform:translate3d(0,0,0) scale(1)}100%{opacity:0;transform:translate3d(var(--dx),var(--dy),0) rotate(var(--rot)) scale(.4)}}",
    "@keyframes p2-pop{0%{transform:scale(1)}40%{transform:scale(1.16)}100%{transform:scale(1)}}",
    "@keyframes p2-glow{0%,100%{box-shadow:0 0 16px rgba(16,185,129,.35)}50%{box-shadow:0 0 32px rgba(16,185,129,.75)}}",
    "@keyframes p2-hot{0%,100%{box-shadow:0 0 12px rgba(225,29,72,.4)}50%{box-shadow:0 0 28px rgba(255,45,85,.85)}}",
    "@keyframes p2-sheen{to{transform:translateX(120%)}}",
    "@keyframes p2-glitch{0%,90%,100%{transform:none}92%{transform:translateX(-1px)}94%{transform:translateX(1px)}96%{transform:none}}",
    "@keyframes p2-shake{0%{transform:translate3d(0,0,0)}20%{transform:translate3d(calc(var(--p2-shake) * -1),2px,0)}40%{transform:translate3d(var(--p2-shake),-2px,0)}60%{transform:translate3d(calc(var(--p2-shake) * -.55),-1px,0)}80%{transform:translate3d(calc(var(--p2-shake) * .4),1px,0)}100%{transform:translate3d(0,0,0)}}",
    "@media (max-width:380px){#p2-overlay .p2-pill{font-size:9px;letter-spacing:0}#p2-overlay .p2-col li{font-size:12px}#p2-overlay h2{font-size:18px}#p2-overlay .p2-node span{display:none}}",
    "@media (prefers-reduced-motion:reduce){#p2-overlay .p2-scan i,#p2-overlay .p2-bust,#p2-overlay .p2-wire,#p2-overlay .p2-eye,#p2-overlay .p2-quote span,#p2-overlay .p2-claim.is-ready,#p2-overlay .p2-claim.is-ready:after,#p2-overlay .p2-core:before,#p2-overlay .p2-core.is-hit,#p2-overlay .is-fold,#p2-overlay .p2-hold.is-hot,#p2-overlay .p2-node.is-due i,#p2-overlay.is-shaking,#p2-overlay .p2-panel:not(.is-hidden),#p2-overlay .p2-chip:before{animation:none !important}#p2-overlay .p2-quote span{opacity:1;filter:none;transform:none}#p2-overlay .p2-crack{transition:none}}"
  ].join("");

  function on(event, fn) {
    if (typeof event !== "string" || typeof fn !== "function") return function () {};
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return function () { off(event, fn); };
  }

  function off(event, fn) {
    var list = listeners[event];
    if (!list) return;
    var i;
    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === fn) list.splice(i, 1);
    }
  }

  function emit(event, detail) {
    var list = listeners[event];
    if (!list || !list.length) return;
    var copy = list.slice();
    var i;
    for (i = 0; i < copy.length; i++) {
      try { copy[i](detail); } catch (err) { /* host listener */ }
    }
  }

  function fxUnlock() {
    try {
      if (root.DopamineFX && root.DopamineFX.unlock) root.DopamineFX.unlock();
    } catch (err) {}
  }

  function fxTick(freq, dur) {
    try {
      if (root.DopamineFX && root.DopamineFX.playTick) root.DopamineFX.playTick(freq, dur);
    } catch (err) {}
  }

  function fxBurst(mode, anchor) {
    try {
      if (root.DopamineFX && root.DopamineFX.burstParticles) {
        root.DopamineFX.burstParticles({ mode: mode, anchor: anchor, zIndex: 12000 });
      }
    } catch (err) {}
  }

  function fxSeal() {
    try {
      if (root.DopamineFX && root.DopamineFX.playOathSealed) root.DopamineFX.playOathSealed();
      else fxTick(640, 0.06);
    } catch (err) {
      fxTick(640, 0.06);
    }
  }

  function speak(text) {
    if (!session || !session.voice) return;
    try {
      if (root.DopamineFX && root.DopamineFX.speakCoach) root.DopamineFX.speakCoach(toSpeech(text));
    } catch (err) {}
  }

  function buzz(ms) {
    try {
      if (root.navigator && typeof root.navigator.vibrate === "function") root.navigator.vibrate(ms);
    } catch (err) {}
  }

  function later(ms, fn) {
    if (!session) return 0;
    var id = root.setTimeout(function () {
      if (!session || !session.alive) return;
      fn();
    }, ms);
    session.timers.push(id);
    return id;
  }

  function injectStyles() {
    var doc = root.document;
    if (!doc || doc.getElementById("p2-engine-css")) return;
    var style = doc.createElement("style");
    style.id = "p2-engine-css";
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function lockScroll() {
    if (scrollLock || !root.document) return;
    var body = root.document.body;
    var html = root.document.documentElement;
    scrollLock = { body: body.style.overflow, html: html.style.overflow };
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
  }

  function unlockScroll() {
    if (!scrollLock || !root.document) return;
    root.document.body.style.overflow = scrollLock.body;
    root.document.documentElement.style.overflow = scrollLock.html;
    scrollLock = null;
  }

  function stopStream(stream) {
    if (!stream || !stream.getTracks) return;
    try {
      stream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) {}
      });
    } catch (err) {}
  }

  function setLive(text) {
    if (!session || !session.els.live) return;
    if (session.liveText === text) return;
    session.liveText = text;
    session.els.live.textContent = text;
  }

  function lineFor(index) {
    var bank = session.quotes;
    return applyDay(bank[((index % bank.length) + bank.length) % bank.length], session.day);
  }

  function paintQuote(text) {
    var el = session.els.quote;
    var words = String(text).split(/\s+/).filter(Boolean).slice(0, 40);
    var i;
    el.textContent = "";
    for (i = 0; i < words.length; i++) {
      var span = root.document.createElement("span");
      span.textContent = words[i];
      span.style.animationDelay = (i * 42) + "ms";
      el.appendChild(span);
    }
    el.setAttribute("aria-label", "Next stoic line. " + text);
  }

  function setCamera(kind) {
    if (!session) return;
    session.camera = kind;
    var chip = session.els.cam;
    var stage = session.els.stage;
    stage.classList.toggle("is-live", kind === "live");
    chip.classList.remove("is-live", "is-scan", "is-arming");
    if (kind === "live") {
      chip.classList.add("is-live");
      chip.textContent = "MIRROR LIVE";
      chip.title = "Front camera mirrored. The heart-rate trace is a coaching guide, not a sensor.";
    } else if (kind === "arming") {
      chip.classList.add("is-arming");
      chip.textContent = "OPTIC LINK";
      chip.title = "Requesting the front camera. Neural scan stays up until it locks.";
    } else {
      chip.classList.add("is-scan");
      chip.textContent = "NEURAL SCAN";
      chip.title = "Camera unavailable. Animated biometric guide. Not a medical sensor.";
    }
  }

  function paintTaps() {
    var n = session.taps;
    session.els.tapCount.textContent = session.shattered ? "✕" : String(n);
    session.els.tapSub.textContent = session.shattered ? "BROKEN" : "/ 10";
    session.els.tapLabel.textContent = session.shattered ? "URGE LOST" : "TEMPTATION CORE";
    session.els.tapNote.textContent = session.shattered
      ? "SHATTERED. THE TEMPTATION LOST THE ROOM."
      : "STRIKE THE CORE. " + n + " / 10";
    session.els.core.setAttribute("aria-label", session.shattered
      ? "Temptation shattered."
      : "Temptation core. Tap " + (n + 1) + " of 10.");
    session.els.core.classList.toggle("is-hot", n >= 5 && !session.shattered);
    session.els.core.classList.toggle("is-critical", n >= 8 && !session.shattered);
  }

  function paintReps() {
    var n = session.pushups;
    var reps = session.els.reps;
    reps.textContent = String(n);
    reps.classList.remove("is-pop");
    void reps.offsetWidth;
    reps.classList.add("is-pop");
    session.els.repFill.style.width = ((n / 20) * 100) + "%";
    session.els.repBlock.classList.toggle("is-done", n >= 20);
    var i;
    for (i = 0; i < session.els.repButtons.length; i++) {
      session.els.repButtons[i].disabled = n >= 20;
    }
  }

  function emitProgress(extra) {
    if (!session) return;
    var detail = {
      sessionId: session.id,
      mode: session.mode,
      taps: session.taps,
      shattered: !!session.shattered,
      pushups: session.pushups,
      breathMs: Math.round(session.breathMs),
      surfMs: Math.round(session.surfMs),
      ready: !!session.ready,
      claimed: !!session.claimed
    };
    var key;
    if (extra) {
      for (key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) detail[key] = extra[key];
      }
    }
    emit("progress", detail);
  }

  function armClaim() {
    var btn = session.els.claim;
    btn.disabled = false;
    btn.classList.add("is-ready");
    session.els.claimLabel.textContent = "CLAIM VICTORY (+" + session.xp + " WILLPOWER XP & GOLD SHIELD)";
    setLive("Victory armed. Claim " + session.xp + " willpower XP and the gold shield.");
    try {
      btn.scrollIntoView({ block: "nearest", behavior: prefersReduced() ? "auto" : "smooth" });
    } catch (err) {}
  }

  function markComplete(mode) {
    if (!session || session.done[mode]) return;
    session.done[mode] = true;
    var first = !session.ready;
    if (mode === "tape") fxSeal();
    else if (mode !== "shatter") fxTick(780, 0.06);
    if (first) {
      session.ready = true;
      session.winMode = mode;
      armClaim();
      emit("ready", { mode: mode, sessionId: session.id, xp: session.xp, day: session.day });
    }
    emitProgress({ complete: true, completedMode: mode });
  }

  function shake(px) {
    if (prefersReduced() || !session) return;
    var el = session.root;
    el.style.setProperty("--p2-shake", px + "px");
    el.style.setProperty("--p2-shake-dur", (px >= 12 ? 0.32 : 0.16) + "s");
    el.classList.remove("is-shaking");
    void el.offsetWidth;
    el.classList.add("is-shaking");
  }

  function punch() {
    if (prefersReduced() || !session) return;
    var el = session.els.core;
    el.classList.remove("is-hit");
    void el.offsetWidth;
    el.classList.add("is-hit");
  }

  function revealCrack(n) {
    var path = session.els.cracks[n - 1];
    if (path) path.style.strokeDashoffset = "0";
    var tick = session.els.ticks[n - 1];
    if (tick) tick.classList.add("is-on");
  }

  function spawnShards(host) {
    var count = prefersReduced() ? 10 : 32;
    var i;
    for (i = 0; i < count; i++) {
      var shard = root.document.createElement("i");
      shard.className = "p2-shard";
      var ang = (Math.PI * 2 * i) / count + Math.random() * 0.22;
      var dist = 72 + Math.random() * 108;
      shard.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      shard.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
      shard.style.setProperty("--rot", (Math.random() * 220 - 110).toFixed(0) + "deg");
      shard.style.background = i % 3 === 0 ? "#fbbf24" : (i % 2 ? "#fff" : "#ff4d6d");
      shard.style.animationDelay = (Math.random() * 40).toFixed(0) + "ms";
      host.appendChild(shard);
    }
    later(900, function () {
      var old = host.querySelectorAll(".p2-shard");
      var k;
      for (k = 0; k < old.length; k++) {
        if (old[k].parentNode) old[k].parentNode.removeChild(old[k]);
      }
    });
  }

  function shatter() {
    session.shattered = true;
    session.els.core.classList.add("is-shattered");
    paintTaps();
    spawnShards(session.els.core);
    buzz(30);
    fxBurst("ember", session.els.core);
    setLive("Temptation core shattered.");
    markComplete("shatter");
  }

  function onTap() {
    if (!session || session.shattered || !session.alive) return;
    var stamp = Date.now();
    if (stamp - session.lastTap < 40) return;
    session.lastTap = stamp;
    session.taps += 1;
    var taps = session.taps;
    fxTick(400 + taps * 65, 0.05);
    shake(taps >= 10 ? 12 : 3 + taps);
    punch();
    revealCrack(taps);
    if (taps >= 10) shatter();
    else {
      paintTaps();
      emitProgress();
    }
  }

  function addReps(delta) {
    if (!session) return;
    var amount = Number(delta);
    if (!isFinite(amount) || amount <= 0) return;
    var next = amount >= 20 ? 20 : Math.min(20, session.pushups + amount);
    if (next === session.pushups) {
      if (session.pushups >= 20) markComplete("breath");
      return;
    }
    session.pushups = next;
    paintReps();
    buzz(10);
    fxTick(500 + next * 12, 0.04);
    if (next >= 20) markComplete("breath");
    else emitProgress();
  }

  function paintBreath() {
    var frame = breathAt(session.breathMs);
    if (!frame) return;
    session.els.ring.style.transform = "scale(" + frame.scale.toFixed(4) + ")";
    var offset = session.circ * (1 - frame.ring);
    session.els.ringDash.setAttribute("stroke-dashoffset", offset.toFixed(2));
    if (frame.phase.id !== session.phaseId) {
      session.phaseId = frame.phase.id;
      session.els.ring.setAttribute("data-phase", frame.phase.id);
      session.els.phase.textContent = frame.phase.label;
      session.els.cue.textContent = frame.phase.cue;
      var i;
      for (i = 0; i < session.els.pips.length; i++) {
        session.els.pips[i].classList.toggle("is-on", session.els.pips[i].getAttribute("data-phase") === frame.phase.id);
      }
      setLive(frame.phase.label + ". " + frame.phase.seconds + " seconds.");
    }
    if (frame.left !== session.leftShown) {
      session.leftShown = frame.left;
      session.els.count.textContent = String(frame.left);
    }
    var cycleLabel = (session.breathCycled ? "SIGH LOCKED · CYCLE " : "CYCLE ") + frame.cycle;
    if (cycleLabel !== session.cycleShown) {
      session.cycleShown = cycleLabel;
      session.els.cycle.textContent = cycleLabel;
    }
    if (session.breathMs >= BREATH_CYCLE && !session.breathCycled) {
      session.breathCycled = true;
      markComplete("breath");
    }
  }

  function dueIndex(ms) {
    var i;
    for (i = 0; i < CHECKS.length; i++) {
      if (!session.held[i] && ms >= CHECKS[i].at) return i;
    }
    return -1;
  }

  function allHeld() {
    var i;
    for (i = 0; i < CHECKS.length; i++) {
      if (!session.held[i]) return false;
    }
    return true;
  }

  function holdLabel(ms) {
    if (session.done.surf || allHeld()) return "LINE HELD";
    var due = dueIndex(ms);
    if (due >= 0) return "HOLD THE LINE · " + CHECKS[due].label;
    var next = -1;
    var i;
    for (i = 0; i < CHECKS.length; i++) {
      if (!session.held[i]) { next = i; break; }
    }
    if (next < 0) return "LINE HELD";
    var left = Math.max(0, Math.ceil((CHECKS[next].at - ms) / 1000));
    return "HOLD THE LINE · " + CHECKS[next].label + " IN " + left + "s";
  }

  function syncHolds(ms) {
    var due = dueIndex(ms);
    var label = holdLabel(ms);
    var key = due + ":" + session.held.join("") + ":" + label;
    if (key === session.holdKey) return;
    session.holdKey = key;
    var i;
    for (i = 0; i < session.els.nodes.length; i++) {
      session.els.nodes[i].classList.toggle("is-held", !!session.held[i]);
      session.els.nodes[i].classList.toggle("is-due", i === due);
    }
    session.els.hold.textContent = label;
    session.els.hold.classList.toggle("is-hot", due >= 0 && !session.done.surf);
    session.els.hold.classList.toggle("is-done", !!session.done.surf || allHeld());
  }

  function paintSurf(stamp) {
    var ms = session.surfMs;
    var amp = urgeAmp(ms);
    var timeSec = stamp / 1000;
    var built = buildWave(timeSec, amp);
    session.els.waveFill.setAttribute("d", built.fill);
    session.els.waveLine.setAttribute("d", built.line);
    var x = (ms / 90000) * 360;
    var y = waveY(x, timeSec, amp);
    session.els.waveMark.setAttribute("x1", x.toFixed(1));
    session.els.waveMark.setAttribute("x2", x.toFixed(1));
    session.els.waveDot.setAttribute("cx", x.toFixed(1));
    session.els.waveDot.setAttribute("cy", y.toFixed(1));
    var stroke = amp > 0.72 ? "#ff4d6d" : (amp > 0.45 ? "#fbbf24" : "#34d399");
    session.els.waveLine.setAttribute("stroke", stroke);
    session.els.waveDot.setAttribute("fill", stroke);
    session.els.rail.style.width = ((ms / 90000) * 100).toFixed(2) + "%";
    var readout = surfPhrase(ms) + " · " + formatShort(ms) + " / 01:30";
    if (readout !== session.surfRead) {
      session.surfRead = readout;
      session.els.surfRead.textContent = readout;
    }
    syncHolds(ms);
  }

  function onHold(index) {
    if (!session || session.mode !== "surf") return;
    var ms = session.surfMs;
    var due = dueIndex(ms);
    if (due < 0) return;
    if (index != null && index !== due) return;
    session.held[due] = true;
    session.holdKey = "";
    buzz(12);
    fxTick(460 + due * 75, 0.045);
    emit("checkpoint", {
      index: due,
      label: CHECKS[due].label,
      at: CHECKS[due].at,
      sessionId: session.id
    });
    setLive("Hold the line. " + CHECKS[due].label + " locked.");
    if (allHeld()) markComplete("surf");
    syncHolds(ms);
  }

  function lockTape() {
    if (!session || session.tapeLocked) return;
    session.tapeLocked = true;
    session.els.tape.classList.add("is-locked");
    session.els.lock.disabled = true;
    session.els.lockLabel.textContent = "MINUTE LOCKED";
    fxBurst("seal", session.els.lock);
    emit("lock", { sessionId: session.id, day: session.day, choice: "win" });
    setLive("Commitment locked. You win this minute.");
    markComplete("tape");
  }

  function nextQuote() {
    if (!session) return;
    session.quoteIndex = (session.quoteIndex + 1) % session.quotes.length;
    var line = lineFor(session.quoteIndex);
    paintQuote(line);
    if (session.voice) speak(line);
    fxTick(540, 0.03);
    emit("quote", { text: line, index: session.quoteIndex, sessionId: session.id });
  }

  function setMode(mode, silent) {
    if (!session) return;
    if (mode !== "shatter" && mode !== "breath" && mode !== "surf" && mode !== "tape") return;
    if (!silent && session.mode === mode) return;
    session.mode = mode;
    session.root.setAttribute("data-mode", mode);
    var i;
    for (i = 0; i < session.els.panels.length; i++) {
      var onPanel = session.els.panels[i].getAttribute("data-panel") === mode;
      session.els.panels[i].classList.toggle("is-hidden", !onPanel);
      if (onPanel) session.els.panels[i].removeAttribute("hidden");
      else session.els.panels[i].setAttribute("hidden", "");
    }
    for (i = 0; i < session.els.pills.length; i++) {
      var active = session.els.pills[i].getAttribute("data-mode") === mode;
      session.els.pills[i].classList.toggle("is-on", active);
      session.els.pills[i].setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (!silent) {
      fxTick(490, 0.03);
      emit("mode", { mode: mode, sessionId: session.id });
    }
  }

  function paintVitals(elapsed) {
    var bpm = bpmFor(elapsed);
    var tone = (118 - bpm) / 46;
    if (bpm !== session.bpmShown) {
      session.bpmShown = bpm;
      session.els.bpm.textContent = String(bpm);
      session.els.bpm.style.color = session.root.classList.contains("is-victory")
        ? "#34d399"
        : lerpHex("#ff4d6d", "#34d399", tone);
    }
    var clock = formatMission(elapsed);
    if (clock !== session.clockShown) {
      session.clockShown = clock;
      session.els.clock.textContent = clock;
    }
    var d = ecgPath(now(), bpm);
    session.els.ecgLine.setAttribute("d", d);
    session.els.ecgGlow.setAttribute("d", d);
    var stroke = session.root.classList.contains("is-victory") ? "#34d399" : lerpHex("#ff4d6d", "#34d399", tone);
    session.els.ecgGlow.setAttribute("stroke", stroke);
  }

  function frame(ts) {
    if (!session || !session.alive) return;
    session.raf = raf(frame);
    try {
      var dt = 16;
      if (session.lastTs) dt = ts - session.lastTs;
      session.lastTs = ts;
      if (dt > 48) dt = 48;
      if (dt < 0) dt = 0;
      paintVitals(Date.now() - session.openedAt);
      if (session.mode === "breath") {
        session.breathMs += dt;
        paintBreath();
      }
      if (session.mode === "surf") {
        session.surfMs = Math.min(90000, session.surfMs + dt);
        paintSurf(ts);
      }
    } catch (err) { /* keep the clock alive */ }
  }

  function victoryDetail() {
    var detail = {
      xp: session.xp,
      gained: session.xp,
      day: session.day,
      mode: session.winMode,
      modes: Object.keys(session.done),
      sessionId: session.id,
      goldShield: true,
      reason: "panic-2"
    };
    if (session.baseXp != null) detail.willpowerXP = session.baseXp + session.xp;
    return detail;
  }

  function claim() {
    if (!session || !session.ready || session.claimed) return;
    session.claimed = true;
    var detail = victoryDetail();
    try {
      if (root.DopamineFX) {
        if (root.DopamineFX.playRankUp) root.DopamineFX.playRankUp();
        if (root.DopamineFX.burstParticles) {
          root.DopamineFX.burstParticles({ mode: "rank", anchor: session.els.claim, zIndex: 12000 });
        }
      }
    } catch (err) {}
    session.root.classList.add("is-victory");
    session.els.claim.classList.remove("is-ready");
    session.els.claim.classList.add("is-banked");
    session.els.claim.disabled = true;
    session.els.claimLabel.textContent = "VICTORY BANKED · GOLD SHIELD ARMED";
    if (session.els.stand) session.els.stand.textContent = "RETURN";
    if (session.bpmShown != null) session.els.bpm.style.color = "#34d399";
    setLive("Victory banked. Plus " + session.xp + " willpower XP. Gold shield armed.");
    emit("victory", detail);
    emit("urge-defeated", detail);
    emit("claim", detail);
  }

  function startCamera() {
    var media = root.navigator && root.navigator.mediaDevices;
    var token = session.id;
    if (!media || typeof media.getUserMedia !== "function") {
      setCamera("scan");
      emit("camera", { state: "scan", sessionId: token });
      return;
    }
    setCamera("arming");
    var req;
    try {
      req = media.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
    } catch (err) {
      setCamera("scan");
      emit("camera", { state: "scan", sessionId: token });
      return;
    }
    req.then(function (stream) {
      if (!session || session.id !== token || !session.alive) {
        stopStream(stream);
        return;
      }
      session.stream = stream;
      var video = session.els.video;
      try {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
      } catch (err) {
        stopStream(stream);
        setCamera("scan");
        emit("camera", { state: "scan", sessionId: token });
        return;
      }
      var play = video.play && video.play();
      if (play && play.catch) play.catch(function () {});
      var went = false;
      var goLive = function () {
        if (went || !session || session.id !== token || !session.alive) return;
        went = true;
        setCamera("live");
        emit("camera", { state: "live", sessionId: token });
      };
      if (video.readyState >= 2) goLive();
      video.addEventListener("playing", goLive);
      video.addEventListener("loadeddata", goLive);
      try {
        stream.getTracks().forEach(function (track) {
          track.addEventListener("ended", function () {
            if (!session || session.id !== token) return;
            setCamera("scan");
            emit("camera", { state: "scan", sessionId: token });
          });
        });
      } catch (err) {}
    }).catch(function () {
      if (!session || session.id !== token) return;
      setCamera("scan");
      emit("camera", { state: "scan", sessionId: token });
    });
  }

  function trapTab(event) {
    var nodes = session.root.querySelectorAll("button");
    var list = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].disabled) continue;
      if (nodes[i].closest && nodes[i].closest("[hidden]")) continue;
      list.push(nodes[i]);
    }
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    var active = root.document.activeElement;
    if (event.shiftKey && (active === first || !session.root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKey(event) {
    if (!session || !session.alive) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(session.claimed ? "close" : "stand-down");
      return;
    }
    if (event.key === "Tab") {
      trapTab(event);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && event.target === session.els.core) {
      event.preventDefault();
      session.pointerTapAt = Date.now();
      onTap();
    }
  }

  function onPointer(event) {
    if (!session || !session.alive || !event.target || !event.target.closest) return;
    if (event.button && event.button !== 0) return;
    var hit = event.target.closest("[data-act='tap']");
    if (!hit || hit !== session.els.core) return;
    event.preventDefault();
    session.pointerTapAt = Date.now();
    onTap();
  }

  function onClick(event) {
    if (!session || !session.alive || !event.target || !event.target.closest) return;
    var btn = event.target.closest("[data-act]");
    if (!btn || !session.root.contains(btn)) return;
    var act = btn.getAttribute("data-act");
    if (act === "tap") {
      if (Date.now() - (session.pointerTapAt || 0) < 450) return;
      onTap();
      return;
    }
    if (act === "close") close(session.claimed ? "close" : "stand-down");
    else if (act === "mode") setMode(btn.getAttribute("data-mode"), false);
    else if (act === "quote") nextQuote();
    else if (act === "push") addReps(btn.getAttribute("data-delta"));
    else if (act === "hold") {
      var raw = btn.getAttribute("data-index");
      onHold(raw == null ? null : Number(raw));
    } else if (act === "lock") lockTape();
    else if (act === "claim") claim();
  }

  function bind(overlay) {
    session.onClick = onClick;
    session.onPointer = onPointer;
    session.onKey = onKey;
    overlay.addEventListener("click", onClick);
    overlay.addEventListener("pointerdown", onPointer);
    root.document.addEventListener("keydown", onKey);
  }

  function unbind() {
    if (!session) return;
    if (session.root && session.onClick) session.root.removeEventListener("click", session.onClick);
    if (session.root && session.onPointer) session.root.removeEventListener("pointerdown", session.onPointer);
    if (session.onKey && root.document) root.document.removeEventListener("keydown", session.onKey);
  }

  function armCracks() {
    var list = session.els.cracks;
    var i;
    for (i = 0; i < list.length; i++) {
      var len = 240;
      try { len = list[i].getTotalLength() || 240; } catch (err) { len = 240; }
      list[i].style.strokeDasharray = String(len);
      list[i].style.strokeDashoffset = String(len);
    }
  }

  function armRing() {
    var circ = 2 * Math.PI * 52;
    session.circ = circ;
    session.els.ringDash.setAttribute("stroke-dasharray", circ.toFixed(3));
    session.els.ringDash.setAttribute("stroke-dashoffset", circ.toFixed(3));
  }

  function silhouette() {
    return '<svg class="p2-sil" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      "<defs>" +
      '<linearGradient id="p2e-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff5a74"/><stop offset="48%" stop-color="#fb7185"/><stop offset="100%" stop-color="#34d399"/></linearGradient>' +
      '<radialGradient id="p2e-core" cx="50%" cy="38%" r="55%"><stop offset="0%" stop-color="#ff2d55" stop-opacity="0.4"/><stop offset="100%" stop-color="#ff2d55" stop-opacity="0"/></radialGradient>' +
      '<filter id="p2e-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      "</defs>" +
      '<ellipse cx="180" cy="96" rx="86" ry="90" fill="url(#p2e-core)"/>' +
      '<g class="p2-bust" fill="none" stroke="url(#p2e-body)" stroke-width="1.35" filter="url(#p2e-glow)">' +
      '<ellipse cx="180" cy="78" rx="40" ry="48"/>' +
      '<path d="M180 80 v14"/>' +
      '<path d="M166 100 h28"/>' +
      '<path d="M154 108 q26 16 52 0"/>' +
      '<path d="M166 122 l-8 28 M194 122 l8 28"/>' +
      '<path d="M64 228 C108 168 148 150 180 150 C212 150 252 168 296 228"/>' +
      '<path class="p2-wire" d="M140 74 L96 44"/>' +
      '<path class="p2-wire" d="M220 74 L264 44"/>' +
      '<path class="p2-wire" d="M180 30 L180 8"/>' +
      '<path class="p2-wire" d="M152 50 L116 26"/>' +
      '<path class="p2-wire" d="M208 50 L246 24"/>' +
      '<path class="p2-wire" d="M128 112 L84 132"/>' +
      '<path class="p2-wire" d="M232 112 L280 132"/>' +
      "</g>" +
      '<g class="p2-eye" fill="#ff4d6d">' +
      '<circle cx="166" cy="74" r="2.5"/>' +
      '<circle cx="196" cy="74" r="2.5"/>' +
      "</g>" +
      '<g fill="#ecfeff">' +
      '<circle cx="96" cy="44" r="2.2"/><circle cx="264" cy="44" r="2.2"/>' +
      '<circle cx="180" cy="8" r="2.4"/><circle cx="116" cy="26" r="2"/>' +
      '<circle cx="246" cy="24" r="2"/><circle cx="84" cy="132" r="2"/><circle cx="280" cy="132" r="2"/>' +
      "</g>" +
      '<g stroke="rgba(255,255,255,.38)" stroke-width="1" fill="none">' +
      '<path d="M46 70 h16 M46 86 h10 M46 102 h16"/>' +
      '<path d="M314 70 h-16 M314 86 h-10 M314 102 h-16"/>' +
      "</g></svg>";
  }

  function markup(model) {
    var hide = function (mode) {
      return mode === model.mode ? "" : " is-hidden";
    };
    var hiddenAttr = function (mode) {
      return mode === model.mode ? "" : " hidden";
    };
    var pressed = function (mode) {
      return mode === model.mode ? "true" : "false";
    };
    var on = function (mode) {
      return mode === model.mode ? " is-on" : "";
    };
    return '<div class="p2-sheet">' +
      '<p id="p2-live" class="p2-sr" aria-live="polite"></p>' +
      '<header class="p2-top">' +
        '<div><p class="p2-kicker">RED PANIC 2.0 · URGE INTERVENTION</p>' +
        '<h2 id="p2-title">DAY ' + model.day + " · " + esc(model.rank) + "</h2></div>" +
        '<button type="button" class="p2-ghost" id="p2-stand" data-act="close">STAND DOWN</button>' +
      "</header>" +
      '<div class="p2-pills" role="tablist" aria-label="Intervention modes">' +
        '<button type="button" class="p2-pill' + on("shatter") + '" role="tab" data-act="mode" data-mode="shatter" aria-pressed="' + pressed("shatter") + '" aria-label="Shatter, 10-tap kinetic breaker">⚡ SHATTER</button>' +
        '<button type="button" class="p2-pill' + on("breath") + '" role="tab" data-act="mode" data-mode="breath" aria-pressed="' + pressed("breath") + '" aria-label="4-7-8 neuro-sigh and pushups">🫁 4-7-8</button>' +
        '<button type="button" class="p2-pill' + on("surf") + '" role="tab" data-act="mode" data-mode="surf" aria-pressed="' + pressed("surf") + '" aria-label="90 second urge surf wave">🌊 SURF</button>' +
        '<button type="button" class="p2-pill' + on("tape") + '" role="tab" data-act="mode" data-mode="tape" aria-pressed="' + pressed("tape") + '" aria-label="Play the tape forward, consequence split-screen">⚖️ TAPE</button>' +
      "</div>" +
      '<section class="p2-stage" id="p2-stage">' +
        '<video class="p2-video" id="p2-video" autoplay muted playsinline disablepictureinpicture aria-hidden="true"></video>' +
        '<div class="p2-grid" aria-hidden="true"></div>' +
        silhouette() +
        '<div class="p2-vignette" aria-hidden="true"></div>' +
        '<div class="p2-scan" aria-hidden="true"><i></i></div>' +
        '<div class="p2-reticle" aria-hidden="true"><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span><span class="p2-cross"></span></div>' +
        '<svg class="p2-ecg" viewBox="0 0 360 48" preserveAspectRatio="none" aria-hidden="true">' +
          '<path id="p2-ecg-glow" fill="none" stroke="#ff4d6d" stroke-width="4" opacity="0.35" stroke-linecap="round"></path>' +
          '<path id="p2-ecg-line" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round"></path>' +
        "</svg>" +
        '<div class="p2-hud">' +
          '<div class="p2-hud-left"><span class="p2-chip is-scan" id="p2-cam">NEURAL SCAN</span>' +
          '<span class="p2-bpm"><b id="p2-bpm">118</b> BPM <small>GUIDE</small></span></div>' +
          '<span class="p2-clock" id="p2-clock">00:00.000</span>' +
        "</div>" +
        '<button type="button" class="p2-quote" id="p2-quote" data-act="quote"></button>' +
      "</section>" +
      '<section class="p2-panel' + hide("shatter") + '" data-panel="shatter" role="tabpanel"' + hiddenAttr("shatter") + ">" +
        '<p class="p2-path">⚡ SHATTER · 10-TAP KINETIC BREAKER</p>' +
        '<p class="p2-help">Ten strikes. The pitch climbs. The tenth one breaks the core.</p>' +
        '<div class="p2-core-wrap"><button type="button" class="p2-core" id="p2-core" data-act="tap" aria-label="Temptation core. Tap 1 of 10.">' +
          '<svg class="p2-crack-svg" viewBox="0 0 320 320" aria-hidden="true">' +
            '<circle cx="160" cy="160" r="78" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.2"></circle>' +
            '<circle cx="160" cy="160" r="54" fill="none" stroke="rgba(255,77,109,.5)" stroke-width="1" stroke-dasharray="3 6"></circle>' +
            cracksMarkup() +
          "</svg>" +
          '<span class="p2-core-read"><strong id="p2-tap-count">0</strong><em id="p2-tap-sub">/ 10</em><span id="p2-tap-label">TEMPTATION CORE</span></span>' +
          '<i class="p2-flash" aria-hidden="true"></i>' +
        "</button></div>" +
        '<div class="p2-ticks" aria-hidden="true">' + ticksMarkup() + "</div>" +
        '<p class="p2-note" id="p2-tap-note">STRIKE THE CORE. 0 / 10</p>' +
      "</section>" +
      '<section class="p2-panel' + hide("breath") + '" data-panel="breath" role="tabpanel"' + hiddenAttr("breath") + ">" +
        '<p class="p2-path">🫁 4-7-8 NEURO-SIGH + PUSHUPS</p>' +
        '<p class="p2-help">Match the ring. In 4, hold 7, out 8. Then log the reps.</p>' +
        '<span class="p2-cycle" id="p2-breath-cycle">CYCLE 1</span>' +
        '<div class="p2-ring-slot"><div class="p2-ring" id="p2-ring" data-phase="inhale">' +
          '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"></circle>' +
          '<circle id="p2-ring-dash" cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" transform="rotate(-90 60 60)"></circle></svg>' +
          '<div class="p2-ring-core"><b id="p2-breath-count">4</b><span id="p2-breath-phase">INHALE</span></div>' +
        "</div></div>" +
        '<div class="p2-phases">' +
          '<span data-phase="inhale" class="is-on">INHALE 4</span>' +
          '<span data-phase="hold">HOLD 7</span>' +
          '<span data-phase="exhale">EXHALE 8</span>' +
        "</div>" +
        '<p class="p2-cue" id="p2-breath-cue">IN THROUGH THE NOSE. FOUR.</p>' +
        '<div class="p2-reps" id="p2-rep-block"><div class="p2-rep-count"><b id="p2-reps">0</b><span>/ 20 REPS</span></div>' +
          '<div class="p2-rep-bar" aria-hidden="true"><i id="p2-rep-fill"></i></div>' +
          '<div class="p2-rep-row">' +
            '<button type="button" class="p2-btn" data-act="push" data-delta="5">+5 Reps</button>' +
            '<button type="button" class="p2-btn" data-act="push" data-delta="10">+10 Reps</button>' +
            '<button type="button" class="p2-btn p2-btn-gold" data-act="push" data-delta="20">20 Reps Complete</button>' +
          "</div></div>" +
      "</section>" +
      '<section class="p2-panel' + hide("surf") + '" data-panel="surf" role="tabpanel"' + hiddenAttr("surf") + ">" +
        '<p class="p2-path">🌊 90s URGE SURF WAVE</p>' +
        '<p class="p2-help">The crest lies about how long it stays. Hold each pulse.</p>' +
        '<div class="p2-legend"><span>0s RISE</span><span>45s CRAVING CREST</span><span>90s DOPAMINE SUBSIDING</span></div>' +
        '<svg class="p2-wave" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">' +
          "<defs><linearGradient id=\"p2e-wave\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">" +
          '<stop offset="0%" stop-color="#ff2d55" stop-opacity="0.5"/><stop offset="100%" stop-color="#ff2d55" stop-opacity="0"/></linearGradient></defs>' +
          '<path id="p2-wave-fill" fill="url(#p2e-wave)"></path>' +
          '<path id="p2-wave-line" fill="none" stroke="#ff4d6d" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"></path>' +
          '<line id="p2-wave-mark" y1="6" y2="114" stroke="rgba(255,255,255,.85)" stroke-width="1.25"></line>' +
          '<circle id="p2-wave-dot" r="4.5" fill="#fff"></circle>' +
        "</svg>" +
        '<div class="p2-rail" aria-hidden="true"><i id="p2-rail"></i></div>' +
        '<div class="p2-nodes">' + nodesMarkup() + "</div>" +
        '<p class="p2-read" id="p2-surf-read">URGE RISING · 00:00 / 01:30</p>' +
        '<button type="button" class="p2-hold" id="p2-hold" data-act="hold">HOLD THE LINE · CHARGE IN 15s</button>' +
      "</section>" +
      '<section class="p2-panel p2-tape' + hide("tape") + '" data-panel="tape" role="tabpanel"' + hiddenAttr("tape") + ">" +
        '<p class="p2-path">⚖️ PLAY THE TAPE FORWARD</p>' +
        '<p class="p2-help">Both endings are already written. Lock the one you want to wake up in.</p>' +
        '<div class="p2-split">' +
          '<article class="p2-col is-fold"><div class="p2-col-head"><h3>IF YOU FOLD TONIGHT</h3></div><ul>' +
            "<li>Day 0 Reset</li><li>Brain Fog</li><li>Squad Alerted</li></ul></article>" +
          '<article class="p2-col is-win"><div class="p2-col-head"><h3>IF YOU WIN THIS MINUTE</h3>' + SHIELD_SVG + "</div><ul>" +
            "<li>Day +1 Banked</li><li>+" + model.xp + " XP</li><li>Gold Shield</li><li>Morning Respect</li></ul></article>" +
        "</div>" +
        '<button type="button" class="p2-btn p2-btn-gold p2-lock" id="p2-lock" data-act="lock"><span id="p2-lock-label">LOCK THIS MINUTE</span></button>' +
      "</section>" +
      '<footer class="p2-foot"><button type="button" class="p2-claim" id="p2-claim" data-act="claim" disabled>' +
        "<span id=\"p2-claim-label\">COMPLETE ANY MODE TO ARM THE SHIELD</span></button></footer>" +
    "</div>";
  }

  function snapshotClose(reason) {
    return {
      reason: reason,
      claimed: !!session.claimed,
      ready: !!session.ready,
      sessionId: session.id,
      day: session.day,
      mode: session.mode
    };
  }

  function teardown() {
    if (!session) return;
    session.alive = false;
    if (session.raf) caf(session.raf);
    var i;
    if (session.timers) {
      for (i = 0; i < session.timers.length; i++) root.clearTimeout(session.timers[i]);
    }
    unbind();
    stopStream(session.stream);
    if (session.els && session.els.video) {
      try { session.els.video.srcObject = null; } catch (err) {}
    }
    if (session.root && session.root.parentNode) session.root.parentNode.removeChild(session.root);
    session = null;
    unlockScroll();
  }

  function close(reason) {
    if (!session) return false;
    if (reason && typeof reason === "object") reason = reason.reason;
    if (!reason) reason = "api";
    var detail = snapshotClose(String(reason));
    teardown();
    emit("close", detail);
    return true;
  }

  function grab(overlay, id) {
    return overlay.querySelector("#" + id);
  }

  function open(options) {
    var doc = root.document;
    if (!doc || !doc.body) return null;
    options = options || {};
    if (session) {
      var prev = snapshotClose("reopen");
      teardown();
      emit("close", prev);
    }
    injectStyles();
    var day = cleanDay(options.streakDay == null ? 1 : options.streakDay);
    var xp = cleanXp(options.xp);
    var mode = cleanMode(options.mode);
    var rank = rankName(day, options.rank);
    var quotes = QUOTES.slice();
    if (options.quote != null && String(options.quote).trim()) {
      quotes = [String(options.quote).trim().slice(0, 220)].concat(QUOTES);
    }
    var overlay = doc.createElement("div");
    overlay.id = "p2-overlay";
    overlay.className = "p2-root";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "p2-title");
    overlay.tabIndex = -1;
    overlay.setAttribute("data-mode", mode);
    overlay.innerHTML = markup({ day: day, rank: rank, xp: xp, mode: mode });
    doc.body.appendChild(overlay);

    session = {
      id: "p2-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      alive: true,
      root: overlay,
      day: day,
      xp: xp,
      rank: rank,
      mode: mode,
      voice: options.voice !== false,
      quotes: quotes,
      quoteIndex: 0,
      taps: 0,
      shattered: false,
      pushups: 0,
      breathMs: 0,
      breathCycled: false,
      surfMs: 0,
      held: [false, false, false, false, false, false],
      holdKey: "",
      tapeLocked: false,
      done: {},
      ready: false,
      claimed: false,
      winMode: null,
      openedAt: Date.now(),
      lastTs: 0,
      lastTap: 0,
      pointerTapAt: 0,
      raf: 0,
      timers: [],
      stream: null,
      camera: "scan",
      bpmShown: 118,
      clockShown: "",
      phaseId: "inhale",
      leftShown: 4,
      cycleShown: "CYCLE 1",
      surfRead: "",
      liveText: "",
      baseXp: (options.willpowerXP != null && isFinite(Number(options.willpowerXP)))
        ? Math.max(0, Math.floor(Number(options.willpowerXP)))
        : null
    };
    session.els = {
      cam: grab(overlay, "p2-cam"),
      bpm: grab(overlay, "p2-bpm"),
      clock: grab(overlay, "p2-clock"),
      quote: grab(overlay, "p2-quote"),
      stage: grab(overlay, "p2-stage"),
      video: grab(overlay, "p2-video"),
      ecgLine: grab(overlay, "p2-ecg-line"),
      ecgGlow: grab(overlay, "p2-ecg-glow"),
      core: grab(overlay, "p2-core"),
      tapCount: grab(overlay, "p2-tap-count"),
      tapSub: grab(overlay, "p2-tap-sub"),
      tapLabel: grab(overlay, "p2-tap-label"),
      tapNote: grab(overlay, "p2-tap-note"),
      ring: grab(overlay, "p2-ring"),
      ringDash: grab(overlay, "p2-ring-dash"),
      count: grab(overlay, "p2-breath-count"),
      phase: grab(overlay, "p2-breath-phase"),
      cue: grab(overlay, "p2-breath-cue"),
      cycle: grab(overlay, "p2-breath-cycle"),
      reps: grab(overlay, "p2-reps"),
      repFill: grab(overlay, "p2-rep-fill"),
      repBlock: grab(overlay, "p2-rep-block"),
      waveFill: grab(overlay, "p2-wave-fill"),
      waveLine: grab(overlay, "p2-wave-line"),
      waveMark: grab(overlay, "p2-wave-mark"),
      waveDot: grab(overlay, "p2-wave-dot"),
      rail: grab(overlay, "p2-rail"),
      hold: grab(overlay, "p2-hold"),
      surfRead: grab(overlay, "p2-surf-read"),
      tape: overlay.querySelector(".p2-tape"),
      lock: grab(overlay, "p2-lock"),
      lockLabel: grab(overlay, "p2-lock-label"),
      claim: grab(overlay, "p2-claim"),
      claimLabel: grab(overlay, "p2-claim-label"),
      stand: grab(overlay, "p2-stand"),
      live: grab(overlay, "p2-live"),
      cracks: overlay.querySelectorAll(".p2-crack"),
      ticks: overlay.querySelectorAll(".p2-ticks i"),
      pills: overlay.querySelectorAll(".p2-pill"),
      panels: overlay.querySelectorAll(".p2-panel"),
      pips: overlay.querySelectorAll(".p2-phases span"),
      nodes: overlay.querySelectorAll(".p2-node"),
      repButtons: overlay.querySelectorAll("[data-act='push']")
    };
    bind(overlay);
    armCracks();
    armRing();
    paintQuote(lineFor(0));
    setCamera("scan");
    lockScroll();
    if (mode === "breath") paintBreath();
    if (mode === "surf") paintSurf(now());
    session.raf = raf(frame);
    startCamera();
    fxUnlock();
    if (options.siren !== false) {
      try {
        if (root.DopamineFX && root.DopamineFX.playPanicSiren) root.DopamineFX.playPanicSiren();
      } catch (err) {}
    }
    if (session.voice) speak(lineFor(0));
    try { overlay.focus(); } catch (err) {}
    emit("open", { sessionId: session.id, streakDay: day, mode: mode, rank: rank, xp: xp });
    return session.id;
  }

  function isOpen() {
    return !!(session && session.alive);
  }

  var api = {
    version: "2.0.0",
    __built: true,
    open: open,
    close: close,
    on: on,
    off: off,
    isOpen: isOpen
  };

  root.Panic2Engine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
