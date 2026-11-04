/**
 * IRON ARC funnel data and helpers.
 * Classic script. Publishes window.FunnelModule.
 *
 * Quiz answers stay on the in-memory session. Card numbers are validated
 * in the preview sheet and then discarded. Live charges go to Stripe
 * Payment Links only.
 */
(function (root) {
  "use strict";

  var HEALTHY_BASELINE = 22;
  var LOADER_DURATION_MS = 3500;
  var PENDING_KEY = "ironArc.pendingCheckout";
  var DISCLAIMER = "This index is a self-report protocol score for your Iron Arc plan. It is not a medical diagnosis, lab result, or measure of hormone levels.";

  var SEVERITY_WEIGHTS = {
    frequency: 30,
    escalation: 24,
    symptoms: 22,
    trigger: 12,
    attempts: 12
  };

  var PILLAR_META = [
    { id: "focus", label: "Mental Clarity" },
    { id: "androgen", label: "Morning Drive" },
    { id: "impulse", label: "Impulse Brake" },
    { id: "presence", label: "Social Presence" }
  ];

  var PILLAR_NOTES = {
    focus: {
      high: "Deep work is the system this pattern is taxing first.",
      mid: "Clarity is dented, and it usually moves in the first two weeks of the pact.",
      low: "Focus is ahead of your other pillars. Protect it while they catch up."
    },
    androgen: {
      high: "Morning drive is the lagging indicator in these answers.",
      mid: "Drive is uneven. The day-7 window is where it usually steadies.",
      low: "Androgen drive is holding better than the rest of the radar."
    },
    impulse: {
      high: "Escalation and the trigger window both pile onto impulse control.",
      mid: "Impulse control sits in the same band as the rest of the stack.",
      low: "Impulse control can lead. Keep the panic window armed."
    },
    presence: {
      high: "Social sharpness is downstream of the same loop.",
      mid: "Presence is close to the rest of the radar.",
      low: "Presence is ahead of the dependency score. Don't spend it late at night."
    }
  };

  var BAND_COPY = {
    severe: "Heavy downregulation. The 90-day arc is the right container.",
    high: "Elevated dependency. A signed pact beats another solo Monday.",
    elevated: "Above the healthy baseline. Structure now, before this becomes the default.",
    moderate: "Closer to baseline. Use the arc to lock the gain."
  };

  var LINK_KEYS = ["annual", "monthly", "downsell", "penaltyStake", "sovereign"];

  function iconLabel(icon, text) {
    return '<span class="fm-ico" aria-hidden="true">' + icon + "</span>" + escapeHtml(text);
  }

  var QUIZ_STEPS = [
    {
      id: "goal",
      phase: "Mission",
      tag: "01 • MISSION",
      question: "What brings you to Iron Arc?",
      sub: "Choose your primary target.",
      ack: "Goal locked.",
      selectionMode: "single",
      minSelections: 1,
      callout: null,
      options: [
        { id: "nnn", label: iconLabel("🛡️", "Block Porn Permanently"), shortLabel: "Block porn permanently", badge: "#1 Choice", rewireDays: 0 },
        { id: "fog", label: iconLabel("🧠", "Clear Brain Fog"), shortLabel: "Clear brain fog", badge: "Clarity", rewireDays: 0 },
        { id: "discipline", label: iconLabel("⚡", "Reclaim Drive & Focus"), shortLabel: "Reclaim drive & focus", badge: "Peak Edge", rewireDays: 0 },
        { id: "redemption", label: iconLabel("🔥", "Lock A 90-Day Streak"), shortLabel: "Lock a 90-day streak", badge: "Clean Slate", rewireDays: 0 }
      ]
    },
    {
      id: "age",
      phase: "Baseline",
      tag: "02 • BASELINE",
      question: "Where are you in your arc?",
      sub: "Calibrates your recovery curve.",
      ack: "Bracket locked.",
      selectionMode: "single",
      minSelections: 1,
      audience: "18+",
      callout: {
        type: "neuro-fact",
        kicker: "⚡ DAY-7 SURGE",
        body: "Testosterone sensitivity rebounds **+45%** at **Day 7**."
      },
      options: [
        { id: "a18", label: iconLabel("⚡", "18 – 24"), shortLabel: "18 – 24", badge: "Fastest Rewire", rewireDays: -7 },
        { id: "a25", label: iconLabel("🔥", "25 – 34"), shortLabel: "25 – 34", badge: "Prime Window", rewireDays: 0 },
        { id: "a35", label: iconLabel("🛡️", "35 – 44"), shortLabel: "35 – 44", badge: "Deep Reset", rewireDays: 7 },
        { id: "a45", label: iconLabel("👑", "45+"), shortLabel: "45+", badge: "Sovereign", rewireDays: 14 }
      ]
    },
    {
      id: "frequency",
      phase: "Frequency",
      tag: "03 • FREQUENCY",
      question: "How often do you slip?",
      sub: "Zero judgment. Private on-device.",
      ack: "Pattern locked.",
      selectionMode: "single",
      minSelections: 1,
      callout: null,
      options: [
        { id: "daily", label: iconLabel("🚨", "Every Single Day"), shortLabel: "Every single day", badge: "High Load", severity: 96, rewireDays: 6, impact: { focus: 8, androgen: 9, impulse: 10, presence: 6 } },
        { id: "x3", label: iconLabel("⚠️", "3–5× Per Week"), shortLabel: "3–5× per week", badge: "Looping", severity: 78, rewireDays: 3, impact: { focus: 6, androgen: 7, impulse: 7, presence: 4 } },
        { id: "x1", label: iconLabel("📆", "Once A Week"), shortLabel: "Once a week", badge: "Breaking Free", severity: 55, rewireDays: 0, impact: { focus: 3, androgen: 3, impulse: 4, presence: 2 } },
        { id: "rare", label: iconLabel("🛡️", "Rarely — Want Armor"), shortLabel: "Rarely — want armor", badge: "Lock It In", severity: 28, rewireDays: -4, impact: { focus: 1, androgen: 1, impulse: 1, presence: 0 } }
      ]
    },
    {
      id: "escalation",
      phase: "Tolerance",
      tag: "04 • TOLERANCE",
      question: "Has your tolerance shifted?",
      sub: "How dopamine dulls the baseline.",
      ack: "Escalation checked.",
      selectionMode: "single",
      minSelections: 1,
      callout: {
        type: "neuro-fact",
        kicker: "🧠 NEURO-FACT",
        body: "Your prefrontal brake begins physically thickening in **14 days**."
      },
      options: [
        { id: "novelty", label: iconLabel("📈", "Need Harder Novelty"), shortLabel: "Need harder novelty", badge: "Escalated", severity: 94, rewireDays: 6, impact: { focus: 5, androgen: 6, impulse: 12, presence: 4 } },
        { id: "fade", label: iconLabel("⏳", "Losing Hours Scrolling"), shortLabel: "Losing hours scrolling", badge: "Time Drain", severity: 84, rewireDays: 4, impact: { focus: 4, androgen: 5, impulse: 9, presence: 3 } },
        { id: "flat", label: iconLabel("🫥", "Numb Afterwards"), shortLabel: "Numb afterwards", badge: "Depleted", severity: 76, rewireDays: 3, impact: { focus: 6, androgen: 8, impulse: 5, presence: 5 } },
        { id: "stable", label: iconLabel("✅", "Catching It Early"), shortLabel: "Catching it early", badge: "Controlled", severity: 36, rewireDays: 0, impact: { focus: 1, androgen: 1, impulse: 2, presence: 1 } }
      ]
    },
    {
      id: "symptoms",
      phase: "Tax",
      tag: "05 • TAX",
      question: "Where is it taxing you?",
      sub: "Select all that apply.",
      ack: "Symptoms locked.",
      selectionMode: "multi",
      minSelections: 1,
      callout: {
        type: "social-proof",
        kicker: "⚡ 30-DAY SHIFT",
        body: "Morning drive and sharp eye contact return first."
      },
      options: [
        { id: "fog", label: iconLabel("🧠", "Scattered Focus"), shortLabel: "Scattered focus", badge: "Fog", severity: 74, impact: { focus: 14, androgen: 2, impulse: 3, presence: 3 } },
        { id: "energy", label: iconLabel("🔋", "Flat Morning Drive"), shortLabel: "Flat morning drive", badge: "Low Drive", severity: 70, impact: { focus: 4, androgen: 14, impulse: 2, presence: 2 } },
        { id: "presence", label: iconLabel("👁️", "Muted Eye Contact"), shortLabel: "Muted eye contact", badge: "Presence", severity: 72, impact: { focus: 3, androgen: 2, impulse: 3, presence: 14 } },
        { id: "sleep", label: iconLabel("🌙", "Wrecked Sleep"), shortLabel: "Wrecked sleep", badge: "Late Nights", severity: 66, impact: { focus: 6, androgen: 4, impulse: 8, presence: 4 } },
        { id: "all", label: iconLabel("⚡", "All Of The Above"), shortLabel: "All of the above", badge: "Full Reset", selectsAll: true }
      ]
    },
    {
      id: "trigger",
      phase: "Trigger",
      tag: "06 • TRIGGER",
      question: "When does the urge strike?",
      sub: "We arm your lock screen before it hits.",
      ack: "Trigger window armed.",
      selectionMode: "single",
      minSelections: 1,
      callout: null,
      options: [
        { id: "night", label: iconLabel("🌙", "Late Night In Bed"), shortLabel: "Late night in bed", badge: "11 PM – 2 AM", severity: 90, rewireDays: 2, impact: { focus: 6, androgen: 2, impulse: 10, presence: 3 } },
        { id: "feed", label: iconLabel("📱", "Doomscrolling X / IG"), shortLabel: "Doomscrolling X / IG", badge: "Feed Trap", severity: 80, rewireDays: 1, impact: { focus: 5, androgen: 1, impulse: 8, presence: 2 } },
        { id: "stress", label: iconLabel("⚡", "Stressed Or Alone"), shortLabel: "Stressed or alone", badge: "Cortisol", severity: 70, rewireDays: 0, impact: { focus: 4, androgen: 2, impulse: 6, presence: 5 } },
        { id: "weekend", label: iconLabel("📅", "Unstructured Weekends"), shortLabel: "Unstructured weekends", badge: "Idle Hours", severity: 48, rewireDays: 0, impact: { focus: 2, androgen: 1, impulse: 3, presence: 2 } }
      ]
    },
    {
      id: "attempts",
      phase: "Record",
      tag: "07 • RECORD",
      question: "Longest streak on willpower alone?",
      sub: "Willpower fades. Systems don't.",
      ack: "History logged.",
      selectionMode: "single",
      minSelections: 1,
      callout: {
        type: "social-proof",
        kicker: "🛡️ WHY MEN FOLD",
        body: "Blocking the URL + Lock Screen reminders **3.4×** completion."
      },
      options: [
        { id: "week1", label: iconLabel("💥", "Fold Under 7 Days"), shortLabel: "Fold under 7 days", badge: "Day-4 Wall", severity: 92, rewireDays: 12, impact: { focus: 3, androgen: 2, impulse: 10, presence: 4 } },
        { id: "week2", label: iconLabel("🧱", "Stall Around Day 14"), shortLabel: "Stall around day 14", badge: "Week 2 Wall", severity: 78, rewireDays: 6, impact: { focus: 2, androgen: 2, impulse: 8, presence: 3 } },
        { id: "once", label: iconLabel("🔁", "30+ Days, Then Slipped"), shortLabel: "30+ days, then slipped", badge: "Rebuild", severity: 58, rewireDays: 2, impact: { focus: 2, androgen: 2, impulse: 5, presence: 3 } },
        { id: "first", label: iconLabel("⚔️", "First Real Protocol"), shortLabel: "First real protocol", badge: "Day One", severity: 34, rewireDays: -8, impact: { focus: 0, androgen: 0, impulse: 1, presence: 1 } }
      ]
    },
    {
      id: "pact",
      phase: "Pact",
      tag: "08 • THE PACT",
      question: "Ready to arm your iPhone?",
      sub: "Sign below and tap to lock in.",
      ack: "Pact recorded.",
      selectionMode: "single",
      minSelections: 1,
      callout: null,
      options: [
        { id: "sign", label: iconLabel("🛡️", "Arm My Shield Now"), shortLabel: "Arm my shield now", badge: "Locked In", commitment: "signed", rewireDays: -3 },
        { id: "report", label: iconLabel("📊", "Reveal My Radar First"), shortLabel: "Reveal my radar first", badge: "See Score", commitment: "report", rewireDays: 0 }
      ]
    }
  ];

  var LOADER_STEPS = [
    {
      id: "d2",
      label: "Auditing D2 receptor downregulation...",
      detail: "Comparing urge frequency with your symptom stack",
      durationMs: 1100
    },
    {
      id: "prefrontal",
      label: "Calculating prefrontal impulse threshold...",
      detail: "Weighting escalation and the late-night window",
      durationMs: 1200
    },
    {
      id: "curve",
      label: "Mapping 30-Day NNN & 90-Day Winter Arc recovery curve...",
      detail: "Setting your full rewire target date",
      durationMs: 1200
    }
  ];

  var CHECKOUT_CONFIG = {
    merchantName: "IRON ARC",
    productLabel: "NNN & Winter Arc Protocol",
    currency: "USD",
    surface: "auto",
    demoDisclosure: true,
    successUrl: "",
    cancelUrl: "",
    stripeLinks: {
      annual: "",
      monthly: "",
      downsell: "",
      penaltyStake: "",
      sovereign: ""
    },
    bundleLinks: {},
    plans: {
      annual: {
        id: "annual",
        name: "Annual Winter Arc + NNN Pass",
        badge: "3-DAY FREE TRIAL · SAVE 75%",
        amountCents: 2999,
        dueTodayCents: 0,
        trialDays: 3,
        interval: "year",
        perMonthCents: 249,
        compareAtCents: 11988,
        blurb: "Then $29.99/year after the 3-day trial. $2.49/month.",
        stripeLinkKey: "annual"
      },
      monthly: {
        id: "monthly",
        name: "30-Day NNN Survival Pass",
        badge: "",
        amountCents: 999,
        dueTodayCents: 999,
        trialDays: 0,
        interval: "month",
        perMonthCents: 999,
        blurb: "Billed $9.99 every month. Cancel anytime.",
        stripeLinkKey: "monthly"
      },
      downsell: {
        id: "downsell",
        name: "Founder Year — 50% Off",
        badge: "EXIT OFFER",
        amountCents: 1499,
        dueTodayCents: 1499,
        trialDays: 0,
        interval: "year",
        compareAtCents: 2999,
        blurb: "Full NNN + Winter Arc year for $14.99.",
        stripeLinkKey: "downsell"
      }
    },
    orderBumps: [
      {
        id: "penaltyStake",
        stripeLinkKey: "penaltyStake",
        name: "Skin-in-the-Game $15 Relapse Penalty Pact",
        amountCents: 1500,
        interval: "once",
        placements: ["pre", "post"],
        kicker: "OPTIONAL STAKE",
        blurb: "A $15 commitment stake. Checked only if you add it. Puts a real cost on folding before Day 30.",
        defaultSelected: false
      },
      {
        id: "sovereign",
        stripeLinkKey: "sovereign",
        name: "Lifetime Iron Sovereign Upgrade",
        amountCents: 3900,
        interval: "once",
        placements: ["pre", "post"],
        kicker: "LIFETIME",
        blurb: "Founding Sovereign badge, the full 90-day track, and no annual renewal.",
        defaultSelected: false
      }
    ]
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatMoney(cents, currency) {
    var code = currency || CHECKOUT_CONFIG.currency || "USD";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format((cents || 0) / 100);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    var next = startOfDay(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function formatISODate(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function clockNow() {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  }

  function nextFrame(fn) {
    if (typeof root.requestAnimationFrame === "function") return root.requestAnimationFrame(fn);
    return setTimeout(function () { fn(clockNow()); }, 16);
  }

  function cancelFrame(id) {
    if (typeof root.cancelAnimationFrame === "function") root.cancelAnimationFrame(id);
    else clearTimeout(id);
  }

  function makeReference() {
    return "ia_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  function isStripePaymentLink(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      var url = new URL(value.trim());
      if (url.protocol !== "https:" || url.username || url.password) return false;
      var host = url.hostname.toLowerCase();
      return host === "buy.stripe.com" || host === "checkout.stripe.com" || host === "pay.stripe.com";
    } catch (err) {
      return false;
    }
  }

  function resolveStripeUrl(key) {
    var raw = CHECKOUT_CONFIG.stripeLinks[key];
    return isStripePaymentLink(raw) ? raw.trim() : "";
  }

  function decorateStripeUrl(rawUrl, params) {
    var url = new URL(rawUrl);
    if (params && params.email) url.searchParams.set("prefilled_email", params.email);
    if (params && params.clientReferenceId) url.searchParams.set("client_reference_id", params.clientReferenceId);
    return url.toString();
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function storageGet(key) {
    try {
      var raw = root.sessionStorage && root.sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      if (root.sessionStorage) root.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* Private mode and file previews can block storage. */
    }
  }

  function storageRemove(key) {
    try {
      if (root.sessionStorage) root.sessionStorage.removeItem(key);
    } catch (err) {
      /* Ignore. */
    }
  }

  function readQuery(key) {
    if (typeof root.location === "undefined" || !root.location.search) return "";
    return new URLSearchParams(root.location.search).get(key) || "";
  }

  function getStep(stepId) {
    for (var i = 0; i < QUIZ_STEPS.length; i += 1) {
      if (QUIZ_STEPS[i].id === stepId) return QUIZ_STEPS[i];
    }
    throw new Error("Unknown quiz step: " + stepId);
  }

  function createSession(now) {
    var stamp = now instanceof Date ? now : new Date();
    return {
      stepIndex: 0,
      answers: {},
      startedAt: stamp.toISOString(),
      planId: "annual",
      bumpIds: []
    };
  }

  function setAnswer(session, stepId, optionIdOrIds) {
    var step = getStep(stepId);
    var incoming = Array.isArray(optionIdOrIds) ? optionIdOrIds.slice() : [optionIdOrIds];
    var known = {};
    step.options.forEach(function (opt) { known[opt.id] = opt; });
    var picked = incoming.filter(function (id) { return !!known[id]; });
    if (step.selectionMode !== "multi") {
      session.answers[step.id] = picked.slice(0, 1);
      return session;
    }
    var all = step.options.filter(function (opt) { return opt.selectsAll; })[0];
    var childIds = step.options.filter(function (opt) { return !opt.selectsAll; }).map(function (opt) { return opt.id; });
    var hasAll = all && (picked.indexOf(all.id) !== -1 || childIds.every(function (id) { return picked.indexOf(id) !== -1; }));
    session.answers[step.id] = hasAll ? step.options.map(function (opt) { return opt.id; }) : picked.filter(function (id) { return !all || id !== all.id; });
    return session;
  }

  function toggleAnswer(session, stepId, optionId) {
    var step = getStep(stepId);
    var option = null;
    for (var i = 0; i < step.options.length; i += 1) {
      if (step.options[i].id === optionId) option = step.options[i];
    }
    if (!option) throw new Error("Unknown option: " + optionId);
    if (step.selectionMode !== "multi") {
      session.answers[step.id] = [optionId];
      return session;
    }
    var all = step.options.filter(function (opt) { return opt.selectsAll; })[0];
    var current = {};
    (session.answers[step.id] || []).forEach(function (id) { current[id] = true; });
    if (option.selectsAll) {
      session.answers[step.id] = current[option.id] ? [] : step.options.map(function (opt) { return opt.id; });
      return session;
    }
    if (current[optionId]) delete current[optionId];
    else current[optionId] = true;
    if (all) delete current[all.id];
    var childIds = step.options.filter(function (opt) { return !opt.selectsAll; }).map(function (opt) { return opt.id; });
    if (all && childIds.every(function (id) { return current[id]; })) current[all.id] = true;
    session.answers[step.id] = Object.keys(current);
    return session;
  }

  function isAnswered(session, step) {
    var ids = session.answers[step.id] || [];
    if (step.selectionMode === "multi") {
      var real = ids.filter(function (id) {
        var match = step.options.filter(function (opt) { return opt.id === id && !opt.selectsAll; })[0];
        return !!match;
      });
      return real.length >= (step.minSelections || 1);
    }
    return ids.length >= 1;
  }

  function isQuizComplete(session) {
    return QUIZ_STEPS.every(function (step) { return isAnswered(session, step); });
  }

  function advance(session) {
    if (session.stepIndex < 0 || session.stepIndex >= QUIZ_STEPS.length) {
      throw new Error("Quiz step index is out of range.");
    }
    var step = QUIZ_STEPS[session.stepIndex];
    if (!isAnswered(session, step)) return { ok: false, reason: "unanswered", ack: "" };
    if (session.stepIndex >= QUIZ_STEPS.length - 1) {
      return { ok: true, complete: true, ack: step.ack, stepIndex: session.stepIndex };
    }
    session.stepIndex += 1;
    return { ok: true, complete: false, ack: step.ack, stepIndex: session.stepIndex };
  }

  function getQuizViewModel(session) {
    var step = QUIZ_STEPS[session.stepIndex];
    if (!step) throw new Error("Quiz step index is out of range.");
    var selectedIds = (session.answers[step.id] || []).slice();
    return {
      step: step,
      stepIndex: session.stepIndex,
      stepNumber: session.stepIndex + 1,
      total: QUIZ_STEPS.length,
      progressPct: Math.round(((session.stepIndex + 1) / QUIZ_STEPS.length) * 100),
      selectedIds: selectedIds,
      canContinue: isAnswered(session, step),
      isLast: session.stepIndex === QUIZ_STEPS.length - 1,
      callout: step.callout,
      calloutHTML: renderCalloutHTML(step.callout),
      ack: step.ack
    };
  }

  function renderCalloutHTML(callout) {
    if (!callout) return "";
    var body = escapeHtml(callout.body).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return '<aside class="fm-callout" data-type="' + escapeHtml(callout.type) + '">' +
      '<p class="fm-kicker">' + escapeHtml(callout.kicker) + "</p>" +
      "<p>" + body + "</p></aside>";
  }

  function chosenOptions(session, step) {
    var ids = {};
    (session.answers[step.id] || []).forEach(function (id) { ids[id] = true; });
    var picked = step.options.filter(function (opt) { return ids[opt.id]; });
    if (picked.some(function (opt) { return opt.selectsAll; })) {
      return step.options.filter(function (opt) { return !opt.selectsAll; });
    }
    return picked.filter(function (opt) { return !opt.selectsAll; });
  }

  function addImpact(target, impact) {
    if (!impact) return;
    target.focus += impact.focus || 0;
    target.androgen += impact.androgen || 0;
    target.impulse += impact.impulse || 0;
    target.presence += impact.presence || 0;
  }

  function combinedSeverity(options) {
    if (!options.length) return 0;
    var sum = options.reduce(function (total, opt) { return total + (opt.severity || 0); }, 0);
    var boosted = options.length === 1 ? (sum / options.length) : (sum / options.length) + (options.length - 1) * 6;
    return clamp(Math.round(boosted), 0, 100);
  }

  function optionShort(session, stepId) {
    var step = getStep(stepId);
    var ids = session.answers[step.id] || [];
    var all = step.options.filter(function (opt) { return opt.selectsAll; })[0];
    if (step.selectionMode === "multi") {
      if (all && ids.indexOf(all.id) !== -1) return [all.shortLabel || all.label];
      return chosenOptions(session, step).map(function (opt) { return opt.shortLabel || opt.label; });
    }
    var picked = chosenOptions(session, step);
    if (!picked.length) return "";
    return picked[0].shortLabel || picked[0].label;
  }

  function bandFor(score) {
    if (score >= 86) return "severe";
    if (score >= 74) return "high";
    if (score >= 60) return "elevated";
    return "moderate";
  }

  function pillarNote(id, load, dependencyScore) {
    var tone = load >= dependencyScore + 6 ? "high" : load <= dependencyScore - 6 ? "low" : "mid";
    return PILLAR_NOTES[id][tone];
  }

  function buildDiagnosis(session, now) {
    var from = startOfDay(now instanceof Date ? now : new Date());
    var impact = { focus: 0, androgen: 0, impulse: 0, presence: 0 };
    var weighted = 0;
    var rewireAdjust = 0;

    QUIZ_STEPS.forEach(function (step) {
      chosenOptions(session, step).forEach(function (opt) {
        addImpact(impact, opt.impact);
        rewireAdjust += opt.rewireDays || 0;
      });
    });

    Object.keys(SEVERITY_WEIGHTS).forEach(function (stepId) {
      var step = getStep(stepId);
      var options = chosenOptions(session, step);
      if (!options.length) return;
      var severity = step.selectionMode === "multi" ? combinedSeverity(options) : (options[0].severity || 0);
      weighted += severity * SEVERITY_WEIGHTS[stepId];
    });

    var dependencyScore = clamp(Math.round(52 + weighted / 250), 48, 94);
    var avgImpact = PILLAR_META.reduce(function (sum, pillar) { return sum + impact[pillar.id]; }, 0) / PILLAR_META.length;
    var pillars = PILLAR_META.map(function (pillar) {
      var spread = Math.round((impact[pillar.id] - avgImpact) * 1.2);
      var load = clamp(dependencyScore + spread, 46, 97);
      return {
        id: pillar.id,
        label: pillar.label,
        load: load,
        capacity: 100 - load,
        baseline: HEALTHY_BASELINE,
        delta: load - HEALTHY_BASELINE,
        note: pillarNote(pillar.id, load, dependencyScore)
      };
    });
    var weakest = pillars.slice().sort(function (a, b) { return b.load - a.load; })[0];
    var strongest = pillars.slice().sort(function (a, b) { return a.load - b.load; })[0];
    var days = 90 + rewireAdjust;
    if (dependencyScore >= 86) days += 10;
    else if (dependencyScore >= 80) days += 4;
    else if (dependencyScore <= 68) days -= 14;
    else if (dependencyScore < 74) days -= 6;
    days = clamp(days, 58, 124);

    var fullDate = addDays(from, days);
    var pact = chosenOptions(session, getStep("pact"))[0];
    var frequencyText = optionShort(session, "frequency") || "An unfinished pattern";
    var triggerText = optionShort(session, "trigger") || "an unnamed window";
    var band = bandFor(dependencyScore);
    var ratio = Math.round((dependencyScore / HEALTHY_BASELINE) * 10) / 10;

    return {
      partial: !isQuizComplete(session),
      dependencyScore: dependencyScore,
      healthyBaseline: HEALTHY_BASELINE,
      band: band,
      headline: BAND_COPY[band],
      summary: "Dopamine dependency " + dependencyScore + "% versus a " + HEALTHY_BASELINE + "% healthy baseline. Full Rewire Target Date: " + formatLongDate(fullDate) + ".",
      detail: frequencyText + ". Trigger window: " + triggerText + ". Weakest pillar: " + weakest.label + ".",
      multiplierLabel: ratio.toFixed(1) + "×",
      disclaimer: DISCLAIMER,
      pillars: pillars,
      weakestPillar: weakest.id,
      strongestPillar: strongest.id,
      radar: {
        axes: pillars.map(function (pillar) { return pillar.label; }),
        load: pillars.map(function (pillar) { return pillar.load; }),
        baseline: HEALTHY_BASELINE
      },
      rewire: {
        days: days,
        startDate: formatISODate(from),
        startLabel: formatLongDate(from),
        fullRewireTargetDate: formatISODate(fullDate),
        fullRewireTargetLabel: formatLongDate(fullDate),
        checkpoints: [
          checkpoint(7, "Androgen rebound window", from),
          checkpoint(14, "Clarity and eye-contact return", from),
          checkpoint(30, "30-Day NNN line", from),
          checkpoint(days, "Full Rewire Target", from)
        ]
      },
      profile: {
        goal: optionShort(session, "goal"),
        ageBracket: optionShort(session, "age"),
        frequency: frequencyText,
        escalation: optionShort(session, "escalation"),
        symptoms: optionShort(session, "symptoms") || [],
        trigger: triggerText,
        attempts: optionShort(session, "attempts"),
        pactSigned: !!(pact && pact.commitment === "signed")
      },
      model: {
        name: "answer-weighted-v1",
        severityIndex: Math.round((weighted / 100) * 10) / 10,
        healthyBaseline: HEALTHY_BASELINE
      }
    };
  }

  function checkpoint(day, title, from) {
    var date = addDays(from, day);
    return {
      day: day,
      title: title,
      date: formatISODate(date),
      dateLabel: formatLongDate(date)
    };
  }

  function scoreAnswers(answerMap, now) {
    var session = createSession(now);
    Object.keys(answerMap || {}).forEach(function (stepId) {
      setAnswer(session, stepId, answerMap[stepId]);
    });
    session.stepIndex = QUIZ_STEPS.length - 1;
    return buildDiagnosis(session, now);
  }

  var COMBAT_AXES = {
    focus: { icon: "🧠", name: "CLARITY", slot: "n", color: "#38bdf8" },
    androgen: { icon: "⚡", name: "DRIVE", slot: "e", color: "#fb7185" },
    impulse: { icon: "🛡️", name: "CONTROL", slot: "s", color: "#34d399" },
    presence: { icon: "👑", name: "PRESENCE", slot: "w", color: "#c4b5fd" }
  };

  function radarMarkup(pillars) {
    var cx = 100;
    var cy = 100;
    var hexR = 90;
    var radius = hexR * Math.cos(Math.PI / 6);
    var degs = [-90, 0, 90, 180];
    function polar(deg, reach) {
      var angle = deg * Math.PI / 180;
      return { x: cx + reach * Math.cos(angle), y: cy + reach * Math.sin(angle) };
    }
    function fmt(point) {
      return point.x.toFixed(1) + "," + point.y.toFixed(1);
    }
    function diamond(valueOrList) {
      var values = Array.isArray(valueOrList) ? valueOrList : [valueOrList, valueOrList, valueOrList, valueOrList];
      return values.map(function (value, index) {
        return fmt(polar(degs[index], (clamp(value, 0, 100) / 100) * radius));
      }).join(" ");
    }
    function hexagon(reach) {
      var pts = [];
      for (var i = 0; i < 6; i += 1) pts.push(fmt(polar(-90 + i * 60, reach)));
      return pts.join(" ");
    }
    var grid = [22, 50, 100].map(function (ring) {
      return '<polygon points="' + diamond(ring) + '" class="fm-radar-ring"></polygon>';
    }).join("");
    var axes = [0, 1, 2, 3].map(function (index) {
      var outer = index % 2 === 0 ? hexR : radius;
      var end = polar(degs[index], outer);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + end.x.toFixed(1) + '" y2="' + end.y.toFixed(1) + '" class="fm-radar-axis"></line>';
    }).join("");
    var loads = pillars.map(function (pillar) { return pillar.load; });
    var dots = loads.map(function (value, index) {
      var point = polar(degs[index], (clamp(value, 0, 100) / 100) * radius);
      return '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="4.2" class="fm-radar-dot"></circle>';
    }).join("");
    var labels = pillars.map(function (pillar) {
      var axis = COMBAT_AXES[pillar.id] || { icon: "", name: pillar.label, slot: "n" };
      return '<div class="fm-axis fm-axis-' + axis.slot + '"><b aria-hidden="true">' + axis.icon + "</b><span>" + escapeHtml(axis.name) + "</span></div>";
    }).join("");
    var summary = pillars.map(function (pillar) {
      var axis = COMBAT_AXES[pillar.id] || { name: pillar.label };
      return axis.name + " " + pillar.load;
    }).join(", ");
    return '<div class="fm-radar-stage">' + labels +
      '<svg class="fm-radar" viewBox="0 0 200 200" role="img" aria-label="Battle radar. ' + escapeHtml(summary) + '">' +
      '<defs><filter id="fmRadarGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<polygon points="' + hexagon(hexR) + '" class="fm-radar-hex"></polygon>' +
      grid + axes +
      '<polygon points="' + diamond(HEALTHY_BASELINE) + '" class="fm-radar-base"></polygon>' +
      '<polygon points="' + diamond(loads) + '" class="fm-radar-fill" filter="url(#fmRadarGlow)"></polygon>' +
      dots +
      '<circle cx="' + cx + '" cy="' + cy + '" r="3.2" class="fm-radar-core"></circle>' +
      "</svg></div>";
  }

  function gaugeMarkup(pct, tone, name) {
    var value = clamp(Math.round(pct), 0, 100);
    return '<div class="fm-gauge is-' + tone + '">' +
      '<div class="fm-dial" style="--pct:' + value + '" role="img" aria-label="' + escapeHtml(name) + " " + value + '%">' +
      "<b>" + value + "%</b></div>" +
      '<span class="fm-gauge-name">' + escapeHtml(name) + "</span></div>";
  }

  function weaponsMarkup() {
    return '<div class="fm-weapons">' +
      '<p class="fm-kicker">YOUR 2-WEAPON SYSTEM</p>' +
      '<article class="fm-weapon"><span class="fm-weapon-ico" aria-hidden="true">🛡️</span>' +
      '<span class="fm-weapon-copy"><strong>01 • URL SHIELD</strong><b>Hard Porn URL Blocker</b><em>Kills 42,850+ Sites in Safari</em></span></article>' +
      '<article class="fm-weapon"><span class="fm-weapon-ico" aria-hidden="true">📱</span>' +
      '<span class="fm-weapon-copy"><strong>02 • LOCK SCREEN</strong><b>Stoic Lock Screen Widget</b><em>Live Quote + Streak on Every Glance</em></span></article>' +
      "</div>";
  }

  function renderDiagnosisHTML(diagnosis) {
    if (!diagnosis) return "";
    var base = diagnosis.healthyBaseline || HEALTHY_BASELINE;
    var pillarRows = (diagnosis.pillars || []).map(function (pillar) {
      var axis = COMBAT_AXES[pillar.id] || { icon: "", name: pillar.label, color: "#ef4444" };
      return "<li>" +
        '<div class="fm-pillar-top"><span>' + axis.icon + " " + escapeHtml(axis.name) + "</span><b>" + pillar.load + "%</b></div>" +
        '<div class="fm-track" role="presentation"><i style="width:' + pillar.load + "%;background:" + axis.color + '"></i><em class="fm-base-tick" style="left:' + base + '%"></em></div>' +
        "</li>";
    }).join("");
    return '<section class="fm-diagnosis fm-battle" data-band="' + escapeHtml(diagnosis.band) + '">' +
      '<p class="fm-kicker">BASELINE READOUT</p>' +
      "<h2>BATTLE RADAR</h2>" +
      '<div class="fm-gauges">' +
        gaugeMarkup(diagnosis.dependencyScore, "load", "DOPAMINE TAX") +
        gaugeMarkup(base, "base", "PEAK BASELINE") +
        '<span class="fm-vs" aria-hidden="true">VS</span>' +
      "</div>" +
      radarMarkup(diagnosis.pillars || []) +
      '<ul class="fm-pillars">' + pillarRows + "</ul>" +
      weaponsMarkup() +
      '<p class="fm-disclaimer">Self-report score, not a medical diagnosis.</p></section>';
  }

  function getLoaderTimeline(totalMs) {
    var total = totalMs > 0 ? totalMs : LOADER_DURATION_MS;
    var base = LOADER_STEPS.reduce(function (sum, step) { return sum + step.durationMs; }, 0);
    var cursor = 0;
    return LOADER_STEPS.map(function (step, index) {
      var isLast = index === LOADER_STEPS.length - 1;
      var durationMs = isLast ? (total - cursor) : Math.round(step.durationMs * total / base);
      var startMs = cursor;
      cursor += durationMs;
      return {
        id: step.id,
        label: step.label,
        detail: step.detail,
        startMs: startMs,
        endMs: cursor,
        durationMs: durationMs
      };
    });
  }

  function getLoaderFrame(elapsedMs, durationMs) {
    var total = durationMs > 0 ? durationMs : LOADER_DURATION_MS;
    var elapsed = clamp(elapsedMs || 0, 0, total);
    var steps = getLoaderTimeline(total).map(function (step) {
      var status = "pending";
      if (elapsed >= step.endMs || elapsed >= total) status = "done";
      else if (elapsed >= step.startMs) status = "active";
      return {
        id: step.id,
        label: step.label,
        detail: step.detail,
        startMs: step.startMs,
        endMs: step.endMs,
        status: status
      };
    });
    if (elapsed >= total) {
      steps = steps.map(function (step) {
        return {
          id: step.id,
          label: step.label,
          detail: step.detail,
          startMs: step.startMs,
          endMs: step.endMs,
          status: "done"
        };
      });
    }
    return {
      elapsed: elapsed,
      total: total,
      progress: elapsed / total,
      progressPct: Math.round((elapsed / total) * 100),
      steps: steps,
      complete: elapsed >= total
    };
  }

  function loaderSkeleton() {
    var items = LOADER_STEPS.map(function (step) {
      return '<li data-loader-step="' + escapeHtml(step.id) + '" data-status="pending">' +
        '<span class="fm-mark" aria-hidden="true"></span>' +
        '<span class="fm-check-copy"><strong>' + escapeHtml(step.label) + "</strong><small>" + escapeHtml(step.detail) + "</small></span></li>";
    }).join("");
    return '<section class="fm-loader" data-fm-loader aria-live="polite">' +
      '<p class="fm-kicker">Protocol analysis</p>' +
      '<h2 class="fm-loader-title">Reading your answers</h2>' +
      '<div class="fm-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-loader-track>' +
        '<i class="fm-loader-bar" data-loader-bar style="width:0%"></i></div>' +
      '<div class="fm-loader-pct" data-loader-pct>0%</div>' +
      '<ol class="fm-loader-steps">' + items + "</ol></section>";
  }

  function paintLoader(mount, frame) {
    if (!mount.querySelector("[data-fm-loader]")) mount.innerHTML = loaderSkeleton();
    var active = null;
    for (var i = 0; i < frame.steps.length; i += 1) {
      if (frame.steps[i].status === "active") active = frame.steps[i];
    }
    var title = mount.querySelector(".fm-loader-title");
    var bar = mount.querySelector("[data-loader-bar]");
    var track = mount.querySelector("[data-loader-track]");
    var pct = mount.querySelector("[data-loader-pct]");
    if (title) title.textContent = frame.complete ? "Analysis complete" : (active ? active.label : frame.steps[0].label);
    if (bar) bar.style.width = frame.progressPct + "%";
    if (track) track.setAttribute("aria-valuenow", String(frame.progressPct));
    if (pct) pct.textContent = frame.progressPct + "%";
    frame.steps.forEach(function (step) {
      var row = mount.querySelector('[data-loader-step="' + step.id + '"]');
      if (row) row.setAttribute("data-status", step.status);
    });
  }

  function runLoader(options) {
    var settings = options || {};
    var total = settings.durationMs > 0 ? settings.durationMs : LOADER_DURATION_MS;
    var start = clockNow();
    var frameId = 0;
    var stopped = false;
    var finished = false;
    ensureStyles();
    if (settings.mount) paintLoader(settings.mount, getLoaderFrame(0, total));

    function frame(timestamp) {
      if (stopped) return;
      var elapsed = Math.min(total, (timestamp || clockNow()) - start);
      var snapshot = getLoaderFrame(elapsed, total);
      if (settings.mount) paintLoader(settings.mount, snapshot);
      if (settings.onTick) settings.onTick(snapshot);
      if (snapshot.complete) {
        if (!finished) {
          finished = true;
          if (settings.onComplete) settings.onComplete(snapshot);
        }
        return;
      }
      frameId = nextFrame(frame);
    }

    frame(start);
    return function stop() {
      stopped = true;
      cancelFrame(frameId);
    };
  }

  function getPlan(planId) {
    var plan = CHECKOUT_CONFIG.plans[planId];
    if (!plan) throw new Error("Unknown checkout plan: " + planId);
    return plan;
  }

  function getBump(bumpId) {
    for (var i = 0; i < CHECKOUT_CONFIG.orderBumps.length; i += 1) {
      if (CHECKOUT_CONFIG.orderBumps[i].id === bumpId) return CHECKOUT_CONFIG.orderBumps[i];
    }
    return null;
  }

  function priceCart(planId, bumpIds) {
    var plan = getPlan(planId);
    var unique = [];
    (bumpIds || []).forEach(function (id) {
      if (unique.indexOf(id) === -1 && getBump(id)) unique.push(id);
    });
    var bumps = unique.map(getBump);
    var dueTodayCents = plan.dueTodayCents + bumps.reduce(function (sum, bump) { return sum + bump.amountCents; }, 0);
    return {
      planId: plan.id,
      plan: plan,
      bumpIds: unique,
      bumps: bumps,
      dueTodayCents: dueTodayCents,
      recurringCents: plan.amountCents,
      recurringInterval: plan.interval,
      trialDays: plan.trialDays || 0,
      currency: CHECKOUT_CONFIG.currency
    };
  }

  function cartSignature(planId, bumpIds) {
    return [planId].concat((bumpIds || []).slice().sort()).join("+");
  }

  function resolveBundleUrl(planId, bumpIds) {
    if (!bumpIds || !bumpIds.length) return "";
    var raw = CHECKOUT_CONFIG.bundleLinks[cartSignature(planId, bumpIds)];
    return isStripePaymentLink(raw) ? raw.trim() : "";
  }

  function resolveHandoff(planId, bumpIds) {
    var cart = priceCart(planId, bumpIds);
    var surface = CHECKOUT_CONFIG.surface;
    var planUrl = resolveStripeUrl(cart.plan.stripeLinkKey);
    var bundleUrl = resolveBundleUrl(planId, cart.bumpIds);
    var unlinked = [];
    if (surface === "sheet" || (surface === "auto" && !planUrl && !bundleUrl)) {
      return { rail: "demo", cart: cart, steps: [], unlinked: [], disclosure: CHECKOUT_CONFIG.demoDisclosure !== false };
    }
    if (!planUrl && !bundleUrl) {
      return {
        rail: "unconfigured",
        cart: cart,
        steps: [],
        unlinked: [],
        error: "Add a Stripe Payment Link for the " + cart.plan.id + " plan, or set surface to \"sheet\" for the preview checkout."
      };
    }
    if (bundleUrl) {
      return {
        rail: "stripe",
        cart: cart,
        unlinked: [],
        steps: [{ role: "bundle", key: cartSignature(planId, cart.bumpIds), url: bundleUrl, label: "Full order", amountCents: cart.dueTodayCents }]
      };
    }
    var steps = [{
      role: "plan",
      key: cart.plan.stripeLinkKey,
      url: planUrl,
      label: cart.plan.name,
      amountCents: cart.plan.dueTodayCents
    }];
    cart.bumps.forEach(function (bump) {
      var url = resolveStripeUrl(bump.stripeLinkKey);
      if (url) {
        steps.push({ role: "bump", key: bump.stripeLinkKey, url: url, label: bump.name, amountCents: bump.amountCents });
      } else {
        unlinked.push(bump);
      }
    });
    return { rail: "stripe", cart: cart, steps: steps, unlinked: unlinked };
  }

  function detectBrand(digits) {
    if (/^3[47]/.test(digits)) return "amex";
    if (/^4/.test(digits)) return "visa";
    if (/^5[1-5]/.test(digits) || /^2(2|3|4|5|6|7)/.test(digits)) return "mastercard";
    if (/^6/.test(digits)) return "discover";
    return "card";
  }

  function luhnOk(digits) {
    var sum = 0;
    var alt = false;
    for (var i = digits.length - 1; i >= 0; i -= 1) {
      var n = parseInt(digits.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return digits.length > 0 && sum % 10 === 0;
  }

  function parseExpiry(value) {
    var match = String(value || "").match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!match) return null;
    var month = parseInt(match[1], 10);
    var year = 2000 + parseInt(match[2], 10);
    if (month < 1 || month > 12) return null;
    var end = new Date(year, month, 1);
    if (end <= new Date()) return null;
    return { month: month, year: year };
  }

  function validateCardFields(fields) {
    var digits = String((fields && fields.number) || "").replace(/\D/g, "");
    var brand = detectBrand(digits);
    var expiry = parseExpiry(fields && fields.expiry);
    var cvc = String((fields && fields.cvc) || "").replace(/\D/g, "");
    var name = String((fields && fields.name) || "").trim();
    var postal = String((fields && fields.postal) || "").trim();
    var errors = [];
    var expectedLength = brand === "amex" ? 15 : 16;
    if (digits.length !== expectedLength || !luhnOk(digits)) errors.push("number");
    if (!expiry) errors.push("expiry");
    if (cvc.length !== (brand === "amex" ? 4 : 3)) errors.push("cvc");
    if (name.length < 2) errors.push("name");
    if (!/^[A-Za-z0-9 \-]{3,10}$/.test(postal)) errors.push("postal");
    if (errors.length) return { ok: false, errors: errors, brand: brand };
    return { ok: true, errors: [], brand: brand, last4: digits.slice(-4) };
  }

  function groupCard(digits, brand) {
    var trimmed = digits.slice(0, brand === "amex" ? 15 : 16);
    if (brand === "amex") {
      return [trimmed.slice(0, 4), trimmed.slice(4, 10), trimmed.slice(10, 15)].filter(Boolean).join(" ");
    }
    return trimmed.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  function recurringLabel(cart) {
    if (cart.trialDays) return "Then " + formatMoney(cart.recurringCents) + "/" + (cart.recurringInterval === "year" ? "year" : "month") + " after the " + cart.trialDays + "-day trial.";
    if (cart.recurringInterval === "year") return formatMoney(cart.recurringCents) + " for the year.";
    return formatMoney(cart.recurringCents) + " billed monthly.";
  }

  function ctaLabel(handoff) {
    var due = formatMoney(handoff.cart.dueTodayCents);
    if (handoff.rail === "stripe") {
      if (handoff.steps.length > 1) return "Continue to Stripe · " + handoff.steps.length + " confirmations";
      if (handoff.cart.trialDays && handoff.cart.dueTodayCents === 0) return "Continue to Stripe · $0.00 today";
      return "Continue to Stripe · " + due;
    }
    if (handoff.cart.trialDays && handoff.cart.dueTodayCents === 0) return "Start 3-day free trial";
    return "Pay " + due;
  }

  function stripeNote(handoff) {
    if (handoff.rail === "unconfigured") return handoff.error || "";
    if (handoff.rail === "demo") {
      return handoff.disclosure ? "Preview checkout. Nothing is charged, and the card number is not saved. Add Stripe Payment Links to take live payment." : "";
    }
    var extra = handoff.steps.length - 1;
    var base = extra > 0
      ? "Stripe confirms this in " + handoff.steps.length + " steps. The add-on opens only after the plan payment succeeds."
      : "Apple Pay, Google Pay, and card are confirmed on Stripe's secure page.";
    if (handoff.unlinked.length) {
      var names = handoff.unlinked.map(function (bump) { return bump.name; }).join(" · ");
      base += " Not sent to Stripe yet: " + names + ".";
    }
    return base;
  }

  function publicResult(settings) {
    return {
      mode: settings.mode,
      method: settings.method,
      planId: settings.handoff.cart.planId,
      bumpIds: settings.handoff.cart.bumpIds.slice(),
      currency: settings.handoff.cart.currency,
      dueTodayCents: settings.handoff.cart.dueTodayCents,
      recurringCents: settings.handoff.cart.recurringCents,
      trialDays: settings.handoff.cart.trialDays,
      card: settings.card || null,
      clientReferenceId: settings.clientReferenceId || "",
      paidAt: new Date().toISOString()
    };
  }

  function peekPendingCheckout() {
    return storageGet(PENDING_KEY);
  }

  function completePendingCheckout() {
    storageRemove(PENDING_KEY);
  }

  function suggestedReturnUrls(pageUrl) {
    var fallback = typeof root.location !== "undefined" ? root.location.href : "https://example.com/";
    var url = new URL(pageUrl || fallback);
    url.hash = "";
    var success = new URL(url.href);
    var cancel = new URL(url.href);
    success.searchParams.set("checkout", "success");
    cancel.searchParams.set("checkout", "cancel");
    return { success: success.toString(), cancel: cancel.toString() };
  }

  function assignLink(key, value) {
    if (LINK_KEYS.indexOf(key) === -1) return false;
    var trimmed = String(value || "").trim();
    if (!trimmed) {
      CHECKOUT_CONFIG.stripeLinks[key] = "";
      return true;
    }
    if (!isStripePaymentLink(trimmed)) return false;
    CHECKOUT_CONFIG.stripeLinks[key] = trimmed;
    return true;
  }

  function configure(patch) {
    var input = patch || {};
    var rejected = [];
    if (input.surface && ["auto", "stripe", "sheet"].indexOf(input.surface) !== -1) {
      CHECKOUT_CONFIG.surface = input.surface;
    }
    if (input.demoDisclosure != null) CHECKOUT_CONFIG.demoDisclosure = !!input.demoDisclosure;
    if (typeof input.successUrl === "string") CHECKOUT_CONFIG.successUrl = input.successUrl;
    if (typeof input.cancelUrl === "string") CHECKOUT_CONFIG.cancelUrl = input.cancelUrl;
    if (input.stripeLinks && typeof input.stripeLinks === "object") {
      LINK_KEYS.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(input.stripeLinks, key)) return;
        if (!assignLink(key, input.stripeLinks[key])) rejected.push("stripeLinks." + key);
      });
    }
    if (input.bundleLinks && typeof input.bundleLinks === "object") {
      Object.keys(input.bundleLinks).forEach(function (signature) {
        var value = String(input.bundleLinks[signature] || "").trim();
        if (!value) {
          delete CHECKOUT_CONFIG.bundleLinks[signature];
          return;
        }
        if (!isStripePaymentLink(value)) {
          rejected.push("bundleLinks." + signature);
          return;
        }
        CHECKOUT_CONFIG.bundleLinks[signature] = value;
      });
    }
    return { config: CHECKOUT_CONFIG, rejected: rejected };
  }

  function sheetMarkup(handoff, email) {
    var bumps = CHECKOUT_CONFIG.orderBumps.map(function (bump) {
      var checked = handoff.cart.bumpIds.indexOf(bump.id) !== -1;
      return '<label class="fm-bump">' +
        '<input type="checkbox" data-bump="' + escapeHtml(bump.id) + '"' + (checked ? " checked" : "") + ">" +
        "<span><small>" + escapeHtml(bump.kicker) + "</small><strong>" + escapeHtml(bump.name) + "</strong>" +
        "<em>" + escapeHtml(formatMoney(bump.amountCents)) + " one-time</em>" +
        "<b>" + escapeHtml(bump.blurb) + "</b></span></label>";
    }).join("");
    return '<div class="fm-overlay" data-fm-overlay>' +
      '<div class="fm-sheet" role="dialog" aria-modal="true" aria-labelledby="fm-sheet-title" tabindex="-1">' +
        '<div class="fm-grabber" aria-hidden="true"></div>' +
        '<header class="fm-sheet-head"><div><p class="fm-kicker">' + escapeHtml(CHECKOUT_CONFIG.merchantName) + '</p>' +
          '<h2 id="fm-sheet-title">Checkout</h2></div>' +
          '<button type="button" class="fm-icon-btn" data-close aria-label="Close checkout">✕</button></header>' +
        '<div data-sheet-body>' +
          '<div class="fm-plan-summary"><strong data-plan-name>' + escapeHtml(handoff.cart.plan.name) + "</strong>" +
            '<p data-plan-blurb>' + escapeHtml(handoff.cart.plan.blurb) + "</p></div>" +
          '<div class="fm-bumps">' + bumps + "</div>" +
          '<dl class="fm-totals"><div><dt>Due today</dt><dd data-due>' + escapeHtml(formatMoney(handoff.cart.dueTodayCents)) + "</dd></div>" +
            '<div><dt>Plan</dt><dd data-recurring>' + escapeHtml(recurringLabel(handoff.cart)) + "</dd></div></dl>" +
          '<p class="fm-note" data-stripe-note>' + escapeHtml(stripeNote(handoff)) + "</p>" +
          '<label class="fm-field" data-email-field>Email<input type="email" data-email autocomplete="off" placeholder="you@email.com" value="' + escapeHtml(email || "") + '"></label>' +
          '<div class="fm-wallets">' +
            '<button type="button" class="fm-wallet fm-apple" data-method="apple_pay">Apple Pay</button>' +
            '<button type="button" class="fm-wallet fm-google" data-method="google_pay">Google Pay</button>' +
          "</div>" +
          '<button type="button" class="fm-pay" data-stripe-pay data-method="card" data-cta>' + escapeHtml(ctaLabel(handoff)) + "</button>" +
          '<div class="fm-card-fields" data-card-fields>' +
            '<p class="fm-or">or card</p>' +
            '<label>Card number<input inputmode="numeric" autocomplete="off" data-number placeholder="4242 4242 4242 4242"></label>' +
            '<div class="fm-card-row"><label>Expiry<input inputmode="numeric" autocomplete="off" data-expiry placeholder="MM / YY"></label>' +
              '<label>CVC<input inputmode="numeric" autocomplete="off" data-cvc placeholder="123"></label>' +
              '<label>Postal<input autocomplete="off" data-postal placeholder="94107"></label></div>' +
            '<label>Name on card<input autocomplete="off" data-name placeholder="Name"></label>' +
            '<button type="button" class="fm-pay" data-pay data-cta>' + escapeHtml(ctaLabel(handoff)) + "</button>" +
          "</div>" +
          '<p class="fm-error" data-error></p><p class="fm-status" data-status></p>' +
        "</div></div></div>";
  }

  function mountCheckoutSheet(options) {
    assertDom();
    ensureStyles();
    var settings = options || {};
    var host = settings.mount || root.document.body;
    var contained = host !== root.document.body && host !== root.document.documentElement;
    var state = {
      planId: settings.planId || (settings.handoff && settings.handoff.cart.planId) || "annual",
      bumpIds: (settings.bumpIds || (settings.handoff && settings.handoff.cart.bumpIds) || []).slice(),
      method: "card",
      clientReferenceId: makeReference()
    };
    var wrap = root.document.createElement("div");
    var handoff = settings.handoff || resolveHandoff(state.planId, state.bumpIds);
    wrap.innerHTML = sheetMarkup(handoff, settings.email || "");
    var overlay = wrap.firstChild;
    if (contained) overlay.classList.add("fm-overlay-contained");
    host.appendChild(overlay);
    function placeOverlay() {
      if (!contained) return;
      var rect = host.getBoundingClientRect();
      var viewWidth = root.innerWidth || root.document.documentElement.clientWidth;
      var viewHeight = root.innerHeight || root.document.documentElement.clientHeight;
      var top = Math.max(rect.top, 0);
      var left = Math.max(rect.left, 0);
      var right = Math.min(rect.right, viewWidth);
      var bottom = Math.min(rect.bottom, viewHeight);
      overlay.style.left = left + "px";
      overlay.style.top = top + "px";
      overlay.style.width = Math.max(0, right - left) + "px";
      overlay.style.height = Math.max(0, bottom - top) + "px";
    }
    placeOverlay();
    root.addEventListener("resize", placeOverlay);
    root.addEventListener("scroll", placeOverlay, true);
    var sheet = overlay.querySelector(".fm-sheet");
    var previousFocus = root.document.activeElement;
    var closed = false;
    var busy = false;
    sheet.focus();

    function currentHandoff() {
      return resolveHandoff(state.planId, state.bumpIds);
    }

    function paint() {
      var next = currentHandoff();
      var due = overlay.querySelector("[data-due]");
      var recurring = overlay.querySelector("[data-recurring]");
      var note = overlay.querySelector("[data-stripe-note]");
      var cardFields = overlay.querySelector("[data-card-fields]");
      var stripePay = overlay.querySelector("[data-stripe-pay]");
      var wallets = overlay.querySelector(".fm-wallets");
      var emailField = overlay.querySelector("[data-email-field]");
      if (due) due.textContent = formatMoney(next.cart.dueTodayCents);
      if (recurring) recurring.textContent = recurringLabel(next.cart);
      if (note) note.textContent = stripeNote(next);
      overlay.querySelectorAll("[data-cta]").forEach(function (node) { node.textContent = ctaLabel(next); });
      if (cardFields) cardFields.classList.toggle("fm-hidden", next.rail !== "demo");
      if (stripePay) stripePay.classList.toggle("fm-hidden", next.rail !== "stripe");
      if (wallets) wallets.classList.toggle("fm-hidden", next.rail === "unconfigured");
      if (emailField) emailField.classList.toggle("fm-hidden", next.rail === "unconfigured");
      overlay.querySelectorAll("[data-bump]").forEach(function (input) {
        input.checked = state.bumpIds.indexOf(input.getAttribute("data-bump")) !== -1;
      });
    }

    function setError(message) {
      var node = overlay.querySelector("[data-error]");
      if (node) node.textContent = message || "";
    }

    function destroy() {
      if (closed) return;
      closed = true;
      root.removeEventListener("resize", placeOverlay);
      root.removeEventListener("scroll", placeOverlay, true);
      root.document.removeEventListener("keydown", onKey);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (previousFocus && previousFocus.focus) previousFocus.focus();
      if (settings.onClose) settings.onClose();
    }

    function onKey(event) {
      if (event.key === "Escape") destroy();
    }

    function cardSnapshot() {
      return {
        number: (overlay.querySelector("[data-number]") || {}).value,
        expiry: (overlay.querySelector("[data-expiry]") || {}).value,
        cvc: (overlay.querySelector("[data-cvc]") || {}).value,
        name: (overlay.querySelector("[data-name]") || {}).value,
        postal: (overlay.querySelector("[data-postal]") || {}).value
      };
    }

    function clearCardInputs() {
      ["[data-number]", "[data-cvc]"].forEach(function (selector) {
        var input = overlay.querySelector(selector);
        if (input) input.value = "";
      });
    }

    function showSuccess(result) {
      var body = overlay.querySelector("[data-sheet-body]");
      var target = settings.diagnosis && settings.diagnosis.rewire ? settings.diagnosis.rewire.fullRewireTargetLabel : "";
      var preview = result.mode === "demo" && CHECKOUT_CONFIG.demoDisclosure !== false
        ? '<p class="fm-note">Preview complete. No charge was sent.</p>'
        : "";
      body.innerHTML = '<div class="fm-success"><p class="fm-kicker">Checkout</p><h2>You\'re locked in.</h2>' +
        "<p>" + escapeHtml(getPlan(result.planId).name) + "</p>" +
        "<p>Due today " + escapeHtml(formatMoney(result.dueTodayCents)) + (result.card ? " · " + escapeHtml(result.card.brand) + " •••• " + escapeHtml(result.card.last4) : "") + "</p>" +
        (target ? "<p>Full Rewire Target Date " + escapeHtml(target) + "</p>" : "") +
        preview +
        '<button type="button" class="fm-pay" data-enter>Enter the protocol</button></div>';
      body.querySelector("[data-enter]").addEventListener("click", function () {
        if (settings.onSuccess) settings.onSuccess(result);
      });
    }

    function pay(method) {
      if (busy || closed) return;
      var next = currentHandoff();
      var emailInput = overlay.querySelector("[data-email]");
      var email = emailInput ? emailInput.value.trim() : "";
      setError("");
      if (email && !validEmail(email)) {
        setError("Enter a valid email, or leave it blank.");
        return;
      }
      if (next.rail === "unconfigured") {
        setError(next.error);
        return;
      }
      state.method = method || state.method;
      var cardMeta = null;
      if (next.rail === "demo" && state.method === "card") {
        var verdict = validateCardFields(cardSnapshot());
        if (!verdict.ok) {
          setError("Check the card number, expiry, CVC, name, and postal code.");
          return;
        }
        cardMeta = { brand: verdict.brand, last4: verdict.last4 };
        clearCardInputs();
      }
      busy = true;
      if (next.rail === "stripe") {
        var step = next.steps[0];
        var url = decorateStripeUrl(step.url, { email: email, clientReferenceId: state.clientReferenceId });
        storageSet(PENDING_KEY, {
          phase: "plan",
          confirmingKey: null,
          clientReferenceId: state.clientReferenceId,
          email: email,
          planId: state.planId,
          bumpIds: state.bumpIds.slice(),
          followUps: next.steps.slice(1).map(function (item) {
            return { key: item.key, label: item.label, amountCents: item.amountCents };
          }),
          createdAt: new Date().toISOString()
        });
        var status = overlay.querySelector("[data-status]");
        if (status) status.textContent = "Redirecting to Stripe…";
        overlay.querySelectorAll("button").forEach(function (button) { button.disabled = true; });
        var payload = publicResult({ mode: "stripe", method: state.method, handoff: next, clientReferenceId: state.clientReferenceId });
        if (settings.onHandoff) settings.onHandoff(Object.assign({ url: url }, payload));
        root.location.assign(url);
        return;
      }
      var statusNode = overlay.querySelector("[data-status]");
      if (statusNode) statusNode.textContent = "Processing…";
      overlay.querySelectorAll("button").forEach(function (button) { button.disabled = true; });
      root.setTimeout(function () {
        if (closed) return;
        showSuccess(publicResult({
          mode: "demo",
          method: state.method,
          handoff: next,
          card: cardMeta,
          clientReferenceId: state.clientReferenceId
        }));
      }, 900);
    }

    overlay.addEventListener("click", function () { destroy(); });
    sheet.addEventListener("click", function (event) { event.stopPropagation(); });
    overlay.querySelector("[data-close]").addEventListener("click", destroy);
    root.document.addEventListener("keydown", onKey);
    overlay.querySelectorAll("[data-bump]").forEach(function (input) {
      input.addEventListener("change", function () {
        var id = input.getAttribute("data-bump");
        if (input.checked && state.bumpIds.indexOf(id) === -1) state.bumpIds.push(id);
        if (!input.checked) state.bumpIds = state.bumpIds.filter(function (item) { return item !== id; });
        paint();
      });
    });
    overlay.querySelectorAll("[data-method]").forEach(function (button) {
      button.addEventListener("click", function () { pay(button.getAttribute("data-method")); });
    });
    var payButton = overlay.querySelector("[data-pay]");
    if (payButton) payButton.addEventListener("click", function () { pay("card"); });
    var numberInput = overlay.querySelector("[data-number]");
    if (numberInput) {
      numberInput.addEventListener("input", function () {
        var digits = numberInput.value.replace(/\D/g, "");
        numberInput.value = groupCard(digits, detectBrand(digits));
      });
    }
    var expiryInput = overlay.querySelector("[data-expiry]");
    if (expiryInput) {
      expiryInput.addEventListener("input", function () {
        var digits = expiryInput.value.replace(/\D/g, "").slice(0, 4);
        expiryInput.value = digits.length > 2 ? digits.slice(0, 2) + " / " + digits.slice(2) : digits;
      });
    }
    overlay.querySelector("[data-sheet-body]").addEventListener("keydown", function (event) {
      if (event.key === "Enter" && event.target && event.target.tagName === "INPUT" && event.target.type !== "checkbox") {
        event.preventDefault();
        pay("card");
      }
    });
    paint();

    return {
      destroy: destroy,
      getHandoff: currentHandoff,
      setBump: function (bumpId, selected) {
        var has = state.bumpIds.indexOf(bumpId) !== -1;
        if (selected && !has) state.bumpIds.push(bumpId);
        if (!selected && has) state.bumpIds = state.bumpIds.filter(function (id) { return id !== bumpId; });
        paint();
      }
    };
  }

  function mountFollowUpPrompt(settings, pending, next, url) {
    assertDom();
    ensureStyles();
    var host = settings.mount || root.document.body;
    var wrap = root.document.createElement("div");
    wrap.innerHTML = '<div class="fm-overlay"><div class="fm-sheet" role="dialog" aria-modal="true" tabindex="-1">' +
      '<p class="fm-kicker">Post-checkout</p><h2>' + escapeHtml(next.label) + "</h2>" +
      "<p>Plan payment succeeded. Confirm " + escapeHtml(formatMoney(next.amountCents)) + " as a separate Stripe payment, or skip it.</p>" +
      '<button type="button" class="fm-pay" data-accept>Confirm on Stripe</button>' +
      '<button type="button" class="fm-text-btn" data-skip>Skip this add-on</button></div></div>';
    var overlay = wrap.firstChild;
    host.appendChild(overlay);
    overlay.querySelector("[data-accept]").addEventListener("click", function () {
      pending.phase = "follow-up";
      pending.confirmingKey = next.key;
      storageSet(PENDING_KEY, pending);
      root.location.assign(url);
    });
    overlay.querySelector("[data-skip]").addEventListener("click", function () {
      completePendingCheckout();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (settings.onDeclineBump) settings.onDeclineBump(pending);
    });
    return overlay;
  }

  function resumeCheckout(options) {
    var settings = options || {};
    var status = settings.status || readQuery("checkout");
    var pending = peekPendingCheckout();
    if (status === "cancel") {
      completePendingCheckout();
      if (pending && pending.phase === "follow-up") {
        if (settings.onDeclineBump) settings.onDeclineBump(pending);
        return { status: "declined-follow-up", pending: pending };
      }
      if (settings.onCancel) settings.onCancel(pending);
      return { status: "cancel", pending: pending };
    }
    if (status !== "success") return { status: pending ? "pending" : "idle", pending: pending };
    if (!pending) return { status: "success", pending: null };
    if (pending.phase === "follow-up" && pending.confirmingKey) {
      pending.followUps = (pending.followUps || []).filter(function (item) { return item.key !== pending.confirmingKey; });
      pending.phase = "plan";
      pending.confirmingKey = null;
      storageSet(PENDING_KEY, pending);
    }
    if (pending.followUps && pending.followUps.length) {
      var next = pending.followUps[0];
      var rawUrl = resolveStripeUrl(next.key);
      var url = rawUrl ? decorateStripeUrl(rawUrl, { email: pending.email, clientReferenceId: pending.clientReferenceId }) : "";
      if (settings.mount && url) mountFollowUpPrompt(settings, pending, next, url);
      return { status: "follow-up", pending: pending, next: next, url: url };
    }
    completePendingCheckout();
    if (settings.onSuccess) settings.onSuccess(pending);
    return { status: "success", pending: pending };
  }

  function startCheckout(options) {
    var settings = options || {};
    return mountCheckoutSheet({
      mount: settings.mount || null,
      planId: settings.planId || "annual",
      bumpIds: settings.bumpIds || [],
      email: settings.email || "",
      diagnosis: settings.diagnosis || null,
      onHandoff: settings.onHandoff,
      onSuccess: settings.onSuccess,
      onClose: settings.onClose
    });
  }

  function assertDom() {
    if (typeof root.document === "undefined") throw new Error("Checkout UI requires a browser document.");
  }

  function getUpsellOffer(selectedBumpIds) {
    var selected = selectedBumpIds || [];
    var remaining = CHECKOUT_CONFIG.orderBumps.filter(function (bump) {
      return selected.indexOf(bump.id) === -1 && bump.placements.indexOf("post") !== -1;
    });
    return remaining.filter(function (bump) { return bump.id === "penaltyStake"; })[0] || remaining[0] || null;
  }

  var STYLES = [
    ".fm-kicker{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-emerald,#10b981);margin:0 0 6px}",
    ".fm-callout{margin:14px 0;padding:12px 14px;border-radius:12px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.28)}",
    ".fm-callout[data-type='neuro-fact']{background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.35)}",
    ".fm-callout p{margin:0;color:var(--text-muted,#94a3b8);font-size:13px;line-height:1.45}",
    ".fm-callout strong{color:#f8fafc;font-weight:900}",
    ".quiz-option > span:first-child{font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1.2}",
    ".quiz-option{min-height:62px}",
    ".quiz-option .fm-ico{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.07);font-size:16px;line-height:1;margin-right:11px;vertical-align:middle;flex-shrink:0}",
    ".fm-loader h2,.fm-diagnosis h2,.fm-sheet h2{font-size:22px;line-height:1.25;margin:0 0 8px}",
    ".fm-track{position:relative;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}",
    ".fm-track i{display:block;height:100%;width:0;border-radius:inherit;background:#ef4444;transition:width .12s linear}",
    ".fm-track i.is-base{background:#10b981}",
    ".fm-base-tick{position:absolute;top:-3px;bottom:-3px;width:2px;background:#94a3b8}",
    ".fm-loader-pct{margin:8px 0 12px;font-weight:800}",
    ".fm-loader-steps{list-style:none;display:flex;flex-direction:column;gap:10px;padding:0;margin:0}",
    ".fm-loader-steps li{display:flex;gap:10px;align-items:flex-start;color:var(--text-muted,#94a3b8)}",
    ".fm-loader-steps strong{display:block;color:var(--text-main,#f8fafc);font-size:14px}",
    ".fm-loader-steps small{display:block;font-size:12px}",
    ".fm-mark{width:18px;height:18px;margin-top:2px;border-radius:50%;border:2px solid rgba(255,255,255,.2);box-sizing:border-box;flex:none;position:relative}",
    ".fm-loader-steps li[data-status='active'] .fm-mark{border-color:#10b981;animation:fm-spin .8s linear infinite}",
    ".fm-loader-steps li[data-status='done'] .fm-mark{background:#10b981;border-color:#10b981}",
    ".fm-loader-steps li[data-status='done'] .fm-mark:after{content:'\\2713';position:absolute;inset:0;color:#04140d;font-size:12px;line-height:14px;text-align:center;font-weight:900}",
    "@keyframes fm-spin{to{transform:rotate(360deg)}}",
    ".fm-diagnosis .fm-lead,.fm-summary{color:var(--text-muted,#94a3b8);font-size:14px;line-height:1.45}",
    ".fm-diagnosis h2 span{color:#ef4444}",
    ".fm-compare{display:grid;gap:10px;margin:14px 0}",
    ".fm-compare span{font-size:12px;color:var(--text-muted,#94a3b8)}",
    ".fm-battle{position:relative;background:rgba(14,19,31,0.85);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:18px 16px}",
    ".fm-battle h2{text-align:center;letter-spacing:.08em;font-size:clamp(14px,4.3vw,18px);line-height:1.2;margin:0 0 4px;font-weight:800}",
    ".fm-battle .fm-kicker{text-align:center;color:#94a3b8;letter-spacing:.16em}",
    ".fm-gauges{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0 2px}",
    ".fm-gauge{text-align:center}",
    ".fm-dial{width:104px;height:104px;margin:0 auto 8px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(from -90deg, var(--dial,#f43f5e) calc(var(--pct) * 1%), rgba(255,255,255,.1) 0);box-shadow:0 0 16px var(--glow, rgba(244,63,94,.35))}",
    ".fm-dial b{width:80%;height:80%;border-radius:50%;display:grid;place-items:center;background:#070b12;color:#f8fafc;font-size:22px;font-weight:900;letter-spacing:-.04em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}",
    ".fm-gauge.is-load{--dial:#f43f5e;--glow:rgba(244,63,94,.4)}",
    ".fm-gauge.is-base{--dial:#10b981;--glow:rgba(16,185,129,.32)}",
    ".fm-gauge.is-load .fm-dial b{color:#fecdd3}",
    ".fm-gauge.is-base .fm-dial b{color:#6ee7b7}",
    ".fm-gauge-name{display:block;max-width:148px;margin:0 auto;font-size:11px;font-weight:900;letter-spacing:.06em;line-height:1.2;color:#e2e8f0}",
    ".fm-vs{position:absolute;left:50%;top:52px;transform:translate(-50%,-50%);z-index:1;font-size:10px;font-weight:900;letter-spacing:.16em;color:#cbd5e1;background:#0e131f;border:1px solid rgba(255,255,255,.14);border-radius:99px;padding:3px 7px}",
    ".fm-radar-stage{display:grid;grid-template-columns:72px minmax(0,1fr) 72px;grid-template-rows:auto minmax(176px,1fr) auto;align-items:center;justify-items:center;width:100%;max-width:420px;margin:8px auto 0}",
    ".fm-radar{grid-column:2;grid-row:2;width:100%;height:auto;display:block;overflow:visible}",
    ".fm-axis{text-align:center;line-height:1;text-shadow:0 2px 10px rgba(0,0,0,.9)}",
    ".fm-axis b{display:block;font-size:22px;font-weight:400;line-height:1}",
    ".fm-axis span{display:block;margin-top:3px;font-size:11px;font-weight:900;letter-spacing:.08em;white-space:nowrap}",
    ".fm-axis-n{grid-column:2;grid-row:1;margin-bottom:-4px}",
    ".fm-axis-e{grid-column:3;grid-row:2;margin-left:-6px}",
    ".fm-axis-s{grid-column:2;grid-row:3;margin-top:-4px}",
    ".fm-axis-w{grid-column:1;grid-row:2;margin-right:-6px}",
    ".fm-axis-n span{color:#7dd3fc}",
    ".fm-axis-e span{color:#fda4af}",
    ".fm-axis-s span{color:#6ee7b7}",
    ".fm-axis-w span{color:#d8b4fe}",
    ".fm-radar-ring{fill:none;stroke:rgba(255,255,255,0.12);stroke-width:1}",
    ".fm-radar-hex{fill:none;stroke:rgba(255,255,255,0.12);stroke-width:1}",
    ".fm-radar-axis{stroke:rgba(255,255,255,0.12);stroke-width:1}",
    ".fm-radar-base{fill:rgba(16,185,129,.06);stroke:#34d399;stroke-width:1.4;stroke-dasharray:3 2.5}",
    ".fm-radar-fill{stroke:#f43f5e;fill:rgba(244,63,94,0.22);stroke-width:1.6}",
    ".fm-radar-dot{fill:#fff;stroke:#f43f5e;stroke-width:1.5}",
    ".fm-radar-core{fill:#f8fafc}",
    ".fm-pillars,.fm-checks-list{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-direction:column;gap:10px}",
    ".fm-pillar-top{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:4px}",
    ".fm-battle .fm-pillars{gap:7px;margin:8px 2px 0}",
    ".fm-battle .fm-pillar-top{font-size:12px;font-weight:900;letter-spacing:.07em}",
    ".fm-battle .fm-pillar-top b{font-size:14px;color:#f8fafc}",
    ".fm-battle .fm-track{height:12px;background:rgba(255,255,255,.08);overflow:visible}",
    ".fm-pillars small,.fm-disclaimer,.fm-note{color:var(--text-dim,#64748b);font-size:12px;line-height:1.4}",
    ".fm-battle .fm-disclaimer{margin:10px 0 2px;text-align:center}",
    ".fm-weapons{display:grid;gap:8px;margin:14px 0 0}",
    ".fm-weapon{display:flex;gap:10px;align-items:center;padding:12px;border-radius:14px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08)}",
    ".fm-weapon-ico{font-size:18px;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none;line-height:1;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.07)}",
    ".fm-weapon-copy{display:flex;flex-direction:column;gap:1px;min-width:0}",
    ".fm-weapon-copy strong{font-size:10px;letter-spacing:.14em;color:#8fb8aa}",
    ".fm-weapon-copy b{font-size:14px;line-height:1.25;color:#f8fafc;font-weight:800}",
    ".fm-weapon-copy em{font-style:normal;font-size:12px;font-weight:600;color:#94a3b8}",
    ".fm-target{margin-top:14px}",
    ".fm-overlay{position:fixed;inset:0;z-index:240;background:rgba(2,6,14,.72);display:flex;align-items:flex-end;justify-content:center}",
    ".fm-overlay-contained{position:fixed;inset:auto}",
    ".fm-overlay-contained .fm-sheet{max-height:100%}",
    ".fm-sheet{width:min(430px,100%);max-height:min(92vh,760px);overflow:auto;background:#10141f;color:#f8fafc;border-radius:18px 18px 0 0;padding:10px 16px 22px;box-shadow:0 -20px 60px rgba(0,0,0,.35)}",
    ".fm-grabber{width:42px;height:4px;border-radius:99px;background:rgba(255,255,255,.16);margin:4px auto 10px}",
    ".fm-sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}",
    ".fm-icon-btn,.fm-text-btn{background:none;border:0;color:#94a3b8;cursor:pointer}",
    ".fm-plan-summary,.fm-bump{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;background:#161c2b}",
    ".fm-bumps{display:flex;flex-direction:column;gap:8px;margin:12px 0}",
    ".fm-bump{display:flex;gap:10px;align-items:flex-start;cursor:pointer}",
    ".fm-bump small{display:block;color:#f59e0b;font-weight:800;letter-spacing:.04em}",
    ".fm-bump em,.fm-bump b{display:block;font-style:normal;font-weight:500;color:#94a3b8;font-size:12px}",
    ".fm-totals{display:grid;gap:6px;margin:0 0 8px}",
    ".fm-totals div{display:flex;justify-content:space-between;gap:12px;font-size:13px}",
    ".fm-wallets{display:flex;flex-direction:column;gap:8px;margin:12px 0}",
    ".fm-wallet{height:46px;border-radius:12px;border:0;font-weight:700;cursor:pointer}",
    ".fm-apple{background:#000;color:#fff}",
    ".fm-google{background:#fff;color:#111}",
    ".fm-field,.fm-card-fields label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:8px}",
    ".fm-field input,.fm-card-fields input{height:42px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#0c1018;color:#f8fafc;padding:0 10px;font:inherit}",
    ".fm-card-row{display:grid;grid-template-columns:1.2fr .8fr .9fr;gap:8px}",
    ".fm-pay{width:100%;height:48px;border:0;border-radius:12px;background:#10b981;color:#04140d;font-weight:800;cursor:pointer;margin-top:6px}",
    ".fm-or{text-align:center;color:#64748b;font-size:12px;margin:4px 0 8px}",
    ".fm-error{color:#f87171;min-height:1em;font-size:12px}",
    ".fm-status{color:#94a3b8;font-size:12px}",
    ".fm-hidden{display:none!important}",
    ".fm-success{padding:12px 0 4px}",
    ".fm-sheet button:focus-visible,.fm-field input:focus-visible,.fm-card-fields input:focus-visible{outline:2px solid #10b981;outline-offset:2px}",
    "@media (prefers-reduced-motion: reduce){.fm-loader-steps li[data-status='active'] .fm-mark{animation:none}.fm-track i{transition:none}}"
  ].join("");

  function ensureStyles() {
    if (typeof root.document === "undefined") return;
    if (root.document.getElementById("fm-funnel-styles")) return;
    var style = root.document.createElement("style");
    style.id = "fm-funnel-styles";
    style.textContent = STYLES;
    root.document.head.appendChild(style);
  }

  var FunnelModule = {
    version: "1.0.0",
    HEALTHY_BASELINE: HEALTHY_BASELINE,
    LOADER_DURATION_MS: LOADER_DURATION_MS,
    QUIZ_STEPS: QUIZ_STEPS,
    LOADER_STEPS: LOADER_STEPS,
    CHECKOUT_CONFIG: CHECKOUT_CONFIG,
    configure: configure,
    createSession: createSession,
    getStep: getStep,
    setAnswer: setAnswer,
    toggleAnswer: toggleAnswer,
    advance: advance,
    isQuizComplete: isQuizComplete,
    getQuizViewModel: getQuizViewModel,
    renderCalloutHTML: renderCalloutHTML,
    scoreAnswers: scoreAnswers,
    buildDiagnosis: buildDiagnosis,
    renderDiagnosisHTML: renderDiagnosisHTML,
    getLoaderTimeline: getLoaderTimeline,
    getLoaderFrame: getLoaderFrame,
    runLoader: runLoader,
    formatMoney: formatMoney,
    priceCart: priceCart,
    cartSignature: cartSignature,
    resolveHandoff: resolveHandoff,
    resolveStripeUrl: resolveStripeUrl,
    isStripePaymentLink: isStripePaymentLink,
    validateCardFields: validateCardFields,
    suggestedReturnUrls: suggestedReturnUrls,
    getUpsellOffer: getUpsellOffer,
    startCheckout: startCheckout,
    resumeCheckout: resumeCheckout,
    peekPendingCheckout: peekPendingCheckout,
    completePendingCheckout: completePendingCheckout
  };

  root.FunnelModule = FunnelModule;
  if (typeof root.document !== "undefined") ensureStyles();
})(typeof window !== "undefined" ? window : globalThis);
