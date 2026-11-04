/**
 * IRON ARC — iPhone Lock Screen Stoic Quote Box.
 * Self-contained. CSS is injected once. Audio goes through DopamineFX.
 *
 *   LockScreenWidget.mount("#slot", { streakDay: 14, blockedToday: 3 });
 *   LockScreenWidget.renderHTML(state);
 *   LockScreenWidget.openFullLockScreen({ streakDay: 14 });
 *   LockScreenWidget.nextQuote();
 *   LockScreenWidget.getState();
 *
 * Styles: obsidian (Obsidian) | gold (Spartan) | ice (Glacier) | blood (Crimson)
 * Vibes:  urges | marcus | gym | stoic
 * Rotate: 1h | 3h | night (23:00 danger hour)
 */
(function (root) {
  "use strict";

  if (root.LockScreenWidget && root.LockScreenWidget.__built) return;

  var STORAGE_KEY = "ironarc.lockscreen.v1";
  var RING_C = 251.33;
  var HOUR = 3600000;

  var THEMES = {
    obsidian: { id: "obsidian", name: "Obsidian", emoji: "🌑", accent: "#34d399" },
    gold: { id: "gold", name: "Spartan", emoji: "👑", accent: "#f6c453" },
    ice: { id: "ice", name: "Glacier", emoji: "🧊", accent: "#bae6fd" },
    blood: { id: "blood", name: "Crimson", emoji: "🩸", accent: "#fb7185" }
  };

  var VIBES = [
    { id: "urges", label: "⚔️ Kill The Urge" },
    { id: "marcus", label: "🏛️ Marcus Aurelius" },
    { id: "gym", label: "🏋️‍♂️ Iron Discipline" },
    { id: "stoic", label: "🗿 Pure Stoic" }
  ];

  var ROTATIONS = [
    { id: "1h", label: "Every 1H" },
    { id: "3h", label: "Every 3H" },
    { id: "night", label: "11 PM Danger Hour" }
  ];

  var QUOTES = {
    stoic: [
      { text: "Rule your mind or it will rule you.", author: "Horace" },
      { text: "No man is free who is not master of himself.", author: "Epictetus" },
      { text: "Conquer yourself, not the world.", author: "Marcus Aurelius" },
      { text: "We suffer more in imagination than in reality.", author: "Seneca" },
      { text: "What stands in the way becomes the way.", author: "Marcus Aurelius" },
      { text: "Make the best use of what is in your power.", author: "Epictetus" },
      { text: "Difficulties strengthen the mind.", author: "Seneca" },
      { text: "Luck is preparation meeting opportunity.", author: "Seneca" }
    ],
    marcus: [
      { text: "You have power over your mind, not events.", author: "Marcus Aurelius" },
      { text: "The impediment to action advances action.", author: "Marcus Aurelius" },
      { text: "Waste no more time arguing. Be one.", author: "Marcus Aurelius" },
      { text: "The soul is dyed by its thoughts.", author: "Marcus Aurelius" },
      { text: "Do each act as if it were your last.", author: "Marcus Aurelius" },
      { text: "Look within. The source is there.", author: "Marcus Aurelius" },
      { text: "Be strict with yourself.", author: "Marcus Aurelius" },
      { text: "Accept the thing. Do the work.", author: "Marcus Aurelius" }
    ],
    urges: [
      { text: "The urge peaks. You do not.", author: "IRON ARC" },
      { text: "Starve the tab. Feed the man.", author: "IRON ARC" },
      { text: "Ninety seconds. Then it drops.", author: "IRON ARC" },
      { text: "Do not negotiate with a screen.", author: "IRON ARC" },
      { text: "One look costs the whole night.", author: "IRON ARC" },
      { text: "You already decided. Stay decided.", author: "IRON ARC" },
      { text: "Feet on the floor. Phone down.", author: "IRON ARC" },
      { text: "Close it. Become the man.", author: "IRON ARC" }
    ],
    gym: [
      { text: "Conquer the bar before the urge.", author: "IRON ARC" },
      { text: "Heavy reps. Quiet mind.", author: "IRON ARC" },
      { text: "One more set. Not one more tab.", author: "IRON ARC" },
      { text: "Sweat is a cleaner thought.", author: "IRON ARC" },
      { text: "The body keeps the vow.", author: "IRON ARC" },
      { text: "Train the animal. Lead the man.", author: "IRON ARC" },
      { text: "Earn the mirror.", author: "IRON ARC" },
      { text: "Pain in the muscle. Not the morning.", author: "IRON ARC" }
    ]
  };

  var FLASH_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 2h6l-.8 3.2A1.6 1.6 0 0 1 12.7 6.6H11.3A1.6 1.6 0 0 1 9.8 5.2L9 2z"/><path fill="currentColor" d="M8 7.2h8a1.4 1.4 0 0 1 1.4 1.4v9.2A2.2 2.2 0 0 1 15.2 20H8.8A2.2 2.2 0 0 1 6.6 17.8V8.6A1.4 1.4 0 0 1 8 7.2z"/><path fill="rgba(0,0,0,.45)" d="M11 10.2h2v5.2h-2z"/></svg>';
  var CAM_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 6.2 10.2 4.4h3.6L15 6.2h3.1A1.9 1.9 0 0 1 20 8.1v8.2a1.9 1.9 0 0 1-1.9 1.9H5.9A1.9 1.9 0 0 1 4 16.3V8.1a1.9 1.9 0 0 1 1.9-1.9H9z"/><circle cx="12" cy="12.2" r="3.15" fill="rgba(0,0,0,.55)"/><circle cx="12" cy="12.2" r="1.35" fill="rgba(255,255,255,.35)"/></svg>';
  var LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7.6a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  var state = {
    theme: "obsidian",
    vibe: "stoic",
    rotation: "1h",
    quoteIndex: 0,
    streakDay: 14,
    shieldOn: true,
    blockedToday: 3,
    lastRotatedAt: Date.now(),
    nightKey: ""
  };

  var host = null;
  var fullEl = null;
  var ticker = 0;
  var listener = null;
  var onUnlock = null;
  var scrollLock = "";
  var closing = false;
  var lastPopKey = null;
  var lastTheme = null;
  var lastClock = "";
  var swallowClick = false;
  var escapeBound = false;

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

  function clamp(n, a, b) {
    var x = Number(n);
    if (!isFinite(x)) return a;
    return Math.max(a, Math.min(b, x));
  }

  function mod(n, m) {
    if (!m) return 0;
    return ((n % m) + m) % m;
  }

  function quoteKeyOf(vibe, index) {
    return vibe + "|" + index;
  }

  function listFor(vibe) {
    return QUOTES[vibe] || QUOTES.stoic;
  }

  function formatDate(d) {
    return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate();
  }

  function formatClock(d) {
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function remain(ms) {
    var min = Math.max(0, Math.ceil(ms / 60000));
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (h <= 0) return m + "m";
    if (!m) return h + "h";
    return h + "h " + m + "m";
  }

  function etaFor(rotation, lastRotatedAt, now) {
    var d = now || new Date();
    if (rotation === "night") {
      var target = new Date(d.getTime());
      target.setHours(23, 0, 0, 0);
      if (d.getHours() === 23) return "11 PM";
      if (d.getTime() > target.getTime()) target.setDate(target.getDate() + 1);
      return remain(target.getTime() - d.getTime());
    }
    var wait = rotation === "3h" ? 3 * HOUR : HOUR;
    var left = wait - (d.getTime() - lastRotatedAt);
    if (left < 0) left = 0;
    return remain(left);
  }

  function blockedLine(n) {
    var c = Math.max(0, n | 0);
    return c + " urge" + (c === 1 ? "" : "s") + " intercepted today";
  }

  function islandCopy(on) {
    return on ? "Shield Armed" : "Disarmed";
  }

  function ringOffset(day) {
    var cap = day <= 30 ? 30 : 90;
    var p = clamp(day, 0, cap) / cap;
    return (RING_C * (1 - p)).toFixed(2);
  }

  function compose(override) {
    var theme = state.theme;
    var vibe = state.vibe;
    var rotation = state.rotation;
    var quoteIndex = state.quoteIndex;
    var streakDay = state.streakDay;
    var shieldOn = state.shieldOn;
    var blockedToday = state.blockedToday;
    var now = new Date();
    if (override) {
      if (override.theme && THEMES[override.theme]) theme = override.theme;
      if (override.vibe && QUOTES[override.vibe]) vibe = override.vibe;
      if (override.rotation === "1h" || override.rotation === "3h" || override.rotation === "night") rotation = override.rotation;
      if (override.quoteIndex != null && isFinite(Number(override.quoteIndex))) quoteIndex = Number(override.quoteIndex);
      if (override.streakDay != null && isFinite(Number(override.streakDay))) streakDay = Number(override.streakDay);
      if (override.shieldOn != null) shieldOn = !!override.shieldOn;
      if (override.blockedToday != null && isFinite(Number(override.blockedToday))) blockedToday = Number(override.blockedToday);
      if (override.now instanceof Date) now = override.now;
    }
    var list = listFor(vibe);
    var i = mod(quoteIndex, list.length);
    var quote = list[i];
    streakDay = Math.round(clamp(streakDay, 0, 999));
    blockedToday = Math.round(Math.max(0, blockedToday));
    return {
      theme: theme,
      vibe: vibe,
      rotation: rotation,
      quoteIndex: i,
      quote: { text: quote.text, author: quote.author, vibe: vibe },
      streakDay: streakDay,
      shieldOn: !!shieldOn,
      blockedToday: blockedToday,
      dateLabel: formatDate(now),
      clockLabel: formatClock(now),
      etaLabel: etaFor(rotation, state.lastRotatedAt, now),
      accent: THEMES[theme] ? THEMES[theme].accent : THEMES.obsidian.accent
    };
  }

  function getState() {
    return compose();
  }

  function applyOpts(opts) {
    if (!opts) return;
    if (opts.theme && THEMES[opts.theme]) state.theme = opts.theme;
    if (opts.vibe && QUOTES[opts.vibe]) state.vibe = opts.vibe;
    if (opts.rotation === "1h" || opts.rotation === "3h" || opts.rotation === "night") state.rotation = opts.rotation;
    if (opts.quoteIndex != null && isFinite(Number(opts.quoteIndex))) state.quoteIndex = Math.round(Number(opts.quoteIndex));
    if (opts.streakDay != null && isFinite(Number(opts.streakDay))) state.streakDay = Math.round(clamp(opts.streakDay, 0, 999));
    if (opts.shieldOn != null) state.shieldOn = !!opts.shieldOn;
    if (opts.blockedToday != null && isFinite(Number(opts.blockedToday))) state.blockedToday = Math.round(Math.max(0, Number(opts.blockedToday)));
    if (typeof opts.onChange === "function") listener = opts.onChange;
    if (typeof opts.onUnlock === "function") onUnlock = opts.onUnlock;
  }

  function load() {
    try {
      if (typeof localStorage === "undefined") return;
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      if (data.theme && THEMES[data.theme]) state.theme = data.theme;
      if (data.vibe && QUOTES[data.vibe]) state.vibe = data.vibe;
      if (data.rotation === "1h" || data.rotation === "3h" || data.rotation === "night") state.rotation = data.rotation;
      if (isFinite(Number(data.quoteIndex))) state.quoteIndex = Math.round(Number(data.quoteIndex));
      if (isFinite(Number(data.lastRotatedAt))) state.lastRotatedAt = Number(data.lastRotatedAt);
      if (typeof data.nightKey === "string") state.nightKey = data.nightKey;
    } catch (err) { /* private mode */ }
  }

  function persist() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        theme: state.theme,
        vibe: state.vibe,
        rotation: state.rotation,
        quoteIndex: state.quoteIndex,
        lastRotatedAt: state.lastRotatedAt,
        nightKey: state.nightKey
      }));
    } catch (err) { /* private mode */ }
  }

  function emit() {
    if (typeof listener !== "function") return;
    try { listener(getState()); } catch (err) { /* host callback */ }
  }

  function fxTick(freq, dur) {
    var fx = root.DopamineFX;
    if (fx && typeof fx.playTick === "function") {
      try { fx.playTick(freq || 680, dur || 0.035); return; } catch (err) { /* audio optional */ }
    }
    try {
      if (root.navigator && typeof root.navigator.vibrate === "function") root.navigator.vibrate(12);
    } catch (err) { /* no haptics */ }
  }

  function armAudio() {
    var fx = root.DopamineFX;
    if (fx && typeof fx.unlock === "function") {
      try { fx.unlock(); } catch (err) { /* ignore */ }
    }
  }

  function speakQuote() {
    var q = getState().quote;
    var line = q.text + " " + q.author;
    armAudio();
    var fx = root.DopamineFX;
    if (fx && typeof fx.speakCoach === "function") {
      try { fx.speakCoach(line); } catch (err) { /* speech optional */ }
    } else {
      fallbackSpeak(line);
    }
    fxTick(520, 0.04);
    markSpeaking();
  }

  function fallbackSpeak(line) {
    try {
      var synth = root.speechSynthesis;
      var Utter = root.SpeechSynthesisUtterance;
      if (!synth || !Utter) return;
      var utter = new Utter(line);
      utter.rate = 0.92;
      utter.pitch = 0.7;
      synth.cancel();
      synth.speak(utter);
    } catch (err) { /* speech optional */ }
  }

  function markSpeaking() {
    var nodes = queryAll("[data-lsw-speak]");
    var i;
    for (i = 0; i < nodes.length; i++) {
      nodes[i].classList.add("is-hot");
    }
    root.setTimeout(function () {
      var again = queryAll("[data-lsw-speak]");
      var n;
      for (n = 0; n < again.length; n++) again[n].classList.remove("is-hot");
    }, 1600);
  }

  function advance(manual) {
    var list = listFor(state.vibe);
    state.quoteIndex = mod(state.quoteIndex + 1, list.length);
    if (manual) state.lastRotatedAt = Date.now();
  }

  function maybeRotate() {
    var now = new Date();
    if (state.rotation === "night") {
      if (now.getHours() !== 23) return false;
      var key = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
      if (state.nightKey === key) return false;
      state.nightKey = key;
      advance(false);
      return true;
    }
    var wait = state.rotation === "3h" ? 3 * HOUR : HOUR;
    if (Date.now() - state.lastRotatedAt < wait) return false;
    state.lastRotatedAt = Date.now();
    advance(false);
    return true;
  }

  function nextQuote() {
    advance(true);
    fxTick(680, 0.035);
    commit(true);
    return getState();
  }

  function commit(soundless) {
    persist();
    paint();
    emit();
    if (soundless) { /* caller already ticked */ }
  }

  function screenMarkup(s, mode) {
    var body = s.shieldOn ? blockedLine(s.blockedToday) : "Shield off. URLs exposed";
    var island = islandCopy(s.shieldOn);
    var islandEmo = s.shieldOn ? "🛡️" : "⚠️";
    var bannerLabel = "🛡️ IRON ARC • " + body;
    var home = mode === "full"
      ? '<button type="button" class="lsw-home" data-lsw-unlock data-lsw-hold aria-label="Swipe up or tap to unlock"><span class="lsw-chev"></span><span class="lsw-bar"></span></button>'
      : '<div class="lsw-home" aria-hidden="true"><span class="lsw-bar"></span></div>';
    return '' +
      '<div class="lsw-screen" data-lsw-screen data-theme="' + s.theme + '" data-shield="' + (s.shieldOn ? "on" : "off") + '">' +
        '<div class="lsw-wall lsw-skin-' + s.theme + '" data-lsw-wall><span class="lsw-grain"></span><span class="lsw-vignette"></span></div>' +
        '<div class="lsw-cluster">' +
          '<div class="lsw-island" aria-label="' + esc(islandEmo + " " + island) + '">' +
            '<span class="lsw-dot"></span>' +
            '<span class="lsw-island-emo" data-lsw-island-emo aria-hidden="true">' + islandEmo + '</span>' +
            '<span class="lsw-island-txt" data-lsw-island>' + esc(island) + '</span>' +
            '<span class="lsw-island-cam" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="lsw-lock" aria-hidden="true">' + LOCK_SVG + '</div>' +
          '<div class="lsw-date" data-lsw-date>' + esc(s.dateLabel) + '</div>' +
          '<div class="lsw-clock" data-lsw-clock>' + esc(s.clockLabel) + '</div>' +
          '<div class="lsw-widgets">' +
            '<button type="button" class="lsw-quote" data-lsw-quote data-lsw-hold aria-label="Stoic quote. ' + esc(s.quote.text) + ' ' + esc(s.quote.author) + '">' +
              '<span class="lsw-kicker">DAILY STOIC</span>' +
              '<span class="lsw-q" data-lsw-q>\u201C' + esc(s.quote.text) + '\u201D</span>' +
              '<span class="lsw-by" data-lsw-by>\u2014 ' + esc(s.quote.author) + '</span>' +
            '</button>' +
            '<div class="lsw-streak" data-lsw-streak role="img" aria-label="DAY ' + s.streakDay + ' \u2022 ' + (s.shieldOn ? "🛡️ ON" : "🛡️ OFF") + '">' +
              '<svg class="lsw-ring" viewBox="0 0 100 100" aria-hidden="true">' +
                '<circle cx="50" cy="50" r="40" class="lsw-ring-track"></circle>' +
                '<circle cx="50" cy="50" r="40" class="lsw-ring-val" data-lsw-ring stroke-dasharray="' + RING_C + '" stroke-dashoffset="' + ringOffset(s.streakDay) + '" transform="rotate(-90 50 50)"></circle>' +
              '</svg>' +
              '<span class="lsw-streak-stack">' +
                '<span class="lsw-streak-num" data-lsw-day>' + s.streakDay + '</span>' +
                '<span class="lsw-streak-day">DAY</span>' +
                '<span class="lsw-streak-sh"><span aria-hidden="true">🛡️</span> <b class="lsw-shield-val" data-lsw-shield>' + (s.shieldOn ? "ON" : "OFF") + '</b></span>' +
              '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lsw-spacer"></div>' +
        '<div class="lsw-banner" data-lsw-banner aria-label="' + esc(bannerLabel) + '">' +
          '<span class="lsw-appico" data-lsw-appico aria-hidden="true">' + islandEmo + '</span>' +
          '<span class="lsw-banner-copy">' +
            '<span class="lsw-banner-top"><b>IRON ARC</b><i>now</i></span>' +
            '<span class="lsw-banner-body" data-lsw-blocked>' + esc(body) + '</span>' +
          '</span>' +
        '</div>' +
        '<div class="lsw-dock">' +
          '<button type="button" class="lsw-round" data-lsw-flash data-lsw-hold aria-pressed="false" aria-label="Flashlight">' + FLASH_SVG + '</button>' +
          '<button type="button" class="lsw-round" data-lsw-cam data-lsw-hold aria-label="Camera">' + CAM_SVG + '</button>' +
        '</div>' +
        home +
        '<div class="lsw-torch" aria-hidden="true"></div>' +
        '<div class="lsw-glass" aria-hidden="true"></div>' +
        '<div class="lsw-lens" data-lsw-hold>' +
          '<video playsinline muted autoplay></video>' +
          '<div class="lsw-aperture" aria-hidden="true"><span class="lsw-finder"></span><span class="lsw-iris"></span></div>' +
          '<div class="lsw-snap" data-lsw-snap></div>' +
          '<button type="button" class="lsw-cam-close" data-lsw-cam-close aria-label="Close camera">⌄</button>' +
          '<button type="button" class="lsw-shutter" data-lsw-shutter aria-label="Shutter"><i></i></button>' +
        '</div>' +
      '</div>';
  }

  function deviceMarkup(s) {
    return '' +
      '<div class="lsw-device" aria-hidden="false">' +
        '<span class="lsw-hw lsw-hw-action" aria-hidden="true"></span>' +
        '<span class="lsw-hw lsw-hw-vol" aria-hidden="true"></span>' +
        '<span class="lsw-hw lsw-hw-vol2" aria-hidden="true"></span>' +
        '<span class="lsw-hw lsw-hw-power" aria-hidden="true"></span>' +
        screenMarkup(s, "preview") +
      '</div>';
  }

  function pills(items, attr, current) {
    var html = "";
    var i;
    for (i = 0; i < items.length; i++) {
      var on = items[i].id === current;
      html += '<button type="button" class="lsw-pill' + (on ? " is-on" : "") + '" data-lsw-' + attr + '="' + items[i].id + '" aria-pressed="' + (on ? "true" : "false") + '">' + items[i].label + '</button>';
    }
    return html;
  }

  function swatchMarkup(s) {
    var ids = ["obsidian", "gold", "ice", "blood"];
    var html = '<div class="lsw-swatches" role="listbox" aria-label="Style">';
    var i;
    for (i = 0; i < ids.length; i++) {
      var t = THEMES[ids[i]];
      var on = s.theme === t.id;
      html += '<button type="button" class="lsw-swatch' + (on ? " is-on" : "") + '" data-lsw-theme="' + t.id + '" role="option" aria-selected="' + (on ? "true" : "false") + '" aria-label="' + esc(t.name) + '">' +
        '<span class="lsw-swatch-dot" aria-hidden="true"></span>' +
        '<span class="lsw-swatch-name">' + esc(t.name) + '</span>' +
      '</button>';
    }
    return html + '</div>';
  }

  function renderHTML(override) {
    ensureCSS();
    var s = compose(override);
    return '' +
      '<section class="lsw-panel" data-lsw-panel>' +
        '<div class="lsw-stage lsw-preview-wrap">' + deviceMarkup(s) + '</div>' +
        '<div class="lsw-controls">' +
          swatchMarkup(s) +
          '<div class="lsw-pills lsw-vibes" role="group" aria-label="Quote vibe">' + pills(VIBES, "vibe", s.vibe) + '</div>' +
          '<div class="lsw-actions">' +
            '<button type="button" class="lsw-act" data-lsw-shuffle>↻ Next Stoic Quote</button>' +
            '<button type="button" class="lsw-act lsw-act-speak" data-lsw-speak>🔊 Voice Readout</button>' +
          '</div>' +
          '<div class="lsw-pills lsw-rots" role="group" aria-label="Auto rotation">' + pills(ROTATIONS, "rot", s.rotation) + '</div>' +
          '<div class="lsw-eta" data-lsw-eta>↻ ' + esc(s.etaLabel) + '</div>' +
          '<button type="button" class="lsw-go" data-lsw-full><span>📱 Preview Full Lock Screen</span></button>' +
        '</div>' +
      '</section>';
  }

  var CSS = [
    ".lsw-root,.lsw-panel,.lsw-full{color:#f8fafc;color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;user-select:none}",
    ".lsw-panel{width:100%;max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:14px;padding:4px 0 18px}",
    ".lsw-panel *,.lsw-full *{box-sizing:border-box}",
    ".lsw-panel button,.lsw-full button{font-family:inherit;cursor:pointer;-webkit-appearance:none;appearance:none}",
    ".lsw-panel button:focus-visible,.lsw-full button:focus-visible{outline:2px solid #fff;outline-offset:2px}",
    ".lsw-stage{display:flex;flex-direction:column;align-items:center;padding:2px 8px 0}",
    ".lsw-stage::after{content:'';width:58%;height:16px;margin-top:-4px;background:radial-gradient(ellipse,rgba(0,0,0,.55),transparent 70%);filter:blur(1px)}",
    ".lsw-preview-wrap{width:100%;align-items:stretch;padding:0}",
    ".lsw-preview-wrap::after{display:none}",
    ".lsw-device{position:relative;width:min(340px,96vw);aspect-ratio:402/874;border-radius:46px;background:linear-gradient(145deg,rgba(255,255,255,.7),rgba(255,255,255,0) 22%),linear-gradient(180deg,#a1a1aa 0%,#3f3f46 10%,#18181b 28%,#09090b 52%,#52525b 78%,#18181b 100%);box-shadow:0 28px 70px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.38),inset 0 0 0 2px rgba(0,0,0,.55);flex:none}",
    ".lsw-preview-wrap .lsw-device{width:100%;max-width:100%;aspect-ratio:auto;height:auto;min-height:310px;padding:0;border-radius:24px;background:none;box-shadow:0 16px 40px rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.12);overflow:hidden}",
    ".lsw-preview-wrap .lsw-hw,.lsw-preview-wrap .lsw-dock,.lsw-preview-wrap .lsw-home{display:none}",
    ".lsw-overlay .lsw-device{width:min(440px,100%);height:100%;max-width:100%;aspect-ratio:auto;border-radius:0;background:none;box-shadow:none;flex:0 0 auto;overflow:visible}",
    ".lsw-hw{position:absolute;width:3px;border-radius:2px;background:linear-gradient(#71717a,#18181b);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);z-index:2}",
    ".lsw-hw-action{left:-3px;top:15%;height:22px}",
    ".lsw-hw-vol{left:-3px;top:21%;height:46px}",
    ".lsw-hw-vol2{left:-3px;top:29%;height:46px}",
    ".lsw-hw-power{right:-3px;left:auto;top:24%;height:74px}",
    ".lsw-screen{position:absolute;inset:8px;border-radius:38px;overflow:hidden;background:#000;display:flex;flex-direction:column;padding:10px 12px 8px;container-type:inline-size;color:#fff;--lsw-accent:#34d399}",
    ".lsw-preview-wrap .lsw-screen{position:relative;inset:auto;width:100%;height:auto;min-height:310px;border-radius:23px;padding:20px 16px 16px}",
    ".lsw-preview-wrap .lsw-clock{font-size:clamp(84px,28cqw,112px)}",
    ".lsw-preview-wrap .lsw-date{font-size:clamp(16px,4.6cqw,20px)}",
    ".lsw-preview-wrap .lsw-widgets{margin-top:14px;gap:10px}",
    ".lsw-preview-wrap .lsw-quote{height:clamp(128px,36cqw,148px);min-height:128px;padding:14px 14px 14px 16px}",
    ".lsw-preview-wrap .lsw-q{font-size:clamp(16px,4.6cqw,19px);-webkit-line-clamp:4}",
    ".lsw-preview-wrap .lsw-kicker{letter-spacing:.14em}",
    ".lsw-preview-wrap .lsw-streak{width:clamp(128px,36cqw,148px);height:clamp(128px,36cqw,148px)}",
    ".lsw-preview-wrap .lsw-banner{margin-bottom:0}",
    ".lsw-preview-wrap .lsw-spacer{min-height:18px}",
    ".lsw-screen[data-theme='gold']{--lsw-accent:#f6c453}",
    ".lsw-screen[data-theme='ice']{--lsw-accent:#bae6fd}",
    ".lsw-screen[data-theme='blood']{--lsw-accent:#fb7185}",
    ".lsw-wall{position:absolute;inset:-2%;z-index:0;transform:scale(1.08);animation:lsw-drift 18s ease-in-out infinite}",
    ".lsw-grain,.lsw-vignette{position:absolute;inset:0;pointer-events:none}",
    ".lsw-grain{opacity:.18;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\");background-size:140px 140px}",
    ".lsw-vignette{background:radial-gradient(ellipse at 50% 36%,transparent 42%,rgba(0,0,0,.5) 100%)}",
    ".lsw-skin-obsidian{background:radial-gradient(1.4px 1.4px at 18% 16%,rgba(255,255,255,.9) 50%,transparent 52%),radial-gradient(1.2px 1.2px at 72% 12%,rgba(255,255,255,.75) 50%,transparent 52%),radial-gradient(1px 1px at 40% 22%,rgba(255,255,255,.65) 50%,transparent 52%),radial-gradient(1.6px 1.6px at 84% 28%,rgba(255,255,255,.55) 50%,transparent 52%),radial-gradient(ellipse 90% 42% at 50% 112%,rgba(16,185,129,.5),transparent 58%),radial-gradient(ellipse 40% 24% at 50% 0%,rgba(148,163,184,.16),transparent 70%),linear-gradient(180deg,#12182a 0%,#07080d 48%,#040605 100%)}",
    ".lsw-skin-obsidian::after{content:'';position:absolute;left:-4%;right:-4%;bottom:0;height:52%;pointer-events:none;background:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 220' preserveAspectRatio='none'><polygon fill='%230b1612' points='0,220 0,120 52,78 110,150 168,52 214,132 258,40 318,128 362,74 400,140 400,220'/><polygon fill='%23050c09' points='0,220 0,160 86,112 156,176 230,108 320,172 400,120 400,220'/></svg>\") center bottom/100% 100% no-repeat}",
    ".lsw-skin-gold{background:radial-gradient(circle at 50% 0%,rgba(246,196,83,.62),transparent 32%),radial-gradient(circle at 50% 86%,rgba(120,72,16,.45),transparent 34%),linear-gradient(180deg,#2a1c0c 0%,#120e09 46%,#070504 100%)}",
    ".lsw-skin-gold::after{content:'';position:absolute;left:50%;top:18%;width:54%;aspect-ratio:1;transform:translate(-50%,-20%);border-radius:50%;pointer-events:none;background:repeating-conic-gradient(from 0deg,rgba(246,196,83,0) 0 10deg,rgba(246,196,83,.45) 10deg 12deg),radial-gradient(circle,rgba(255,236,179,.85) 0 16%,transparent 18%);opacity:.8}",
    ".lsw-skin-ice{background:radial-gradient(circle at 78% 64%,rgba(224,242,254,.7),transparent 24%),radial-gradient(circle at 20% 72%,rgba(255,255,255,.42),transparent 20%),radial-gradient(circle at 48% 48%,rgba(125,211,252,.28),transparent 26%),linear-gradient(180deg,#071422 0%,#0e4c7a 52%,#061018 100%)}",
    ".lsw-skin-ice::after{content:'';position:absolute;inset:-10%;pointer-events:none;background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.2) 42%,transparent 50%,transparent 62%,rgba(186,230,253,.18) 74%,transparent 82%)}",
    ".lsw-skin-blood{background:repeating-linear-gradient(118deg,rgba(255,255,255,.04) 0 1px,transparent 1px 4px),radial-gradient(circle at 76% 18%,rgba(239,68,68,.55),transparent 26%),radial-gradient(circle at 18% 84%,rgba(127,29,29,.62),transparent 34%),linear-gradient(180deg,#2a0a10 0%,#140206 50%,#070203 100%)}",
    ".lsw-skin-blood::after{content:'';position:absolute;left:8%;right:8%;bottom:10%;height:22%;pointer-events:none;background:radial-gradient(ellipse,rgba(251,113,133,.45),transparent 70%);filter:blur(6px)}",
    ".lsw-cluster{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%}",
    ".lsw-island{display:flex;align-items:center;gap:6px;height:34px;padding:0 8px 0 10px;border-radius:20px;background:#000;color:#fff;box-shadow:0 8px 18px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.06);margin-bottom:clamp(14px,4.5cqw,26px)}",
    ".lsw-dot{width:7px;height:7px;border-radius:50%;background:var(--lsw-accent);box-shadow:0 0 8px var(--lsw-accent);flex:none;animation:lsw-pulse 1.8s ease-in-out infinite}",
    ".lsw-screen[data-shield='off'] .lsw-dot{background:#fb7185;box-shadow:0 0 8px #fb7185}",
    ".lsw-island-emo{font-size:14px;line-height:1}",
    ".lsw-island-txt{font-size:12px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}",
    ".lsw-island-cam{width:12px;height:12px;margin-left:4px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 35%,#6ea8ff,#0b1b3a 46%,#000 72%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}",
    ".lsw-lock{color:rgba(255,255,255,.92);width:14px;height:14px;margin-bottom:3px}",
    ".lsw-lock svg{width:14px;height:14px;display:block}",
    ".lsw-date{font-size:clamp(16px,5cqw,22px);font-weight:600;letter-spacing:.01em;text-shadow:0 2px 14px rgba(0,0,0,.45)}",
    ".lsw-clock{font-family:ui-rounded,'SF Pro Rounded','Avenir Next','Segoe UI',sans-serif;font-weight:800;font-size:clamp(68px,26cqw,98px);letter-spacing:-.045em;line-height:.84;font-variant-numeric:tabular-nums;text-shadow:0 2px 18px rgba(0,0,0,.4);margin:1px 0 2px}",
    ".lsw-widgets{align-self:stretch;display:flex;gap:8px;width:100%;margin-top:clamp(8px,2.4cqw,14px)}",
    ".lsw-quote{flex:1;min-width:0;height:clamp(88px,32cqw,118px);border:0;border-radius:22px;padding:8px 10px 8px 12px;text-align:left;color:#fff;background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,.12));border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 10px 24px rgba(0,0,0,.2);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);display:flex;flex-direction:column;justify-content:center;gap:2px}",
    ".lsw-quote:active{transform:scale(.985)}",
    ".lsw-kicker{font-size:clamp(10px,3.1cqw,12px);font-weight:800;letter-spacing:.08em;color:var(--lsw-accent);line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".lsw-q{font-size:clamp(14px,4.5cqw,17px);font-weight:700;line-height:1.16;letter-spacing:-.02em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}",
    ".lsw-by{font-size:clamp(10px,2.8cqw,13px);font-weight:600;color:rgba(255,255,255,.78)}",
    ".lsw-quote.is-pop{animation:lsw-pop .38s cubic-bezier(.2,.8,.2,1)}",
    ".lsw-streak{position:relative;width:clamp(88px,32cqw,118px);height:clamp(88px,32cqw,118px);flex:none;border-radius:50%;color:var(--lsw-accent);background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,.12));border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 10px 24px rgba(0,0,0,.2);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);container-type:inline-size}",
    ".lsw-ring{position:absolute;inset:5px;width:calc(100% - 10px);height:calc(100% - 10px)}",
    ".lsw-ring-track{fill:none;stroke:rgba(255,255,255,.28);stroke-width:5}",
    ".lsw-ring-val{fill:none;stroke:currentColor;stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 3px var(--lsw-accent))}",
    ".lsw-streak-stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}",
    ".lsw-streak-num{font-weight:800;font-size:34cqi;letter-spacing:-.04em;color:#fff}",
    ".lsw-streak-day{margin-top:1px;font-size:11cqi;font-weight:800;letter-spacing:.16em;color:rgba(255,255,255,.78)}",
    ".lsw-streak-sh{margin-top:3px;font-size:12cqi;font-weight:800;color:#fff;display:flex;align-items:center;gap:2px}",
    ".lsw-shield-val{color:var(--lsw-accent);font-style:normal}",
    ".lsw-screen[data-shield='off'] .lsw-shield-val{color:#fb7185}",
    ".lsw-spacer{flex:1 1 auto;min-height:8px;position:relative;z-index:2}",
    ".lsw-banner{position:relative;z-index:2;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:22px;background:rgba(255,255,255,.78);color:#1c1c1e;backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);box-shadow:0 12px 28px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.65);margin-bottom:10px}",
    ".lsw-appico{width:38px;height:38px;border-radius:10px;background:linear-gradient(180deg,#222,#050505);display:grid;place-items:center;font-size:20px;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}",
    ".lsw-banner-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:1px}",
    ".lsw-banner-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}",
    ".lsw-banner-top b{font-size:13px;font-weight:800;letter-spacing:.01em}",
    ".lsw-banner-top i{font-style:normal;font-size:12px;font-weight:600;color:#8e8e93}",
    ".lsw-banner-body{font-size:13px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".lsw-dock{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:0 6px}",
    ".lsw-round{width:clamp(46px,14cqw,58px);height:clamp(46px,14cqw,58px);border-radius:50%;border:0;color:#fff;background:rgba(255,255,255,.22);backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 16px rgba(0,0,0,.18);display:grid;place-items:center;padding:0}",
    ".lsw-round svg{width:48%;height:48%;display:block}",
    ".lsw-round:active{transform:scale(.94)}",
    ".lsw-round.is-on{background:#fff;color:#111}",
    ".lsw-home{position:relative;z-index:2;align-self:center;margin-top:8px;display:flex;flex-direction:column;align-items:center;background:none;border:0;color:#fff;padding:2px 16px 0}",
    ".lsw-chev{width:11px;height:11px;border-left:2px solid rgba(255,255,255,.9);border-top:2px solid rgba(255,255,255,.9);transform:rotate(45deg);display:block;margin:0 0 7px;animation:lsw-bob 1.6s ease-in-out infinite}",
    ".lsw-bar{width:min(134px,36cqw);height:5px;border-radius:5px;background:rgba(255,255,255,.92);display:block}",
    ".lsw-torch,.lsw-glass{position:absolute;inset:0;pointer-events:none}",
    ".lsw-torch{z-index:4;opacity:0;transition:opacity .22s linear;background:radial-gradient(circle at 50% -8%,rgba(255,252,240,.9),rgba(255,236,190,.22) 34%,transparent 64%)}",
    ".lsw-screen.is-torch .lsw-torch{opacity:1}",
    ".lsw-screen.is-torch .lsw-wall{filter:brightness(1.28) saturate(.9)}",
    ".lsw-glass{z-index:5;background:linear-gradient(165deg,rgba(255,255,255,.16),transparent 24%,transparent 70%,rgba(0,0,0,.16))}",
    ".lsw-lens{display:none;position:absolute;inset:0;z-index:8;background:#050505;flex-direction:column;align-items:center;justify-content:flex-end;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 18px)}",
    ".lsw-screen.is-cam .lsw-lens{display:flex}",
    ".lsw-lens video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;opacity:0}",
    ".lsw-screen.is-live .lsw-lens video{opacity:1}",
    ".lsw-aperture{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,#1a1a1a 0 18%,#050505 19%),repeating-conic-gradient(from 8deg,#0a0a0a 0 14deg,#171717 14deg 20deg)}",
    ".lsw-finder{position:absolute;left:14%;right:14%;top:16%;bottom:26%;background:linear-gradient(#fff,#fff) left top/22px 2px no-repeat,linear-gradient(#fff,#fff) left top/2px 22px no-repeat,linear-gradient(#fff,#fff) right top/22px 2px no-repeat,linear-gradient(#fff,#fff) right top/2px 22px no-repeat,linear-gradient(#fff,#fff) left bottom/22px 2px no-repeat,linear-gradient(#fff,#fff) left bottom/2px 22px no-repeat,linear-gradient(#fff,#fff) right bottom/22px 2px no-repeat,linear-gradient(#fff,#fff) right bottom/2px 22px no-repeat}",
    ".lsw-iris{position:absolute;left:50%;top:40%;width:72px;height:72px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 0 8px rgba(0,0,0,.25),inset 0 0 0 10px rgba(255,255,255,.06)}",
    ".lsw-snap{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:3}",
    ".lsw-snap.is-hot{animation:lsw-flash .42s ease}",
    ".lsw-cam-close{position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);z-index:2;width:64px;height:28px;border-radius:14px;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:18px;line-height:1}",
    ".lsw-shutter{position:relative;z-index:2;width:72px;height:72px;border-radius:50%;border:3px solid #fff;background:transparent;display:grid;place-items:center;padding:0;margin-bottom:6px}",
    ".lsw-shutter i{width:56px;height:56px;border-radius:50%;background:#fff;display:block}",
    ".lsw-shutter:active i{transform:scale(.9);background:#ddd}",
    ".lsw-controls{display:flex;flex-direction:column;gap:10px;padding:0 2px}",
    ".lsw-swatches{display:flex;flex-direction:row;justify-content:center;align-items:stretch;gap:6px;height:42px;aspect-ratio:auto;padding:0 10px}",
    ".lsw-swatch{position:relative;flex:1 1 0;min-width:0;height:42px;aspect-ratio:auto;border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.14);padding:0 6px;background:rgba(255,255,255,.05);color:#fff;box-shadow:none;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:6px}",
    ".lsw-swatch.is-on{border-color:rgba(255,255,255,.92);background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);transform:none}",
    ".lsw-swatch-dot{width:12px;height:12px;border-radius:50%;flex:none}",
    ".lsw-swatch[data-lsw-theme='obsidian'] .lsw-swatch-dot{background:#34d399;box-shadow:0 0 8px #34d399}",
    ".lsw-swatch[data-lsw-theme='gold'] .lsw-swatch-dot{background:#f6c453;box-shadow:0 0 8px #f6c453}",
    ".lsw-swatch[data-lsw-theme='ice'] .lsw-swatch-dot{background:#bae6fd;box-shadow:0 0 8px #bae6fd}",
    ".lsw-swatch[data-lsw-theme='blood'] .lsw-swatch-dot{background:#fb7185;box-shadow:0 0 8px #fb7185}",
    ".lsw-swatch-name{position:static;padding:0;background:none;font-size:10px;font-weight:800;letter-spacing:-.03em;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".lsw-pills{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}",
    ".lsw-pills::-webkit-scrollbar{display:none}",
    ".lsw-vibes{display:grid;grid-template-columns:1fr 1fr;overflow:visible}",
    ".lsw-rots{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,.9fr) minmax(0,1.5fr);overflow:visible}",
    ".lsw-pill{flex:0 0 auto;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e2e8f0;font-weight:800;font-size:12px;padding:10px 12px;white-space:nowrap;text-align:center}",
    ".lsw-vibes .lsw-pill,.lsw-rots .lsw-pill{white-space:normal}",
    ".lsw-pill.is-on{background:#f8fafc;color:#0b0d12;border-color:#fff}",
    ".lsw-pill:active,.lsw-swatch:active,.lsw-act:active,.lsw-go:active{transform:scale(.97)}",
    ".lsw-swatch.is-on:active{transform:scale(.97)}",
    ".lsw-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".lsw-act{min-height:52px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#f8fafc;font-weight:800;font-size:13px;line-height:1.15;padding:8px 10px}",
    ".lsw-act-speak{background:#f8fafc;color:#111;border-color:#fff}",
    ".lsw-act-speak.is-hot{box-shadow:0 0 0 3px rgba(52,211,153,.45)}",
    ".lsw-eta{text-align:center;font-size:12px;font-weight:800;letter-spacing:.08em;color:#94a3b8}",
    ".lsw-go{position:relative;width:100%;min-height:56px;border:0;border-radius:16px;padding:12px 14px;color:#042f24;font-weight:900;font-size:14px;letter-spacing:-.01em;background:radial-gradient(120% 90% at 8% 0%,rgba(255,255,255,.5),transparent 42%),linear-gradient(180deg,#5eead4 0%,#10b981 58%,#047857 100%);box-shadow:0 12px 28px rgba(16,185,129,.35),inset 0 1px 0 rgba(255,255,255,.65)}",
    ".lsw-go span{position:relative;z-index:1}",
    ".lsw-full{position:fixed;inset:0;z-index:9600;display:flex;justify-content:center;background:#000;overscroll-behavior:contain;touch-action:none;overflow:hidden}",
    ".lsw-full-bg{position:absolute;inset:-8%;filter:blur(28px) brightness(.55) saturate(1.15);transform:scale(1.08)}",
    ".lsw-full .lsw-screen{position:relative;inset:auto;width:100%;height:100%;border-radius:0;box-shadow:none;padding:calc(env(safe-area-inset-top,0px) + 12px) 18px calc(env(safe-area-inset-bottom,0px) + 10px);touch-action:none}",
    ".lsw-overlay .lsw-hw-action,.lsw-overlay .lsw-hw-vol,.lsw-overlay .lsw-hw-vol2{left:0}",
    ".lsw-overlay .lsw-hw-power{right:0;left:auto}",
    ".lsw-full .lsw-island{height:38px;padding:0 12px 0 12px}",
    ".lsw-full .lsw-island-txt{font-size:13px}",
    ".lsw-full .lsw-banner{border-radius:24px;padding:12px 14px}",
    ".lsw-full .lsw-appico{width:42px;height:42px;font-size:22px}",
    "@keyframes lsw-drift{0%,100%{transform:scale(1.08) translate3d(0,0,0)}50%{transform:scale(1.12) translate3d(-1.2%,-1%,0)}}",
    "@keyframes lsw-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.55}}",
    "@keyframes lsw-pop{0%{transform:scale(.96);filter:brightness(1.45)}100%{transform:none;filter:none}}",
    "@keyframes lsw-bob{0%,100%{transform:rotate(45deg) translateY(3px);opacity:.4}50%{transform:rotate(45deg) translateY(-2px);opacity:1}}",
    "@keyframes lsw-flash{0%{opacity:0}12%{opacity:.95}100%{opacity:0}}",
    "@keyframes lsw-themeflash{0%{filter:brightness(1.35) saturate(1.3)}100%{filter:none}}",
    ".lsw-screen.is-theme{animation:lsw-themeflash .4s ease}",
    "@media (prefers-reduced-motion:reduce){.lsw-wall,.lsw-dot,.lsw-chev,.lsw-quote.is-pop{animation:none !important}}"
  ].join("\n");

  function ensureCSS() {
    if (!root.document) return;
    if (root.document.getElementById("lsw-styles")) return;
    var style = root.document.createElement("style");
    style.id = "lsw-styles";
    style.textContent = CSS;
    (root.document.head || root.document.documentElement).appendChild(style);
  }

  function resolve(el) {
    if (!el || !root.document) return null;
    if (typeof el === "string") return root.document.querySelector(el);
    if (el.nodeType === 1) return el;
    return null;
  }

  function queryAll(sel) {
    var out = [];
    var scopes = [];
    if (host) scopes.push(host);
    if (fullEl) scopes.push(fullEl);
    var s;
    var i;
    for (s = 0; s < scopes.length; s++) {
      var found = scopes[s].querySelectorAll(sel);
      for (i = 0; i < found.length; i++) out.push(found[i]);
    }
    return out;
  }

  function setText(scope, sel, text) {
    var nodes = scope.querySelectorAll(sel);
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].textContent !== text) nodes[i].textContent = text;
    }
  }

  function popQuotes(key) {
    if (lastPopKey == null) {
      lastPopKey = key;
      return;
    }
    if (key === lastPopKey) return;
    lastPopKey = key;
    var nodes = queryAll("[data-lsw-quote]");
    var i;
    for (i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove("is-pop");
      void nodes[i].offsetWidth;
      nodes[i].classList.add("is-pop");
    }
  }

  function flashTheme(theme) {
    if (lastTheme == null) {
      lastTheme = theme;
      return;
    }
    if (theme === lastTheme) return;
    lastTheme = theme;
    var nodes = queryAll("[data-lsw-screen]");
    var i;
    for (i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove("is-theme");
      void nodes[i].offsetWidth;
      nodes[i].classList.add("is-theme");
    }
  }

  function applyView(scope, s) {
    if (!scope) return;
    var screens = scope.querySelectorAll("[data-lsw-screen]");
    var i;
    var body = s.shieldOn ? blockedLine(s.blockedToday) : "Shield off. URLs exposed";
    var island = islandCopy(s.shieldOn);
    var islandEmo = s.shieldOn ? "🛡️" : "⚠️";
    var quoted = "\u201C" + s.quote.text + "\u201D";
    var byline = "\u2014 " + s.quote.author;
    for (i = 0; i < screens.length; i++) {
      var screen = screens[i];
      screen.setAttribute("data-theme", s.theme);
      screen.setAttribute("data-shield", s.shieldOn ? "on" : "off");
      var wall = screen.querySelector("[data-lsw-wall]");
      if (wall) wall.className = "lsw-wall lsw-skin-" + s.theme;
      setText(screen, "[data-lsw-date]", s.dateLabel);
      setText(screen, "[data-lsw-clock]", s.clockLabel);
      setText(screen, "[data-lsw-q]", quoted);
      setText(screen, "[data-lsw-by]", byline);
      setText(screen, "[data-lsw-day]", String(s.streakDay));
      setText(screen, "[data-lsw-shield]", s.shieldOn ? "ON" : "OFF");
      setText(screen, "[data-lsw-island]", island);
      setText(screen, "[data-lsw-island-emo]", islandEmo);
      setText(screen, "[data-lsw-blocked]", body);
      setText(screen, "[data-lsw-appico]", islandEmo);
      var ring = screen.querySelector("[data-lsw-ring]");
      if (ring) ring.setAttribute("stroke-dashoffset", ringOffset(s.streakDay));
      var quoteBtn = screen.querySelector("[data-lsw-quote]");
      if (quoteBtn) quoteBtn.setAttribute("aria-label", "Stoic quote. " + s.quote.text + " " + s.quote.author);
      var streak = screen.querySelector("[data-lsw-streak]");
      if (streak) streak.setAttribute("aria-label", "DAY " + s.streakDay + " • " + (s.shieldOn ? "🛡️ ON" : "🛡️ OFF"));
      var islandEl = screen.querySelector(".lsw-island");
      if (islandEl) islandEl.setAttribute("aria-label", islandEmo + " " + island);
      var banner = screen.querySelector("[data-lsw-banner]");
      if (banner) banner.setAttribute("aria-label", "🛡️ IRON ARC • " + body);
    }
    var bgs = scope.querySelectorAll("[data-lsw-bg]");
    for (i = 0; i < bgs.length; i++) bgs[i].className = "lsw-full-bg lsw-skin-" + s.theme;
    var sw = scope.querySelectorAll("[data-lsw-theme]");
    for (i = 0; i < sw.length; i++) {
      var onT = sw[i].getAttribute("data-lsw-theme") === s.theme;
      sw[i].classList.toggle("is-on", onT);
      sw[i].setAttribute("aria-selected", onT ? "true" : "false");
    }
    var vibes = scope.querySelectorAll("[data-lsw-vibe]");
    for (i = 0; i < vibes.length; i++) {
      var onV = vibes[i].getAttribute("data-lsw-vibe") === s.vibe;
      vibes[i].classList.toggle("is-on", onV);
      vibes[i].setAttribute("aria-pressed", onV ? "true" : "false");
    }
    var rots = scope.querySelectorAll("[data-lsw-rot]");
    for (i = 0; i < rots.length; i++) {
      var onR = rots[i].getAttribute("data-lsw-rot") === s.rotation;
      rots[i].classList.toggle("is-on", onR);
      rots[i].setAttribute("aria-pressed", onR ? "true" : "false");
    }
    var eta = scope.querySelector("[data-lsw-eta]");
    if (eta) eta.textContent = "↻ " + s.etaLabel;
    popQuotes(quoteKeyOf(s.vibe, s.quoteIndex));
    flashTheme(s.theme);
  }

  function paint() {
    var s = getState();
    if (host && host.isConnected) applyView(host, s);
    else if (host && !host.isConnected) host = null;
    if (fullEl && fullEl.isConnected) applyView(fullEl, s);
    else if (fullEl && !fullEl.isConnected) fullEl = null;
  }

  function onClick(e) {
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    var t = e.target.closest("[data-lsw-theme],[data-lsw-vibe],[data-lsw-rot],[data-lsw-shuffle],[data-lsw-speak],[data-lsw-full],[data-lsw-quote],[data-lsw-flash],[data-lsw-cam],[data-lsw-shutter],[data-lsw-cam-close],[data-lsw-unlock]");
    if (!t || !e.currentTarget.contains(t)) return;
    armAudio();
    if (t.hasAttribute("data-lsw-theme")) {
      state.theme = t.getAttribute("data-lsw-theme");
      fxTick(520, 0.03);
      commit(true);
      return;
    }
    if (t.hasAttribute("data-lsw-vibe")) {
      state.vibe = t.getAttribute("data-lsw-vibe");
      fxTick(600, 0.03);
      commit(true);
      return;
    }
    if (t.hasAttribute("data-lsw-rot")) {
      state.rotation = t.getAttribute("data-lsw-rot");
      if (state.rotation !== "night") state.lastRotatedAt = Date.now();
      fxTick(480, 0.03);
      commit(true);
      return;
    }
    if (t.hasAttribute("data-lsw-shuffle") || t.hasAttribute("data-lsw-quote")) {
      nextQuote();
      return;
    }
    if (t.hasAttribute("data-lsw-speak")) {
      speakQuote();
      return;
    }
    if (t.hasAttribute("data-lsw-full")) {
      openFullLockScreen();
      return;
    }
    if (t.hasAttribute("data-lsw-flash")) {
      var screenF = t.closest("[data-lsw-screen]");
      if (screenF) toggleFlash(screenF);
      return;
    }
    if (t.hasAttribute("data-lsw-cam")) {
      var screenC = t.closest("[data-lsw-screen]");
      if (screenC) openCamera(screenC);
      return;
    }
    if (t.hasAttribute("data-lsw-shutter")) {
      var screenS = t.closest("[data-lsw-screen]");
      if (screenS) shutter(screenS);
      return;
    }
    if (t.hasAttribute("data-lsw-cam-close")) {
      var screenX = t.closest("[data-lsw-screen]");
      if (screenX) closeCamera(screenX);
      return;
    }
    if (t.hasAttribute("data-lsw-unlock")) {
      unlockFull();
    }
  }

  function bindRoot(node) {
    if (!node || node._lswBound) return;
    node._lswBound = true;
    node.addEventListener("click", onClick);
    node.addEventListener("pointerdown", armAudio);
  }

  function toggleFlash(screen) {
    var on = screen.classList.toggle("is-torch");
    var btn = screen.querySelector("[data-lsw-flash]");
    if (btn) {
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    fxTick(on ? 980 : 420, 0.03);
  }

  function stopStream(screen) {
    var stream = screen._lswStream;
    if (!stream) return;
    try {
      stream.getTracks().forEach(function (track) { track.stop(); });
    } catch (err) { /* already ended */ }
    screen._lswStream = null;
    var video = screen.querySelector("video");
    if (video) {
      try { video.srcObject = null; } catch (err) { /* ignore */ }
    }
  }

  function closeCamera(screen) {
    if (!screen) return;
    screen.classList.remove("is-cam");
    screen.classList.remove("is-live");
    screen.classList.remove("is-cam-fallback");
    stopStream(screen);
  }

  function openCamera(screen) {
    if (screen.classList.contains("is-cam")) {
      closeCamera(screen);
      fxTick(420, 0.025);
      return;
    }
    screen.classList.add("is-cam");
    screen.classList.remove("is-live");
    screen.classList.remove("is-cam-fallback");
    fxTick(760, 0.03);
    var video = screen.querySelector("video");
    var md = root.navigator && root.navigator.mediaDevices;
    if (!video || !md || typeof md.getUserMedia !== "function") {
      screen.classList.add("is-cam-fallback");
      return;
    }
    var tries = [
      { video: { facingMode: { ideal: "environment" } }, audio: false },
      { video: true, audio: false }
    ];
    var attempt = function (index) {
      if (!screen.classList.contains("is-cam")) return;
      if (index >= tries.length) {
        screen.classList.add("is-cam-fallback");
        return;
      }
      md.getUserMedia(tries[index]).then(function (stream) {
        if (!screen.classList.contains("is-cam")) {
          stream.getTracks().forEach(function (track) { track.stop(); });
          return;
        }
        stopStream(screen);
        screen._lswStream = stream;
        video.srcObject = stream;
        video.onplaying = function () { screen.classList.add("is-live"); };
        var play = video.play();
        if (play && typeof play.catch === "function") play.catch(function () { screen.classList.add("is-cam-fallback"); });
      }).catch(function () { attempt(index + 1); });
    };
    attempt(0);
  }

  function shutter(screen) {
    var snap = screen.querySelector("[data-lsw-snap]");
    if (snap) {
      snap.classList.remove("is-hot");
      void snap.offsetWidth;
      snap.classList.add("is-hot");
    }
    fxTick(1680, 0.02);
  }

  function bindGestures(screen, fullscreen) {
    if (!screen || screen._lswGestures) return;
    screen._lswGestures = true;
    var drag = null;
    screen.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      var hold = e.target.closest("[data-lsw-hold]");
      drag = {
        y: e.clientY,
        x: e.clientX,
        hold: !!hold,
        lens: screen.classList.contains("is-cam"),
        id: e.pointerId
      };
      if (!hold && fullscreen) {
        try { screen.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    screen.addEventListener("pointermove", function (e) {
      if (!drag || drag.id !== e.pointerId || drag.hold || drag.lens || !fullscreen) return;
      var dy = e.clientY - drag.y;
      if (dy > 0) dy = dy * 0.28;
      screen.style.transition = "none";
      screen.style.transform = "translate3d(0," + dy + "px,0)";
    });
    screen.addEventListener("pointerup", function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var dy = e.clientY - drag.y;
      var dx = e.clientX - drag.x;
      var snapshot = drag;
      drag = null;
      if (!snapshot.hold && (Math.abs(dy) > 8 || Math.abs(dx) > 8)) {
        swallowClick = true;
        root.setTimeout(function () { swallowClick = false; }, 350);
      }
      if (snapshot.lens && dy > 72 && Math.abs(dy) > Math.abs(dx)) {
        closeCamera(screen);
        fxTick(420, 0.025);
        return;
      }
      if (snapshot.hold || !fullscreen) return;
      if (dy < -78) {
        unlockFull();
        return;
      }
      var rect = screen.getBoundingClientRect();
      var y = e.clientY - rect.top;
      if (Math.abs(dy) < 12 && Math.abs(dx) < 12 && y > rect.height * 0.84) {
        unlockFull();
        return;
      }
      screen.style.transition = "transform .34s cubic-bezier(.2,.9,.25,1)";
      screen.style.transform = "translate3d(0,0,0)";
    });
    screen.addEventListener("pointercancel", function () {
      drag = null;
      screen.style.transition = "transform .34s ease";
      screen.style.transform = "translate3d(0,0,0)";
    });
  }

  function lockScroll() {
    if (!root.document || !root.document.body) return;
    scrollLock = root.document.body.style.overflow;
    root.document.body.style.overflow = "hidden";
  }

  function unlockScroll() {
    if (!root.document || !root.document.body) return;
    root.document.body.style.overflow = scrollLock || "";
  }

  function onEscape(e) {
    if (e.key === "Escape" && fullEl) unlockFull();
  }

  function bindEscape() {
    if (escapeBound || !root.document) return;
    escapeBound = true;
    root.document.addEventListener("keydown", onEscape);
  }

  function closeFull() {
    closing = false;
    if (fullEl) {
      var screen = fullEl.querySelector("[data-lsw-screen]");
      if (screen) closeCamera(screen);
      if (fullEl.parentNode) fullEl.parentNode.removeChild(fullEl);
    }
    fullEl = null;
    unlockScroll();
  }

  function unlockFull() {
    if (!fullEl || closing) return;
    closing = true;
    fxTick(880, 0.04);
    var screen = fullEl.querySelector("[data-lsw-screen]");
    if (screen) {
      closeCamera(screen);
      screen.style.transition = "transform .42s cubic-bezier(.4,0,.2,1)";
      screen.style.transform = "translate3d(0,-108%,0)";
    }
    var done = function () {
      var cb = onUnlock;
      closeFull();
      if (typeof cb === "function") {
        try { cb(getState()); } catch (err) { /* host callback */ }
      }
    };
    root.setTimeout(done, 430);
  }

  function openFullLockScreen(opts) {
    ensureCSS();
    applyOpts(opts || null);
    if (maybeRotate()) persist();
    if (!root.document || !root.document.body) return api;
    if (fullEl && fullEl.isConnected) {
      paint();
      return api;
    }
    closing = false;
    var s = getState();
    fullEl = root.document.createElement("div");
    fullEl.className = "lsw-full lsw-overlay";
    fullEl.id = "lsw-full";
    fullEl.setAttribute("role", "dialog");
    fullEl.setAttribute("aria-modal", "true");
    fullEl.setAttribute("aria-label", "iPhone Lock Screen");
    fullEl.tabIndex = -1;
    fullEl.innerHTML = '<div class="lsw-full-bg lsw-skin-' + s.theme + '" data-lsw-bg></div>' +
      '<div class="lsw-device">' +
        '<span class="lsw-hw lsw-hw-action" aria-hidden="true"></span>' +
        '<span class="lsw-hw lsw-hw-vol" aria-hidden="true"></span>' +
        '<span class="lsw-hw lsw-hw-vol2" aria-hidden="true"></span>' +
        '<span class="lsw-hw lsw-hw-power" aria-hidden="true"></span>' +
        screenMarkup(s, "full") +
      '</div>';
    root.document.body.appendChild(fullEl);
    bindRoot(fullEl);
    bindGestures(fullEl.querySelector("[data-lsw-screen]"), true);
    lockScroll();
    bindEscape();
    lastPopKey = quoteKeyOf(s.vibe, s.quoteIndex);
    lastTheme = s.theme;
    try { fullEl.focus({ preventScroll: true }); } catch (err) {
      try { fullEl.focus(); } catch (err2) { /* ignore */ }
    }
    armTicker();
    fxTick(720, 0.04);
    return api;
  }

  function closeFullLockScreen() {
    closeFull();
    return api;
  }

  function mount(el, opts) {
    ensureCSS();
    applyOpts(opts || null);
    if (maybeRotate()) persist();
    var node = resolve(el);
    if (!node) return api;
    host = node;
    node.classList.add("lsw-root");
    if (!node.querySelector("[data-lsw-panel]")) node.innerHTML = renderHTML();
    bindRoot(node);
    var screen = node.querySelector("[data-lsw-screen]");
    if (screen) bindGestures(screen, false);
    var s = getState();
    lastPopKey = quoteKeyOf(s.vibe, s.quoteIndex);
    lastTheme = s.theme;
    paint();
    armTicker();
    return api;
  }

  function stampClocks() {
    var now = new Date();
    var clock = formatClock(now);
    var date = formatDate(now);
    if (clock === lastClock) return;
    lastClock = clock;
    var scopes = [];
    if (host) scopes.push(host);
    if (fullEl) scopes.push(fullEl);
    var i;
    for (i = 0; i < scopes.length; i++) {
      setText(scopes[i], "[data-lsw-clock]", clock);
      setText(scopes[i], "[data-lsw-date]", date);
    }
  }

  function stampEta() {
    if (!host) return;
    var eta = host.querySelector("[data-lsw-eta]");
    if (!eta) return;
    var label = "↻ " + etaFor(state.rotation, state.lastRotatedAt, new Date());
    if (eta.textContent !== label) eta.textContent = label;
  }

  function onTick() {
    stampClocks();
    stampEta();
    if (maybeRotate()) {
      persist();
      paint();
      emit();
      fxTick(620, 0.03);
    }
  }

  function armTicker() {
    if (ticker) return;
    lastClock = formatClock(new Date());
    ticker = root.setInterval(onTick, 1000);
  }

  function onVisible() {
    if (!root.document || root.document.visibilityState === "hidden") return;
    stampClocks();
    if (maybeRotate()) {
      persist();
      paint();
      emit();
    }
  }

  load();

  if (root.document && root.document.addEventListener) {
    root.document.addEventListener("visibilitychange", onVisible);
  }

  var api = {
    version: "1.0.0",
    __built: true,
    mount: mount,
    renderHTML: renderHTML,
    openFullLockScreen: openFullLockScreen,
    closeFullLockScreen: closeFullLockScreen,
    nextQuote: nextQuote,
    getState: getState
  };

  root.LockScreenWidget = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
