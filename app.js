/* global DopamineFX, FunnelModule, FeaturesModule, Day1Module, LiveTelemetry, Panic2Engine, BlockerShield, LockScreenWidget */

const RANKS = [
  { minDay: 0, name: "INITIATE", code: "I", nextDay: 3, benefit: "Withdrawal Crest & Cue Interruption" },
  { minDay: 3, name: "SURGE", code: "II", nextDay: 7, benefit: "Day-7 Androgen Surge Window" },
  { minDay: 7, name: "IRON MONK", code: "III", nextDay: 14, benefit: "Prefrontal Brake Conditioning" },
  { minDay: 14, name: "SPARTAN", code: "IV", nextDay: 30, benefit: "Deep Focus, Eye Contact & Vocal Presence" },
  { minDay: 30, name: "NNN TITAN", code: "V", nextDay: 60, benefit: "30-Day Ritual Mastery • D2 Recovery" },
  { minDay: 60, name: "WINTER GUARD", code: "VI", nextDay: 90, benefit: "66-Day Automaticity Threshold" },
  { minDay: 90, name: "SOVEREIGN", code: "VII", nextDay: 180, benefit: "Full 90-Day Winter Arc Neuro-Reboot" }
];

const SAVED_STRIPE_KEY = "ironarc.stripeLinks.v1";

const funnelSession = window.FunnelModule ? window.FunnelModule.createSession() : null;

// Pre-seed sensible defaults so jumping directly to Diagnosis in Studio works immediately
if (funnelSession && window.FunnelModule) {
  window.FunnelModule.setAnswer(funnelSession, "goal", "nnn");
  window.FunnelModule.setAnswer(funnelSession, "age", "a25");
  window.FunnelModule.setAnswer(funnelSession, "frequency", "daily");
  window.FunnelModule.setAnswer(funnelSession, "escalation", "novelty");
  window.FunnelModule.setAnswer(funnelSession, "symptoms", ["fog", "energy", "presence"]);
  window.FunnelModule.setAnswer(funnelSession, "trigger", "night");
  window.FunnelModule.setAnswer(funnelSession, "attempts", "week1");
  window.FunnelModule.setAnswer(funnelSession, "pact", "Ready");
  funnelSession.stepIndex = 0;
}

const state = {
  screen: "quiz", // quiz | loader | diagnosis | paywall | app
  selectedPlan: "annual",
  precheckPenaltyBump: true,
  activeTab: "blocker", // blocker | lockquote | battle | panic | iphone
  panicLaunch: false,
  streakDays: 14,
  streakSecondsOffset: 23419,
  willpowerXP: 450,
  pledgedToday: false,
  urgesDefeated: 9,
  signatureSigned: false,
  callsign: "COMMANDER-01",
  stopLoaderFn: null,
  squad: [
    { name: "You (Commander)", days: 14, status: "alive", note: "Daily Iron Oath sealed • Shield Armed" },
    { name: "Marcus_V", days: 14, status: "alive", note: "Defeated 11:40 PM urge via Panic 2.0 (+50 XP)" },
    { name: "Kieran_99", days: 9, status: "danger", note: "Late-night trigger window • Sent backup flare" },
    { name: "Devon_Lift", days: 2, status: "fallen", note: "Folded Nov 4 • $15 Penalty Ledgered • In Redemption" }
  ]
};

// Load saved Stripe Payment Links from localStorage if configured
function loadSavedStripeConfig() {
  try {
    const raw = localStorage.getItem(SAVED_STRIPE_KEY);
    if (raw && window.FunnelModule) {
      const parsed = JSON.parse(raw);
      window.FunnelModule.configure({ stripeLinks: parsed });
    }
  } catch (_) {}
}

function getRank(days) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (days >= r.minDay) current = r;
  }
  return current;
}

function getRewirePercentage(days) {
  return Math.min(100, Math.round((days / 90) * 82 + 18));
}

function formatSubClock(totalSeconds) {
  const hrs = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hrs)}h : ${pad(mins)}m : ${pad(secs)}s`;
}

function updateXPPill() {
  const pill = document.getElementById("xpPill");
  if (pill) {
    pill.textContent = `⚡ ${state.willpowerXP} XP`;
  }
}

const LIVE_TABS = ["blocker", "lockquote", "battle", "panic", "iphone"];

function studioIsActive(jump) {
  if (jump === "radar") return state.screen === "diagnosis";
  if (LIVE_TABS.indexOf(jump) !== -1) return state.screen === "app" && state.activeTab === jump;
  return jump === state.screen;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function trialSnapshot() {
  if (!window.Day1Module || typeof window.Day1Module.getState !== "function") return null;
  try {
    const snap = window.Day1Module.getState();
    if (!snap || !snap.active || !snap.remaining || snap.remaining.expired) return null;
    return snap;
  } catch (err) {
    return null;
  }
}

function weaponStatus() {
  let blockerOn = true;
  let quoteOn = true;
  try {
    if (window.BlockerShield && typeof window.BlockerShield.getState === "function") {
      blockerOn = !!window.BlockerShield.getState().master;
    }
  } catch (err) { /* shield state is optional */ }
  try {
    if (window.LockScreenWidget && typeof window.LockScreenWidget.getState === "function") {
      quoteOn = !!window.LockScreenWidget.getState().shieldOn;
    }
  } catch (err) { /* quote state is optional */ }
  return { blockerOn, quoteOn };
}

function syncDynamicIsland() {
  const label = document.getElementById("dynamicIslandLabel");
  if (!label) return;
  const on = weaponStatus().blockerOn;
  label.textContent = on ? "🛡️ SHIELD ON" : "🛡️ SHIELD OFF";
  label.classList.toggle("is-off", !on);
}

function syncTrialStrip() {
  const strip = document.getElementById("powerStrip");
  if (!strip) return;
  const snap = trialSnapshot();
  const show = !!(snap && state.screen === "app");
  strip.hidden = !show;
  if (!show) return;
  const clock = document.getElementById("trialClock");
  const rem = snap.remaining;
  if (clock) {
    clock.textContent = `⏱️ 24H FREE TRIAL: ${pad2(rem.h)}:${pad2(rem.m)}:${pad2(rem.s)}`;
  }
  const weapons = weaponStatus();
  const blocker = document.getElementById("pillBlocker");
  const quote = document.getElementById("pillQuote");
  if (blocker) {
    blocker.textContent = `🛡️ Porn Blocker: ${weapons.blockerOn ? "ON" : "OFF"}`;
    blocker.classList.toggle("is-on", weapons.blockerOn);
    blocker.classList.toggle("is-off", !weapons.blockerOn);
  }
  if (quote) {
    quote.textContent = `📱 Lock Quote: ${weapons.quoteOn ? "ON" : "OFF"}`;
    quote.classList.toggle("is-on", weapons.quoteOn);
    quote.classList.toggle("is-off", !weapons.quoteOn);
  }
}

function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (err) { /* clipboard blocked */ }
  ta.remove();
}

function guessLanIp() {
  return new Promise((resolve) => {
    const found = [];
    let pc = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { if (pc) pc.close(); } catch (err) { /* already closed */ }
      resolve(found[0] || null);
    };
    try {
      pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("lan");
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          finish();
          return;
        }
        const match = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(event.candidate.candidate || "");
        if (match && match[1] !== "0.0.0.0" && match[1].indexOf("127.") !== 0 && found.indexOf(match[1]) === -1) {
          found.push(match[1]);
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(finish);
    } catch (err) {
      finish();
      return;
    }
    setTimeout(finish, 900);
  });
}

function resolveInstallUrl() {
  const originBase = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}`;
  const host = window.location.hostname;
  const pack = (url, bound) => ({ url, bound: bound === true });
  if (host && host !== "localhost" && host !== "127.0.0.1") return Promise.resolve(pack(originBase, true));
  const fromIp = (ip) => {
    if (!ip) return pack(originBase, false);
    const port = window.location.port ? `:${window.location.port}` : "";
    return pack(`http://${ip}${port}/`, false);
  };
  return fetch("./lan.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.url) return pack(data.url, data.bound === true);
      return guessLanIp().then(fromIp);
    })
    .catch(() => guessLanIp().then(fromIp));
}

function loadNativeBadges() {
  const slot = document.getElementById("nativeBundle");
  fetch("./capacitor.config.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((cfg) => {
      if (!cfg || !slot || !slot.isConnected) return;
      const fc = cfg.plugins && cfg.plugins.IronArcFamilyControls;
      const wk = cfg.plugins && cfg.plugins.IronArcWidgetKit;
      const bits = [cfg.appId || "com.ironarc.app"];
      if (fc) bits.push("FamilyControls");
      if (wk && wk.kind) bits.push(wk.kind);
      else bits.push("WidgetKit");
      slot.textContent = bits.join(" • ");
    })
    .catch(() => {});
}

function renderHoloPass(subtitleText) {
  const rank = getRank(state.streakDays);
  const displayDays = state.screen === "app" ? `DAY ${state.streakDays}` : "DAY 0 → 90";
  return `
    <div class="holo-pass">
      <div class="holo-top">
        <span class="holo-tag">◈ IRON ARC • SOVEREIGN PASS</span>
        <span class="holo-serial">ID #IA-2026-8841</span>
      </div>
      <div class="holo-main">
        <div>
          <div class="holo-callsign">${state.callsign}</div>
          <div class="holo-meta">${subtitleText || "Protocol: 30D NNN + 90D Winter Arc"}</div>
        </div>
        <div class="holo-badge">
          <div class="holo-badge-rank">RANK: ${rank.name}</div>
          <div class="holo-badge-days">${displayDays}</div>
        </div>
      </div>
    </div>
  `;
}

function render() {
  if (state.stopLoaderFn) {
    state.stopLoaderFn();
    state.stopLoaderFn = null;
  }
  if (window.Day1Module) window.Day1Module.unmount();
  if (window.BlockerShield) window.BlockerShield.unmount();

  updateXPPill();

  const root = document.getElementById("viewRoot");
  const bottomNav = document.getElementById("bottomNav");

  document.querySelectorAll(".studio-btn[data-jump]").forEach((btn) => {
    btn.classList.toggle("active", studioIsActive(btn.dataset.jump));
  });

  if (state.screen === "quiz") {
    bottomNav.style.display = "none";
    renderQuiz(root);
  } else if (state.screen === "loader") {
    bottomNav.style.display = "none";
    renderLoader(root);
  } else if (state.screen === "diagnosis") {
    bottomNav.style.display = "none";
    renderDiagnosis(root);
  } else if (state.screen === "paywall") {
    bottomNav.style.display = "none";
    renderPaywall(root);
  } else if (state.screen === "app") {
    bottomNav.style.display = "flex";
    renderApp(root);
  }
  syncTrialStrip();
  syncDynamicIsland();
}

/* =========================================================================
   1. 8-STEP PSYCHOLOGICAL QUIZ FUNNEL (WITH HOLO PASS & SIGNATURE PAD)
   ========================================================================= */
function renderQuiz(root) {
  const steps = window.FunnelModule.QUIZ_STEPS;
  const idx = funnelSession.stepIndex;
  const step = steps[idx];
  const pct = Math.round(((idx + 1) / steps.length) * 100);
  const currentAns = funnelSession.answers[step.id];

  const isMulti = step.selectionMode === "multi";
  const isFinalStep = idx === steps.length - 1;

  const calloutHTML = step.callout ? window.FunnelModule.renderCalloutHTML(step.callout) : "";

  root.innerHTML = `
    ${idx === 0 ? renderHoloPass("Unclaimed Pass • Complete 60s Assessment to Lock") : ""}
    <div class="quiz-header-row">
      ${idx > 0 ? `<button id="quizBackBtn" class="quiz-back-btn">← Back</button>` : `<span></span>`}
      <span style="font-size:11px; color:var(--text-dim); font-weight:700;">${idx + 1} / ${steps.length}</span>
    </div>
    <div class="quiz-progress-wrap">
      <div class="quiz-progress-fill" style="width: ${pct}%"></div>
    </div>
    <div class="quiz-step-tag">${step.tag}</div>
    <h1 class="quiz-question">${step.question}</h1>
    <p class="quiz-sub">${step.sub}</p>

    <div class="quiz-options">
      ${step.options
        .map((opt) => {
          const isSelected = isMulti
            ? Array.isArray(currentAns) && currentAns.includes(opt.id)
            : currentAns === opt.id;
          return `
            <button class="quiz-option ${isSelected ? "selected" : ""}" data-opt-id="${opt.id}">
              <span>${opt.label}</span>
              <span class="quiz-option-badge">${isMulti && isSelected ? "✓ Selected" : opt.badge}</span>
            </button>
          `;
        })
        .join("")}
    </div>

    ${calloutHTML}

    ${
      isFinalStep
        ? `
      <div class="sig-card">
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--accent-emerald-bright); font-weight:800; margin-bottom:6px;">
          <span>✍️ SIGN YOUR 30/90-DAY IRON PACT BELOW</span>
          <button id="clearSigBtn" style="background:none; border:none; color:var(--text-muted); font-size:11px; cursor:pointer;">Clear</button>
        </div>
        <canvas id="sigCanvas" class="sig-canvas" width="380" height="82"></canvas>
      </div>
    `
        : ""
    }

    ${
      isMulti
        ? `<button id="multiNextBtn" class="btn-primary" style="margin-top: 12px;">Continue Assessment →</button>`
        : ""
    }

    <div style="margin-top: 16px; text-align: center; font-size: 11.5px; color: var(--text-dim);">
      🔒 100% On-Device Privacy • Join 48,200+ Winter Arc Challengers
    </div>
  `;

  const backBtn = document.getElementById("quizBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.DopamineFX) window.DopamineFX.playTick(420, 0.03);
      funnelSession.stepIndex = Math.max(0, idx - 1);
      render();
    });
  }

  if (isFinalStep) {
    initSignaturePad("sigCanvas", "clearSigBtn");
  }

  root.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.DopamineFX) window.DopamineFX.playTick(660, 0.04);
      const optId = btn.dataset.optId;

      if (isMulti) {
        window.FunnelModule.toggleAnswer(funnelSession, step.id, optId);
        render();
      } else {
        window.FunnelModule.setAnswer(funnelSession, step.id, optId);
        if (idx < steps.length - 1) {
          funnelSession.stepIndex = idx + 1;
          render();
        } else {
          state.screen = "loader";
          render();
        }
      }
    });
  });

  const multiNextBtn = document.getElementById("multiNextBtn");
  if (multiNextBtn) {
    multiNextBtn.addEventListener("click", () => {
      if (window.DopamineFX) window.DopamineFX.playTick(740, 0.05);
      const ans = funnelSession.answers[step.id];
      if (!Array.isArray(ans) || ans.length === 0) {
        window.FunnelModule.setAnswer(funnelSession, step.id, ["fog", "energy"]);
      }
      funnelSession.stepIndex = idx + 1;
      render();
    });
  }
}

function initSignaturePad(canvasId, clearBtnId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";

  let drawing = false;
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const start = (e) => {
    drawing = true;
    state.signatureSigned = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => {
    if (drawing && window.DopamineFX) window.DopamineFX.playTick(820, 0.03);
    drawing = false;
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);

  const clearBtn = document.getElementById(clearBtnId);
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.signatureSigned = false;
    });
  }
}

/* =========================================================================
   2. CLINICAL BRAIN SCAN LOADER (3.5 SECONDS)
   ========================================================================= */
function renderLoader(root) {
  let lastStepDoneCount = 0;
  state.stopLoaderFn = window.FunnelModule.runLoader({
    mount: root,
    durationMs: 3200,
    onTick(snapshot) {
      const doneCount = snapshot.steps.filter((s) => s.status === "done").length;
      if (doneCount > lastStepDoneCount) {
        lastStepDoneCount = doneCount;
        if (window.DopamineFX) window.DopamineFX.playTick(540 + doneCount * 110, 0.05);
      }
    },
    onComplete() {
      if (window.DopamineFX) window.DopamineFX.playRankUp();
      state.screen = "diagnosis";
      render();
    }
  });
}

/* =========================================================================
   3. 4-PILLAR SYMPTOM RADAR & DOPAMINE DEPENDENCY DIAGNOSIS
   ========================================================================= */
function renderDiagnosis(root) {
  const diagnosis = window.FunnelModule.buildDiagnosis(funnelSession);
  const diagHTML = window.FunnelModule.renderDiagnosisHTML(diagnosis);

  root.innerHTML = `
    <div class="report-card" style="padding: 16px;">
      ${diagHTML}
    </div>
    <button id="toPaywallBtn" class="btn-primary">Lock In My 30/90-Day Recovery Plan →</button>
  `;

  document.getElementById("toPaywallBtn").addEventListener("click", () => {
    if (window.DopamineFX) window.DopamineFX.playTick(760, 0.05);
    state.screen = "paywall";
    render();
  });
}

/* =========================================================================
   4. HARD PAYWALL + ORDER BUMP + STRIPE / APPLE PAY SHEET
   ========================================================================= */
function renderPaywall(root) {
  const diagnosis = window.FunnelModule.buildDiagnosis(funnelSession);

  root.innerHTML = `
    <div class="paywall-header">
      <span class="quiz-step-tag" style="margin:0;">IRON ARC PRO</span>
      <button id="paywallCloseBtn" class="paywall-close" title="Triggers 50% Exit-Intent Offer">✕</button>
    </div>

    <h1 class="tab-headline">Arm Both Weapons</h1>
    <div class="weapon-duo">
      <article class="weapon-card weapon-card-shield">
        <div class="weapon-art" aria-hidden="true">
          <span class="weapon-orb">🛡️</span>
          <span class="weapon-bars"><i></i><i></i><i></i><i></i></span>
        </div>
        <h2>🛡️ PORN URL BLOCKER</h2>
        <p>42,850+ Sites Blocked • Safari + Incognito</p>
      </article>
      <article class="weapon-card weapon-card-quote">
        <div class="weapon-phone" aria-hidden="true">
          <span class="weapon-phone-time">9:41</span>
          <span class="weapon-phone-quote">Rule your mind.</span>
        </div>
        <h2>📱 STOIC QUOTE WIDGET</h2>
        <p>iOS Lock Screen Armor • 24/7 Stoic Quotes</p>
      </article>
    </div>

    <div class="plan-grid">
      <div class="plan-card ${state.selectedPlan === "annual" ? "active" : ""}" data-plan="annual">
        <span class="plan-badge">MOST POPULAR • 3-DAY FREE TRIAL</span>
        <div>
          <div style="font-weight: 800; font-size: 14.5px;">Annual NNN + Winter Arc Pass</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">3 days free, then $29.99/yr ($0.57/wk)</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 900; font-size: 18px; color: var(--accent-emerald-bright);">$2.49</div>
          <div style="font-size: 10.5px; color: var(--text-muted);">/ month</div>
        </div>
      </div>

      <div class="plan-card ${state.selectedPlan === "monthly" ? "active" : ""}" data-plan="monthly">
        <div>
          <div style="font-weight: 800; font-size: 14.5px;">30-Day NNN Survival Pass</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">Billed monthly • No trial • Cancel anytime</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 900; font-size: 18px;">$9.99</div>
          <div style="font-size: 10.5px; color: var(--text-muted);">/ month</div>
        </div>
      </div>
    </div>

    <label class="pact-toggle">
      <input id="penaltyBumpToggle" type="checkbox" ${state.precheckPenaltyBump ? "checked" : ""} />
      <span>
        <strong>🔥 $15 RELAPSE PACT</strong>
        <em>+310% stick rate</em>
      </span>
    </label>

    <button id="openCheckoutSheetBtn" class="btn-primary" type="button">Apple Pay / Stripe Checkout</button>
    <button type="button" class="btn-trial" data-d1-start-pass>🎁 Try 1 Day Free (24H Full App Access — No Card)</button>
    <div class="paywall-fine">IA-PERFORMANCE-LABS • Cancel anytime</div>
  `;

  root.querySelectorAll(".plan-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (window.DopamineFX) window.DopamineFX.playTick(680, 0.04);
      state.selectedPlan = card.dataset.plan;
      render();
    });
  });

  const bumpToggle = document.getElementById("penaltyBumpToggle");
  if (bumpToggle) {
    bumpToggle.addEventListener("change", (e) => {
      if (window.DopamineFX) window.DopamineFX.playTick(720, 0.04);
      state.precheckPenaltyBump = e.target.checked;
    });
  }

  document.getElementById("openCheckoutSheetBtn").addEventListener("click", () => {
    if (window.DopamineFX) window.DopamineFX.playTick(840, 0.05);
    window.FunnelModule.startCheckout({
      planId: state.selectedPlan,
      bumpIds: state.precheckPenaltyBump ? ["penaltyStake"] : [],
      diagnosis,
      onSuccess() {
        if (window.DopamineFX) {
          window.DopamineFX.playOathSealed();
          window.DopamineFX.burstParticles({ mode: "rank" });
        }
        if (window.Day1Module) window.Day1Module.markUpgraded();
        state.willpowerXP += 100;
        state.activeTab = "blocker";
        state.screen = "app";
        render();
      }
    });
  });

  const day1PassBtn = root.querySelector("[data-d1-start-pass]");
  if (day1PassBtn) {
    day1PassBtn.addEventListener("click", () => {
      enterDay1Pass();
    });
  }

  document.getElementById("paywallCloseBtn").addEventListener("click", () => {
    if (window.DopamineFX) window.DopamineFX.playTick(420, 0.04);
    openDownsellModal();
  });
}

/* =========================================================================
   5. 50% OFF EXIT-INTENT DOWNSELL MODAL (QUITTR $19.99/$14.99 RECOVERY)
   ========================================================================= */
function openDownsellModal() {
  const modalRoot = document.getElementById("modalRoot");
  const diagnosis = window.FunnelModule.buildDiagnosis(funnelSession);

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card" style="border-color: var(--accent-amber);">
        <div class="season-pill" style="display:inline-block; margin-bottom: 10px;">ONE-TIME FOUNDER COMMITMENT OFFER</div>
        <h2 style="font-size: 21px; font-weight: 900; margin-bottom: 8px;">Wait — Don't Face the 11 PM Urge Unarmed.</h2>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.45; margin-bottom: 14px;">
          With a <strong>${diagnosis.dependencyScore}% Dopamine Dependency Score</strong>, trying to white-knuckle November solo has an 84% relapse rate before Day 8. Claim our <strong>50% OFF Commitment Scholarship</strong>:
        </p>
        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 13px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 14px;">Full Year Access (NNN + Winter Arc)</div>
            <div style="font-size: 11.5px; color: #fbbf24;">Immediate unlock • $0.04 / day</div>
          </div>
          <div style="text-align: right;">
            <span style="text-decoration: line-through; color: var(--text-dim); font-size: 12px;">$29.99</span>
            <div style="font-size: 20px; font-weight: 900; color: #fbbf24;">$14.99/yr</div>
          </div>
        </div>
        <button id="claimDownsellBtn" class="btn-primary" style="margin-bottom: 10px;">Claim 50% OFF ($14.99/yr) →</button>
        <button id="skipToAppBtn" style="width:100%; background:none; border:none; color: var(--text-dim); font-size: 12px; cursor:pointer; padding: 6px;">
          Preview Dashboard in Limited Mode
        </button>
      </div>
    </div>
  `;

  document.getElementById("claimDownsellBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
    window.FunnelModule.startCheckout({
      planId: "downsell",
      bumpIds: [],
      diagnosis,
      onSuccess() {
        if (window.DopamineFX) {
          window.DopamineFX.playOathSealed();
          window.DopamineFX.burstParticles({ mode: "seal" });
        }
        if (window.Day1Module) window.Day1Module.markUpgraded();
        state.activeTab = "blocker";
        state.screen = "app";
        render();
      }
    });
  });

  document.getElementById("skipToAppBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
    state.screen = "app";
    render();
  });
}

/* =========================================================================
   6. LIVE APP DASHBOARD (D2 BRAIN CORE + FEATURES MODULE + VIRAL CARD)
   ========================================================================= */
function renderApp(root) {
  if (LIVE_TABS.indexOf(state.activeTab) === -1) state.activeTab = "blocker";
  document.querySelectorAll(".nav-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === state.activeTab);
  });

  if (state.activeTab === "lockquote") renderLockQuoteTab(root);
  else if (state.activeTab === "battle") renderBattleTab(root);
  else if (state.activeTab === "panic") renderPanicTab(root);
  else if (state.activeTab === "iphone") renderIphoneTab(root);
  else renderBlockerTab(root);
}

function enterDay1Pass() {
  if (window.DopamineFX) window.DopamineFX.playTick(640, 0.05);
  if (window.Day1Module) {
    let snap = window.Day1Module.getState();
    if (!snap.passStartedAt || (snap.expired && !snap.upgraded)) {
      window.Day1Module.startPass({ source: "paywall", force: true });
    }
    snap = window.Day1Module.getState();
    const callsign = snap.missions && snap.missions.callsign && snap.missions.callsign.callsign;
    if (callsign) {
      state.callsign = callsign;
      if (state.squad[0]) state.squad[0].name = `${callsign} (You)`;
    }
    if (!snap.upgraded) {
      state.streakDays = 1;
      state.streakSecondsOffset = 0;
      const preset = document.getElementById("streakPreset");
      if (preset) preset.value = "1";
    }
  }
  state.activeTab = "blocker";
  state.screen = "app";
  render();
}

function upgradeFromDay1() {
  if (!window.FunnelModule) {
    state.selectedPlan = "annual";
    state.screen = "paywall";
    render();
    return;
  }
  const diagnosis = window.FunnelModule.buildDiagnosis(funnelSession);
  window.FunnelModule.startCheckout({
    planId: state.selectedPlan || "annual",
    bumpIds: state.precheckPenaltyBump ? ["penaltyStake"] : [],
    diagnosis,
    onSuccess() {
      if (window.Day1Module) window.Day1Module.markUpgraded();
      if (window.DopamineFX) {
        window.DopamineFX.playOathSealed();
        window.DopamineFX.burstParticles({ mode: "rank" });
      }
      state.willpowerXP += 100;
      state.screen = "app";
      state.activeTab = "blocker";
      render();
    }
  });
}

function telemetryState() {
  const rank = getRank(state.streakDays);
  return {
    streakDays: state.streakDays,
    streakSecondsOffset: state.streakSecondsOffset,
    rank: rank.name,
    rankCode: rank.code,
    rewirePct: getRewirePercentage(state.streakDays),
    benefit: ""
  };
}

function holdOathHTML() {
  return `
    <button id="holdPledgeBtn" class="hold-btn" type="button">
      <div class="hold-fill" style="width: ${state.pledgedToday ? "100%" : "0%"}"></div>
      <span class="hold-text">${state.pledgedToday ? "✓ OATH SEALED" : "HOLD OATH"}</span>
    </button>
  `;
}

function bindHoldOath() {
  const holdBtn = document.getElementById("holdPledgeBtn");
  if (!holdBtn) return;
  const holdFill = holdBtn.querySelector(".hold-fill");
  let holdTimer = null;
  let progress = state.pledgedToday ? 100 : 0;

  const startHold = () => {
    if (state.pledgedToday) return;
    if (window.DopamineFX) window.DopamineFX.startChargeHum();
    clearInterval(holdTimer);
    holdTimer = setInterval(() => {
      progress += 7;
      const clamped = Math.min(100, progress);
      if (holdFill) holdFill.style.width = `${clamped}%`;
      if (window.DopamineFX) window.DopamineFX.updateChargePitch(clamped / 100);
      if (clamped >= 100) {
        clearInterval(holdTimer);
        state.pledgedToday = true;
        state.willpowerXP += 25;
        if (window.DopamineFX) {
          window.DopamineFX.playOathSealed();
          window.DopamineFX.burstParticles({ anchor: holdBtn, mode: "seal" });
        }
        updateXPPill();
        render();
      }
    }, 55);
  };

  const stopHold = () => {
    if (state.pledgedToday) return;
    clearInterval(holdTimer);
    if (window.DopamineFX) window.DopamineFX.stopChargeHum();
    progress = 0;
    if (holdFill) holdFill.style.width = "0%";
  };

  holdBtn.addEventListener("mousedown", startHold);
  holdBtn.addEventListener("touchstart", startHold, { passive: true });
  holdBtn.addEventListener("mouseup", stopHold);
  holdBtn.addEventListener("mouseleave", stopHold);
  holdBtn.addEventListener("touchend", stopHold);
  holdBtn.addEventListener("touchcancel", stopHold);
}

function renderBlockerTab(root) {
  const rank = getRank(state.streakDays);
  root.innerHTML = `
    <div class="streak-rank-bar">
      <div class="sr-stat">
        <span>STREAK</span>
        <strong>DAY ${state.streakDays}</strong>
      </div>
      <div id="liveSubClock" class="sr-clock">${formatSubClock(state.streakSecondsOffset)}</div>
      <div class="sr-stat sr-rank">
        <span>RANK ${rank.code}</span>
        <strong>${rank.name}</strong>
      </div>
    </div>
    <div id="blockerShieldMount"></div>
  `;
  if (window.BlockerShield) {
    window.BlockerShield.mount("#blockerShieldMount", {
      onXp(amount) {
        state.willpowerXP += amount || 25;
        updateXPPill();
      },
      onChange() {
        syncDynamicIsland();
        syncTrialStrip();
      }
    });
  }
}

function renderLockQuoteTab(root) {
  const shield = window.BlockerShield ? window.BlockerShield.getState() : { attempts: 0 };
  root.innerHTML = `
    <h1 class="tab-headline">Lock Screen Armor</h1>
    <div id="lockQuoteMount"></div>
  `;
  if (window.LockScreenWidget) {
    window.LockScreenWidget.mount("#lockQuoteMount", {
      streakDay: state.streakDays,
      blockedToday: shield.attempts || 0,
      shieldOn: true
    });
  }
}

function renderBattleTab(root) {
  const diagnosis = window.FunnelModule && funnelSession ? window.FunnelModule.buildDiagnosis(funnelSession) : null;
  const diagHTML = diagnosis ? window.FunnelModule.renderDiagnosisHTML(diagnosis) : "";
  const rank = getRank(state.streakDays);
  const rewirePct = getRewirePercentage(state.streakDays);
  const brain = window.LiveTelemetry
    ? window.LiveTelemetry.renderInteractiveBrainWidget(telemetryState())
    : `<div class="brain-hero-card"><div class="brain-svg-mount">${window.DopamineFX ? window.DopamineFX.renderBrainSVG(rewirePct, rank.code) : ""}</div></div>`;
  root.innerHTML = `
    <div class="battle-stage">${diagHTML}</div>
    ${brain}
    ${holdOathHTML()}
  `;
  bindHoldOath();
}

function renderPanicTab(root) {
  root.innerHTML = `
    <h1 class="tab-headline">Panic 2.0</h1>
    <button id="panicLaunchBtn" type="button" class="panic-trigger-btn">
      <span>🚨</span>
      <span>OPEN PANIC</span>
    </button>
    <div class="panic-pad">
      <div class="panic-tile">🪞<b>Mirror HUD</b></div>
      <div class="panic-tile">🎙<b>Marcus AI</b></div>
      <div class="panic-tile">💥<b>Urge Shatter</b></div>
      <div class="panic-tile">🫁<b>Breath Lock</b></div>
    </div>
  `;
  const launch = document.getElementById("panicLaunchBtn");
  if (launch) launch.addEventListener("click", () => triggerPanic2());
  if (state.panicLaunch) {
    state.panicLaunch = false;
    triggerPanic2();
  }
}

function renderIphoneTab(root) {
  root.innerHTML = `
    <h1 class="tab-headline">On Your iPhone</h1>

    <section class="install-card">
      <div class="install-step-no">1</div>
      <h2>Block Porn Today</h2>
      <button id="installProfileBtn" type="button" class="btn-primary">📲 Install Real iPhone Blocker</button>
    </section>

    <section class="install-card">
      <div class="install-step-no">2</div>
      <h2>Home Screen Icon</h2>
      <div class="share-guide" aria-label="Tap Share in Safari, then Add to Home Screen">
        <div class="share-card">
          <span class="share-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M12 3l4 4h-3v7h-2V7H8l4-4zm-7 11h2v5h10v-5h2v7H5v-7z"/></svg>
          </span>
          <b>Tap Share</b>
          <small>in Safari</small>
        </div>
        <span class="share-arrow" aria-hidden="true">→</span>
        <div class="share-card">
          <span class="share-ico" aria-hidden="true">＋</span>
          <b>Add to Home Screen</b>
        </div>
      </div>
      <div class="lan-row">
        <code id="lanUrl">Detecting Wi-Fi URL…</code>
        <span id="lanState" class="lan-state">…</span>
        <button id="copyLanBtn" type="button">COPY</button>
      </div>
    </section>

    <section class="install-card">
      <div class="install-step-no">3</div>
      <h2>Lock Screen Mode</h2>
      <button id="openFullLockBtn" type="button" class="btn-trial">📱 Full-Screen iPhone Lock Screen Mode</button>
    </section>

    <section class="install-card">
      <div class="install-step-no">4</div>
      <h2>Native Build Ready</h2>
      <div class="native-grid">
        <span>capacitor.config.json</span>
        <span>FamilyControls</span>
        <span>WidgetKit</span>
        <span>TestFlight</span>
      </div>
      <div id="nativeBundle" class="native-bundle">com.ironarc.app</div>
    </section>
  `;

  const profileBtn = document.getElementById("installProfileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      if (window.DopamineFX) window.DopamineFX.playTick(720, 0.04);
      if (window.BlockerShield) window.BlockerShield.downloadMobileConfig();
    });
  }

  const lockBtn = document.getElementById("openFullLockBtn");
  if (lockBtn) {
    lockBtn.addEventListener("click", () => {
      if (window.DopamineFX) window.DopamineFX.playTick(680, 0.04);
      if (!window.LockScreenWidget) return;
      const shield = window.BlockerShield ? window.BlockerShield.getState() : { attempts: 0 };
      window.LockScreenWidget.openFullLockScreen({
        streakDay: state.streakDays,
        blockedToday: shield.attempts || 0,
        shieldOn: true
      });
    });
  }

  const copyBtn = document.getElementById("copyLanBtn");
  resolveInstallUrl().then((info) => {
    const url = info && info.url ? info.url : "";
    const slot = document.getElementById("lanUrl");
    const flag = document.getElementById("lanState");
    if (slot) slot.textContent = url;
    if (copyBtn) copyBtn.dataset.url = url;
    if (flag) {
      const live = !!(info && info.bound);
      flag.textContent = live ? "WIFI LIVE" : "LOCAL ONLY";
      flag.classList.toggle("is-live", live);
    }
  });
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const slot = document.getElementById("lanUrl");
      const url = copyBtn.dataset.url || (slot ? slot.textContent : "");
      const done = () => { copyBtn.textContent = "COPIED"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => {
          legacyCopy(url);
          done();
        });
      } else {
        legacyCopy(url);
        done();
      }
    });
  }
  loadNativeBadges();
}

function triggerPanic2() {
  if (window.Panic2Engine) {
    window.Panic2Engine.open({
      streakDay: state.streakDays,
      willpowerXP: state.willpowerXP,
      voice: true,
      siren: true
    });
    return;
  }
  if (window.DopamineFX) {
    window.DopamineFX.playPanicSiren();
    window.DopamineFX.speakCoach(
      `Day ${state.streakDays}. Look at the man in the glass. Do not trade your respect for five seconds of pixels.`
    );
  }
  if (window.FeaturesModule) {
    window.FeaturesModule.sync({ streakDay: state.streakDays, willpowerXP: state.willpowerXP });
    window.FeaturesModule.openPanic();
  }
}

/* =========================================================================
   7. PARTNER GTM & LIVE STRIPE CONFIGURATION MODAL
   ========================================================================= */
function openGtmModal() {
  const modalRoot = document.getElementById("modalRoot");
  const links = (window.FunnelModule && window.FunnelModule.CHECKOUT_CONFIG.stripeLinks) || {};
  const prodUrl = `${window.location.origin}${window.location.pathname}?mode=prod`;

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card" style="border-color: var(--accent-emerald);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span class="season-pill">PARTNER GTM &amp; LIVE STRIPE STUDIO</span>
          <button id="closeGtmModalBtn" class="paywall-close">✕</button>
        </div>
        <h2 style="font-size: 19px; font-weight: 900; margin-bottom: 6px;">Lock In Real Customers Today</h2>
        <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">
          Paste your live <code>https://buy.stripe.com/...</code> Payment Links below to switch from Demo Sheet to live Stripe checkout, or copy your customer-facing production link.
        </p>

        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:10px; margin-bottom:12px;">
          <div style="font-size:11px; font-weight:800; color:var(--accent-emerald-bright); margin-bottom:4px;">CUSTOMER PRODUCTION LINK (HIDES DEV BAR)</div>
          <div style="font-size:11.5px; word-break:break-all; color:#e2e8f0; margin-bottom:8px;">${prodUrl}</div>
          <button id="copyProdUrlBtn" class="studio-btn" style="width:100%; border-color:var(--accent-emerald); color:var(--accent-emerald-bright);">Copy Customer URL (?mode=prod)</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
          <label style="font-size:11px; color:var(--text-muted); font-weight:700;">
            Annual Plan ($29.99/yr) Stripe Link
            <input id="stripeAnnualInput" type="url" placeholder="https://buy.stripe.com/..." value="${links.annual || ""}" style="width:100%; height:36px; margin-top:3px; border-radius:8px; border:1px solid var(--border-subtle); background:#080b12; color:#fff; padding:0 10px; font-size:12px;" />
          </label>
          <label style="font-size:11px; color:var(--text-muted); font-weight:700;">
            Monthly Plan ($9.99/mo) Stripe Link
            <input id="stripeMonthlyInput" type="url" placeholder="https://buy.stripe.com/..." value="${links.monthly || ""}" style="width:100%; height:36px; margin-top:3px; border-radius:8px; border:1px solid var(--border-subtle); background:#080b12; color:#fff; padding:0 10px; font-size:12px;" />
          </label>
          <label style="font-size:11px; color:var(--text-muted); font-weight:700;">
            50% Exit Downsell ($14.99/yr) Stripe Link
            <input id="stripeDownsellInput" type="url" placeholder="https://buy.stripe.com/..." value="${links.downsell || ""}" style="width:100%; height:36px; margin-top:3px; border-radius:8px; border:1px solid var(--border-subtle); background:#080b12; color:#fff; padding:0 10px; font-size:12px;" />
          </label>
          <label style="font-size:11px; color:var(--text-muted); font-weight:700;">
            $15 Relapse Penalty Bump Stripe Link
            <input id="stripePenaltyInput" type="url" placeholder="https://buy.stripe.com/..." value="${links.penaltyStake || ""}" style="width:100%; height:36px; margin-top:3px; border-radius:8px; border:1px solid var(--border-subtle); background:#080b12; color:#fff; padding:0 10px; font-size:12px;" />
          </label>
        </div>

        <button id="saveStripeLinksBtn" class="btn-primary" style="padding:12px; font-size:14px; margin-bottom:10px;">Save Stripe Links &amp; Arm Checkout ✓</button>

        <div style="font-size:11px; color:var(--text-dim); line-height:1.45;">
          📄 <strong>Partner Ad Playbook:</strong> Open <code>GTM_PLAYBOOK.md</code> &amp; <code>COMPETITOR_RESEARCH.md</code> in your workspace for all 10 word-for-word TikTok scripts and QUITTR $500k/mo teardown.
        </div>
      </div>
    </div>
  `;

  document.getElementById("closeGtmModalBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
  });

  document.getElementById("copyProdUrlBtn").addEventListener("click", (e) => {
    if (navigator.clipboard) navigator.clipboard.writeText(prodUrl).catch(() => {});
    e.currentTarget.textContent = "✓ Copied Customer Production URL!";
  });

  document.getElementById("saveStripeLinksBtn").addEventListener("click", (e) => {
    const patch = {
      annual: document.getElementById("stripeAnnualInput").value.trim(),
      monthly: document.getElementById("stripeMonthlyInput").value.trim(),
      downsell: document.getElementById("stripeDownsellInput").value.trim(),
      penaltyStake: document.getElementById("stripePenaltyInput").value.trim()
    };
    localStorage.setItem(SAVED_STRIPE_KEY, JSON.stringify(patch));
    window.FunnelModule.configure({ stripeLinks: patch });
    if (window.DopamineFX) window.DopamineFX.playOathSealed();
    e.currentTarget.textContent = "✓ Stripe Links Saved!";
    setTimeout(() => {
      modalRoot.innerHTML = "";
    }, 700);
  });
}

/* =========================================================================
   EVENT LISTENERS & INITIALIZATION
   ========================================================================= */
if (window.Day1Module) {
  window.Day1Module.on("mission-complete", (detail) => {
    state.willpowerXP += detail.xp || 0;
    if (detail.id === "callsign" && detail.callsign) {
      state.callsign = detail.callsign;
      if (state.squad[0]) state.squad[0].name = `${detail.callsign} (You)`;
    }
    updateXPPill();
  });
  window.Day1Module.on("upgrade", () => {
    upgradeFromDay1();
  });
}

if (window.FeaturesModule) {
  window.FeaturesModule.on("urge-defeated", (detail) => {
    state.urgesDefeated += 1;
    state.willpowerXP = detail.willpowerXP || state.willpowerXP + 50;
    if (window.DopamineFX) {
      window.DopamineFX.playRankUp();
      window.DopamineFX.burstParticles({ mode: "rank" });
    }
    updateXPPill();
    if (state.screen === "app" && (state.activeTab === "blocker" || state.activeTab === "battle")) {
      render();
    }
  });
}

if (window.Panic2Engine) {
  window.Panic2Engine.on("urge-defeated", (detail) => {
    state.urgesDefeated += 1;
    state.willpowerXP += detail.gained || 50;
    updateXPPill();
    if (state.screen === "app" && (state.activeTab === "blocker" || state.activeTab === "battle")) {
      render();
    }
  });
}

document.querySelectorAll(".studio-btn[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (window.DopamineFX) window.DopamineFX.playTick(600, 0.03);
    document.getElementById("modalRoot").innerHTML = "";
    if (window.FeaturesModule) window.FeaturesModule.closePanic();
    if (window.Panic2Engine) window.Panic2Engine.close();

    const target = btn.dataset.jump;
    if (target === "gtm") {
      openGtmModal();
    } else if (target === "panic") {
      state.screen = "app";
      state.activeTab = "panic";
      state.panicLaunch = true;
      render();
    } else if (target === "blocker" || target === "lockquote" || target === "battle" || target === "iphone") {
      state.screen = "app";
      state.activeTab = target;
      render();
    } else if (target === "radar") {
      state.screen = "diagnosis";
      render();
    } else if (target === "day1") {
      enterDay1Pass();
    } else {
      if (target === "quiz" && funnelSession) funnelSession.stepIndex = 0;
      state.screen = target;
      render();
    }
  });
});

document.getElementById("streakPreset").addEventListener("change", (e) => {
  state.streakDays = parseInt(e.target.value, 10);
  if (state.streakDays === 1 && window.Day1Module) {
    const snap = window.Day1Module.getState();
    if (!snap.passStartedAt) window.Day1Module.startPass({ source: "preset" });
  }
  if (window.DopamineFX) {
    window.DopamineFX.playRankUp();
    window.DopamineFX.burstParticles({ mode: "ember" });
  }
  if (window.FeaturesModule) {
    window.FeaturesModule.sync({ streakDay: state.streakDays });
  }
  render();
});

document.getElementById("muteToggleBtn").addEventListener("click", (e) => {
  if (!window.DopamineFX) return;
  const muted = window.DopamineFX.toggleMute();
  e.currentTarget.textContent = muted ? "🔇 FX Muted" : "🔊 FX On";
});

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (window.DopamineFX) window.DopamineFX.playTick(640, 0.03);
    const next = tab.dataset.tab;
    if (next !== "panic" && window.Panic2Engine) window.Panic2Engine.close();
    if (next === "panic") state.panicLaunch = true;
    state.activeTab = next;
    render();
  });
});

const lockForeverBtn = document.getElementById("lockForeverBtn");
if (lockForeverBtn) {
  lockForeverBtn.addEventListener("click", () => {
    if (window.DopamineFX) window.DopamineFX.playTick(760, 0.05);
    upgradeFromDay1();
  });
}

// Live 1-second ticker for the streak subclock
setInterval(() => {
  state.streakSecondsOffset += 1;
  const clockEl = document.getElementById("liveSubClock");
  if (clockEl) {
    clockEl.textContent = formatSubClock(state.streakSecondsOffset);
  }
  if (window.LiveTelemetry && window.LiveTelemetry.noteOffset) {
    window.LiveTelemetry.noteOffset(state.streakSecondsOffset);
  }
  syncTrialStrip();
}, 1000);

document.addEventListener("live-telemetry:panic", (event) => {
  event.preventDefault();
  triggerPanic2();
});

document.addEventListener("live-telemetry:pulse", (event) => {
  const detail = event.detail || {};
  if (state.pulseAwardDay !== state.streakDays) {
    state.pulseAwardDay = state.streakDays;
    state.willpowerXP += 10;
    updateXPPill();
  }
  state.lastPulse = detail;
});

// Compact studio chrome on a real phone and on the customer link (?mode=prod).
(function setupStudioDock() {
  const bar = document.getElementById("studioBar");
  const toggle = document.getElementById("studioToggle");
  if (!bar || !toggle) return;
  const params = new URLSearchParams(window.location.search);
  const prod = params.get("mode") === "prod";
  const mq = window.matchMedia("(max-width: 520px)");

  function syncDock() {
    const dock = prod || mq.matches;
    document.documentElement.classList.toggle("studio-dock", dock);
    if (!dock) {
      bar.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Studio";
    }
  }

  toggle.addEventListener("click", () => {
    const open = bar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Hide" : "Studio";
  });

  syncDock();
  if (mq.addEventListener) mq.addEventListener("change", syncDock);
  else if (mq.addListener) mq.addListener(syncDock);
})();

loadSavedStripeConfig();

// Resume Stripe return if returning from Stripe Checkout (?checkout=success)
if (window.FunnelModule) {
  const resumed = window.FunnelModule.resumeCheckout({
    mount: document.body,
    onSuccess() {
      state.screen = "app";
      render();
    }
  });
  if (resumed && resumed.status === "success") {
    state.screen = "app";
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

render();
