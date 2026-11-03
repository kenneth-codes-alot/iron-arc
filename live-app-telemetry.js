/**
 * LiveTelemetry — Live App 2.0 dashboard layer for IRON ARC.
 * Vanilla, zero-dependency. CSS is injected once. Works without DopamineFX
 * (brain falls back, ticks no-op) and without FeaturesModule.
 *
 *   LiveTelemetry.renderInteractiveBrainWidget(state)
 *   LiveTelemetry.renderBioMetricsStrip(state)
 *   LiveTelemetry.renderPulseCheckModal(state?)
 *   LiveTelemetry.openPulseCheck(state?)
 *   LiveTelemetry.noteOffset(seconds)   // canonical streak clock, seconds
 *
 * state: {
 *   streakDays, streakSecondsOffset, rank, rankCode, rewirePct,
 *   benefit, hour, activeRegion, inline
 * }
 *
 * "In Bed - Danger" reveals a one-tap launch and dispatches
 * "live-telemetry:panic" (cancelable). If nothing handles it,
 * FeaturesModule.openPanic() opens Red Panic Button 2.0.
 * A logged pulse dispatches "live-telemetry:pulse".
 */
(function (root) {
  "use strict";

  if (root.LiveTelemetry && root.LiveTelemetry.__built) return;

  var FOCUS_OPENING_H = 0.43;
  var FOCUS_PER_DAY_H = 1.34;
  var STORAGE_KEY = "ironarc.liveTelemetry.pulse.v1";

  var REGION = {
    prefrontal: { index: "01", name: "Prefrontal Brake", sub: "Impulse Control", pitch: 620, color: "#34d399" },
    striatum: { index: "02", name: "Striatum D2", sub: "Reward Sensitivity", pitch: 740, color: "#fbbf24" },
    androgen: { index: "03", name: "Androgen Axis", sub: "Drive & Presence", pitch: 540, color: "#a5b4fc" },
    amygdala: { index: "04", name: "Amygdala Shield", sub: "Cue Resistance", pitch: 460, color: "#f87171" }
  };

  var ENV = {
    desk: { label: "Locked In Desk", note: "Cue is the work." },
    gym: { label: "Gym", note: "Body is the reward." },
    bed: { label: "In Bed - Danger", note: "Phone, dark, horizontal." },
    bored: { label: "Bored/Alone", note: "Flatline window." }
  };

  var PLEASURES = [
    { id: "gym", name: "Gym", note: "Body signal. Heavy, simple, finished.", open: 3, online: 12 },
    { id: "music", name: "Music", note: "A full song. No skip, no second screen.", open: 7, online: 20 },
    { id: "work", name: "Deep work", note: "Ninety undivided minutes.", open: 14, online: 30 },
    { id: "connection", name: "Real connection", note: "A conversation with nowhere else to be.", open: 21, online: 45 }
  ];

  var memory = { region: null, regionDay: null };
  var pinnedOffset = null;
  var bound = false;
  var clockTimer = null;
  var scrollLock = "";

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

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function format1(n) {
    return (Math.round(Number(n) * 10) / 10).toFixed(1);
  }

  function formatSigned(n) {
    var v = round1(n);
    if (Object.is(v, -0) || v === 0) return "0.0";
    return (v > 0 ? "+" : "−") + Math.abs(v).toFixed(1);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function formatSubClock(totalSeconds) {
    var s = Math.floor(Math.abs(Number(totalSeconds) || 0) % 86400);
    return pad2(Math.floor(s / 3600)) + "h : " + pad2(Math.floor((s % 3600) / 60)) + "m : " + pad2(s % 60) + "s";
  }

  function formatHMS(totalSeconds) {
    var s = Math.floor(Math.abs(Number(totalSeconds) || 0) % 86400);
    return pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor((s % 3600) / 60)) + ":" + pad2(s % 60);
  }

  function todayKey(now) {
    var d = now || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function normalize(state) {
    state = state || {};
    var rawDay = state.streakDays != null ? state.streakDays : (state.streakDay != null ? state.streakDay : state.day);
    var day;
    if (rawDay == null || rawDay === "") day = 1;
    else day = Math.round(Number(rawDay));
    if (!isFinite(day)) day = 1;
    day = clamp(day, 0, 999);

    var offset = Number(state.streakSecondsOffset != null ? state.streakSecondsOffset : state.secondsOffset);
    if (!isFinite(offset) || offset < 0) offset = 0;
    if (offset > 86400 * 400) offset = 86400 * 400;

    var rewire = Number(state.rewirePct != null ? state.rewirePct : state.rewire);
    if (!isFinite(rewire)) rewire = Math.min(100, Math.round((Math.min(day, 90) / 90) * 82 + 18));
    rewire = clamp(rewire, 0, 100);

    var hour = state.hour;
    if (hour == null && state.now) {
      var parsed = new Date(state.now);
      if (!isNaN(parsed.getTime())) hour = parsed.getHours();
    }
    if (hour == null) hour = new Date().getHours();
    hour = Math.round(Number(hour));
    if (!isFinite(hour)) hour = 0;
    hour = ((hour % 24) + 24) % 24;

    var region = String(state.activeRegion || "");
    if (!REGION[region]) region = "";

    return {
      day: day,
      offset: offset,
      rewire: rewire,
      rank: String(state.rank == null ? "" : state.rank).trim().slice(0, 24),
      rankCode: String(state.rankCode == null ? "" : state.rankCode).trim().slice(0, 8),
      benefit: String(state.benefit == null ? "" : state.benefit).trim().slice(0, 80),
      hour: hour,
      region: region
    };
  }

  function brakeRaw(day) {
    var d = Math.max(0, day);
    var base = 24 + 72 * (1 - Math.exp(-d / 34));
    var dip = 0;
    if (d >= 2 && d <= 6) dip = Math.sin(((d - 2) / 4) * Math.PI) * 6;
    return Math.max(10, base - dip);
  }

  function d2Raw(day) {
    var d = Math.max(0, day);
    return 18 + 76 * (1 - Math.exp(-d / 26));
  }

  function velocityRaw(day) {
    var d = Math.max(0, day);
    return 1.55 + 2.65 * Math.exp(-Math.max(0, d - 1) / 40);
  }

  function velocityStatus(v) {
    if (v >= 2.5) return "Active Rewiring";
    if (v >= 1.7) return "Steady Compound";
    return "Ceiling Hold";
  }

  function vocalMarker(day) {
    return round1(3.2 + 20 * (1 - Math.exp(-Math.max(0, day) / 36)));
  }

  function eyeMarker(day) {
    return round1(1.8 + 14 * (1 - Math.exp(-Math.max(0, day) / 40)));
  }

  function driveIndex(day) {
    var vocal = Math.min(1, vocalMarker(day) / 22);
    var eye = Math.min(1, eyeMarker(day) / 15);
    return round1(100 * (0.55 * vocal + 0.45 * eye));
  }

  function shieldGross(day) {
    return 22 + 72 * (1 - Math.exp(-Math.max(0, day) / 30));
  }

  function hourDrag(hour) {
    var h = ((Math.round(hour) % 24) + 24) % 24;
    if (h >= 22 || h < 2) {
      return { drag: 12, band: "deep", label: "Deep night. Cortisol and the lit screen share a door." };
    }
    if (h >= 20 || h < 5) {
      return { drag: 8, band: "late", label: "Late window. The shield reads thinner after 20:00." };
    }
    if (h >= 13 && h <= 16) {
      return { drag: 3, band: "flat", label: "Afternoon flatline. Boredom borrows the stress door." };
    }
    return { drag: 0, band: "day", label: "Daylight window. Resistance is at its daily high." };
  }

  function pleasureStage(day, item) {
    if (day < item.open) return "muted";
    if (day < item.online) return "returning";
    return "online";
  }

  function stageLabel(stage) {
    if (stage === "online") return "Online";
    if (stage === "returning") return "Returning";
    return "Muted";
  }

  function conqueredHours(day, offsetSec) {
    return day * 24 + offsetSec / 3600;
  }

  function focusHours(day, offsetSec) {
    return FOCUS_OPENING_H + FOCUS_PER_DAY_H * (day + offsetSec / 86400);
  }

  function focusTodayMinutes(offsetSec) {
    return ((offsetSec % 86400) / 86400) * FOCUS_PER_DAY_H * 60;
  }

  function defaultRegion(day) {
    if (day <= 7) return "androgen";
    if (day <= 21) return "striatum";
    if (day <= 45) return "prefrontal";
    return "amygdala";
  }

  function snapshot(input) {
    var base = normalize(input);
    var drag = hourDrag(base.hour);
    var gross = shieldGross(base.day);
    var net = Math.max(6, gross - drag.drag);
    var brake = brakeRaw(base.day);
    var brakeNext = brakeRaw(base.day + 2);
    var d2 = d2Raw(base.day);
    var velocity = velocityRaw(base.day);
    var pleasures = [];
    for (var i = 0; i < PLEASURES.length; i++) {
      var item = PLEASURES[i];
      pleasures.push({
        id: item.id,
        name: item.name,
        note: item.note,
        stage: pleasureStage(base.day, item)
      });
    }
    var triggers = {
      cortisol: clamp(round1(net + 4), 0, 99),
      boredom: clamp(round1(net - (base.day < 14 ? 8 : 3)), 0, 99),
      bed: clamp(round1(net - (base.day < 21 ? 14 : 6)), 0, 99)
    };
    return {
      day: base.day,
      offset: base.offset,
      rewire: base.rewire,
      rank: base.rank,
      rankCode: base.rankCode,
      benefit: base.benefit,
      hour: base.hour,
      hours: conqueredHours(base.day, base.offset),
      focus: focusHours(base.day, base.offset),
      focusTodayMin: focusTodayMinutes(base.offset),
      velocity: velocity,
      velocityStatus: velocityStatus(velocity),
      hms: formatHMS(base.offset),
      subclock: formatSubClock(base.offset),
      brake: round1(brake),
      brake48: round1(brakeNext - brake),
      d2: round1(d2),
      vocal: vocalMarker(base.day),
      eye: eyeMarker(base.day),
      drive: driveIndex(base.day),
      shieldGross: round1(gross),
      shieldDrag: drag.drag,
      shieldNet: round1(net),
      shieldLabel: drag.label,
      shieldBand: drag.band,
      triggers: triggers,
      pleasures: pleasures
    };
  }

  function prefrontalPhase(day) {
    if (day <= 2) return "open";
    if (day <= 6) return "notch";
    if (day <= 13) return "hold";
    if (day <= 29) return "ask";
    if (day <= 59) return "guard";
    return "auto";
  }

  function prefrontalAdvice(day) {
    var phase = prefrontalPhase(day);
    if (phase === "open") return "Urges peak before they shrink. Leave the room in the first ten seconds. Do not debate a screen from the pillow.";
    if (phase === "notch") return "This is the withdrawal crest. The brake feels softer while the circuit is still being laid. Sleep, food, and a closed laptop beat a speech.";
    if (phase === "hold") return "The first ninety seconds are the whole fight. Outlast them and the urge drops its voice.";
    if (phase === "ask") return "Autopilot has to ask permission now. Answer by changing rooms, not by bargaining.";
    if (phase === "guard") return "One exception re-pairs the cue faster than a week of clean reps. Guard the exception.";
    return "The brake fires early. The remaining leak is fatigue plus a late cue. Protect the last hour before sleep.";
  }

  function prefrontalAction(day, delta) {
    if (delta < 0 || (day >= 2 && day <= 6)) return "Do not read the stall as relapse. Leave the room once tonight.";
    if (day <= 7) return "When the cue hits, stand up before you explain it to yourself.";
    if (day >= 60) return "Protect the last waking hour. That is the remaining leak.";
    return "Change rooms at the first cue. Do not negotiate a maybe.";
  }

  function androgenCopy(day) {
    if (day < 1) return "The surge window arms the hour the streak starts. Voice and gaze move before mood does.";
    if (day <= 7) return "You are inside the Day 1–7 surge window. Drive, vocal steadiness, and eye contact often move this week, before mood agrees. Treat the markers as a log, not a verdict.";
    if (day <= 16) return "The surge window has closed. What remains is presence under load: a lower voice, longer eye contact, no performance. Flatness now is usually sleep, not a failed arc.";
    return "Drive is no longer a spike. It is iron, sleep, and the decision not to spend it on a screen at midnight.";
  }

  function androgenBadge(day) {
    if (day < 1) return { tone: "wait", text: "Surge window arms at Day 1" };
    if (day < 7) return { tone: "open", text: "Day " + day + " of 7 · surge window open" };
    if (day === 7) return { tone: "open", text: "Day 7 of 7 · last day of the surge" };
    if (day <= 16) return { tone: "mid", text: "Surge consolidating" };
    return { tone: "calm", text: "Presence practice" };
  }

  function meter(pct) {
    var width = clamp(round1(pct), 0, 100);
    return '<span class="lt-meter" aria-hidden="true"><i data-w="' + width + '%" style="width:' + width + '%"></i></span>';
  }

function readoutHTML(id, snap) {
    var meta = REGION[id] || REGION.prefrontal;
    var body = "";
    if (id === "prefrontal") {
      var trend = snap.brake48 < -0.3 ? "inside a scheduled dip" : snap.brake48 < 0.8 ? "holding its ground" : "adding thickness";
      body =
        '<p class="lt-copy">Day ' + snap.day + '. Recovery is <strong>' + format1(snap.brake) + '%</strong>. The brake is the gap between the cue and the click. It is ' + trend + '.</p>' +
        meter(snap.brake) +
        '<div class="lt-next"><p class="lt-kicker">Next 48 hours</p><strong>' + formatSigned(snap.brake48) + '%</strong>' +
        '<p>' + esc(prefrontalAdvice(snap.day)) + '</p></div>' +
        '<p class="lt-action">' + esc(prefrontalAction(snap.day, snap.brake48)) + '</p>';
    } else if (id === "striatum") {
      var rows = "";
      for (var i = 0; i < snap.pleasures.length; i++) {
        var p = snap.pleasures[i];
        rows +=
          '<li data-stage="' + p.stage + '">' +
            '<span class="lt-stage">' + stageLabel(p.stage) + '</span>' +
            '<div><b>' + esc(p.name) + '</b><p>' + esc(p.note) + '</p></div>' +
          '</li>';
      }
      body =
        '<p class="lt-copy">Sensitivity index <strong>' + format1(snap.d2) + '%</strong>. Ordinary pleasure is the point of the reset. Super-stimuli turned the gain down. These four turn it back up, in order.</p>' +
        meter(snap.d2) +
        '<ul class="lt-pleasures">' + rows + '</ul>' +
        '<p class="lt-action">Do the next returning pleasure before you open a feed. Baseline velocity is ' + formatSigned(snap.velocity) + '% / day.</p>';
    } else if (id === "androgen") {
      var badge = androgenBadge(snap.day);
      var vocalPct = clamp((snap.vocal / 24) * 100, 0, 100);
      var eyePct = clamp((snap.eye / 16) * 100, 0, 100);
      body =
        '<p class="lt-badge lt-badge-' + badge.tone + '">' + esc(badge.text) + '</p>' +
        '<p class="lt-copy">' + esc(androgenCopy(snap.day)) + '</p>' +
        '<div class="lt-markers">' +
          '<div class="lt-marker"><div class="lt-marker-row"><span>Vocal confidence</span><b>' + format1(snap.vocal) + 's</b></div>' + meter(vocalPct) + '</div>' +
          '<div class="lt-marker"><div class="lt-marker-row"><span>Eye-contact hold</span><b>' + format1(snap.eye) + 's</b></div>' + meter(eyePct) + '</div>' +
        '</div>' +
        '<p class="lt-fine">Protocol markers from the streak, not a microphone test. They move so you can watch presence on a clock instead of a vibe.</p>' +
        '<p class="lt-action">Hold eye contact one second past the flinch today. Note it.</p>';
    } else {
      var t = snap.triggers;
      body =
        '<p class="lt-copy">Net resistance <strong>' + format1(snap.shieldNet) + '%</strong>' +
        (snap.shieldDrag ? ' · cue drag −' + snap.shieldDrag + '%' : '') +
        '. Cortisol and boredom share a door. Resistance is how long you can feel the spike without feeding it.</p>' +
        '<p class="lt-fine">' + esc(snap.shieldLabel) + '</p>' +
        meter(snap.shieldNet) +
        '<ul class="lt-triggers">' +
          '<li><span class="lt-trigger-name">Cortisol spike</span><b>' + format1(t.cortisol) + '%</b>' + meter(t.cortisol) + '</li>' +
          '<li><span class="lt-trigger-name">Boredom flatline</span><b>' + format1(t.boredom) + '%</b>' + meter(t.boredom) + '</li>' +
          '<li><span class="lt-trigger-name">Bed + phone</span><b>' + format1(t.bed) + '%</b>' + meter(t.bed) + '</li>' +
        '</ul>' +
        '<p class="lt-action">' + (snap.shieldDrag >= 8 ? "Change rooms before you change your mind. The shield does not win from the pillow." : "Bank a clean hour while the shield is at its daily high.") + '</p>';
    }

    var statValue = id === "prefrontal" ? format1(snap.brake) + "%"
      : id === "striatum" ? format1(snap.d2) + "%"
      : id === "androgen" ? (snap.day >= 1 && snap.day <= 7 ? "D" + snap.day + "/7" : format1(snap.drive) + "%")
      : format1(snap.shieldNet) + "%";
    var statLabel = id === "prefrontal" ? "recovery"
      : id === "striatum" ? "sensitivity"
      : id === "androgen" ? (snap.day >= 1 && snap.day <= 7 ? "surge" : "presence")
      : "resistance";

    return (
      '<article class="lt-readout is-in">' +
        '<header class="lt-readout-top">' +
          '<div><p class="lt-kicker">' + meta.index + ' · ' + esc(id === "amygdala" ? "Stress & Late-Night Cue Resistance" : meta.sub) + '</p>' +
          '<h3>' + esc(meta.name) + '</h3></div>' +
          '<div class="lt-readout-stat"><strong>' + statValue + '</strong><span>' + statLabel + '</span></div>' +
        '</header>' +
        body +
      '</article>'
    );
  }

  function pillStat(id, snap) {
    if (id === "prefrontal") return Math.round(snap.brake) + "%";
    if (id === "striatum") return Math.round(snap.d2) + "%";
    if (id === "androgen") return (snap.day >= 1 && snap.day <= 7) ? ("D" + snap.day + "/7") : (Math.round(snap.drive) + "%");
    return Math.round(snap.shieldNet) + "%";
  }

  function brainMarkup(pct, code) {
    var fx = root.DopamineFX;
    if (fx && typeof fx.renderBrainSVG === "function") {
      try {
        var html = fx.renderBrainSVG(pct, code || "");
        if (html) return html;
      } catch (err) { /* fallback below */ }
    }
    var safe = esc(code || Math.round(pct));
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 340" role="img" aria-label="Dopamine rewiring ' + Math.round(pct) + ' percent">' +
        '<circle cx="180" cy="164" r="78" fill="none" stroke="#34d399" stroke-width="2" opacity="0.7"/>' +
        '<circle cx="180" cy="164" r="34" fill="#064e3b"/>' +
        '<text x="180" y="170" text-anchor="middle" fill="#f8fafc" font-size="18" font-family="Segoe UI, sans-serif" font-weight="800">' + safe + '</text>' +
        '<text x="180" y="322" text-anchor="middle" fill="#34d399" font-size="12" font-family="Segoe UI, sans-serif" font-weight="800">D2 REWIRE ' + Math.round(pct) + '%</text>' +
      '</svg>'
    );
  }

  function playTick(freq, duration) {
    var fx = root.DopamineFX;
    if (!fx || typeof fx.playTick !== "function") return;
    try { fx.playTick(freq, duration); } catch (err) { /* audio is optional */ }
  }

  function ensureCss() {
    if (typeof document === "undefined") return;
    if (document.getElementById("lt-styles")) return;
    var style = document.createElement("style");
    style.id = "lt-styles";
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function pickRegion(base) {
    if (base.region && REGION[base.region]) return base.region;
    if (memory.region && memory.regionDay === base.day && REGION[memory.region]) return memory.region;
    return defaultRegion(base.day);
  }

  function renderInteractiveBrainWidget(state) {
    ensureCss();
    var base = normalize(state);
    var snap = snapshot(base);
    var active = pickRegion(base);
    var svgCode = base.rankCode || (base.rank.length <= 6 ? base.rank : "");
    var pills = ["prefrontal", "striatum", "androgen", "amygdala"];
    var pillHTML = "";
    for (var i = 0; i < pills.length; i++) {
      var id = pills[i];
      var meta = REGION[id];
      var on = id === active;
      pillHTML +=
        '<button type="button" class="lt-pill' + (on ? " is-on" : "") + '" data-lt-region="' + id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          '<span class="lt-pill-stat" data-lt-pill-stat="' + id + '">' + esc(pillStat(id, snap)) + '</span>' +
          '<span class="lt-pill-copy"><span class="lt-pill-name">' + esc(meta.name) + '</span>' +
          '<span class="lt-pill-sub">' + esc(meta.sub) + '</span></span>' +
        '</button>';
      if (i === 1) {
        pillHTML += '<div class="lt-svg-wrap">' + brainMarkup(snap.rewire, svgCode) + '</div>';
      }
    }
    var benefit = base.benefit
      ? '<p class="lt-benefit">' + esc(base.benefit) + '</p>'
      : "";
    var rank = base.rank
      ? '<b class="lt-rank">' + esc(base.rank) + '</b>'
      : '<b class="lt-rank">UNRANKED</b>';

    return (
      '<section class="lt lt-brain" data-lt-brain data-lt-region="' + active + '" data-lt-day="' + snap.day + '" data-lt-offset="' + snap.offset + '" data-lt-t0="' + Date.now() + '" data-lt-rewire="' + snap.rewire + '" data-lt-rank="' + esc(base.rank) + '" data-lt-code="' + esc(base.rankCode) + '" data-lt-benefit="' + esc(base.benefit) + '">' +
        '<div class="lt-top">' +
          '<div class="lt-top-day">' +
            '<p class="lt-kicker">D2 Neural Inspector</p>' +
            '<div class="lt-day">DAY ' + snap.day + '</div>' +
            '<div id="liveSubClock" class="lt-subclock" data-lt-subclock>' + esc(snap.subclock) + '</div>' +
          '</div>' +
          '<div class="lt-top-meta"><span class="lt-live"><i></i>Live</span>' + rank + '</div>' +
        '</div>' +
        benefit +
        '<div class="lt-region-grid" role="group" aria-label="Four neuro regions">' + pillHTML + '</div>' +
        '<p class="lt-tap">Tap a region. The readout follows.</p>' +
        '<div class="lt-drawer" data-lt-drawer data-lt-region="' + active + '" aria-live="polite">' +
          readoutHTML(active, snap) +
        '</div>' +
      '</section>'
    );
  }

  function renderBioMetricsStrip(state) {
    ensureCss();
    var snap = snapshot(state);
    var focusSub = snap.focusTodayMin >= 1
      ? "+" + Math.round(snap.focusTodayMin) + "m today"
      : "+" + format1(snap.focusTodayMin) + "m today";
    return (
      '<section class="lt lt-strip" data-lt-strip data-lt-day="' + snap.day + '" data-lt-offset="' + snap.offset + '" data-lt-t0="' + Date.now() + '">' +
        '<div class="lt-strip-head">' +
          '<span class="lt-kicker">Real-Time Bio-Telemetry</span>' +
          '<span class="lt-live"><i></i>Live</span>' +
        '</div>' +
        '<div class="lt-strip-grid">' +
          '<article class="lt-metric">' +
            '<h3 class="lt-metric-label">Hours Conquered</h3>' +
            '<p class="lt-metric-value" data-lt-hours>' + format1(snap.hours) + 'h</p>' +
            '<p class="lt-metric-sub" data-lt-hours-sub>' + esc(snap.hms) + ' live</p>' +
          '</article>' +
          '<article class="lt-metric">' +
            '<h3 class="lt-metric-label">Focus Time Reclaimed</h3>' +
            '<p class="lt-metric-value" data-lt-focus>' + format1(snap.focus) + ' hrs</p>' +
            '<p class="lt-metric-sub" data-lt-focus-sub>' + esc(focusSub) + '</p>' +
          '</article>' +
          '<article class="lt-metric lt-metric-velocity">' +
            '<h3 class="lt-metric-label">Dopamine Baseline Velocity</h3>' +
            '<p class="lt-metric-value" data-lt-velocity>' + formatSigned(snap.velocity) + '%</p>' +
            '<p class="lt-metric-sub"><span>/ day</span> · <span data-lt-velocity-status>' + esc(snap.velocityStatus) + '</span></p>' +
          '</article>' +
        '</div>' +
        '<button type="button" class="lt-pulse-launch" data-lt-open-pulse>' +
          '<span>10-Second Craving &amp; Energy Pulse</span>' +
          '<small>Energy · Focus · Environment</small>' +
        '</button>' +
      '</section>'
    );
  }

  function savedPulseFor(day) {
    var saved = readPulse();
    if (!saved) return null;
    if (saved.day !== day) return null;
    if (saved.date !== todayKey(new Date())) return null;
    return saved;
  }

  function renderPulseCheckModal(state) {
    ensureCss();
    var base = inferredState(state);
    var inline = !!(state && state.inline);
    var saved = savedPulseFor(base.day);
    var energy = saved ? saved.energy : 0;
    var focus = saved ? saved.focus : 0;
    var env = saved ? saved.environment : "";
    var steps = (energy ? 1 : 0) + (focus ? 1 : 0) + (env ? 1 : 0);

    function scale(kind, current, low, high) {
      var html = '<div class="lt-scale" role="group" aria-label="' + (kind === "energy" ? "Energy level" : "Focus sharpness") + ' from 1 ' + low + ' to 5 ' + high + '">';
      for (var n = 1; n <= 5; n++) {
        var on = current === n;
        html += '<button type="button" data-lt-' + kind + '="' + n + '" aria-pressed="' + (on ? "true" : "false") + '" aria-label="' + kind + ' ' + n + ' of 5">' + n + '</button>';
      }
      html += "</div>";
      return html;
    }

    var envs = ["desk", "gym", "bed", "bored"];
    var envHTML = "";
    for (var i = 0; i < envs.length; i++) {
      var key = envs[i];
      var onEnv = env === key;
      envHTML +=
        '<button type="button" class="lt-env' + (onEnv ? " is-on" : "") + '" data-lt-env="' + key + '" aria-pressed="' + (onEnv ? "true" : "false") + '">' +
          '<b>' + esc(ENV[key].label) + '</b><small>' + esc(ENV[key].note) + '</small>' +
        '</button>';
    }

    var sheet =
      '<div class="lt-sheet' + (env === "bed" ? " is-danger" : "") + '" role="dialog" aria-modal="' + (inline ? "false" : "true") + '" aria-labelledby="lt-pulse-title" tabindex="-1">' +
        '<div class="lt-sheet-top">' +
          '<div><p class="lt-kicker">10-second check-in</p><h3 id="lt-pulse-title">Craving &amp; Energy Pulse</h3></div>' +
          '<button type="button" class="lt-close" data-lt-close aria-label="Close pulse check">✕</button>' +
        '</div>' +
        '<div class="lt-timer"><span data-lt-countdown>10</span><span data-lt-countdown-label>seconds · three taps</span></div>' +
        '<div class="lt-countdown-track" aria-hidden="true"><i class="lt-countdown-bar"></i></div>' +
        '<p class="lt-steps" data-lt-steps>' + steps + ' / 3</p>' +
        '<fieldset class="lt-field"><legend>Energy level</legend>' +
          '<div class="lt-caps"><span>Flat</span><span>Charged</span></div>' +
          scale("energy", energy, "flat", "charged") +
        '</fieldset>' +
        '<fieldset class="lt-field"><legend>Focus sharpness</legend>' +
          '<div class="lt-caps"><span>Scattered</span><span>Razor</span></div>' +
          scale("focus", focus, "scattered", "razor") +
        '</fieldset>' +
        '<fieldset class="lt-field"><legend>Current environment</legend>' +
          '<div class="lt-envs">' + envHTML + '</div>' +
        '</fieldset>' +
        '<div class="lt-danger"' + (env === "bed" ? "" : " hidden") + ' data-lt-danger>' +
          '<p class="lt-kicker">In Bed — Danger</p>' +
          '<p>The cue stack is phone, dark, and horizontal. Do not negotiate from the pillow.</p>' +
          '<button type="button" class="lt-panic-go" data-lt-launch-panic>Launch Red Panic Button 2.0</button>' +
        '</div>' +
        '<p class="lt-saved" data-lt-saved hidden></p>' +
        '<button type="button" class="lt-log" data-lt-log' + (steps === 3 ? "" : " disabled") + '>Log pulse</button>' +
      '</div>';

    if (inline) return '<section class="lt lt-inline" data-lt-pulse-root data-lt-day="' + base.day + '" data-lt-pick-energy="' + (energy || "") + '" data-lt-pick-focus="' + (focus || "") + '" data-lt-pick-env="' + esc(env) + '">' + sheet + '</section>';

    return (
      '<div class="lt-modal" data-lt-pulse-root data-lt-day="' + base.day + '" data-lt-pick-energy="' + (energy || "") + '" data-lt-pick-focus="' + (focus || "") + '" data-lt-pick-env="' + esc(env) + '">' +
        sheet +
      '</div>'
    );
  }

  function inferredState(state) {
    if (state && (state.streakDays != null || state.streakDay != null || state.day != null)) return normalize(state);
    if (typeof document !== "undefined") {
      var brain = document.querySelector("[data-lt-brain]");
      if (brain) {
        return normalize({
          streakDays: brain.getAttribute("data-lt-day"),
          streakSecondsOffset: offsetFor(brain),
          rank: brain.getAttribute("data-lt-rank"),
          rankCode: brain.getAttribute("data-lt-code"),
          rewirePct: brain.getAttribute("data-lt-rewire"),
          benefit: brain.getAttribute("data-lt-benefit")
        });
      }
    }
    return normalize(state || {});
  }

  function offsetFor(el) {
    if (pinnedOffset != null) return pinnedOffset;
    var base = Number(el.getAttribute("data-lt-offset")) || 0;
    var t0 = Number(el.getAttribute("data-lt-t0")) || Date.now();
    var extra = Math.max(0, Math.floor((Date.now() - t0) / 1000));
    return base + extra;
  }

  function setText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  function flash(el) {
    if (!el) return;
    el.classList.remove("is-tick");
    void el.offsetWidth;
    el.classList.add("is-tick");
  }

  function paintStrip(el) {
    var day = Number(el.getAttribute("data-lt-day"));
    if (!isFinite(day)) day = 1;
    var offset = offsetFor(el);
    var hours = format1(conqueredHours(day, offset)) + "h";
    var focus = format1(focusHours(day, offset)) + " hrs";
    var mins = focusTodayMinutes(offset);
    var focusSub = mins >= 1 ? "+" + Math.round(mins) + "m today" : "+" + format1(mins) + "m today";
    var hoursEl = el.querySelector("[data-lt-hours]");
    var focusEl = el.querySelector("[data-lt-focus]");
    if (hoursEl && hoursEl.textContent !== hours) {
      hoursEl.textContent = hours;
      flash(hoursEl);
    }
    if (focusEl && focusEl.textContent !== focus) {
      focusEl.textContent = focus;
      flash(focusEl);
    }
    setText(el.querySelector("[data-lt-hours-sub]"), formatHMS(offset) + " live");
    setText(el.querySelector("[data-lt-focus-sub]"), focusSub);
    var status = velocityStatus(velocityRaw(day));
    setText(el.querySelector("[data-lt-velocity]"), formatSigned(velocityRaw(day)) + "%");
    setText(el.querySelector("[data-lt-velocity-status]"), status);
  }

  function paintBrain(el) {
    var offset = offsetFor(el);
    setText(el.querySelector("[data-lt-subclock]"), formatSubClock(offset));
    var hour = new Date().getHours();
    var band = hourDrag(hour).band;
    var day = Number(el.getAttribute("data-lt-day")) || 1;
    var region = el.getAttribute("data-lt-region") || "prefrontal";
    var sig = region + "|" + day + "|" + band;
    if (region === "amygdala" && el.getAttribute("data-lt-sig") && el.getAttribute("data-lt-sig") !== sig) {
      var snap = snapshot({
        streakDays: day,
        streakSecondsOffset: offset,
        rank: el.getAttribute("data-lt-rank"),
        rankCode: el.getAttribute("data-lt-code"),
        rewirePct: el.getAttribute("data-lt-rewire"),
        benefit: el.getAttribute("data-lt-benefit"),
        hour: hour
      });
      var drawer = el.querySelector("[data-lt-drawer]");
      if (drawer) drawer.innerHTML = readoutHTML("amygdala", snap);
      var pill = el.querySelector('[data-lt-pill-stat="amygdala"]');
      if (pill) pill.textContent = pillStat("amygdala", snap);
    }
    el.setAttribute("data-lt-sig", sig);
  }

  function paintLive() {
    if (typeof document === "undefined") return;
    var strips = document.querySelectorAll("[data-lt-strip]");
    for (var i = 0; i < strips.length; i++) paintStrip(strips[i]);
    var brains = document.querySelectorAll("[data-lt-brain]");
    for (var j = 0; j < brains.length; j++) paintBrain(brains[j]);
  }

  function noteOffset(seconds) {
    var n = Number(seconds);
    if (!isFinite(n) || n < 0) return;
    pinnedOffset = n;
    paintLive();
  }

  function animateMeters(scope) {
    if (!scope || typeof requestAnimationFrame !== "function") return;
    var bars = scope.querySelectorAll(".lt-meter > i");
    for (var i = 0; i < bars.length; i++) {
      (function (bar) {
        var width = bar.getAttribute("data-w") || bar.style.width || "0%";
        bar.style.width = "0%";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { bar.style.width = width; });
        });
      })(bars[i]);
    }
  }

  function selectRegion(widget, id) {
    if (!widget || !REGION[id]) return;
    var prev = widget.getAttribute("data-lt-region");
    playTick(REGION[id].pitch, 0.028);
    if (prev === id) return;
    widget.setAttribute("data-lt-region", id);
    memory.region = id;
    memory.regionDay = Number(widget.getAttribute("data-lt-day")) || 1;
    var pills = widget.querySelectorAll(".lt-pill[data-lt-region]");
    for (var i = 0; i < pills.length; i++) {
      var on = pills[i].getAttribute("data-lt-region") === id;
      pills[i].classList.toggle("is-on", on);
      pills[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    var snap = snapshot({
      streakDays: widget.getAttribute("data-lt-day"),
      streakSecondsOffset: offsetFor(widget),
      rank: widget.getAttribute("data-lt-rank"),
      rankCode: widget.getAttribute("data-lt-code"),
      rewirePct: widget.getAttribute("data-lt-rewire"),
      benefit: widget.getAttribute("data-lt-benefit")
    });
    var drawer = widget.querySelector("[data-lt-drawer]");
    if (drawer) {
      drawer.setAttribute("data-lt-region", id);
      drawer.innerHTML = readoutHTML(id, snap);
      animateMeters(drawer);
    }
    widget.setAttribute("data-lt-sig", id + "|" + snap.day + "|" + snap.shieldBand);
  }

  function setExclusive(modal, selector, chosen) {
    var nodes = modal.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      var on = nodes[i] === chosen;
      nodes[i].setAttribute("aria-pressed", on ? "true" : "false");
      nodes[i].classList.toggle("is-on", on);
    }
  }

  function syncPulseGate(modal) {
    var energy = modal.getAttribute("data-lt-pick-energy");
    var focus = modal.getAttribute("data-lt-pick-focus");
    var env = modal.getAttribute("data-lt-pick-env");
    var steps = (energy ? 1 : 0) + (focus ? 1 : 0) + (env ? 1 : 0);
    var stepEl = modal.querySelector("[data-lt-steps]");
    if (stepEl) stepEl.textContent = steps + " / 3";
    var log = modal.querySelector("[data-lt-log]");
    if (log) log.disabled = steps !== 3;
    var danger = modal.querySelector("[data-lt-danger]");
    var sheet = modal.querySelector(".lt-sheet");
    var bed = env === "bed";
    if (danger) danger.hidden = !bed;
    if (sheet) sheet.classList.toggle("is-danger", bed);
    if (bed && danger && !danger.hasAttribute("data-lt-shown")) {
      danger.setAttribute("data-lt-shown", "1");
      if (danger.scrollIntoView) {
        try { danger.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (err) { danger.scrollIntoView(); }
      }
    }
    if (!bed && danger) danger.removeAttribute("data-lt-shown");
  }

  function readPulse() {
    try {
      if (typeof localStorage === "undefined") return null;
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      var energy = Number(data.energy);
      var focus = Number(data.focus);
      var env = String(data.environment || "");
      if (!(energy >= 1 && energy <= 5) || !(focus >= 1 && focus <= 5) || !ENV[env]) return null;
      return {
        energy: energy,
        focus: focus,
        environment: env,
        day: Number(data.day) || 0,
        date: String(data.date || ""),
        at: String(data.at || "")
      };
    } catch (err) {
      return null;
    }
  }

  function commitPulse(modal) {
    var energy = Number(modal.getAttribute("data-lt-pick-energy"));
    var focus = Number(modal.getAttribute("data-lt-pick-focus"));
    var env = modal.getAttribute("data-lt-pick-env") || "";
    if (!(energy >= 1 && energy <= 5) || !(focus >= 1 && focus <= 5) || !ENV[env]) return;
    var day = Number(modal.getAttribute("data-lt-day")) || inferredState({}).day;
    var payload = {
      energy: energy,
      focus: focus,
      environment: env,
      environmentLabel: ENV[env].label,
      day: day,
      date: todayKey(new Date()),
      at: new Date().toISOString()
    };
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) { /* private mode */ }
    if (typeof document !== "undefined" && typeof root.CustomEvent === "function") {
      document.dispatchEvent(new CustomEvent("live-telemetry:pulse", { detail: payload }));
    }
    playTick(760, 0.04);
    var saved = modal.querySelector("[data-lt-saved]");
    if (saved) {
      saved.hidden = false;
      saved.textContent = "Pulse logged. Energy " + energy + " · Focus " + focus + " · " + ENV[env].label + ".";
    }
    var log = modal.querySelector("[data-lt-log]");
    if (log) log.textContent = "Logged";
    if (env !== "bed") {
      setTimeout(function () { closePulseCheck(); }, 700);
    }
  }

  function launchPanic() {
    closePulseCheck();
    var handled = false;
    if (typeof document !== "undefined" && typeof root.CustomEvent === "function") {
      var event = new CustomEvent("live-telemetry:panic", {
        cancelable: true,
        detail: { source: "pulse-bed", environment: "bed" }
      });
      handled = document.dispatchEvent(event) === false;
    }
    if (handled) return;
    var fx = root.DopamineFX;
    if (fx && typeof fx.playPanicSiren === "function") {
      try { fx.playPanicSiren(); } catch (err) { /* optional */ }
    }
    var features = root.FeaturesModule;
    if (features && typeof features.openPanic === "function") {
      try { features.openPanic(); } catch (err) { /* optional */ }
    }
  }

  function armPulse(modal) {
    if (!modal || modal.getAttribute("data-lt-armed") === "1") return;
    modal.setAttribute("data-lt-armed", "1");
    var left = 10;
    var countEl = modal.querySelector("[data-lt-countdown]");
    var labelEl = modal.querySelector("[data-lt-countdown-label]");
    var timer = setInterval(function () {
      if (!modal.isConnected) {
        clearInterval(timer);
        return;
      }
      left -= 1;
      if (countEl) countEl.textContent = String(Math.max(0, left));
      if (left <= 0) {
        clearInterval(timer);
        if (labelEl) labelEl.textContent = "still open · finish the taps";
      }
    }, 1000);
    modal._ltTimer = timer;
    var sheet = modal.querySelector(".lt-sheet");
    if (sheet && sheet.focus) {
      try { sheet.focus({ preventScroll: true }); } catch (err) { try { sheet.focus(); } catch (err2) { /* ignore */ } }
    }
  }

  function openPulseCheck(state) {
    ensureCss();
    if (typeof document === "undefined") return null;
    closePulseCheck();
    var host = document.body || document.documentElement;
    var wrap = document.createElement("div");
    wrap.innerHTML = renderPulseCheckModal(state);
    var modal = wrap.firstElementChild;
    if (!modal) return null;
    scrollLock = document.body ? document.body.style.overflow : "";
    if (document.body) document.body.style.overflow = "hidden";
    host.appendChild(modal);
    armPulse(modal);
    playTick(640, 0.03);
    return modal;
  }

  function closePulseCheck() {
    if (typeof document === "undefined") return;
    var nodes = document.querySelectorAll("[data-lt-pulse-root]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i]._ltTimer) clearInterval(nodes[i]._ltTimer);
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
    if (document.body) document.body.style.overflow = scrollLock || "";
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var regionBtn = target.closest(".lt-pill[data-lt-region]");
    if (regionBtn) {
      event.preventDefault();
      selectRegion(regionBtn.closest("[data-lt-brain]"), regionBtn.getAttribute("data-lt-region"));
      return;
    }

    if (target.closest("[data-lt-open-pulse]")) {
      event.preventDefault();
      openPulseCheck();
      return;
    }

    var modal = target.closest("[data-lt-pulse-root]");
    if (!modal) return;

    if (target === modal || target.closest("[data-lt-close]")) {
      event.preventDefault();
      closePulseCheck();
      return;
    }

    var energyBtn = target.closest("[data-lt-energy]");
    if (energyBtn && modal.contains(energyBtn)) {
      event.preventDefault();
      setExclusive(modal, "[data-lt-energy]", energyBtn);
      modal.setAttribute("data-lt-pick-energy", energyBtn.getAttribute("data-lt-energy"));
      playTick(500 + Number(energyBtn.getAttribute("data-lt-energy")) * 36, 0.026);
      syncPulseGate(modal);
      return;
    }

    var focusBtn = target.closest("[data-lt-focus]");
    if (focusBtn && modal.contains(focusBtn)) {
      event.preventDefault();
      setExclusive(modal, "[data-lt-focus]", focusBtn);
      modal.setAttribute("data-lt-pick-focus", focusBtn.getAttribute("data-lt-focus"));
      playTick(560 + Number(focusBtn.getAttribute("data-lt-focus")) * 32, 0.026);
      syncPulseGate(modal);
      return;
    }

    var envBtn = target.closest("[data-lt-env]");
    if (envBtn && modal.contains(envBtn)) {
      event.preventDefault();
      var env = envBtn.getAttribute("data-lt-env");
      setExclusive(modal, "[data-lt-env]", envBtn);
      modal.setAttribute("data-lt-pick-env", env);
      playTick(env === "bed" ? 420 : 700, env === "bed" ? 0.04 : 0.028);
      syncPulseGate(modal);
      return;
    }

    if (target.closest("[data-lt-launch-panic]")) {
      event.preventDefault();
      launchPanic();
      return;
    }

    if (target.closest("[data-lt-log]")) {
      event.preventDefault();
      commitPulse(modal);
    }
  }

  function onKey(event) {
    if (event.key !== "Escape") return;
    if (typeof document === "undefined") return;
    if (document.querySelector("[data-lt-pulse-root]")) {
      event.preventDefault();
      closePulseCheck();
    }
  }

  function watchModals() {
    if (typeof document === "undefined" || typeof MutationObserver !== "function" || !document.body) return;
    var observer = new MutationObserver(function () {
      var nodes = document.querySelectorAll("[data-lt-pulse-root]:not([data-lt-armed])");
      for (var i = 0; i < nodes.length; i++) armPulse(nodes[i]);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function bind() {
    if (bound || typeof document === "undefined") return;
    bound = true;
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    watchModals();
  }

  function startClock() {
    if (clockTimer || typeof root.setInterval !== "function") return;
    clockTimer = root.setInterval(paintLive, 1000);
  }

  function hydrate(rootEl) {
    ensureCss();
    bind();
    startClock();
    var scope = rootEl && rootEl.querySelectorAll ? rootEl : (typeof document !== "undefined" ? document : null);
    if (!scope) return;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll("[data-lt-pulse-root]") : [];
    for (var i = 0; i < nodes.length; i++) armPulse(nodes[i]);
    paintLive();
  }

  function boot() {
    ensureCss();
    bind();
    startClock();
  }

  function selfCheck() {
    var day1 = snapshot({ streakDays: 1, streakSecondsOffset: 1800, hour: 12 });
    var day14 = snapshot({ streakDays: 14, streakSecondsOffset: 23419, hour: 12 });
    var day90 = snapshot({ streakDays: 90, streakSecondsOffset: 0, hour: 12 });
    return {
      day1Hours: format1(day1.hours) + "h",
      day14Hours: format1(day14.hours) + "h",
      day1Focus: format1(day1.focus) + " hrs",
      day14Focus: format1(day14.focus) + " hrs",
      day1Velocity: formatSigned(day1.velocity) + "%",
      day1Status: day1.velocityStatus,
      day14Velocity: formatSigned(day14.velocity) + "%",
      day90Velocity: formatSigned(day90.velocity) + "%",
      day90Status: day90.velocityStatus,
      day1Brake: day1.brake,
      day14Brake: day14.brake,
      day1Surge: androgenBadge(1).text,
      regions: Object.keys(REGION)
    };
  }

  var CSS = [
    ".lt,.lt *{box-sizing:border-box;}",
    ".lt{width:100%;max-width:440px;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;}",
    ".lt button{font-family:inherit;-webkit-tap-highlight-color:transparent;}",
    ".lt h3,.lt p{margin:0;}",
    ".lt-kicker{margin:0;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#34d399;}",
    ".lt-brain{background:linear-gradient(165deg,#111a2e 0%,#090d16 100%);border:1px solid rgba(16,185,129,.32);border-radius:22px;padding:14px 12px 12px;margin:0 0 12px;box-shadow:0 16px 40px rgba(0,0,0,.35);}",
    ".lt-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}",
    ".lt-day{font-size:36px;font-weight:900;letter-spacing:-.03em;line-height:.95;margin:2px 0 6px;}",
    ".lt-subclock{display:inline-block;font-family:'SF Mono',ui-monospace,Consolas,monospace;font-size:12px;font-weight:700;color:#34d399;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.22);border-radius:999px;padding:3px 10px;font-variant-numeric:tabular-nums;}",
    ".lt-top-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;text-align:right;}",
    ".lt-rank{font-size:11px;letter-spacing:.08em;color:#fbbf24;}",
    ".lt-benefit{margin:8px 0 0;font-size:11px;line-height:1.35;color:#94a3b8;}",
    ".lt-live{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#6ee7b7;}",
    ".lt-live i{width:6px;height:6px;border-radius:99px;background:#34d399;box-shadow:0 0 8px #34d399;animation:lt-blink 1.4s ease-in-out infinite;}",
    ".lt-region-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;align-items:stretch;}",
    ".lt-svg-wrap{grid-column:1 / -1;width:min(168px,56%);margin:0 auto;}",
    ".lt-svg-wrap svg{width:100%;height:auto;display:block;}",
    ".lt[data-lt-region='prefrontal'] .lt-svg-wrap{filter:drop-shadow(0 10px 16px rgba(52,211,153,.28));}",
    ".lt[data-lt-region='striatum'] .lt-svg-wrap{filter:drop-shadow(0 10px 16px rgba(251,191,36,.26));}",
    ".lt[data-lt-region='androgen'] .lt-svg-wrap{filter:drop-shadow(0 10px 16px rgba(165,180,252,.3));}",
    ".lt[data-lt-region='amygdala'] .lt-svg-wrap{filter:drop-shadow(0 10px 16px rgba(248,113,113,.28));}",
    ".lt-pill{display:flex;align-items:center;gap:7px;min-height:48px;padding:7px 8px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(8,12,20,.78);color:#e2e8f0;text-align:left;cursor:pointer;transition:border-color .2s ease,transform .15s ease,background .2s ease;}",
    ".lt-pill:active{transform:scale(.98);}",
    ".lt-pill-stat{flex:0 0 auto;min-width:40px;font-size:13px;font-weight:900;font-variant-numeric:tabular-nums;color:var(--lt-c,#34d399);}",
    ".lt-pill-name{display:block;font-size:11px;font-weight:800;letter-spacing:-.01em;line-height:1.15;}",
    ".lt-pill-sub{display:block;margin-top:1px;font-size:8.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;}",
    ".lt-pill[data-lt-region='prefrontal']{--lt-c:#34d399;}",
    ".lt-pill[data-lt-region='striatum']{--lt-c:#fbbf24;}",
    ".lt-pill[data-lt-region='androgen']{--lt-c:#a5b4fc;}",
    ".lt-pill[data-lt-region='amygdala']{--lt-c:#f87171;}",
    ".lt-pill.is-on{border-color:var(--lt-c);background:rgba(255,255,255,.04);box-shadow:0 0 0 1px var(--lt-c),0 0 16px rgba(16,185,129,.22);}",
    ".lt-pill[data-lt-region='striatum'].is-on{background:rgba(251,191,36,.1);box-shadow:0 0 0 1px #fbbf24,0 0 16px rgba(251,191,36,.22);}",
    ".lt-pill[data-lt-region='androgen'].is-on{background:rgba(165,180,252,.1);box-shadow:0 0 0 1px #a5b4fc,0 0 16px rgba(165,180,252,.24);}",
    ".lt-pill[data-lt-region='amygdala'].is-on{background:rgba(248,113,113,.1);box-shadow:0 0 0 1px #f87171,0 0 16px rgba(248,113,113,.22);}",
    ".lt-pill[data-lt-region='prefrontal'].is-on{background:rgba(52,211,153,.1);}",
    ".lt-pill.is-on::after{content:'';width:6px;height:6px;margin-left:auto;border-radius:99px;background:var(--lt-c);box-shadow:0 0 8px var(--lt-c);flex:0 0 auto;}",
    ".lt-pill:focus-visible,.lt-scale button:focus-visible,.lt-env:focus-visible,.lt-log:focus-visible,.lt-panic-go:focus-visible,.lt-pulse-launch:focus-visible,.lt-close:focus-visible{outline:2px solid #f8fafc;outline-offset:2px;}",
    ".lt-tap{margin:8px 0 0;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;text-align:center;}",
    ".lt-drawer{margin-top:8px;border-radius:16px;background:#070b12;border:1px solid rgba(255,255,255,.06);padding:11px 11px 12px;}",
    ".lt-drawer[data-lt-region='prefrontal']{--lt-c:#34d399;}",
    ".lt-drawer[data-lt-region='striatum']{--lt-c:#fbbf24;}",
    ".lt-drawer[data-lt-region='androgen']{--lt-c:#a5b4fc;}",
    ".lt-drawer[data-lt-region='amygdala']{--lt-c:#f87171;}",
    ".lt-readout-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}",
    ".lt-readout-top h3{font-size:16px;line-height:1.15;margin:2px 0 0;}",
    ".lt-readout-stat{text-align:right;}",
    ".lt-readout-stat strong{display:block;font-size:20px;font-weight:900;letter-spacing:-.03em;color:var(--lt-c,#34d399);font-variant-numeric:tabular-nums;}",
    ".lt-readout-stat span{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;}",
    ".lt-copy{margin:8px 0;font-size:12.5px;line-height:1.45;color:#cbd5e1;}",
    ".lt-copy strong{color:#f8fafc;}",
    ".lt-fine{margin:0 0 8px;font-size:11px;line-height:1.4;color:#94a3b8;}",
    ".lt-meter{display:block;height:5px;border-radius:99px;background:#1e293b;overflow:hidden;margin:6px 0 8px;}",
    ".lt-meter i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--lt-c,#34d399),#f8fafc);transition:width .45s cubic-bezier(.2,.8,.2,1);}",
    ".lt-next{margin-top:4px;padding:8px 10px;border-radius:12px;background:rgba(52,211,153,.06);border:1px solid rgba(52,211,153,.22);}",
    ".lt-next strong{display:block;margin:2px 0 4px;font-size:18px;color:#6ee7b7;}",
    ".lt-next p:last-child{font-size:12px;line-height:1.4;color:#cbd5e1;}",
    ".lt-action{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);font-size:12px;font-weight:700;line-height:1.4;color:#e2e8f0;}",
    ".lt-pleasures,.lt-triggers{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;}",
    ".lt-pleasures li{display:grid;grid-template-columns:78px 1fr;gap:8px;align-items:start;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);}",
    ".lt-stage{display:inline-block;width:100%;font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 0;text-align:center;}",
    ".lt-pleasures li[data-stage='muted'] .lt-stage{color:#94a3b8;background:#172033;}",
    ".lt-pleasures li[data-stage='returning'] .lt-stage{color:#fbbf24;background:rgba(245,158,11,.14);}",
    ".lt-pleasures li[data-stage='online'] .lt-stage{color:#042016;background:#34d399;}",
    ".lt-pleasures b{font-size:12.5px;}",
    ".lt-pleasures p{font-size:11px;line-height:1.35;color:#94a3b8;}",
    ".lt-badge{display:inline-block;margin:8px 0 4px;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;}",
    ".lt-badge-open{color:#1e1b4b;background:#c7d2fe;}",
    ".lt-badge-mid{color:#fde68a;background:rgba(245,158,11,.16);}",
    ".lt-badge-calm{color:#6ee7b7;background:rgba(16,185,129,.12);}",
    ".lt-badge-wait{color:#94a3b8;background:#172033;}",
    ".lt-marker-row{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:700;}",
    ".lt-marker-row b{color:var(--lt-c,#a5b4fc);font-variant-numeric:tabular-nums;}",
    ".lt-triggers li{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 8px;padding:2px 0;}",
    ".lt-trigger-name{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#94a3b8;}",
    ".lt-triggers li b{font-size:12px;color:#fecaca;font-variant-numeric:tabular-nums;}",
    ".lt-triggers li .lt-meter{flex:1 0 100%;margin:2px 0 4px;}",
    ".lt-readout.is-in{animation:lt-in .32s cubic-bezier(.2,.8,.2,1);}",
    ".lt-strip{margin:0 0 12px;}",
    ".lt-strip-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}",
    ".lt-strip-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}",
    ".lt-metric{min-width:0;background:#0e131f;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:8px 8px 9px;}",
    ".lt-metric-label{font-size:8.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#94a3b8;line-height:1.25;min-height:2.5em;}",
    ".lt-metric-value{margin-top:4px;font-size:16px;font-weight:900;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;color:#f8fafc;}",
    ".lt-metric-sub{margin-top:4px;font-size:9px;font-weight:700;color:#64748b;font-variant-numeric:tabular-nums;line-height:1.3;}",
    ".lt-metric-velocity .lt-metric-value{color:#34d399;}",
    ".lt-metric-value.is-tick{animation:lt-flash .45s ease;}",
    ".lt-pulse-launch{width:100%;margin-top:8px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:11px 12px;border-radius:14px;border:1px solid rgba(16,185,129,.4);background:rgba(16,185,129,.08);color:#ecfdf5;cursor:pointer;text-align:left;}",
    ".lt-pulse-launch span{font-size:13px;font-weight:900;letter-spacing:.01em;}",
    ".lt-pulse-launch small{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6ee7b7;}",
    ".lt-pulse-launch:active{transform:scale(.99);}",
    ".lt-modal{position:fixed;inset:0;z-index:480;display:flex;align-items:flex-end;justify-content:center;padding:12px;background:rgba(4,6,12,.78);backdrop-filter:blur(8px);}",
    ".lt-sheet,.lt-inline .lt-sheet{width:min(440px,100%);max-height:min(92vh,760px);overflow:auto;background:#0c111c;border:1px solid rgba(16,185,129,.35);border-radius:22px 22px 16px 16px;padding:14px 14px calc(16px + env(safe-area-inset-bottom));box-shadow:0 24px 60px rgba(0,0,0,.5);}",
    ".lt-sheet.is-danger{border-color:rgba(239,68,68,.7);}",
    ".lt-sheet-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;}",
    ".lt-sheet h3{font-size:20px;line-height:1.15;margin:2px 0 0;}",
    ".lt-close{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#121826;color:#e2e8f0;font-size:14px;font-weight:800;cursor:pointer;}",
    ".lt-timer{display:flex;align-items:baseline;gap:8px;margin:10px 0 6px;}",
    ".lt-timer [data-lt-countdown]{font-size:28px;font-weight:900;letter-spacing:-.04em;color:#f8fafc;font-variant-numeric:tabular-nums;}",
    ".lt-timer [data-lt-countdown-label]{font-size:11px;font-weight:700;color:#94a3b8;}",
    ".lt-countdown-track{height:4px;border-radius:99px;background:#1e293b;overflow:hidden;margin-bottom:8px;}",
    ".lt-countdown-bar{display:block;height:100%;width:100%;transform-origin:left center;background:linear-gradient(90deg,#34d399,#fbbf24);animation:lt-deplete 10s linear forwards;}",
    ".lt-steps{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin-bottom:6px;}",
    ".lt-field{border:0;margin:0 0 10px;padding:0;}",
    ".lt-field legend{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;}",
    ".lt-caps{display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px;}",
    ".lt-scale{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;}",
    ".lt-scale button{min-height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#121826;color:#e2e8f0;font-size:16px;font-weight:900;cursor:pointer;}",
    ".lt-scale button[aria-pressed='true']{background:#34d399;border-color:#34d399;color:#042016;}",
    ".lt-envs{display:grid;grid-template-columns:1fr 1fr;gap:6px;}",
    ".lt-env{min-height:58px;padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#121826;color:#e2e8f0;text-align:left;cursor:pointer;}",
    ".lt-env b{display:block;font-size:12px;line-height:1.25;}",
    ".lt-env small{display:block;margin-top:3px;font-size:10px;color:#94a3b8;}",
    ".lt-env[data-lt-env='bed']{border-color:rgba(239,68,68,.45);}",
    ".lt-env.is-on{border-color:#34d399;background:rgba(16,185,129,.14);}",
    ".lt-env.is-on[data-lt-env='bed']{border-color:#ef4444;background:rgba(239,68,68,.16);color:#fff;}",
    ".lt-danger{margin:4px 0 10px;padding:10px;border-radius:14px;background:rgba(127,29,29,.35);border:1px solid rgba(239,68,68,.55);animation:lt-in .28s ease;}",
    ".lt-danger p{font-size:12.5px;line-height:1.4;color:#fecaca;margin-top:4px;}",
    ".lt-panic-go{width:100%;margin-top:8px;border:0;border-radius:12px;padding:13px 12px;cursor:pointer;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 8px 24px rgba(239,68,68,.35);}",
    ".lt-saved{margin:0 0 8px;font-size:12.5px;font-weight:700;color:#6ee7b7;}",
    ".lt-log{width:100%;border:0;border-radius:12px;padding:13px 12px;font-weight:900;letter-spacing:.03em;color:#042016;background:#34d399;cursor:pointer;}",
    ".lt-log:disabled{opacity:.4;cursor:not-allowed;background:#1f2937;color:#94a3b8;}",
    "@media (min-width:720px){.lt-modal{align-items:center;}}",
    "@media (max-width:440px){",
    ".lt-day{font-size:32px;}",
    ".lt-brain{padding:12px 10px;}",
    ".lt-svg-wrap{width:min(150px,52%);}",
    ".lt-pill{min-height:46px;padding:6px;gap:6px;}",
    ".lt-pill-name{font-size:10.5px;}",
    ".lt-pill-stat{min-width:36px;font-size:12px;}",
    ".lt-metric-value{font-size:14px;}",
    ".lt-metric{padding:7px 6px 8px;}",
    ".lt-sheet,.lt-inline .lt-sheet{padding:12px 12px calc(14px + env(safe-area-inset-bottom));}",
    ".lt-readout-stat strong{font-size:18px;}",
    "}",
    "@media (max-width:360px){",
    ".lt-strip-grid{grid-template-columns:1fr;}",
    ".lt-metric-label{min-height:0;}",
    ".lt-pleasures li{grid-template-columns:68px 1fr;}",
    "}",
    "@media (prefers-reduced-motion:reduce){",
    ".lt-readout.is-in,.lt-danger,.lt-live i,.lt-countdown-bar,.lt-metric-value.is-tick{animation:none;}",
    ".lt-meter i{transition:none;}",
    "}",
    "@keyframes lt-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}",
    "@keyframes lt-blink{0%,100%{opacity:1;}50%{opacity:.35;}}",
    "@keyframes lt-flash{0%{color:#6ee7b7;}100%{color:#f8fafc;}}",
    "@keyframes lt-deplete{to{transform:scaleX(0);}}"
  ].join("");

  var api = {
    version: "2.0.0",
    __built: true,
    renderInteractiveBrainWidget: renderInteractiveBrainWidget,
    renderBioMetricsStrip: renderBioMetricsStrip,
    renderPulseCheckModal: renderPulseCheckModal,
    openPulseCheck: openPulseCheck,
    closePulseCheck: closePulseCheck,
    launchPanic: launchPanic,
    noteOffset: noteOffset,
    hydrate: hydrate,
    metrics: function (state) { return snapshot(state); },
    selfCheck: selfCheck
  };

  root.LiveTelemetry = api;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
