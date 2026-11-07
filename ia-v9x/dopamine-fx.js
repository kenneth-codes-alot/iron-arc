/**
 * DopamineFX — zero-dependency neuro-feedback for IRON ARC.
 * Synthesized Web Audio, haptics, full-screen bursts, and the D2 brain SVG.
 *
 *   <script src="./dopamine-fx.js"></script>
 *   DopamineFX.unlock();
 *   DopamineFX.playTick();
 *   DopamineFX.startChargeHum();
 *   DopamineFX.updateChargePitch(progress); // 0–1, or 2–100 (%)
 *   DopamineFX.playOathSealed();
 *   DopamineFX.burstParticles({ anchor: button, mode: "seal" });
 *   DopamineFX.playRankUp();
 *   DopamineFX.playPanicSiren();
 *   DopamineFX.speakCoach("Look at yourself.");
 *   host.innerHTML = DopamineFX.renderBrainSVG(percent, rankCode);
 *   DopamineFX.toggleMute();
 */
(function (root) {
  "use strict";

  if (root.DopamineFX && root.DopamineFX.version === "1.0.0" && root.DopamineFX.__built) {
    return;
  }

  var EMERALD = "#10b981";
  var EMERALD_BRIGHT = "#34d399";
  var MINT = "#a7f3d0";
  var HOT = "#ecfdf5";
  var GOLD = "#fbbf24";
  var GOLD_HOT = "#fde68a";
  var AMBER = "#f59e0b";
  var WHITE = "#f8fafc";
  var CRIMSON = "#e11d48";
  var CRIMSON_NODE = "#fb7185";
  var CRIMSON_DEEP = "#9f1239";
  var SLATE = "#334155";
  var SLATE_NODE = "#64748b";
  var TRACK = "#1e293b";
  var TEAL = "#115e59";

  var muted = false;
  var speechGen = 0;
  var lastTickAt = -1000;
  var panicUntil = 0;
  var oathUntil = 0;
  var rankUntil = 0;
  var brainSeq = 0;

  var ctx = null;
  var master = null;
  var noiseBuffer = null;
  var charge = null;
  var glideTimes = typeof WeakMap === "function" ? new WeakMap() : null;

  var fx = {
    canvas: null,
    ctx2d: null,
    particles: [],
    raf: 0,
    width: 1,
    height: 1,
    onResize: null
  };

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function nowMs() {
    return root.performance && root.performance.now ? root.performance.now() : Date.now();
  }

  function later(ms, fn) {
    var id = root.setTimeout(fn, ms);
    if (id && typeof id.unref === "function") id.unref();
    return id;
  }

  function reducedMotion() {
    try {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) {
      return false;
    }
  }

  function safeDisconnect(node) {
    if (!node || typeof node.disconnect !== "function") return;
    try { node.disconnect(); } catch (err) { /* already disconnected */ }
  }

  function safeStop(node, when) {
    if (!node || typeof node.stop !== "function") return;
    try { node.stop(when); } catch (err) { /* not started or already stopped */ }
  }

  function track(bucket, node) {
    if (node) bucket.push(node);
    return node;
  }

  function unitInterval(value) {
    var x = Number(value);
    if (!Number.isFinite(x) || x <= 0) return 0;
    if (x <= 1) return x;
    if (x >= 2 && x <= 100) return x / 100;
    return 1;
  }

  function clampPercent(value) {
    var x = Number(value);
    if (!Number.isFinite(x) || x <= 0) return 0;
    if (x >= 100) return 100;
    return x;
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function mixHex(a, b, t) {
    var u = t < 0 ? 0 : t > 1 ? 1 : t;
    var A = parseInt(a.slice(1), 16);
    var B = parseInt(b.slice(1), 16);
    var ar = (A >> 16) & 255;
    var ag = (A >> 8) & 255;
    var ab = A & 255;
    var br = (B >> 16) & 255;
    var bg = (B >> 8) & 255;
    var bb = B & 255;
    var r = Math.round(ar + (br - ar) * u);
    var g = Math.round(ag + (bg - ag) * u);
    var bl = Math.round(ab + (bb - ab) * u);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  function n1(x) {
    return Math.round(x * 10) / 10;
  }

  function requestFrame(fn) {
    if (typeof root.requestAnimationFrame === "function") return root.requestAnimationFrame(fn);
    return root.setTimeout(function () { fn(nowMs()); }, 16);
  }

  function cancelFrame(id) {
    if (!id) return;
    if (typeof root.cancelAnimationFrame === "function") root.cancelAnimationFrame(id);
    else root.clearTimeout(id);
  }

  /* --------------------------------------------------------------------- */
  /* Audio                                                                  */
  /* --------------------------------------------------------------------- */

  function buildMaster(audio) {
    var gain = audio.createGain();
    gain.gain.value = muted ? 0 : 0.92;
    try {
      var comp = audio.createDynamicsCompressor();
      if (comp.threshold) comp.threshold.value = -12;
      if (comp.knee) comp.knee.value = 18;
      if (comp.ratio) comp.ratio.value = 3.6;
      if (comp.attack) comp.attack.value = 0.004;
      if (comp.release) comp.release.value = 0.24;
      gain.connect(comp);
      comp.connect(audio.destination);
    } catch (err) {
      gain.connect(audio.destination);
    }
    master = gain;
  }

  function ensureCtx() {
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      if (!ctx || ctx.state === "closed") {
        var next = new AC();
        buildMaster(next);
        ctx = next;
        noiseBuffer = null;
        charge = null;
      }
    } catch (err) {
      ctx = null;
      master = null;
      return null;
    }
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      try {
        var resumed = ctx.resume();
        if (resumed && typeof resumed.catch === "function") resumed.catch(function () {});
      } catch (err) { /* autoplay still blocked until a gesture */ }
    }
    return master ? ctx : null;
  }

  function applyMute() {
    if (!master || !ctx) return;
    var g = master.gain;
    var t = ctx.currentTime;
    if (muted) {
      try {
        if (g.cancelScheduledValues) g.cancelScheduledValues(t);
        g.setValueAtTime(0, t + 0.001);
      } catch (err) { /* fallback below */ }
      try { g.value = 0; } catch (err) { /* host object */ }
      return;
    }
    try {
      if (g.cancelScheduledValues) g.cancelScheduledValues(t);
      g.setValueAtTime(0.0001, t + 0.001);
      g.exponentialRampToValueAtTime(0.92, t + 0.05);
    } catch (err) {
      try { g.value = 0.92; } catch (err2) { /* ignore */ }
    }
  }

  function getNoise(audio) {
    if (noiseBuffer) return noiseBuffer;
    var length = Math.max(1, Math.floor((audio.sampleRate || 44100) * 0.8));
    var buffer = audio.createBuffer(1, length, audio.sampleRate || 44100);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buffer;
    return buffer;
  }

  function scheduleAmp(param, t, peak, attack, dur) {
    var a = Math.max(0.008, attack || 0);
    var d = Math.max(a + 0.02, dur || 0);
    var pk = Math.max(0.0001, peak || 0.0001);
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(pk, t + a);
    param.exponentialRampToValueAtTime(0.0001, t + d);
    return t + d;
  }

  function approach(param, value, timeConstant) {
    if (!param || !ctx || !Number.isFinite(value)) return;
    var now = ctx.currentTime;
    var last = glideTimes && glideTimes.get(param) || 0;
    var when = Math.max(now + 0.01, last + 0.005);
    param.setTargetAtTime(value, when, Math.max(0.012, timeConstant || 0.05));
    if (glideTimes) glideTimes.set(param, when);
  }

  function fadeOut(param, seconds) {
    var last = glideTimes && glideTimes.get(param) || 0;
    var t = Math.max(ctx.currentTime, last) + 0.002;
    var current = param.value;
    if (!(current > 0)) current = 0.0001;
    if (param.cancelScheduledValues) param.cancelScheduledValues(t);
    param.setValueAtTime(current, t);
    param.exponentialRampToValueAtTime(0.0001, t + Math.max(0.04, seconds || 0.08));
    if (glideTimes) glideTimes.set(param, t + Math.max(0.04, seconds || 0.08));
  }

  function tone(audio, opts, bucket) {
    var osc = track(bucket, audio.createOscillator());
    var gain = track(bucket, audio.createGain());
    var t = opts.time;
    var dur = Math.max(0.03, opts.dur);
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(Math.max(1, opts.freq), t);
    if (opts.freqTo && opts.freqTo > 0) {
      var rampAt = t + Math.max(0.02, opts.freqRamp || dur * 0.85);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqTo), rampAt);
    }
    var end = scheduleAmp(gain.gain, t, opts.peak, opts.attack || 0.01, dur);
    osc.connect(gain);
    gain.connect(opts.dest);
    osc.start(t);
    osc.stop(end + 0.03);
    osc.onended = function () {
      safeDisconnect(osc);
      safeDisconnect(gain);
    };
    return end;
  }

  function noiseShot(audio, opts, bucket) {
    var src = track(bucket, audio.createBufferSource());
    var filter = track(bucket, audio.createBiquadFilter());
    var gain = track(bucket, audio.createGain());
    var t = opts.time;
    var dur = Math.max(0.03, opts.dur);
    src.buffer = getNoise(audio);
    filter.type = opts.filter || "lowpass";
    filter.frequency.setValueAtTime(Math.max(40, opts.freq || 800), t);
    if (opts.freqTo && opts.freqTo > 0) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqTo), t + dur * 0.85);
    }
    if (opts.q && filter.Q) filter.Q.value = opts.q;
    var end = scheduleAmp(gain.gain, t, opts.peak, opts.attack || 0.004, dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(opts.dest);
    src.start(t);
    src.stop(end + 0.02);
    src.onended = function () {
      safeDisconnect(src);
      safeDisconnect(filter);
      safeDisconnect(gain);
    };
  }

  function makeBus(audio, bucket, dest) {
    var bus = track(bucket, audio.createGain());
    bus.gain.value = 1;
    bus.connect(dest || master);
    return bus;
  }

  function releaseBus(bucket, ms) {
    later(ms, function () {
      for (var i = 0; i < bucket.length; i++) safeDisconnect(bucket[i]);
    });
  }

  function makeClip(audio, bucket) {
    if (!audio || typeof audio.createWaveShaper !== "function" || typeof root.Float32Array !== "function") {
      return null;
    }
    var shaper = track(bucket, audio.createWaveShaper());
    var curve = new root.Float32Array(256);
    for (var i = 0; i < 256; i++) {
      var x = (i / 255) * 2 - 1;
      curve[i] = Math.tanh(x * 2.1);
    }
    shaper.curve = curve;
    if ("oversample" in shaper) shaper.oversample = "2x";
    return shaper;
  }

  function makeEcho(audio, bucket) {
    var input = track(bucket, audio.createGain());
    var delay = track(bucket, audio.createDelay(0.5));
    var feedback = track(bucket, audio.createGain());
    var toneFilter = track(bucket, audio.createBiquadFilter());
    var output = track(bucket, audio.createGain());
    delay.delayTime.value = 0.17;
    feedback.gain.value = 0.28;
    toneFilter.type = "highpass";
    toneFilter.frequency.value = 880;
    output.gain.value = 0.34;
    input.connect(delay);
    delay.connect(toneFilter);
    toneFilter.connect(feedback);
    feedback.connect(delay);
    toneFilter.connect(output);
    output.connect(master);
    return input;
  }

  function bell(audio, time, freq, dur, peak, dest, bucket) {
    var partials = [
      [1, 1, 1],
      [2.01, 0.42, 0.62],
      [2.73, 0.16, 0.38]
    ];
    for (var i = 0; i < partials.length; i++) {
      tone(audio, {
        time: time,
        type: "sine",
        freq: freq * partials[i][0],
        dur: Math.max(0.05, dur * partials[i][2]),
        peak: peak * partials[i][1],
        attack: 0.006,
        dest: dest
      }, bucket);
    }
  }

  function brass(audio, time, freq, dur, peak, dest, bucket) {
    var osc = track(bucket, audio.createOscillator());
    var osc2 = track(bucket, audio.createOscillator());
    var thin = track(bucket, audio.createGain());
    var mix = track(bucket, audio.createGain());
    var filter = track(bucket, audio.createBiquadFilter());
    var gain = track(bucket, audio.createGain());
    osc.type = "sawtooth";
    osc2.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.004, time);
    thin.gain.value = 0.32;
    filter.type = "lowpass";
    if (filter.Q) filter.Q.value = 0.72;
    var closed = Math.max(200, freq * 1.2);
    var open = Math.min(5000, Math.max(closed * 2, freq * 5.5));
    var openAt = time + Math.max(0.016, Math.min(0.045, dur * 0.24));
    var endAt = time + dur;
    filter.frequency.setValueAtTime(closed, time);
    filter.frequency.exponentialRampToValueAtTime(open, openAt);
    if (endAt > openAt + 0.02) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, closed * 0.85), endAt);
    }
    var end = scheduleAmp(gain.gain, time, peak, 0.018, dur);
    osc.connect(mix);
    osc2.connect(thin);
    thin.connect(mix);
    mix.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc2.start(time);
    osc.stop(end + 0.03);
    osc2.stop(end + 0.03);
    osc.onended = function () {
      safeDisconnect(osc);
      safeDisconnect(osc2);
      safeDisconnect(thin);
      safeDisconnect(mix);
      safeDisconnect(filter);
      safeDisconnect(gain);
    };
  }

  function playTick(freq, duration) {
    var stamp = nowMs();
    if (stamp - lastTickAt < 32) return false;
    lastTickAt = stamp;
    var audio = ensureCtx();
    vibrate(10);
    if (!audio || !master) return false;
    var bucket = [];
    try {
      var hz = Number(freq);
      var durIn = Number(duration);
      var clickHz = Number.isFinite(hz) && hz > 0 ? clamp(hz, 90, 6000) : 1740;
      var dur = Number.isFinite(durIn) && durIn > 0 ? clamp(durIn, 0.016, 0.16) : 0.032;
      var t = audio.currentTime;
      var hp = track(bucket, audio.createBiquadFilter());
      hp.type = "highpass";
      hp.frequency.setValueAtTime(520, t);
      hp.connect(master);
      var bus = makeBus(audio, bucket, hp);
      tone(audio, {
        time: t,
        type: "triangle",
        freq: clickHz,
        freqTo: Math.max(80, clickHz * 0.45),
        freqRamp: dur,
        dur: dur,
        peak: 0.16,
        attack: 0.004,
        dest: bus
      }, bucket);
      tone(audio, {
        time: t,
        type: "sine",
        freq: 168,
        dur: 0.028,
        peak: 0.11,
        attack: 0.003,
        dest: master
      }, bucket);
      noiseShot(audio, {
        time: t,
        dur: Math.min(0.03, dur),
        peak: 0.1,
        freq: Math.min(5200, clickHz * 1.7),
        filter: "bandpass",
        q: 0.8,
        dest: bus
      }, bucket);
      releaseBus(bucket, 400);
      return true;
    } catch (err) {
      for (var i = 0; i < bucket.length; i++) {
        safeStop(bucket[i], audio.currentTime + 0.02);
        safeDisconnect(bucket[i]);
      }
      return false;
    }
  }

  function applyCharge(progress) {
    if (!charge || !ctx) return false;
    var p = unitInterval(progress);
    var s = Math.pow(p, 1.25);
    var subF = 52 * Math.pow(2.15, s);
    approach(charge.sub.frequency, subF, 0.045);
    approach(charge.body.frequency, subF * 2, 0.045);
    approach(charge.sheen.frequency, 180 * Math.pow(3.2, s), 0.05);
    approach(charge.rumble.frequency, subF * 0.5, 0.05);
    approach(charge.filter.frequency, 140 * Math.pow(8, s), 0.06);
    if (charge.filter.Q) approach(charge.filter.Q, 0.8 + s * 2.4, 0.08);
    approach(charge.subGain.gain, 0.22 + s * 0.18, 0.08);
    approach(charge.bodyGain.gain, 0.045 + s * 0.07, 0.08);
    approach(charge.sheenGain.gain, 0.012 + s * 0.062, 0.07);
    approach(charge.rumbleGain.gain, 0.14 + s * 0.12, 0.08);
    approach(charge.level.gain, 0.5 + s * 0.28, 0.09);
    approach(charge.lfo.frequency, 3.1 + s * 7.2, 0.1);
    approach(charge.lfoDepth.gain, 0.025 + s * 0.08, 0.1);
    return true;
  }

  function startChargeHum() {
    var audio = ensureCtx();
    if (!audio || !master) {
      vibrate(14);
      return false;
    }
    if (charge) return true;
    var bucket = [];
    try {
      var t = audio.currentTime;
      var sub = track(bucket, audio.createOscillator());
      var body = track(bucket, audio.createOscillator());
      var sheen = track(bucket, audio.createOscillator());
      var rumble = track(bucket, audio.createOscillator());
      var lfo = track(bucket, audio.createOscillator());
      var subGain = track(bucket, audio.createGain());
      var bodyGain = track(bucket, audio.createGain());
      var sheenGain = track(bucket, audio.createGain());
      var rumbleGain = track(bucket, audio.createGain());
      var filter = track(bucket, audio.createBiquadFilter());
      var tremolo = track(bucket, audio.createGain());
      var lfoDepth = track(bucket, audio.createGain());
      var level = track(bucket, audio.createGain());

      sub.type = "sine";
      body.type = "sawtooth";
      sheen.type = "sine";
      rumble.type = "sine";
      lfo.type = "sine";
      sub.frequency.value = 52;
      body.frequency.value = 104;
      sheen.frequency.value = 180;
      rumble.frequency.value = 26;
      lfo.frequency.value = 3.1;
      subGain.gain.value = 0.22;
      bodyGain.gain.value = 0.045;
      sheenGain.gain.value = 0.012;
      rumbleGain.gain.value = 0.14;
      lfoDepth.gain.value = 0.025;
      tremolo.gain.value = 1;
      filter.type = "lowpass";
      filter.frequency.value = 140;
      if (filter.Q) filter.Q.value = 0.8;

      sub.connect(subGain);
      body.connect(bodyGain);
      sheen.connect(sheenGain);
      rumble.connect(rumbleGain);
      subGain.connect(filter);
      bodyGain.connect(filter);
      sheenGain.connect(filter);
      rumbleGain.connect(filter);
      filter.connect(tremolo);
      tremolo.connect(level);
      level.connect(master);
      lfo.connect(lfoDepth);
      lfoDepth.connect(tremolo.gain);

      level.gain.setValueAtTime(0.0001, t);
      sub.start(t);
      body.start(t);
      sheen.start(t);
      rumble.start(t);
      lfo.start(t);

      charge = {
        sub: sub,
        body: body,
        sheen: sheen,
        rumble: rumble,
        lfo: lfo,
        subGain: subGain,
        bodyGain: bodyGain,
        sheenGain: sheenGain,
        rumbleGain: rumbleGain,
        filter: filter,
        tremolo: tremolo,
        lfoDepth: lfoDepth,
        level: level,
        oscs: [sub, body, sheen, rumble, lfo],
        nodes: bucket
      };
      applyCharge(0);
      vibrate(14);
      return true;
    } catch (err) {
      charge = null;
      for (var i = 0; i < bucket.length; i++) {
        safeStop(bucket[i], audio.currentTime + 0.02);
        safeDisconnect(bucket[i]);
      }
      return false;
    }
  }

  function updateChargePitch(progress) {
    if (!charge) return false;
    ensureCtx();
    try {
      return applyCharge(progress);
    } catch (err) {
      return false;
    }
  }

  function stopChargeHum(silent) {
    if (!charge || !ctx) return false;
    var current = charge;
    charge = null;
    try {
      var t = ctx.currentTime;
      safeDisconnect(current.lfoDepth);
      safeStop(current.lfo, t + 0.14);
      fadeOut(current.level.gain, 0.08);
      var stopAt = (glideTimes && glideTimes.get(current.level.gain) || t) + 0.02;
      for (var i = 0; i < current.oscs.length; i++) safeStop(current.oscs[i], stopAt);
      later(500, function () {
        for (var n = 0; n < current.nodes.length; n++) safeDisconnect(current.nodes[n]);
      });
      if (silent !== true) vibrate(8);
      return true;
    } catch (err) {
      for (var j = 0; j < current.nodes.length; j++) safeDisconnect(current.nodes[j]);
      return false;
    }
  }

  function playOathSealed() {
    var audio = ensureCtx();
    if (!audio || !master) {
      stopChargeHum(true);
      vibrate([18, 28, 36, 36, 110]);
      return false;
    }
    var t = audio.currentTime;
    if (t < oathUntil) return false;
    oathUntil = t + 0.75;
    stopChargeHum(true);
    vibrate([18, 28, 36, 36, 110]);
      var bucket = [];
      try {
        var impact = track(bucket, audio.createGain());
        impact.gain.value = 0.92;
        var clip = makeClip(audio, bucket);
        if (clip) {
          impact.connect(clip);
          clip.connect(master);
        } else {
          impact.connect(master);
        }
        var chimes = track(bucket, audio.createGain());
        chimes.gain.value = 1;
        chimes.connect(master);
        var echo = makeEcho(audio, bucket);
        chimes.connect(echo);

        tone(audio, {
          time: t,
          type: "sine",
          freq: 168,
          freqTo: 40,
          freqRamp: 0.42,
          dur: 1.05,
          peak: 0.5,
          attack: 0.012,
          dest: impact
        }, bucket);
        tone(audio, {
          time: t + 0.02,
          type: "sine",
          freq: 84,
          freqTo: 32,
          freqRamp: 0.48,
          dur: 0.95,
          peak: 0.28,
          attack: 0.03,
          dest: impact
        }, bucket);
        tone(audio, {
          time: t,
          type: "triangle",
          freq: 240,
          freqTo: 86,
          freqRamp: 0.08,
          dur: 0.09,
          peak: 0.18,
          attack: 0.004,
          dest: impact
        }, bucket);
        noiseShot(audio, {
          time: t,
          dur: 0.22,
          peak: 0.22,
          freq: 980,
          freqTo: 150,
          filter: "lowpass",
          dest: impact
        }, bucket);
        tone(audio, {
          time: t + 0.04,
          type: "sine",
          freq: 164.81,
          dur: 1.15,
          peak: 0.06,
          attack: 0.05,
          dest: chimes
        }, bucket);
        tone(audio, {
          time: t + 0.05,
          type: "sine",
          freq: 246.94,
          dur: 1.05,
          peak: 0.045,
          attack: 0.05,
          dest: chimes
        }, bucket);

        var chord = [659.25, 830.61, 987.77, 1479.98];
        for (var i = 0; i < chord.length; i++) {
          bell(audio, t + 0.06 + i * 0.02, chord[i], 1.45, 0.042, chimes, bucket);
        }
        noiseShot(audio, {
          time: t + 0.05,
          dur: 0.09,
          peak: 0.035,
          freq: 4200,
          filter: "highpass",
          dest: chimes
        }, bucket);
        releaseBus(bucket, 2800);
        return true;
      } catch (err) {
        oathUntil = 0;
        for (var k = 0; k < bucket.length; k++) safeDisconnect(bucket[k]);
        return false;
      }
    }

  function playRankUp() {
    var audio = ensureCtx();
    if (!audio || !master) {
      vibrate([28, 82, 28, 82, 30, 80, 32, 90, 36, 100, 44, 120, 100]);
      return false;
    }
    var t = audio.currentTime;
    if (t < rankUntil) return false;
    rankUntil = t + 1.45;
    vibrate([28, 82, 28, 82, 30, 80, 32, 90, 36, 100, 44, 120, 100]);
      var bucket = [];
      try {
        var bus = makeBus(audio, bucket);
        noiseShot(audio, {
          time: t,
          dur: 0.06,
          peak: 0.05,
          freq: 1400,
          filter: "bandpass",
          q: 0.7,
          dest: bus
        }, bucket);
        var fanfare = [
          { f: 261.63, at: 0.0, d: 0.2, p: 0.07 },
          { f: 329.63, at: 0.11, d: 0.2, p: 0.07 },
          { f: 392.0, at: 0.22, d: 0.2, p: 0.072 },
          { f: 523.25, at: 0.33, d: 0.22, p: 0.074 },
          { f: 659.25, at: 0.45, d: 0.24, p: 0.076 },
          { f: 783.99, at: 0.58, d: 0.28, p: 0.08 }
        ];
        for (var i = 0; i < fanfare.length; i++) {
          var note = fanfare[i];
          brass(audio, t + note.at, note.f, note.d, note.p, bus, bucket);
        }
        var chord = [523.25, 659.25, 783.99, 1046.5];
        for (var c = 0; c < chord.length; c++) {
          brass(audio, t + 0.74, chord[c], 0.82, 0.05, bus, bucket);
        }
        tone(audio, {
          time: t + 0.74,
          type: "sine",
          freq: 130.81,
          dur: 0.7,
          peak: 0.08,
          attack: 0.02,
          dest: bus
        }, bucket);
        releaseBus(bucket, 2200);
        return true;
      } catch (err) {
        rankUntil = 0;
        for (var k = 0; k < bucket.length; k++) safeDisconnect(bucket[k]);
        return false;
      }
    }

  function playPanicSiren() {
    var audio = ensureCtx();
    if (!audio || !master) {
      vibrate([70, 90, 70, 90, 70, 90, 75, 85, 80, 80, 150]);
      return false;
    }
    var t = audio.currentTime;
    if (t < panicUntil) return false;
    panicUntil = t + 1.15;
    vibrate([70, 90, 70, 90, 70, 90, 75, 85, 80, 80, 150]);
      var bucket = [];
      try {
        var bus = makeBus(audio, bucket);
        var pulses = 6;
        for (var i = 0; i < pulses; i++) {
          var at = t + i * 0.16;
          var freq = 76 + i * 12;
          var dur = i === pulses - 1 ? 0.28 : 0.12;
          var peak = 0.3 + i * 0.025;
          tone(audio, {
            time: at,
            type: "sine",
            freq: freq,
            freqTo: freq * 0.9,
            freqRamp: dur * 0.8,
            dur: dur,
            peak: peak,
            attack: 0.006,
            dest: bus
          }, bucket);
          tone(audio, {
            time: at,
            type: "sine",
            freq: freq * 0.5,
            dur: dur,
            peak: peak * 0.55,
            attack: 0.006,
            dest: bus
          }, bucket);
          tone(audio, {
            time: at,
            type: "triangle",
            freq: Math.min(460, freq * 3.1),
            dur: 0.028,
            peak: 0.07,
            attack: 0.003,
            dest: bus
          }, bucket);
        }
        releaseBus(bucket, 1600);
        return true;
      } catch (err) {
        panicUntil = 0;
        for (var k = 0; k < bucket.length; k++) safeDisconnect(bucket[k]);
        return false;
      }
    }

  function unlock() {
    var audio = ensureCtx();
    if (!audio) return Promise.resolve(false);
    try {
      var buffer = audio.createBuffer(1, 1, audio.sampleRate || 44100);
      var src = audio.createBufferSource();
      src.buffer = buffer;
      if (master) src.connect(master);
      var t = audio.currentTime;
      src.start(t);
      src.stop(t + 0.02);
      src.onended = function () { safeDisconnect(src); };
    } catch (err) { /* a resume() alone is enough on modern browsers */ }
    try {
      var resumed = audio.resume && audio.resume();
      if (resumed && typeof resumed.then === "function") {
        return resumed.then(
          function () { return true; },
          function () { return audio.state === "running"; }
        );
      }
    } catch (err) { /* fall through */ }
    return Promise.resolve(audio.state === "running");
  }

  function installUnlock() {
    if (!root || typeof root.addEventListener !== "function" || root.__dopamineFxGesture) return;
    root.__dopamineFxGesture = true;
    var events = ["pointerdown", "touchstart", "keydown"];
    var onGesture = function () {
      unlock();
      for (var i = 0; i < events.length; i++) {
        try { root.removeEventListener(events[i], onGesture, true); } catch (err) { /* ignore */ }
      }
    };
    for (var e = 0; e < events.length; e++) {
      try { root.addEventListener(events[e], onGesture, true); } catch (err) { /* ignore */ }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Speech                                                                 */
  /* --------------------------------------------------------------------- */

  var FEMALE = ["samantha", "victoria", "zira", "susan", "karen", "moira", "fiona", "serena", "kathy", "allison", "ava", "zoe", "nora", "jenny", "aria", "sara", "female", "woman", "salli", "ivy", "joanna", "kimberly", "kendra", "alexa"];
  var MALE = ["daniel", "david", "alex", "aaron", "arthur", "brian", "george", "rishi", "christopher", "guy", "james", "tom", "male"];
  var cachedVoice = null;
  var cachedVoiceCount = -1;

  function scoreVoice(voice) {
    var name = String(voice.name || "").toLowerCase();
    var lang = String(voice.lang || "").toLowerCase();
    var score = 0;
    var english = lang.indexOf("en") === 0 || name.indexOf("english") !== -1;
    if (!english) score -= 6;
    if (lang.indexOf("en-gb") === 0 || lang.indexOf("en_gb") === 0) score += 4;
    else if (lang.indexOf("en-us") === 0 || lang.indexOf("en_us") === 0) score += 3;
    else if (english) score += 1;
    if (name.indexOf("google uk english male") !== -1) score += 8;
    if (name.indexOf("google us english male") !== -1) score += 6;
    for (var m = 0; m < MALE.length; m++) {
      if (name.indexOf(MALE[m]) !== -1) score += MALE[m] === "fred" ? 3 : 8;
    }
    if (name.indexOf("fred") !== -1) score += 3;
    for (var f = 0; f < FEMALE.length; f++) {
      if (name.indexOf(FEMALE[f]) !== -1) score -= 12;
    }
    if (voice.default) score += 0.4;
    return score;
  }

  function pickCoachVoice() {
    var synth = root.speechSynthesis;
    if (!synth || typeof synth.getVoices !== "function") return null;
    var voices = synth.getVoices() || [];
    if (cachedVoice && voices.length === cachedVoiceCount) return cachedVoice;
    cachedVoiceCount = voices.length;
    var best = null;
    var bestScore = -1e9;
    for (var i = 0; i < voices.length; i++) {
      var score = scoreVoice(voices[i]);
      if (score > bestScore) {
        bestScore = score;
        best = voices[i];
      }
    }
    cachedVoice = best;
    return best;
  }

  function makeUtterance(text) {
    var Utter = root.SpeechSynthesisUtterance;
    var utter = new Utter(text);
    utter.rate = 0.92;
    utter.pitch = 0.7;
    utter.volume = 1;
    utter.lang = "en-US";
    var voice = pickCoachVoice();
    if (voice) {
      utter.voice = voice;
      if (voice.lang) utter.lang = voice.lang;
    }
    utter.onerror = function () {};
    return utter;
  }

  function speakCoach(text) {
    if (muted) return null;
    var spoken = String(text == null ? "" : text).replace(/\s+/g, " ").trim().slice(0, 400);
    if (!spoken) return null;
    var synth = root.speechSynthesis;
    var Utter = root.SpeechSynthesisUtterance;
    if (!synth || typeof synth.speak !== "function" || typeof Utter !== "function") return null;
    var gen = ++speechGen;
    var queued = null;
    var speakNow = function () {
      if (gen !== speechGen || muted) return;
      try {
        queued = makeUtterance(spoken);
        synth.speak(queued);
      } catch (err) { /* speech engine unavailable */ }
    };
    try {
      var voices = typeof synth.getVoices === "function" ? synth.getVoices() : [];
      if ((!voices || !voices.length) && typeof synth.addEventListener === "function") {
        var onVoices = function () {
          try { synth.removeEventListener("voiceschanged", onVoices); } catch (err) { /* ignore */ }
          cachedVoice = null;
          cachedVoiceCount = -1;
          if (gen !== speechGen || muted) return;
          try { synth.cancel(); } catch (err) { /* ignore */ }
          later(40, speakNow);
        };
        synth.addEventListener("voiceschanged", onVoices);
      }
      var busy = !!(synth.speaking || synth.pending);
      if (busy) {
        try { synth.cancel(); } catch (err) { /* ignore */ }
        later(50, speakNow);
      } else {
        speakNow();
      }
    } catch (err) {
      return null;
    }
    return queued;
  }

  /* --------------------------------------------------------------------- */
  /* Haptics                                                                */
  /* --------------------------------------------------------------------- */

  function sanitizePattern(pattern) {
    if (typeof pattern === "number" && Number.isFinite(pattern)) {
      return clamp(Math.round(pattern), 0, 5000);
    }
    if (!Array.isArray(pattern)) return 12;
    var out = [];
    var limit = Math.min(pattern.length, 32);
    for (var i = 0; i < limit; i++) {
      var v = Number(pattern[i]);
      if (!Number.isFinite(v)) continue;
      out.push(clamp(Math.round(v), 0, 5000));
    }
    return out.length ? out : 12;
  }

  function vibrate(pattern) {
    try {
      var nav = root.navigator;
      if (!nav || typeof nav.vibrate !== "function") return false;
      var clean = sanitizePattern(pattern);
      var result = nav.vibrate(clean);
      return result !== false;
    } catch (err) {
      return false;
    }
  }

  /* --------------------------------------------------------------------- */
  /* Particles                                                              */
  /* --------------------------------------------------------------------- */

  var PALETTES = {
    seal: [EMERALD, EMERALD_BRIGHT, MINT, GOLD, GOLD_HOT, HOT],
    rank: [GOLD, GOLD_HOT, AMBER, EMERALD, EMERALD_BRIGHT, WHITE],
    confetti: [EMERALD, GOLD, WHITE, "#059669", AMBER],
    ember: [GOLD, GOLD_HOT, EMERALD, "#f97316", HOT],
    spark: [EMERALD, EMERALD_BRIGHT, HOT, GOLD_HOT]
  };

  function normalizeMode(mode) {
    var key = String(mode || "seal").toLowerCase();
    if (key === "oath" || key === "pledge") return "seal";
    if (key === "embers") return "ember";
    if (key === "rankup" || key === "victory" || key === "urge") return "rank";
    if (key === "sparks") return "spark";
    if (PALETTES[key]) return key;
    return "seal";
  }

  function defaultCount(mode) {
    if (mode === "ember") return 72;
    if (mode === "confetti") return 96;
    if (mode === "rank") return 140;
    if (mode === "spark") return 84;
    return 118;
  }

  function clampInt(value, fallback, min, max) {
    if (value == null || value === "") return fallback;
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return clamp(Math.round(n), min, max);
  }

  function sanitizeColors(input, fallback) {
    if (!Array.isArray(input)) return fallback.slice();
    var out = [];
    for (var i = 0; i < input.length && out.length < 12; i++) {
      if (typeof input[i] === "string" && input[i] && input[i].length < 40) out.push(input[i]);
    }
    return out.length ? out : fallback.slice();
  }

  function resolveOrigin(opts) {
    var x = Number(opts.x);
    var y = Number(opts.y);
    if ((!Number.isFinite(x) || !Number.isFinite(y)) && opts.origin) {
      x = Number(opts.origin.x);
      y = Number(opts.origin.y);
    }
    if ((!Number.isFinite(x) || !Number.isFinite(y)) && opts.anchor && root.document) {
      var el = typeof opts.anchor === "string" && root.document.querySelector
        ? root.document.querySelector(opts.anchor)
        : opts.anchor;
      if (el && typeof el.getBoundingClientRect === "function") {
        var rect = el.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }
    if (!Number.isFinite(x)) x = (root.innerWidth || 360) / 2;
    if (!Number.isFinite(y)) y = (root.innerHeight || 640) / 2;
    return { x: x, y: y };
  }

  function pickKind(mode) {
    var roll = Math.random();
    if (mode === "ember") return "ember";
    if (mode === "spark") return "spark";
    if (mode === "confetti") return roll < 0.84 ? "confetti" : "spark";
    if (mode === "rank") {
      if (roll < 0.42) return "confetti";
      if (roll < 0.74) return "spark";
      return "ember";
    }
    if (roll < 0.58) return "spark";
    if (roll < 0.92) return "ember";
    return "confetti";
  }

  function makeParticle(origin, opts) {
    var kind = pickKind(opts.mode);
    var color = opts.colors[(Math.random() * opts.colors.length) | 0];
    var life = opts.duration * (0.45 + Math.random() * 0.55);
    var spread = Number(opts.spread);
    var useSpread = Number.isFinite(spread);
    var angle;
    if (kind === "spark" && !useSpread) angle = Math.random() * Math.PI * 2;
    else if (useSpread && kind === "spark") angle = -Math.PI / 2 + (Math.random() - 0.5) * clamp(spread, 0, Math.PI * 2);
    else if (kind === "ember") angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.05;
    else angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;

    var speed;
    var gravity;
    var drag;
    if (kind === "spark") {
      speed = 340 + Math.random() * 980;
      gravity = 640 + Math.random() * 280;
      drag = 1.25;
      life *= 0.52;
    } else if (kind === "ember") {
      speed = 50 + Math.random() * 170;
      gravity = 50 + Math.random() * 80;
      drag = 0.35;
      life *= 1.15;
    } else {
      speed = 220 + Math.random() * 540;
      gravity = 980;
      drag = 0.5;
    }
    var scale = Number(opts.speed);
    if (Number.isFinite(scale)) speed *= clamp(scale, 0.2, 3);
    if (Number.isFinite(Number(opts.gravity)) && opts.gravity != null && opts.gravity !== "") {
      gravity = Number(opts.gravity);
    }

    return {
      kind: kind,
      color: color,
      x: origin.x + (kind === "ember" ? (Math.random() - 0.5) * 16 : 0),
      y: origin.y + (kind === "ember" ? Math.random() * 6 : 0),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: gravity,
      drag: drag,
      life: life,
      maxLife: life,
      size: kind === "spark" ? 1.1 + Math.random() * 1.7 : 1.8 + Math.random() * 2.4,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: kind === "confetti" ? (Math.random() - 0.5) * 14 : 0,
      seed: Math.random() * Math.PI * 2,
      flicker: 6 + Math.random() * 8,
      shape: Math.random() < 0.55 ? "rect" : "ribbon"
    };
  }

  function resizeCanvas() {
    var canvas = fx.canvas;
    var g = fx.ctx2d;
    if (!canvas || !g) return;
    var dpr = clamp(root.devicePixelRatio || 1, 1, 2);
    var w = Math.max(1, root.innerWidth || (root.document && root.document.documentElement && root.document.documentElement.clientWidth) || 1);
    var h = Math.max(1, root.innerHeight || (root.document && root.document.documentElement && root.document.documentElement.clientHeight) || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    if (g.setTransform) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.width = w;
    fx.height = h;
  }

  function teardown() {
    if (fx.raf) cancelFrame(fx.raf);
    fx.raf = 0;
    fx.particles.length = 0;
    if (fx.onResize) {
      try { root.removeEventListener("resize", fx.onResize); } catch (err) { /* ignore */ }
      fx.onResize = null;
    }
    var canvas = fx.canvas;
    fx.canvas = null;
    fx.ctx2d = null;
    if (canvas && canvas.parentNode) {
      try { canvas.parentNode.removeChild(canvas); } catch (err) { /* ignore */ }
    }
  }

  function ensureCanvas(zIndex) {
    if (fx.canvas && fx.canvas.isConnected !== false && fx.ctx2d) {
      if (zIndex) fx.canvas.style.zIndex = String(zIndex);
      return fx.canvas;
    }
    var doc = root.document;
    if (!doc || !doc.body || typeof doc.createElement !== "function") return null;
    if (typeof doc.querySelector === "function") {
      var stray = doc.querySelector("canvas[data-dopamine-fx='burst']");
      if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
    }
    var canvas = doc.createElement("canvas");
    if (canvas.setAttribute) {
      canvas.setAttribute("data-dopamine-fx", "burst");
      canvas.setAttribute("aria-hidden", "true");
    }
    canvas.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "pointer-events:none",
      "background:transparent",
      "display:block",
      "z-index:" + zIndex
    ].join(";");
    doc.body.appendChild(canvas);
    var g = canvas.getContext && canvas.getContext("2d", { alpha: true });
    if (!g && canvas.getContext) g = canvas.getContext("2d");
    if (!g) return null;
    fx.canvas = canvas;
    fx.ctx2d = g;
    fx.onResize = resizeCanvas;
    if (typeof root.addEventListener === "function") root.addEventListener("resize", fx.onResize);
    resizeCanvas();
    return canvas;
  }

  function drawSpark(g, p) {
    var alpha = Math.max(0, p.life / p.maxLife);
    var fade = alpha * alpha;
    g.globalAlpha = fade;
    g.strokeStyle = p.color;
    g.lineWidth = p.size;
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x - p.vx * 0.032, p.y - p.vy * 0.032);
    g.stroke();
    g.globalAlpha = fade * 0.95;
    g.fillStyle = WHITE;
    g.beginPath();
    g.arc(p.x, p.y, Math.max(0.6, p.size * 0.42), 0, Math.PI * 2);
    g.fill();
  }

  function drawEmber(g, p, ts) {
    var alpha = Math.max(0, p.life / p.maxLife);
    var flick = 0.58 + 0.42 * Math.sin(ts / 1000 * p.flicker + p.seed);
    g.globalAlpha = alpha * 0.28 * flick;
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = alpha * flick;
    g.beginPath();
    g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = alpha * 0.8;
    g.fillStyle = "#fffbeb";
    g.beginPath();
    g.arc(p.x, p.y, Math.max(0.5, p.size * 0.32), 0, Math.PI * 2);
    g.fill();
  }

  function drawConfetti(g, p) {
    var alpha = Math.max(0, p.life / p.maxLife);
    g.save();
    g.globalAlpha = alpha;
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.fillStyle = p.color;
    if (p.shape === "ribbon") g.fillRect(-p.w, -p.h * 0.3, p.w * 2, p.h * 0.6);
    else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    g.restore();
  }

  function frame(ts) {
    fx.raf = 0;
    try {
      frameBody(ts);
    } catch (err) {
      teardown();
    }
  }

  function frameBody(ts) {
    var g = fx.ctx2d;
    if (!g || !fx.canvas || fx.canvas.isConnected === false) {
      teardown();
      return;
    }
    var prev = frame.last || 0;
      frame.last = ts;
      var dt = prev ? (ts - prev) / 1000 : 0;
      if (!Number.isFinite(dt) || dt < 0) dt = 0;
      if (dt > 0.034) dt = 0.034;

      var list = fx.particles;
      var write = 0;
      var w = fx.width || 1;
      var h = fx.height || 1;
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        p.life -= dt * 1000;
        if (p.life <= 0) continue;
        if (p.kind === "ember") p.vx += Math.sin(ts / 1000 * 2.4 + p.seed) * 28 * dt;
        p.vy += p.gravity * dt;
        var damp = Math.exp(-p.drag * dt);
        p.vx *= damp;
        p.vy *= damp;
        if (p.vx > 2500) p.vx = 2500;
        else if (p.vx < -2500) p.vx = -2500;
        if (p.vy > 2500) p.vy = 2500;
        else if (p.vy < -2500) p.vy = -2500;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.x < -140 || p.y < -140 || p.x > w + 140 || p.y > h + 140) continue;
        list[write++] = p;
      }
      list.length = write;

      if (g.setTransform && root.devicePixelRatio) {
        var dpr = clamp(root.devicePixelRatio || 1, 1, 2);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      g.clearRect(0, 0, w, h);
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      for (var s = 0; s < list.length; s++) {
        if (list[s].kind === "spark") drawSpark(g, list[s]);
        else if (list[s].kind === "ember") drawEmber(g, list[s], ts);
      }
      g.globalCompositeOperation = "source-over";
      for (var c = 0; c < list.length; c++) {
        if (list[c].kind === "confetti") drawConfetti(g, list[c]);
      }
      g.globalAlpha = 1;

      if (list.length && fx.canvas) fx.raf = requestFrame(frame);
      else teardown();
    }

  var batchSeq = 0;

  function burstParticles(options) {
    try {
      var opts = options || {};
      if (typeof opts === "string" || (opts && opts.nodeType === 1)) opts = { anchor: opts };
      var mode = normalizeMode(opts.mode);
      var count = clampInt(opts.count, defaultCount(mode), 0, 420);
      if (reducedMotion()) count = Math.min(count, Math.max(0, Math.round(count * 0.4)));
      var duration = clampInt(opts.duration, 1700, 200, 6000);
      if (reducedMotion()) duration = Math.min(duration, 700);
      var zIndex = clampInt(opts.zIndex, 240, 1, 2147483000);
      var colors = sanitizeColors(opts.colors, PALETTES[mode]);
      var origin = resolveOrigin(opts);
      var spec = {
        mode: mode,
        duration: duration,
        colors: colors,
        spread: opts.spread,
        speed: opts.speed,
        gravity: opts.gravity
      };
      if (!count) return { count: 0, cancel: function () {} };
      if (!ensureCanvas(zIndex)) return { count: 0, cancel: function () {} };
      var batch = ++batchSeq;
      var spawned = 0;
      for (var i = 0; i < count; i++) {
        var p = makeParticle(origin, spec);
        p.batch = batch;
        fx.particles.push(p);
        spawned++;
      }
      var overflow = fx.particles.length - 480;
      if (overflow > 0) fx.particles.splice(0, overflow);
      if (!fx.raf) {
        frame.last = 0;
        fx.raf = requestFrame(frame);
      }
      return {
        count: spawned,
        cancel: function () {
          fx.particles = fx.particles.filter(function (particle) { return particle.batch !== batch; });
          if (!fx.particles.length) teardown();
        }
      };
    } catch (err) {
      return { count: 0, cancel: function () {} };
    }
  }

  /* --------------------------------------------------------------------- */
  /* Neural brain                                                           */
  /* --------------------------------------------------------------------- */

  var BRAIN = (function () {
    var left = [
      [128, 66], [96, 86], [146, 98], [74, 120], [114, 124], [152, 136],
      [66, 164], [106, 168], [144, 170], [88, 206], [124, 208], [156, 200],
      [114, 242], [148, 236]
    ];
    var nodes = [];
    for (var i = 0; i < left.length; i++) {
      var L = { x: left[i][0], y: left[i][1], side: "L" };
      var R = { x: 360 - left[i][0], y: left[i][1], side: "R" };
      L.mirror = nodes.length + 1;
      R.mirror = nodes.length;
      nodes.push(L, R);
    }
    var centerYs = [78, 120, 164, 208, 250];
    var core = -1;
    for (var c = 0; c < centerYs.length; c++) {
      if (c === 2) core = nodes.length;
      nodes.push({ x: 180, y: centerYs[c], side: "C", core: c === 2 });
    }
    var edges = [];
    var seen = Object.create(null);
    function link(a, b, force) {
      if (a === b || a < 0 || b < 0 || a >= nodes.length || b >= nodes.length) return;
      var i = a < b ? a : b;
      var j = a < b ? b : a;
      var key = i + ":" + j;
      if (seen[key]) return;
      var dx = nodes[i].x - nodes[j].x;
      var dy = nodes[i].y - nodes[j].y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (!force && (d < 8 || d > 150)) return;
      seen[key] = 1;
      edges.push([i, j]);
    }
    function nearest(index, k, limit) {
      var ranked = [];
      for (var j = 0; j < nodes.length; j++) {
        if (j === index) continue;
        var dx = nodes[index].x - nodes[j].x;
        var dy = nodes[index].y - nodes[j].y;
        ranked.push({ j: j, d: Math.sqrt(dx * dx + dy * dy) });
      }
      ranked.sort(function (a, b) { return a.d - b.d; });
      var added = 0;
      for (var n = 0; n < ranked.length && added < k; n++) {
        if (ranked[n].d <= limit) {
          link(index, ranked[n].j, false);
          added++;
        }
      }
      return ranked;
    }
    for (var n = 0; n < nodes.length; n++) {
      var rank = nearest(n, nodes[n].core ? 6 : 2, nodes[n].core ? 112 : 86);
      if (!nodes[n].core && n % 5 === 0 && rank[3] && rank[3].d < 132) link(n, rank[3].j, false);
    }
    for (var m = 0; m < nodes.length; m++) {
      if (nodes[m].side === "L" && m % 4 === 0) link(m, nodes[m].mirror, false);
    }
    var degree = [];
    for (var d = 0; d < nodes.length; d++) degree.push(0);
    for (var e = 0; e < edges.length; e++) {
      degree[edges[e][0]]++;
      degree[edges[e][1]]++;
    }
    for (var u = 0; u < nodes.length; u++) {
      if (degree[u] > 0) continue;
      var best = -1;
      var bestD = Infinity;
      for (var v = 0; v < nodes.length; v++) {
        if (u === v) continue;
        var ddx = nodes[u].x - nodes[v].x;
        var ddy = nodes[u].y - nodes[v].y;
        var dist = ddx * ddx + ddy * ddy;
        if (dist < bestD) {
          bestD = dist;
          best = v;
        }
      }
      if (best >= 0) {
        link(u, best, true);
        degree[u]++;
        degree[best]++;
      }
    }
    return { nodes: nodes, edges: edges, core: core, cx: 180, cy: 164 };
  })();

  function reticlePath(cx, cy, radius, ticks) {
    var d = "";
    for (var i = 0; i < ticks; i++) {
      var a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
      var inner = radius + (i % 4 === 0 ? 0 : 3);
      var outer = radius + (i % 4 === 0 ? 11 : 6);
      d += "M" + n1(cx + Math.cos(a) * inner) + " " + n1(cy + Math.sin(a) * inner);
      d += "L" + n1(cx + Math.cos(a) * outer) + " " + n1(cy + Math.sin(a) * outer);
    }
    return d;
  }

  function renderBrainSVG(percent, rankCode) {
    try {
      return buildBrainSVG(percent, rankCode);
    } catch (err) {
      var safeRank = escapeXml(String(rankCode == null ? "" : rankCode).slice(0, 12));
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 340" role="img" aria-label="Dopamine rewiring"><circle cx="180" cy="164" r="28" fill="' + CRIMSON_DEEP + '"/><text x="180" y="170" text-anchor="middle" fill="#f8fafc" font-size="16">' + safeRank + "</text></svg>";
    }
  }

  function buildBrainSVG(percent, rankCode) {
    var pct = Math.round(clampPercent(percent));
    var fraction = pct / 100;
    var rankRaw = String(rankCode == null ? "" : rankCode).trim().slice(0, 12);
    var rankLabel = rankRaw || String(Math.round(pct));
    var id = "dfxB" + (++brainSeq);
    var nodes = BRAIN.nodes;
    var edges = BRAIN.edges;
    var cx = BRAIN.cx;
    var cy = BRAIN.cy;
    var order = [];
    for (var i = 0; i < edges.length; i++) order.push(i);
    order.sort(function (a, b) {
      var ea = edges[a];
      var eb = edges[b];
      var amx = (nodes[ea[0]].x + nodes[ea[1]].x) / 2 - cx;
      var amy = (nodes[ea[0]].y + nodes[ea[1]].y) / 2 - cy;
      var bmx = (nodes[eb[0]].x + nodes[eb[1]].x) / 2 - cx;
      var bmy = (nodes[eb[0]].y + nodes[eb[1]].y) / 2 - cy;
      return (amx * amx + amy * amy) - (bmx * bmx + bmy * bmy);
    });
    var litCount = pct <= 0 ? 0 : Math.min(edges.length, Math.max(1, Math.round(fraction * edges.length)));
    if (pct >= 100) litCount = edges.length;
    var live = [];
    for (var z = 0; z < edges.length; z++) live.push(false);
    for (var r = 0; r < litCount; r++) live[order[r]] = true;
    var nodeLive = [];
    for (var nl = 0; nl < nodes.length; nl++) nodeLive.push(false);
    for (var e = 0; e < edges.length; e++) {
      if (!live[e]) continue;
      nodeLive[edges[e][0]] = true;
      nodeLive[edges[e][1]] = true;
    }
    var damage = 1 - fraction;
    function dormantCrimson(index) {
      var threshold = 0.28 + damage * 0.57;
      var hash = ((index * 53 + 11) % 100) / 100;
      return hash < threshold;
    }
    var reduced = reducedMotion();
    var coreColor = fraction < 0.5 ? mixHex(CRIMSON_DEEP, TEAL, fraction / 0.5) : mixHex(TEAL, EMERALD, (fraction - 0.5) / 0.5);
    var hud = mixHex(SLATE, EMERALD, Math.max(0.12, fraction));
    var outline = mixHex(CRIMSON_DEEP, EMERALD, fraction);
    var caption = pct < 8 ? CRIMSON_NODE : EMERALD;
    var ringR = 34;
    var circ = 2 * Math.PI * ringR;
    var filled = fraction * circ;
    var gap = Math.max(0, circ - filled);
    var fontSize = rankLabel.length <= 2 ? 20 : rankLabel.length <= 4 ? 15 : rankLabel.length <= 6 ? 11 : 8;
    var title = "Dopamine rewiring " + Math.round(pct) + " percent, rank " + (rankRaw || "unranked");
    var parts = [];
    parts.push(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 340" width="360" height="340" role="img" focusable="false" preserveAspectRatio="xMidYMid meet" data-rewire="' + Math.round(pct) + '" data-rank="' + escapeXml(rankRaw) + '" aria-label="' + escapeXml(title) + '" style="width:100%;height:auto;display:block">'
    );
    parts.push("<title>" + escapeXml(title) + "</title>");
    parts.push("<defs>");
    parts.push(
      '<filter id="' + id + '-glow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2.15" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    );
    parts.push(
      '<filter id="' + id + '-core" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="3.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    );
    parts.push(
      '<radialGradient id="' + id + '-fill" cx="50%" cy="42%" r="62%"><stop offset="0%" stop-color="' + coreColor + '" stop-opacity="' + (0.16 + fraction * 0.38).toFixed(3) + '"/><stop offset="72%" stop-color="#07090e" stop-opacity="0.18"/><stop offset="100%" stop-color="#07090e" stop-opacity="0"/></radialGradient>'
    );
    parts.push("</defs>");
    parts.push('<path d="' + reticlePath(cx, cy, 126, 40) + '" fill="none" stroke="' + hud + '" stroke-width="1" opacity="0.55"/>');
    parts.push('<path d="M180,44 C214,40 252,56 276,86 C304,82 324,110 322,144 C334,166 326,198 304,216 C314,234 308,260 286,274 C266,288 236,282 214,266 C206,278 194,288 180,288 C166,288 154,278 146,266 C124,282 94,288 74,274 C52,260 46,234 56,216 C34,198 26,166 38,144 C36,110 56,82 84,86 C108,56 146,40 180,44 Z" fill="url(#' + id + '-fill)" stroke="' + outline + '" stroke-width="1.4"/>');
    parts.push('<path d="M180,52 C174,98 188,134 180,164 C170,206 190,246 180,276" fill="none" stroke="' + hud + '" stroke-width="1.2" stroke-dasharray="3 6" opacity="0.7"/>');
    parts.push('<path d="M96,104 C124,114 142,104 154,124 M82,156 C112,166 132,154 150,174 M104,204 C132,194 146,214 154,232" fill="none" stroke="' + hud + '" stroke-width="1" opacity="0.28"/>');
    parts.push('<path d="M264,104 C236,114 218,104 206,124 M278,156 C248,166 228,154 210,174 M256,204 C228,194 214,214 206,232" fill="none" stroke="' + hud + '" stroke-width="1" opacity="0.28"/>');

    var slateLines = "";
    var crimsonLines = "";
    var liveLines = "";
    for (var li = 0; li < edges.length; li++) {
      var a = nodes[edges[li][0]];
      var b = nodes[edges[li][1]];
      var line = '<line x1="' + n1(a.x) + '" y1="' + n1(a.y) + '" x2="' + n1(b.x) + '" y2="' + n1(b.y) + '" stroke-linecap="round" vector-effect="non-scaling-stroke" ';
      if (live[li]) {
        liveLines += line + 'stroke="' + EMERALD + '" stroke-width="1.7"/>';
      } else if (dormantCrimson(li)) {
        crimsonLines += line + 'stroke="' + CRIMSON + '" stroke-width="1.15" opacity="0.72"/>';
      } else {
        slateLines += line + 'stroke="' + SLATE + '" stroke-width="1.05" opacity="0.85"/>';
      }
    }
    parts.push(slateLines);
    parts.push(crimsonLines);
    parts.push('<g filter="url(#' + id + '-glow)">' + liveLines + "</g>");

    if (!reduced && litCount > 0) {
      var travelers = [];
      for (var ti = 0; ti < edges.length; ti++) {
        if (!live[ti]) continue;
        var pa = nodes[edges[ti][0]];
        var pb = nodes[edges[ti][1]];
        var dx = pa.x - pb.x;
        var dy = pa.y - pb.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        travelers.push({ a: pa, b: pb, len: len });
      }
      travelers.sort(function (p, q) { return q.len - p.len; });
      var take = travelers.slice(0, 7);
      for (var tv = 0; tv < take.length; tv++) {
        var tr = take[tv];
        var dur = (1.45 + (tv % 4) * 0.22).toFixed(2);
        parts.push(
          '<circle r="2.1" fill="' + HOT + '"><animateMotion dur="' + dur + 's" repeatCount="indefinite" path="M' + n1(tr.a.x) + " " + n1(tr.a.y) + " L" + n1(tr.b.x) + " " + n1(tr.b.y) + '"/></circle>'
        );
      }
    }

    for (var ni = 0; ni < nodes.length; ni++) {
      if (nodes[ni].core) continue;
      var node = nodes[ni];
      if (nodeLive[ni]) {
        parts.push('<circle cx="' + n1(node.x) + '" cy="' + n1(node.y) + '" r="6.5" fill="' + EMERALD + '" opacity="0.16"/>');
        parts.push('<circle cx="' + n1(node.x) + '" cy="' + n1(node.y) + '" r="2.7" fill="' + EMERALD_BRIGHT + '"/>');
        parts.push('<circle cx="' + n1(node.x) + '" cy="' + n1(node.y) + '" r="1.1" fill="' + HOT + '"/>');
      } else if (dormantCrimson(ni + 3)) {
        parts.push('<circle cx="' + n1(node.x) + '" cy="' + n1(node.y) + '" r="4.2" fill="' + CRIMSON + '" opacity="0.14"/>');
        parts.push('<circle cx="' + n1(node.x) + '" cy="' + n1(node.y) + '" r="2.2" fill="' + CRIMSON_NODE + '"/>');
      } else {
        parts.push('<circle cx="' + n1(node.x) + '" cy="' + n1(node.y) + '" r="2.1" fill="' + SLATE_NODE + '"/>');
      }
    }

    parts.push('<g filter="url(#' + id + '-core)">');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="26" fill="' + coreColor + '" opacity="0.9">' + (reduced ? "" : '<animate attributeName="opacity" values="0.55;0.98;0.55" dur="2.6s" repeatCount="indefinite"/>') + "</circle>");
    parts.push("</g>");
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + ringR + '" fill="none" stroke="' + (pct < 35 ? "#7f1d1d" : TRACK) + '" stroke-width="3"/>');
    if (pct > 0.4) {
      var dash = pct >= 99.5 ? "" : ' stroke-dasharray="' + filled.toFixed(2) + " " + gap.toFixed(2) + '"';
      parts.push('<g transform="rotate(-90 ' + cx + " " + cy + ')"><circle cx="' + cx + '" cy="' + cy + '" r="' + ringR + '" fill="none" stroke="' + EMERALD + '" stroke-width="3" stroke-linecap="round"' + dash + "/></g>");
    }
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="46" fill="none" stroke="' + hud + '" stroke-width="1" stroke-dasharray="2 7" opacity="0.8">' + (reduced ? "" : '<animateTransform attributeName="transform" type="rotate" from="0 ' + cx + " " + cy + '" to="360 ' + cx + " " + cy + '" dur="18s" repeatCount="indefinite"/>') + "</circle>");
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="8" fill="' + WHITE + '" opacity="' + (0.14 + fraction * 0.6).toFixed(3) + '"/>');
    if (rankRaw) {
      parts.push('<text x="' + cx + '" y="' + (cy - 12) + '" text-anchor="middle" fill="' + MINT + '" font-family="Segoe UI, Inter, Roboto, sans-serif" font-size="7" font-weight="700" letter-spacing="1.6">RANK</text>');
    }
    parts.push('<text x="' + cx + '" y="' + (cy + (rankRaw ? 8 : 2)) + '" text-anchor="middle" dominant-baseline="central" fill="' + WHITE + '" font-family="Segoe UI, Inter, Roboto, sans-serif" font-size="' + fontSize + '" font-weight="800" letter-spacing="0.5">' + escapeXml(rankLabel) + "</text>");
    parts.push('<text x="180" y="322" text-anchor="middle" fill="' + caption + '" font-family="Segoe UI, Inter, Roboto, sans-serif" font-size="11" font-weight="800" letter-spacing="2.2">D2 REWIRE ' + Math.round(pct) + "%</text>");
    parts.push("</svg>");
    return parts.join("");
  }

  /* --------------------------------------------------------------------- */
  /* Public API                                                             */
  /* --------------------------------------------------------------------- */

  function setMuted(value) {
    muted = !!value;
    speechGen += 1;
    cachedVoice = null;
    if (muted && root.speechSynthesis && typeof root.speechSynthesis.cancel === "function") {
      try { root.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
    }
    try { applyMute(); } catch (err) { /* context not ready */ }
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function isMuted() {
    return muted;
  }

  function stopAll() {
    stopChargeHum(true);
    speechGen += 1;
    panicUntil = 0;
    oathUntil = 0;
    rankUntil = 0;
    try {
      if (root.speechSynthesis && root.speechSynthesis.cancel) root.speechSynthesis.cancel();
    } catch (err) { /* ignore */ }
    try {
      if (root.navigator && typeof root.navigator.vibrate === "function") root.navigator.vibrate(0);
    } catch (err) { /* ignore */ }
    teardown();
  }

  var api = {
    version: "1.0.0",
    __built: true,
    playTick: playTick,
    startChargeHum: startChargeHum,
    updateChargePitch: updateChargePitch,
    stopChargeHum: stopChargeHum,
    playOathSealed: playOathSealed,
    playRankUp: playRankUp,
    playPanicSiren: playPanicSiren,
    speakCoach: speakCoach,
    vibrate: vibrate,
    burstParticles: burstParticles,
    renderBrainSVG: renderBrainSVG,
    setMuted: setMuted,
    toggleMute: toggleMute,
    isMuted: isMuted,
    unlock: unlock,
    stopAll: stopAll
  };

  Object.defineProperty(api, "muted", {
    enumerable: true,
    get: function () { return muted; },
    set: function (value) { setMuted(value); }
  });

  root.DopamineFX = api;
  installUnlock();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
