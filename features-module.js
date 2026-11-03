/**
 * IRON ARC — sticky feature module (vanilla JS).
 *
 * window.FeaturesModule
 *   .data     quotes, milestones, crisis prompts, phases, ranks
 *   .logic    pure streak, interrupt, commander, vault rules
 *   .render   HTML string helpers
 *   .mount    binds a hub into a container
 *   .openPanic  live mirror HUD + urge destroyer
 *
 * Mount:
 *   FeaturesModule.mount("#slot", { streakDay: 14 });
 *   FeaturesModule.sync({ streakDay: 21 });
 *   FeaturesModule.on("urge-defeated", (detail) => { ... });
 */
(function (root) {
  "use strict";

  var STORAGE_KEY = "ironarc.features.v1";
  var URGE_XP = 50;
  var SHATTER_TAPS = 10;
  var SHATTER_WINDOW_MS = 8000;
  var PUSHUPS_REQUIRED = 20;
  var BREATH_CYCLES = 3;
  var BREATH_CYCLE_MS = 19000;
  var URGE_WINDOW_MS = 90000;
  var SHIELD_PRICE = 2.99;
  var MILESTONE_DAYS = [3, 7, 14, 21, 30, 60, 90];

  var QUOTES = [
    "DAY {DAY}. LOOK AT THE MAN IN THE GLASS. DO NOT SELL HIM FOR A SCREEN.",
    "THE URGE PEAKS AND FALLS. STAND STILL LONG ENOUGH AND IT LOSES INTEREST.",
    "YOU ARE NOT REQUIRED TO WIN THE THOUGHT. YOU ARE REQUIRED NOT TO FEED IT.",
    "FEET ON THE FLOOR. PHONE OUT OF THE HAND. CHANGE THE BODY FIRST.",
    "THIS IS THE REP. DAY {DAY} IS BUILT IN ROOMS LIKE THIS ONE.",
    "SLOW THE EXHALE. THE NERVOUS SYSTEM STANDS DOWN WHEN THE BREATH LEADS.",
    "NO ONE IS COMING TO HOLD THIS HOUR FOR YOU. THAT IS THE HONOR OF IT.",
    "EVERY TAP IS A VOTE. CAST TEN OF THEM BEFORE YOU NEGOTIATE.",
    "THE OBSTACLE IS THE TRAINING. THE URGE IS NOT A VERDICT.",
    "CHANNEL THE CHARGE. A BARBELL CAN HOLD WHAT A FEED SHOULD NOT.",
    "RETICLE ON YOUR EYES. DO NOT LOOK AWAY AND CALL IT DISCIPLINE.",
    "REGRET IS A LONG CAMPAIGN. THIS WAVE IS A SHORT ONE. CHOOSE THE SHORT FIGHT."
  ];

  var RANKS = [
    { min: 1, name: "INITIATE" },
    { min: 3, name: "SURGE" },
    { min: 7, name: "IRON MONK" },
    { min: 14, name: "SPARTAN" },
    { min: 30, name: "NNN TITAN" },
    { min: 90, name: "SOVEREIGN" }
  ];

  var PHASES = [
    { id: "withdrawal", name: "WITHDRAWAL CREST", start: 1, end: 3, line: "The cue still fires. The reward stopped. Agitation is the prediction error." },
    { id: "surge", name: "SURGE WINDOW", start: 4, end: 7, line: "Energy often rebounds here. A day-7 testosterone bump, if it shows up, is a guest, not a new baseline." },
    { id: "flatline", name: "FLATLINE WATCH", start: 8, end: 14, line: "Ordinary rewards feel quiet because you removed a supernormal one. Do not test the cue." },
    { id: "foothold", name: "FOOTHOLD", start: 15, end: 21, line: "Inhibition is getting practice. Automaticity is not here yet. Keep the room boring." },
    { id: "close", name: "NNN CLOSE", start: 22, end: 30, line: "Finish the ritual break. Do not celebrate with the thing you quit." },
    { id: "depth", name: "WINTER DEPTH", start: 31, end: 60, line: "Training and identity take over from white-knuckle refusal." },
    { id: "sovereign", name: "SOVEREIGN", start: 61, end: 90, line: "Maintenance is the protocol. The pathway still exists. You stopped rehearsing it." },
    { id: "maintain", name: "MAINTENANCE", start: 91, end: 999, line: "The season is over. The standard is not. Phone stays out of the bed." }
  ];

  var CRISIS_PROMPTS = [
    { id: "bed", label: "I'm alone in bed and scrolling" },
    { id: "flatline", label: "I feel brain fog / flatline on Day 9" },
    { id: "transmute", label: "How do I channel sexual energy into the gym?" },
    { id: "reset", label: "I almost relapsed, reset my focus" }
  ];

  var MILESTONES = [
    {
      day: 3,
      code: "WITHDRAWAL CREST",
      title: "The cue fires. The reward does not.",
      brain: "The old loop is cue, craving, reward. On day 3 the cue still lights up the reward circuit and the reward never arrives. That mismatch is a dopamine prediction error: agitation, bargaining, and a loud urge. The prefrontal cortex is doing unfamiliar brake work. This is conditioning, not a verdict on your character.",
      body: "Expect a hotter sympathetic system: restless legs, short sleep, irritability, and a noisy libido when the usual cue is in reach (dark room, bed, phone). The wave crests in a minute or two if you do not feed it. It lasts as long as you negotiate from the pillow.",
      order: "Tonight the phone charges outside the room. When the cue hits, feet hit the floor before you argue with it.",
      source: "Prediction-error account of craving; urge-surfing (Marlatt). The first days are cue withdrawal."
    },
    {
      day: 7,
      code: "SURGE WINDOW",
      title: "A short androgen window, then back to work.",
      brain: "Acute urge frequency often starts dropping for daily users once the ritual misses a week. Inhibition is a rep you have now practiced. Nothing mystical landed in the prefrontal cortex on a schedule.",
      body: "A small abstinence study found serum testosterone peaked around day 7 and then fell back toward baseline. Treat any drive spike as a transient guest. Sleep and morning energy often feel better if the late-night cue is actually gone. Spend that on training.",
      order: "Train while the drive is up. Do not spend a short hormone blip on a tab you already decided to close.",
      source: "Jiang et al., 2003. Small sample. Day-7 testosterone peak, then a decline. Not a permanent raise."
    },
    {
      day: 14,
      code: "FLATLINE WATCH",
      title: "The noise drops. So can your mood.",
      brain: "Two weeks without pairing the bed to a supernormal cue. Day-to-day compulsion can quiet while cue reactivity stays hot: open the old apps and the striatum still recognizes the dinner bell. A flat mood is the contrast effect of removing a stimulus that was louder than ordinary life.",
      body: "Sleep timing often improves. Some men report a flatter libido and gray motivation, the community 'flatline.' That is a reported rebound pattern, not a diagnosis and not proof you are broken. Checking whether it 'still works' reloads the cue.",
      order: "Lift, get daylight, and do not run a test scroll. Flat is not a hall pass.",
      source: "Cue-reactivity in compulsive sexual behavior (Voon et al., 2014). Flatline is community-reported, not a clinical entity."
    },
    {
      day: 21,
      code: "FOOTHOLD",
      title: "Three weeks is a foothold, not a new personality.",
      brain: "Repeated response inhibition is training a policy: the cue appears, you do not answer. The 21-day habit myth is false. For simple habits, automaticity landed closer to two months in the best-known field study. You are early. The old loop is wounded, not buried.",
      body: "Stress still looks for the old regulator. Boredom plus a phone in the bed is the combo that reopens the tab. Replacement regulators are dull on purpose: sunlight, lifting, a fixed bedtime, a phone that lives in another room.",
      order: "Keep the boring rules. Do not loosen them because three weeks felt like a personality transplant.",
      source: "Lally et al., 2010. Median about 66 days to automaticity for simple habits. The 21-day rule comes from Maltz, not from that data."
    },
    {
      day: 30,
      code: "NNN CLOSE",
      title: "The daily ritual is the thing that broke.",
      brain: "A month of not rehearsing the loop. Reward prediction is being asked to care about slower sources: effort, people, training. 'Receptor rewiring' is a fair metaphor for that adaptation. It is not a published 30-day receptor percentage you can screenshot.",
      body: "Mood is often steadier when sleep and training were kept. One slip does not delete a month of brake practice. A binge will re-pair the cue fast. Close the month. If you want a reward, make it food, people, or a hard session.",
      order: "Do not celebrate with the thing you quit. Bank the month and set the night rules for day 31.",
      source: "Habit-loop interruption. Specific 30-day dopamine-receptor percentages are marketing, not a lab result you can cite."
    },
    {
      day: 60,
      code: "WINTER DEPTH",
      title: "The environment still owns the night.",
      brain: "You are near the window where simpler habits become automatic. Sexual cues are older and stickier than 'drink water.' Identity is the actual lock: 'I do not negotiate at night' only holds if the room still matches the sentence.",
      body: "A winter training block is visible in strength and posture by now. If libido flattened earlier, it often returns more selectively. Aim it at real life and heavy work. A victory scroll is how day 60 becomes day 0.",
      order: "Audit the bedroom. A phone on the mattress is a cracked door, no matter what the counter says.",
      source: "Automaticity timelines from Lally et al. Cue control still does the heavy lifting past the two-month mark."
    },
    {
      day: 90,
      code: "SOVEREIGN",
      title: "One season of not rehearsing the pathway.",
      brain: "Ninety days is long enough that the old policy is no longer your daily rehearsal. The pathway still exists. Brakes you practiced are available. They are not invincible if you put the cue back in your hand at midnight.",
      body: "Winter Arc complete means the leak is smaller: more sleep opportunity, less novelty drip, training that had time to compound. Abstinence was the removal of a drain, not the whole engine. Maintenance is the product from here.",
      order: "Write the maintenance rules down: no 'just checking,' training stays, lights-out stays. The season ended. The standard did not.",
      source: "Maintenance framing. Sleep, lifting, and cue control carry what a streak counter cannot."
    }
  ];

  var STATUS_META = {
    locked: {
      label: "Locked In Emerald",
      headline: "This day is banked.",
      detail: "No biological brief on ordinary days. Stay boring. Boring is the protocol."
    },
    "urge-defeated": {
      label: "Urge Defeated Gold Shield",
      headline: "You broke an urge and took the XP.",
      detail: "The gold mark is the receipt. The streak did not survive by mood. It survived by an interrupt."
    },
    today: {
      label: "Today Active Pulse",
      headline: "This day is live.",
      detail: "The pulse means the oath is still in play. Milestone briefs open on days 3, 7, 14, 21, 30, 60, and 90."
    },
    upcoming: {
      label: "Upcoming",
      headline: "Not on the board yet.",
      detail: "Do not spend tomorrow's focus to feel something tonight."
    },
    freeze: {
      label: "Streak Shield Held",
      headline: "The freeze was spent here.",
      detail: "The counter held because a shield charge was deployed. That charge is gone. Earn another before you need it."
    }
  };

  var INTENTS = [
    { id: "bed", keys: ["in bed", "alone", "scrolling", "scroll", "tiktok", "instagram", "reels", "pillow", "can't sleep", "cant sleep", "late night", "porn", "onlyfans", "nsfw"] },
    { id: "flatline", keys: ["brain fog", "fog", "flatline", "flat line", "numb", "no motivation", "anhedonia", "day 9", "gray", "grey"] },
    { id: "transmute", keys: ["sexual energy", "sexual", "libido", "arousal", "channel", "transmute", "gym", "workout", "horny"] },
    { id: "hormones", keys: ["testosterone", "androgen", "hormones"] },
    { id: "reset", keys: ["relapse", "relapsed", "almost", "slipped", "folded", "edging", "i nutted", "fapped", "reset my"] },
    { id: "sleep", keys: ["insomnia", "sleep", "tired", "3am", "3 am"] },
    { id: "stress", keys: ["stress", "anxious", "anxiety", "procrastinat", "work"] },
    { id: "bored", keys: ["bored", "boredom", "nothing to do", "idle"] }
  ];

  function clampDay(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) return 1;
    return Math.min(999, Math.max(1, v));
  }

  function phaseForDay(day) {
    var d = clampDay(day);
    var i;
    for (i = 0; i < PHASES.length; i++) {
      if (d >= PHASES[i].start && d <= PHASES[i].end) return PHASES[i];
    }
    return PHASES[PHASES.length - 1];
  }

  function rankForDay(day) {
    var d = clampDay(day);
    var current = RANKS[0];
    var i;
    for (i = 0; i < RANKS.length; i++) {
      if (d >= RANKS[i].min) current = RANKS[i];
    }
    return current;
  }

  function isMilestone(day) {
    return MILESTONE_DAYS.indexOf(Number(day)) !== -1;
  }

  function milestoneByDay(day) {
    var i;
    for (i = 0; i < MILESTONES.length; i++) {
      if (MILESTONES[i].day === Number(day)) return MILESTONES[i];
    }
    return null;
  }

  function defaultMilestone(day) {
    var best = null;
    var i;
    for (i = 0; i < MILESTONE_DAYS.length; i++) {
      if (MILESTONE_DAYS[i] <= clampDay(day)) best = MILESTONE_DAYS[i];
    }
    return best == null ? MILESTONE_DAYS[0] : best;
  }

  function statusKey(day, state) {
    var log = state.dayLog && state.dayLog[String(day)];
    if (log && log.status === "urge-defeated") return "urge-defeated";
    if (log && log.status === "freeze") return "freeze";
    if (Number(day) === Number(state.streakDay)) return "today";
    if (Number(day) < Number(state.streakDay)) return "locked";
    return "upcoming";
  }

  function dayStatus(day, state) {
    var key = statusKey(day, state);
    var meta = STATUS_META[key];
    return {
      day: Number(day),
      key: key,
      label: meta.label,
      headline: meta.headline,
      detail: meta.detail,
      milestone: isMilestone(day)
    };
  }

  function applyDay(text, day) {
    return String(text).split("{DAY}").join(String(clampDay(day)));
  }

  function reduceShatter(prev, now) {
    var current = prev || { taps: 0, startedAt: null, cleared: false, failed: false };
    if (current.cleared) return current;
    var expired = current.startedAt != null && now - current.startedAt > SHATTER_WINDOW_MS;
    if (current.startedAt == null || expired) {
      return {
        taps: 1,
        startedAt: now,
        cleared: false,
        failed: Boolean(expired && current.taps > 0 && current.taps < SHATTER_TAPS)
      };
    }
    var taps = current.taps + 1;
    if (taps >= SHATTER_TAPS) {
      return { taps: SHATTER_TAPS, startedAt: current.startedAt, cleared: true, failed: false };
    }
    return { taps: taps, startedAt: current.startedAt, cleared: false, failed: false };
  }

  function addPushups(count, delta) {
    var next = Math.floor(Number(count) || 0) + Math.floor(Number(delta) || 0);
    return Math.max(0, Math.min(PUSHUPS_REQUIRED, next));
  }

  function breathFrame(elapsedMs) {
    var elapsed = Math.max(0, Number(elapsedMs) || 0);
    if (elapsed >= BREATH_CYCLE_MS * BREATH_CYCLES) {
      return {
        complete: true,
        cyclesDone: BREATH_CYCLES,
        required: BREATH_CYCLES,
        phase: "STEADY",
        cue: "Pacer logged. The long exhale is the off-switch.",
        phaseMs: 1,
        phaseElapsed: 1,
        scale: 0.92
      };
    }
    var phases = [
      { name: "INHALE", ms: 4000, cue: "In through the nose. Four." },
      { name: "HOLD", ms: 7000, cue: "Hold. Seven. Let it crest." },
      { name: "EXHALE", ms: 8000, cue: "Out through the mouth. Eight. Longer than the inhale." }
    ];
    var into = elapsed % BREATH_CYCLE_MS;
    var cyclesDone = Math.floor(elapsed / BREATH_CYCLE_MS);
    var acc = 0;
    var phase = phases[0];
    var phaseElapsed = 0;
    var i;
    for (i = 0; i < phases.length; i++) {
      if (into < acc + phases[i].ms || i === phases.length - 1) {
        phase = phases[i];
        phaseElapsed = Math.max(0, into - acc);
        break;
      }
      acc += phases[i].ms;
    }
    var ratio = phase.ms ? phaseElapsed / phase.ms : 0;
    var scale = 0.85;
    if (phase.name === "INHALE") scale = 0.85 + 0.35 * ratio;
    else if (phase.name === "HOLD") scale = 1.2;
    else scale = 1.2 - 0.35 * ratio;
    return {
      complete: false,
      cyclesDone: cyclesDone,
      required: BREATH_CYCLES,
      phase: phase.name,
      cue: phase.cue,
      phaseMs: phase.ms,
      phaseElapsed: phaseElapsed,
      scale: scale
    };
  }

  function sessionProgress(session, now) {
    var frame = session.breathStartedAt ? breathFrame(now - session.breathStartedAt) : null;
    var cycles = frame ? (frame.complete ? BREATH_CYCLES : frame.cyclesDone) : 0;
    return {
      shatter: session.shatter,
      pushups: session.pushups || 0,
      breathCycles: cycles
    };
  }

  function interruptCleared(progress) {
    if (!progress) return false;
    var shattered = progress.shatter && progress.shatter.cleared;
    var body = progress.pushups >= PUSHUPS_REQUIRED && progress.breathCycles >= BREATH_CYCLES;
    return Boolean(shattered || body);
  }

  function arousalCurve(elapsedMs, breathCycles) {
    var timeDecay = Math.min(1, Math.max(0, Number(elapsedMs) || 0) / URGE_WINDOW_MS);
    var breathBonus = Math.min(0.35, Math.max(0, Number(breathCycles) || 0) * 0.1);
    var index = Math.max(6, Math.round(100 - timeDecay * 72 - breathBonus * 80));
    var bpm = Math.round(68 + (index / 100) * 52);
    var remainMs = Math.max(0, URGE_WINDOW_MS - (Number(elapsedMs) || 0));
    return { index: index, bpm: bpm, remainMs: remainMs, windowMs: URGE_WINDOW_MS };
  }

  function formatClock(now) {
    var d = new Date(now);
    function p(n) { return String(n).padStart(2, "0"); }
    return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function formatRemain(ms) {
    var s = Math.ceil(Math.max(0, ms) / 1000);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function panicView(session, state, now) {
    var elapsed = now - session.openedAt;
    var frame = session.breathStartedAt ? breathFrame(now - session.breathStartedAt) : null;
    var progress = sessionProgress(session, now);
    var quote = applyDay(QUOTES[session.quoteCursor % QUOTES.length], state.streakDay);
    var leftMs = SHATTER_WINDOW_MS;
    if (session.shatter && session.shatter.startedAt && !session.shatter.cleared) {
      leftMs = Math.max(0, SHATTER_WINDOW_MS - (now - session.shatter.startedAt));
    }
    return {
      streakDay: state.streakDay,
      rank: rankForDay(state.streakDay).name,
      phaseName: phaseForDay(state.streakDay).name,
      clock: formatClock(now),
      quote: quote,
      arousal: arousalCurve(elapsed, progress.breathCycles),
      mode: session.mode,
      shatter: {
        taps: session.shatter.taps,
        cleared: session.shatter.cleared,
        failed: session.shatter.failed,
        leftMs: leftMs,
        started: session.shatter.startedAt != null
      },
      pushups: progress.pushups,
      breathCycles: progress.breathCycles,
      frame: frame,
      breathRunning: Boolean(session.breathStartedAt),
      cleared: interruptCleared(progress),
      voice: session.voice !== false,
      cameraNote: session.cameraNote || "ARMING FRONT MIRROR"
    };
  }

  function clip(text, max) {
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1) + "…";
  }

  function hasKey(text, key) {
    var escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(?:^|\\b)" + escaped + "(?:\\b|$)", "i").test(text);
  }

  function detectIntent(text) {
    var source = String(text || "");
    var best = null;
    var bestScore = 0;
    var i;
    var k;
    var score;
    for (i = 0; i < INTENTS.length; i++) {
      score = 0;
      for (k = 0; k < INTENTS[i].keys.length; k++) {
        if (hasKey(source, INTENTS[i].keys[k])) score += INTENTS[i].keys[k].length > 6 ? 2 : 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = INTENTS[i].id;
      }
    }
    return best;
  }

  function replyBed(day) {
    return [
      "Day " + day + ". You are not in a debate. You are in a cue.",
      "",
      "Bed plus a glowing feed is a conditioned urge machine. Scrolling is the on-ramp. A horizontal, dark, one-thumb-from-the-cue posture is when the brakes lose. This is conditioning, not a character flaw.",
      "",
      "Orders:",
      "1. Feet on the floor before the next video ends. Lights on.",
      "2. Phone leaves the room. Face-down on the mattress is theater.",
      "3. Open the mirror. Ten fast taps or twenty pushups. Change the body and the script collapses.",
      "4. If you get back in bed, the phone does not come with you.",
      "",
      "The wave is short if you starve it. It is long if you negotiate from the pillow.",
      "Hold the line."
    ].join("\n");
  }

  function replyFlatline(day) {
    var where = day >= 8 && day <= 14
      ? "Day " + day + " is inside the flatline watch."
      : "You called the Day 9 flatline. Your counter says Day " + day + ". Same mechanism, different mile.";
    return [
      where,
      "",
      "Flatline is a quiet reward system, not a broken one. You removed a supernormal stimulus and ordinary life feels gray. Brain fog on this stretch is usually sleep debt plus a contrast effect: nothing in the room is as loud as the thing you took away. That is recalibration, not damage.",
      "",
      "Do not check whether it still works. A test scroll reloads the cue.",
      "",
      "Orders:",
      "1. Sunlight in your eyes within an hour of waking. Ten minutes, outside.",
      "2. Lift today even if the mood is flat. Drive often follows movement.",
      "3. One 25-minute hard task with the phone in another room.",
      "4. Caffeine off after early afternoon so tonight does not get a second fog shift.",
      "",
      "You do not need motivation. You need a repeatable morning.",
      "Hold the line."
    ].join("\n");
  }

  function replyTransmute(day) {
    return [
      "Day " + day + ". That charge is arousal plus a cue. It is not an instruction.",
      "",
      "Sexual energy you do not spend on a screen is raw activation. It feels like restlessness until it has a heavy outlet. The gym can hold it. A feed cannot.",
      "",
      "Orders:",
      "1. Leave the room you are in. The cue stays behind.",
      "2. Train inside 30 minutes. Heavy compound, sprint, or a hard walk in daylight. Start before you feel ready.",
      "3. Cold water on your face on the way out. Longer exhales than inhales drop the spike.",
      "4. Do not bargain with a half-session. A partial hit re-pairs the cue and you lose the streak and the workout.",
      "",
      "If you have a partner, aim the charge there, not at a performer. If you do not, the bar still counts.",
      "Hold the line."
    ].join("\n");
  }

  function replyReset(day) {
    return [
      "Day " + day + ". A near miss is intelligence. Do not price it like a relapse.",
      "",
      "If you almost folded and stopped, the streak stands. Punishing a near miss the same as a full lapse teaches the brain that the cost is already paid. The next fold gets cheaper. Log the cue. Change the room. Run the interrupt.",
      "",
      "If you actually relapsed: stop the binge. One slip is an event. A binge is a new policy. Pay the vault if an oath is locked, tell one person, and start the next day without a funeral.",
      "",
      "Orders:",
      "1. Name the cue in one sentence. Bed, boredom, stress, or a specific app.",
      "2. Physiology now. Twenty pushups and a 4-7-8 cycle. Thoughts after.",
      "3. Add friction before tonight. Charger outside the room. A real lights-out time.",
      "4. Sleep. Shame is a stimulant. It sends people back to the cue.",
      "",
      "You are allowed to be the man who stopped.",
      "Hold the line."
    ].join("\n");
  }

  function replyHormones(day) {
    return [
      "Day " + day + ". The hormone answer, without the myth.",
      "",
      "A small study found serum testosterone peaked around day 7 of abstinence and then fell toward baseline. It is a transient blip, not a new ceiling. This protocol does not hand you a permanent testosterone identity.",
      "",
      "What you can bank is less romantic and more useful: a real sleep window, fewer late-night dopamine spikes, and training you actually repeat. Those move energy and body composition. The spike is a guest. Do not build the house on it.",
      "",
      "If you feel flat instead of superhuman, that is also a normal stretch. Lift anyway.",
      "Hold the line."
    ].join("\n");
  }

  function replySleep(day) {
    return [
      "Day " + day + ". You are tired, and the cue knows it.",
      "",
      "A tired brain bargains. The order is mechanical: lights up, feet down, phone out of the room, then back to bed with nothing that glows. If sleep is already gone, do the ten taps and the long exhale, then lie down on purpose.",
      "",
      "Do not scroll until you are sleepy. That is how a streak dies at 1 a.m.",
      "Hold the line."
    ].join("\n");
  }

  function replyStress(day) {
    return [
      "Day " + day + ". Stress is asking for the fastest regulator you own.",
      "",
      "You used to pay cortisol with a screen. That account is closed. Take the hit in the body: a hard set, a walk, or a 4-7-8 cycle. Then do ten minutes of the task you are avoiding. Avoidance is the fuse. The feed is just where it burns.",
      "",
      "Name the task out loud. Start the ugly first minute.",
      "Hold the line."
    ].join("\n");
  }

  function replyBored(day) {
    return [
      "Day " + day + ". Boredom is not an emergency.",
      "",
      "It is the feeling of a nervous system that lost its slot machine. Do not medicate it with the cue. Give it a job: one set of pushups, one room, one page, one message to a friend that is not a crisis. Idle and horizontal is the danger geometry. Change the geometry.",
      "",
      "The urge is a request for stimulation. You still choose the dose.",
      "Hold the line."
    ].join("\n");
  }

  function replyDefault(day, phase, input) {
    var heard = input ? "I heard: \"" + clip(input, 90) + "\"." : "You opened the channel without a target.";
    return [
      "Day " + day + ". " + rankForDay(day).name + ". " + phase.name + ". " + heard,
      "",
      "I will not hand you a mood. Here is the protocol.",
      "1. Name the cue and leave the room it lives in.",
      "2. Twenty pushups or a fast walk. Longer exhale than inhale.",
      "3. One block of work or training in the next hour. Phone in another room.",
      "",
      phase.line,
      "Hold the line."
    ].join("\n");
  }

  var REPLIES = {
    bed: replyBed,
    flatline: replyFlatline,
    transmute: replyTransmute,
    reset: replyReset,
    hormones: replyHormones,
    sleep: replySleep,
    stress: replyStress,
    bored: replyBored
  };

  function commanderReply(input, day, promptId) {
    var d = clampDay(day);
    var phase = phaseForDay(d);
    var id = promptId || detectIntent(input) || "default";
    var text;
    if (REPLIES[id]) text = REPLIES[id](d, phase, input);
    else text = replyDefault(d, phase, input);
    return { id: id, day: d, phase: phase.name, rank: rankForDay(d).name, text: text };
  }

  function briefing(day) {
    var d = clampDay(day);
    var phase = phaseForDay(d);
    var rank = rankForDay(d);
    return [
      "Commander Marcus online. Day " + d + ". Rank " + rank.name + ". Phase " + phase.name + ".",
      "",
      phase.line,
      "",
      "I do not do vague motivation. Tell me the room you are in and the cue in front of you, or hit a crisis prompt.",
      "Change the body before you debate the urge. The mirror is on the red button."
    ].join("\n");
  }

  function makeCode() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out = "ARC-";
    var i;
    for (i = 0; i < 4; i++) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    return out;
  }

  function cleanPayee(value) {
    return String(value || "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 60);
  }

  function createState(over) {
    var state = {
      v: 1,
      streakDay: 14,
      run: 1,
      willpowerXP: 0,
      urgesDefeated: 0,
      quoteIndex: 0,
      inviteCode: makeCode(),
      dayLog: {},
      messages: [],
      ledger: [],
      history: [],
      awarded: {},
      confessionRequired: false,
      shield: {
        charges: 0,
        source: null,
        armedAt: null,
        invites: 0,
        deployed: 0,
        lastInviteAt: null,
        lastDeployedAt: null,
        receipts: []
      },
      pledge: {
        active: false,
        broken: false,
        amount: 25,
        payee: "",
        lockedAt: null,
        debt: 0
      }
    };
    if (over) {
      Object.keys(over).forEach(function (key) {
        state[key] = over[key];
      });
    }
    state.streakDay = clampDay(state.streakDay);
    return state;
  }

  function awardUrgeClear(state, sessionId, day) {
    if (!sessionId) return { ok: false, reason: "Missing session." };
    if (state.awarded[sessionId]) {
      return { ok: false, reason: "Already awarded.", xp: state.willpowerXP, gained: 0 };
    }
    state.awarded[sessionId] = Date.now();
    var keys = Object.keys(state.awarded);
    if (keys.length > 40) delete state.awarded[keys[0]];
    state.willpowerXP += URGE_XP;
    state.urgesDefeated += 1;
    state.dayLog[String(clampDay(day))] = { status: "urge-defeated", at: new Date().toISOString() };
    return { ok: true, xp: state.willpowerXP, gained: URGE_XP, day: clampDay(day) };
  }

  function earnShieldByInvite(state) {
    state.shield.invites += 1;
    state.shield.lastInviteAt = new Date().toISOString();
    if (state.shield.charges >= 1) {
      return { ok: true, armed: false, reason: "Invite logged. Shield already armed." };
    }
    state.shield.charges = 1;
    state.shield.source = "invite";
    state.shield.armedAt = state.shield.lastInviteAt;
    return { ok: true, armed: true, source: "invite", charges: 1 };
  }

  function buyShield(state) {
    if (state.shield.charges >= 1) {
      return { ok: false, reason: "A shield is already armed. Deploy it before buying another." };
    }
    var at = new Date().toISOString();
    var receipt = {
      id: "RCPT-" + Date.now().toString(36).toUpperCase(),
      amount: SHIELD_PRICE,
      currency: "USD",
      status: "authorized-local",
      note: "No card captured. Receipt stored on this device.",
      at: at
    };
    state.shield.charges = 1;
    state.shield.source = "purchase";
    state.shield.armedAt = at;
    state.shield.receipts.push(receipt);
    if (state.shield.receipts.length > 12) state.shield.receipts.shift();
    return { ok: true, receiptId: receipt.id, amount: SHIELD_PRICE, armed: true };
  }

  function deployShield(state, day) {
    if (state.shield.charges < 1) return { ok: false, reason: "No Streak Shield is armed." };
    var key = String(clampDay(day));
    if (state.dayLog[key] && state.dayLog[key].status === "urge-defeated") {
      return { ok: false, reason: "Today already has a gold shield. Keep the freeze for a real slip." };
    }
    var at = new Date().toISOString();
    state.shield.charges = 0;
    state.shield.deployed += 1;
    state.shield.lastDeployedAt = at;
    state.dayLog[key] = { status: "freeze", at: at };
    state.ledger.push({ type: "shield-deployed", day: Number(key), at: at });
    if (state.ledger.length > 30) state.ledger.shift();
    return { ok: true, day: Number(key) };
  }

  function lockPledge(state, amount, payee) {
    if (state.pledge.active) return { ok: false, reason: "An oath is already locked." };
    var stake = Number(amount);
    if ([10, 25, 50].indexOf(stake) === -1) return { ok: false, reason: "Choose a $10, $25, or $50 stake." };
    var who = cleanPayee(payee);
    if (!who) return { ok: false, reason: "Name who collects if you fold." };
    state.pledge.active = true;
    state.pledge.broken = false;
    state.pledge.amount = stake;
    state.pledge.payee = who;
    state.pledge.lockedAt = new Date().toISOString();
    return { ok: true, amount: stake, payee: who };
  }

  function breakOath(state, day, options) {
    if (!state.pledge.active) return { ok: false, reason: "No live pledge." };
    var opts = options || {};
    var amount = state.pledge.amount;
    var payee = state.pledge.payee;
    var xpLost = state.willpowerXP;
    var shieldBurned = state.shield.charges > 0;
    var at = new Date().toISOString();
    state.willpowerXP = 0;
    state.shield.charges = 0;
    state.pledge.active = false;
    state.pledge.broken = true;
    state.pledge.debt += amount;
    state.confessionRequired = true;
    var entry = {
      type: "oath-broken",
      amount: amount,
      payee: payee,
      xpLost: xpLost,
      shieldBurned: shieldBurned,
      day: clampDay(day),
      at: at
    };
    state.ledger.push(entry);
    if (state.ledger.length > 30) state.ledger.shift();
    if (opts.resetStreak) {
      state.history.push({ endedOnDay: clampDay(day), at: at, reason: "oath-broken" });
      if (state.history.length > 12) state.history.shift();
      state.dayLog = {};
      state.streakDay = 1;
      state.run += 1;
    }
    return {
      ok: true,
      amount: amount,
      payee: payee,
      xpLost: xpLost,
      shieldBurned: shieldBurned,
      reset: Boolean(opts.resetStreak),
      streakDay: state.streakDay
    };
  }

  function invitePayload(state) {
    var url = "https://ironarc.app/join?ref=" + encodeURIComponent(state.inviteCode) + "&day=" + state.streakDay;
    var message = "Day " + state.streakDay + " of IRON ARC. I locked a Winter Arc pact. Join and we both stay armed: " + url;
    return { url: url, message: message, code: state.inviteCode };
  }

  function trimStore(raw) {
    var base = createState();
    if (!raw || typeof raw !== "object") return base;
    var shield = Object.assign({}, base.shield, raw.shield || {});
    var pledge = Object.assign({}, base.pledge, raw.pledge || {});
    var state = Object.assign(base, raw, { shield: shield, pledge: pledge });
    state.streakDay = clampDay(state.streakDay);
    state.run = Math.max(1, Math.floor(Number(state.run) || 1));
    state.willpowerXP = Math.max(0, Math.floor(Number(state.willpowerXP) || 0));
    state.urgesDefeated = Math.max(0, Math.floor(Number(state.urgesDefeated) || 0));
    state.quoteIndex = Math.max(0, Math.floor(Number(state.quoteIndex) || 0));
    state.shield.charges = state.shield.charges >= 1 ? 1 : 0;
    state.shield.invites = Math.max(0, Math.floor(Number(state.shield.invites) || 0));
    state.shield.deployed = Math.max(0, Math.floor(Number(state.shield.deployed) || 0));
    state.shield.receipts = Array.isArray(state.shield.receipts) ? state.shield.receipts.slice(-12) : [];
    state.pledge.debt = Math.max(0, Number(state.pledge.debt) || 0);
    state.pledge.active = Boolean(state.pledge.active);
    state.pledge.amount = [10, 25, 50].indexOf(Number(state.pledge.amount)) !== -1 ? Number(state.pledge.amount) : 25;
    state.dayLog = state.dayLog && typeof state.dayLog === "object" && !Array.isArray(state.dayLog) ? state.dayLog : {};
    state.messages = Array.isArray(state.messages) ? state.messages.slice(-40) : [];
    state.ledger = Array.isArray(state.ledger) ? state.ledger.slice(-30) : [];
    state.history = Array.isArray(state.history) ? state.history.slice(-12) : [];
    state.awarded = state.awarded && typeof state.awarded === "object" ? state.awarded : {};
    state.confessionRequired = Boolean(state.confessionRequired);
    if (!state.inviteCode) state.inviteCode = makeCode();
    state.v = 1;
    return state;
  }

  var logic = {
    clampDay: clampDay,
    phaseForDay: phaseForDay,
    rankForDay: rankForDay,
    isMilestone: isMilestone,
    milestoneByDay: milestoneByDay,
    defaultMilestone: defaultMilestone,
    dayStatus: dayStatus,
    applyDay: applyDay,
    reduceShatter: reduceShatter,
    addPushups: addPushups,
    breathFrame: breathFrame,
    sessionProgress: sessionProgress,
    interruptCleared: interruptCleared,
    arousalCurve: arousalCurve,
    formatClock: formatClock,
    formatRemain: formatRemain,
    panicView: panicView,
    detectIntent: detectIntent,
    commanderReply: commanderReply,
    briefing: briefing,
    createState: createState,
    awardUrgeClear: awardUrgeClear,
    earnShieldByInvite: earnShieldByInvite,
    buyShield: buyShield,
    deployShield: deployShield,
    lockPledge: lockPledge,
    breakOath: breakOath,
    invitePayload: invitePayload,
    cleanPayee: cleanPayee
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cracksHtml(taps) {
    var html = "";
    var i;
    for (i = 0; i < SHATTER_TAPS; i++) {
      html += '<span class="iaf-crack n' + i + (i < taps ? " is-on" : "") + '"></span>';
    }
    return html;
  }

  function renderPanic(view) {
    var remainLabel = view.arousal.remainMs <= 0 ? "00:00  CREST PASSED" : formatRemain(view.arousal.remainMs);
    var tapNote = "HIT IT. TEN TAPS INSIDE EIGHT SECONDS.";
    if (view.shatter.cleared) tapNote = "SHATTERED. THE URGE LOST THE ROOM.";
    else if (view.shatter.failed) tapNote = "TOO SLOW. AGAIN. EIGHT SECONDS. TEN TAPS.";
    else if (view.shatter.started && view.shatter.leftMs <= 0) tapNote = "WINDOW CLOSED. TAP ONCE TO START A CLEAN SET.";
    var frame = view.frame;
    var breathPhase = frame ? frame.phase : "READY";
    var breathCue = frame ? frame.cue : "Start when the pushups get hard. In 4, hold 7, out 8. Three cycles.";
    var breathScale = frame ? frame.scale.toFixed(3) : "0.850";
    var cycleLabel = frame
      ? (frame.complete ? "3 / 3 CYCLES" : (frame.cyclesDone + 1) + " / 3 CYCLES")
      : "0 / 3 CYCLES";
    var dismiss = view.cleared
      ? "DISMISS URGE  ·  +" + URGE_XP + " WILLPOWER XP"
      : "COMPLETE THE INTERRUPT TO DISMISS";
    return (
      '<div class="iaf-sheet iaf-panic">' +
        '<div class="iaf-panic-top">' +
          '<div><p class="iaf-kicker">RED PANIC 2.0 · URGE INTERVENTION</p>' +
          '<h2>Day ' + esc(view.streakDay) + ' · ' + esc(view.rank) + '</h2></div>' +
          '<button type="button" class="iaf-btn iaf-btn-ghost" data-act="stand-down">Stand down</button>' +
        '</div>' +
        '<div class="iaf-mirror">' +
          '<video class="iaf-video" autoplay playsinline muted></video>' +
          '<div class="iaf-reticle" aria-hidden="true"><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span><span class="x"></span></div>' +
          '<div class="iaf-hud-top"><span class="iaf-rec" id="iaf-cam">' + esc(view.cameraNote) + '</span><span id="iaf-clock">' + esc(view.clock) + '</span></div>' +
          '<p class="iaf-quote" id="iaf-quote">' + esc(view.quote) + '</p>' +
        '</div>' +
        '<div class="iaf-quote-row">' +
          '<button type="button" class="iaf-btn iaf-btn-ghost" data-act="quote">Next line</button>' +
          '<button type="button" class="iaf-btn iaf-btn-ghost" data-act="voice">' + (view.voice ? "Voice on" : "Voice off") + '</button>' +
        '</div>' +
        '<div class="iaf-gauges" aria-label="Stabilization coaching curve">' +
          '<div><span>Heart-rate guide</span><strong id="iaf-bpm">' + esc(view.arousal.bpm) + '</strong></div>' +
          '<div><span>Adrenaline</span><strong id="iaf-index">' + esc(view.arousal.index) + '</strong>' +
            '<i class="iaf-bar"><b id="iaf-index-bar" style="width:' + esc(view.arousal.index) + '%"></b></i></div>' +
          '<div><span>Stabilization</span><strong id="iaf-remain">' + esc(remainLabel) + '</strong></div>' +
        '</div>' +
        '<p class="iaf-fine">Coaching curve from the 90s urge window and your breath count. Not a medical sensor. Outlasting the clock does not dismiss the urge.</p>' +
        '<div class="iaf-modes">' +
          '<button type="button" class="iaf-mode' + (view.mode === "shatter" ? " is-on" : "") + '" data-act="mode" data-mode="shatter">Shatter · 10 taps</button>' +
          '<button type="button" class="iaf-mode' + (view.mode === "body" ? " is-on" : "") + '" data-act="mode" data-mode="body">Pushups + 4-7-8</button>' +
        '</div>' +
        '<div id="iaf-panel-shatter" class="' + (view.mode === "shatter" ? "" : "is-hidden") + '">' +
          '<p class="iaf-path-label">Urge Destroyer · Shatter the Temptation</p>' +
          '<div class="iaf-glass" data-act="tap" role="button" tabindex="0" aria-label="Shatter the temptation. Ten rapid taps.">' +
            cracksHtml(view.shatter.taps) +
            '<strong id="iaf-tap-count">' + esc(view.shatter.taps) + '</strong><em>/ 10</em>' +
          '</div>' +
          '<p class="iaf-tap-meta"><span id="iaf-tap-left">' + (view.shatter.leftMs / 1000).toFixed(1) + 's</span> · <span id="iaf-tap-note">' + esc(tapNote) + '</span></p>' +
        '</div>' +
        '<div id="iaf-panel-body" class="' + (view.mode === "body" ? "" : "is-hidden") + '">' +
          '<p class="iaf-path-label">Urge Destroyer · 20 pushups + 4-7-8 physiological sigh pacer</p>' +
          '<div class="iaf-split">' +
            '<div><span>Pushups</span><strong id="iaf-push-count">' + esc(view.pushups) + '</strong><em>/ 20</em>' +
              '<div class="iaf-row">' +
                '<button type="button" class="iaf-btn" data-act="push" data-delta="1">+1</button>' +
                '<button type="button" class="iaf-btn" data-act="push" data-delta="5">+5</button>' +
              '</div></div>' +
            '<div class="iaf-breath">' +
              '<span id="iaf-breath-cycle">' + esc(cycleLabel) + '</span>' +
              '<div class="iaf-orb" id="iaf-orb" style="transform:scale(' + breathScale + ')"><b id="iaf-breath-phase">' + esc(breathPhase) + '</b></div>' +
              '<p id="iaf-breath-cue">' + esc(breathCue) + '</p>' +
              '<button type="button" class="iaf-btn" data-act="breath"' + (view.breathRunning ? " disabled" : "") + '>' + (view.breathRunning ? "Pacer running" : "Start 4-7-8") + '</button>' +
              '<button type="button" class="iaf-textbtn' + (view.breathRunning && !(frame && frame.complete) ? "" : " is-hidden") + '" id="iaf-breath-restart" data-act="breath-restart">Restart pacer</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="iaf-check" id="iaf-check">Shatter ' + esc(view.shatter.taps) + '/10 &nbsp;or&nbsp; pushups ' + esc(view.pushups) + '/20 + breath ' + esc(view.breathCycles) + '/3</p>' +
        '<button type="button" class="iaf-btn iaf-btn-gold" id="iaf-dismiss" data-act="dismiss"' + (view.cleared ? "" : " disabled") + '>' + esc(dismiss) + '</button>' +
        '<button type="button" class="iaf-textbtn" data-act="stand-down">Close without XP</button>' +
      '</div>'
    );
  }

  function renderMessages(messages) {
    if (!messages || !messages.length) {
      return '<p class="iaf-empty">Hit a crisis prompt or write the room you are in.</p>';
    }
    return messages.map(function (msg) {
      var role = msg.role === "marcus" ? "marcus" : "user";
      var kicker = role === "marcus"
        ? "COMMANDER MARCUS" + (msg.day ? " · DAY " + msg.day : "") + (msg.phase ? " · " + msg.phase : "")
        : "YOU";
      return '<article class="iaf-msg iaf-msg-' + role + '"><span>' + esc(kicker) + '</span><p>' + esc(msg.text) + '</p></article>';
    }).join("");
  }

  function renderCommander(state, draft) {
    var phase = phaseForDay(state.streakDay);
    var prompts = CRISIS_PROMPTS.map(function (prompt) {
      return '<button type="button" class="iaf-chip" data-act="prompt" data-id="' + esc(prompt.id) + '">' + esc(prompt.label) + '</button>';
    }).join("");
    return (
      '<section class="iaf-panel">' +
        '<p class="iaf-kicker">24/7 NEURO-COMMANDER</p>' +
        '<h2>Commander Marcus</h2>' +
        '<p class="iaf-lead">Day ' + esc(state.streakDay) + ' · ' + esc(rankForDay(state.streakDay).name) + ' · ' + esc(phase.name) + '. Sharp orders, honest physiology. No vague pep talk.</p>' +
        '<div class="iaf-chips">' + prompts + '</div>' +
        '<div class="iaf-transcript" aria-live="polite">' + renderMessages(state.messages) + '</div>' +
        '<form id="iaf-chat-form" class="iaf-chat" autocomplete="off">' +
          '<input id="iaf-chat" name="message" maxlength="500" placeholder="Tell Marcus the cue in front of you" value="' + esc(draft || "") + '" />' +
          '<button type="submit" class="iaf-btn iaf-btn-gold">Send</button>' +
        '</form>' +
      '</section>'
    );
  }

  function renderDetail(day, state) {
    var card = milestoneByDay(day);
    if (!card) {
      var status = dayStatus(day, state);
      return (
        '<article class="iaf-bio">' +
          '<p class="iaf-kicker">DAY ' + esc(day) + ' · ' + esc(status.label) + '</p>' +
          '<h3>' + esc(status.headline) + '</h3>' +
          '<p>' + esc(status.detail) + '</p>' +
        '</article>'
      );
    }
    var reached = state.streakDay >= card.day;
    return (
      '<article class="iaf-bio">' +
        '<p class="iaf-kicker">DAY ' + esc(card.day) + ' · ' + esc(card.code) + (reached ? " · ON YOUR CLOCK" : " · AHEAD") + '</p>' +
        '<h3>' + esc(card.title) + '</h3>' +
        '<h4>Brain</h4><p>' + esc(card.brain) + '</p>' +
        '<h4>Body</h4><p>' + esc(card.body) + '</p>' +
        '<p class="iaf-order"><strong>Order. </strong>' + esc(card.order) + '</p>' +
        '<p class="iaf-fine">' + esc(card.source) + '</p>' +
      '</article>'
    );
  }

  function renderGrid(state, selectedDay) {
    var cells = "";
    var day;
    var status;
    for (day = 1; day <= 30; day++) {
      status = dayStatus(day, state);
      cells += '<button type="button" class="iaf-day is-' + status.key +
        (status.milestone ? " is-milestone" : "") +
        (Number(selectedDay) === day ? " is-selected" : "") +
        '" data-act="day" data-grid="1" data-day="' + day + '"' +
        (status.milestone ? ' data-milestone="1"' : "") +
        ' aria-pressed="' + (Number(selectedDay) === day ? "true" : "false") + '"' +
        ' aria-label="Day ' + day + ', ' + esc(status.label) + '">' +
        '<b>' + day + '</b></button>';
    }
    var legend = ["locked", "urge-defeated", "today", "upcoming"].map(function (key) {
      return '<li class="is-' + key + '"><i></i>' + esc(STATUS_META[key].label) + '</li>';
    }).join("");
    return (
      '<section class="iaf-panel">' +
        '<p class="iaf-kicker">30-DAY NNN TACTICAL GRID</p>' +
        '<h2>Lock the month. Read the mile.</h2>' +
        '<p class="iaf-lead">Emerald is banked. Gold is an urge you destroyed. The pulse is today. Milestone days open the biology.</p>' +
        '<ul class="iaf-legend">' + legend + '</ul>' +
        '<div class="iaf-grid">' + cells + '</div>' +
        renderRoadmap(state, selectedDay) +
        renderDetail(selectedDay || defaultMilestone(state.streakDay), state) +
      '</section>'
    );
  }

  function renderRoadmap(state, selectedDay) {
    var width = Math.max(0, Math.min(100, (Math.min(state.streakDay, 90) / 90) * 100));
    var phases = PHASES.filter(function (phase) { return phase.id !== "maintain"; });
    var html = phases.map(function (phase) {
      var tone = state.streakDay > phase.end ? "is-done" : (state.streakDay >= phase.start ? "is-now" : "is-next");
      var nodes = MILESTONE_DAYS.filter(function (day) {
        return day >= phase.start && day <= phase.end;
      }).map(function (day) {
        return '<button type="button" class="iaf-node' + (Number(selectedDay) === day ? " is-selected" : "") +
          '" data-act="day" data-road="1" data-day="' + day + '" data-milestone="1">Day ' + day + '</button>';
      }).join("");
      return (
        '<li class="iaf-phase ' + tone + '">' +
          '<div><b>' + esc(phase.name) + '</b><span>Days ' + phase.start + '–' + phase.end + '</span></div>' +
          '<p>' + esc(phase.line) + '</p>' +
          '<div class="iaf-nodes">' + nodes + '</div>' +
        '</li>'
      );
    }).join("");
    return (
      '<div class="iaf-road">' +
        '<div class="iaf-road-head"><p class="iaf-kicker">90-DAY WINTER ARC</p><strong>' + esc(Math.min(state.streakDay, 90)) + ' / 90</strong></div>' +
        '<div class="iaf-track"><b style="width:' + width.toFixed(1) + '%"></b></div>' +
        '<ol>' + html + '</ol>' +
      '</div>'
    );
  }

  function renderVault(state, view) {
    var shield = state.shield;
    var pledge = state.pledge;
    var armed = shield.charges >= 1;
    var stakes = [10, 25, 50].map(function (amount) {
      return '<button type="button" class="iaf-stake' + (view.stake === amount ? " is-on" : "") + '" data-act="stake" data-stake="' + amount + '">$' + amount + '</button>';
    }).join("");
    var shieldBlock =
      '<div class="iaf-card">' +
        '<p class="iaf-kicker">STREAK FREEZE SHIELD</p>' +
        '<h3>' + (armed ? "1 charge armed" : "No charge armed") + '</h3>' +
        '<p>' + (armed
          ? "Source: " + esc(shield.source || "unknown") + ". Deploy it to hold the counter through one slip."
          : "Earn one freeze by inviting a friend, or arm it now for $2.99. One charge. No stack.") +
        '</p>' +
        '<p class="iaf-code">' + esc(state.inviteCode) + ' · invites ' + esc(shield.invites) + ' · deployed ' + esc(shield.deployed) + '</p>' +
        '<div class="iaf-row">' +
          '<button type="button" class="iaf-btn" data-act="invite">Invite 1 friend</button>' +
          '<button type="button" class="iaf-btn iaf-btn-gold" data-act="buy">$2.99 shield</button>' +
        '</div>' +
        (view.purchaseOpen
          ? '<div class="iaf-confirm"><p>Arm one Streak Shield for $2.99. This records a local receipt. No card number is collected and nothing is charged in this build.</p>' +
            '<div class="iaf-row"><button type="button" class="iaf-btn iaf-btn-gold" data-act="buy-confirm">Confirm local receipt</button>' +
            '<button type="button" class="iaf-btn iaf-btn-ghost" data-act="buy-cancel">Cancel</button></div></div>'
          : '') +
        '<button type="button" class="iaf-btn iaf-btn-ghost" data-act="deploy"' + (armed ? "" : " disabled") + '>Deploy shield on day ' + esc(state.streakDay) + '</button>' +
      '</div>';
    var pledgeBlock;
    if (pledge.active) {
      pledgeBlock =
        '<div class="iaf-card iaf-card-hot">' +
          '<p class="iaf-kicker">RELAPSE PENALTY PLEDGE</p>' +
          '<h3>$' + esc(pledge.amount) + ' locked to ' + esc(pledge.payee) + '</h3>' +
          '<p>Break the oath and this device zeros Willpower XP, ' +
            (armed ? "burns the armed shield, " : "") +
            'ledgers $' + esc(pledge.amount) + ' as a debt, and resets the module counter to Day 1.</p>' +
          '<p class="iaf-fine">Honor contract stored on this device. It does not move money by itself. You still owe what you named.</p>' +
          (view.confirmBreak
            ? '<div class="iaf-confirm"><p>Second tap pays the penalty.</p>' +
              '<div class="iaf-row"><button type="button" class="iaf-btn iaf-btn-red" data-act="break-confirm">Pay $' + esc(pledge.amount) + ' and reset</button>' +
              '<button type="button" class="iaf-btn iaf-btn-ghost" data-act="break-cancel">Keep the oath</button></div></div>'
            : '<button type="button" class="iaf-btn iaf-btn-red" data-act="break">I broke the oath</button>') +
        '</div>';
    } else {
      pledgeBlock =
        '<div class="iaf-card">' +
          '<p class="iaf-kicker">RELAPSE PENALTY PLEDGE</p>' +
          '<h3>' + (pledge.debt > 0 ? '$' + esc(pledge.debt) + ' already on the ledger' : 'No live oath') + '</h3>' +
          '<p>Lock a stake before you need it. Folding costs the stake, your XP, and the streak inside this module.</p>' +
          '<div class="iaf-stakes">' + stakes + '</div>' +
          '<label class="iaf-field">Who collects if you fold?' +
            '<input id="iaf-payee" maxlength="60" value="' + esc(view.payee) + '" />' +
          '</label>' +
          '<button type="button" class="iaf-btn iaf-btn-red" data-act="lock">Lock the pledge</button>' +
        '</div>';
    }
    var ledger = (state.ledger || []).slice(-3).reverse().map(function (entry) {
      if (entry.type === "oath-broken") {
        return '<li>Oath broken · $' + esc(entry.amount) + ' to ' + esc(entry.payee) + ' · XP lost ' + esc(entry.xpLost) + '</li>';
      }
      if (entry.type === "shield-deployed") return '<li>Shield deployed on day ' + esc(entry.day) + '</li>';
      return '<li>' + esc(entry.type) + '</li>';
    }).join("");
    var confession = state.confessionRequired
      ? '<div class="iaf-banner">Confession is still owed. Tell one person what the ledger already knows.<button type="button" data-act="confessed">Mark sent</button></div>'
      : '';
    return (
      '<section class="iaf-panel">' +
        '<p class="iaf-kicker">SKIN IN THE GAME</p>' +
        '<h2>Commitment vault</h2>' +
        '<p class="iaf-lead">A shield is a freeze you earn. A pledge is a price you choose. Neither one is a hidden charge.</p>' +
        confession +
        shieldBlock +
        pledgeBlock +
        (ledger ? '<ul class="iaf-ledger">' + ledger + '</ul>' : '') +
        '<button type="button" class="iaf-textbtn" data-act="' + (view.confirmErase ? "erase-confirm" : "erase") + '">' +
          (view.confirmErase ? "Tap again to erase this device's vault" : "Erase this device's vault") +
        '</button>' +
      '</section>'
    );
  }

  function renderHub(state, view) {
    var phase = phaseForDay(state.streakDay);
    var rank = rankForDay(state.streakDay);
    var tab = view.tab || "grid";
    var body = "";
    if (tab === "marcus") body = renderCommander(state, view.draft);
    else if (tab === "vault") body = renderVault(state, view);
    else body = renderGrid(state, view.selectedDay);
    var shieldLabel = state.shield.charges >= 1 ? "SHIELD ARMED" : "NO SHIELD";
    return (
      '<div class="iaf-root">' +
        '<header class="iaf-head">' +
          '<div><p class="iaf-kicker">IRON ARC · FEATURES</p>' +
          '<h2>Day ' + esc(state.streakDay) + ' · ' + esc(rank.name) + '</h2>' +
          '<p>' + esc(phase.name) + (state.run > 1 ? " · Redemption run " + esc(state.run) : "") + '</p></div>' +
          '<div class="iaf-stats"><b>' + esc(state.willpowerXP) + ' XP</b><span>' + esc(state.urgesDefeated) + ' urges</span><span>' + shieldLabel + '</span></div>' +
        '</header>' +
        '<button type="button" class="iaf-panic-launch" data-act="panic">Red Panic Button 2.0</button>' +
        (view.notice ? '<p class="iaf-notice">' + esc(view.notice) + '</p>' : '') +
        '<div class="iaf-tabs" role="tablist">' +
          '<button type="button" role="tab" data-act="tab" data-tab="marcus"' + (tab === "marcus" ? ' aria-selected="true"' : "") + '>Marcus</button>' +
          '<button type="button" role="tab" data-act="tab" data-tab="grid"' + (tab === "grid" ? ' aria-selected="true"' : "") + '>Tactical grid</button>' +
          '<button type="button" role="tab" data-act="tab" data-tab="vault"' + (tab === "vault" ? ' aria-selected="true"' : "") + '>Vault</button>' +
        '</div>' +
        body +
      '</div>'
    );
  }

  var render = {
    panic: renderPanic,
    commander: renderCommander,
    grid: renderGrid,
    roadmap: renderRoadmap,
    vault: renderVault,
    hub: renderHub,
    detail: renderDetail,
    milestone: function (day, state) {
      return renderDetail(day, state || createState());
    }
  };

  var CSS = [
    ".iaf-root,.iaf-overlay{--iaf-bg:#07090e;--iaf-card:#10141f;--iaf-text:#f8fafc;--iaf-muted:#94a3b8;--iaf-dim:#64748b;--iaf-emerald:#10b981;--iaf-amber:#f59e0b;--iaf-crimson:#ef4444;color:var(--text-main,var(--iaf-text));font-family:inherit;}",
    ".iaf-root button,.iaf-overlay button,.iaf-root input{font-family:inherit;}",
    ".iaf-root h2,.iaf-overlay h2{font-size:22px;line-height:1.15;margin:2px 0 4px;}",
    ".iaf-root h3{font-size:16px;margin:0 0 6px;}",
    ".iaf-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--accent-emerald,var(--iaf-emerald));margin:0 0 4px;}",
    ".iaf-lead,.iaf-root p,.iaf-overlay p{color:var(--text-muted,var(--iaf-muted));font-size:13px;line-height:1.45;}",
    ".iaf-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px;}",
    ".iaf-head p{margin:0;}",
    ".iaf-stats{display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:11px;color:var(--text-dim,var(--iaf-dim));font-weight:700;}",
    ".iaf-stats b{color:var(--accent-amber,#fbbf24);font-size:14px;}",
    ".iaf-panic-launch{width:100%;border:0;border-radius:12px;padding:14px 12px;margin-bottom:10px;cursor:pointer;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 8px 24px rgba(239,68,68,.35);}",
    ".iaf-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;}",
    ".iaf-tabs button{background:var(--bg-card,#10141f);color:var(--text-muted,#94a3b8);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:8px 6px;font-size:12px;font-weight:800;cursor:pointer;}",
    ".iaf-tabs button[aria-selected=true]{color:#04130d;background:var(--accent-emerald,#10b981);border-color:transparent;}",
    ".iaf-notice,.iaf-banner{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.4);color:#fbbf24;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:700;margin-bottom:10px;}",
    ".iaf-banner{display:flex;justify-content:space-between;gap:8px;align-items:center;}",
    ".iaf-banner button,.iaf-textbtn{background:none;border:0;color:var(--text-dim,#94a3b8);font-size:12px;cursor:pointer;text-decoration:underline;padding:6px 0;}",
    ".iaf-card{background:var(--bg-card,#10141f);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px;margin-bottom:10px;}",
    ".iaf-card-hot{border-color:rgba(239,68,68,.45);}",
    ".iaf-card p{margin:0 0 8px;}",
    ".iaf-code{font-weight:800;color:var(--accent-emerald,#10b981)!important;}",
    ".iaf-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;}",
    ".iaf-btn{border:1px solid rgba(255,255,255,.1);background:#161c2b;color:#f8fafc;border-radius:10px;padding:10px 12px;font-weight:800;font-size:13px;cursor:pointer;}",
    ".iaf-btn:disabled{opacity:.45;cursor:not-allowed;}",
    ".iaf-btn-gold{background:#f59e0b;color:#1c1303;border-color:transparent;}",
    ".iaf-btn-red{background:#ef4444;color:#fff;border-color:transparent;}",
    ".iaf-btn-ghost{background:transparent;color:#e2e8f0;}",
    ".iaf-chips{display:flex;flex-direction:column;gap:6px;margin:10px 0;}",
    ".iaf-chip{text-align:left;background:#10141f;color:#f8fafc;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700;font-size:13px;}",
    ".iaf-transcript{max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin:8px 0;}",
    ".iaf-msg{border-radius:12px;padding:10px 12px;white-space:pre-wrap;}",
    ".iaf-msg span{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:4px;color:#94a3b8;}",
    ".iaf-msg p{margin:0;color:#f8fafc;}",
    ".iaf-msg-marcus{background:#10141f;border:1px solid rgba(16,185,129,.35);}",
    ".iaf-msg-user{background:#1b2436;margin-left:18px;}",
    ".iaf-chat{display:flex;gap:8px;}",
    ".iaf-chat input,.iaf-field input{flex:1;width:100%;background:#0c111b;color:#f8fafc;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;font-size:14px;}",
    ".iaf-field{display:block;font-size:12px;font-weight:700;color:#94a3b8;margin:8px 0;}",
    ".iaf-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0;}",
    ".iaf-day{min-height:46px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#121826;color:#64748b;font-weight:800;cursor:pointer;position:relative;}",
    ".iaf-day.is-locked{background:rgba(16,185,129,.18);color:#6ee7b7;border-color:rgba(16,185,129,.45);}",
    ".iaf-day.is-urge-defeated{background:rgba(245,158,11,.2);color:#fbbf24;border-color:#f59e0b;}",
    ".iaf-day.is-today{color:#ecfdf5;border-color:#10b981;animation:iaf-pulse 1.6s ease-in-out infinite;}",
    ".iaf-day.is-freeze{background:rgba(99,102,241,.18);color:#c7d2fe;border-color:#818cf8;}",
    ".iaf-day.is-milestone::after{content:'';position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:99px;background:#f59e0b;}",
    ".iaf-day.is-selected{outline:2px solid #f8fafc;}",
    ".iaf-legend{display:flex;flex-wrap:wrap;gap:8px 12px;list-style:none;padding:0;margin:8px 0;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#94a3b8;}",
    ".iaf-legend li{display:flex;align-items:center;gap:5px;}",
    ".iaf-legend i{width:8px;height:8px;border-radius:99px;background:#334155;display:block;}",
    ".iaf-legend .is-locked i{background:#10b981;}",
    ".iaf-legend .is-urge-defeated i{background:#f59e0b;}",
    ".iaf-legend .is-today i{background:#34d399;}",
    ".iaf-track{height:8px;border-radius:99px;background:#1e293b;overflow:hidden;margin:8px 0 12px;}",
    ".iaf-track b{display:block;height:100%;background:linear-gradient(90deg,#10b981,#f59e0b);}",
    ".iaf-road ol{list-style:none;margin:0;padding:0;}",
    ".iaf-road-head{display:flex;justify-content:space-between;align-items:end;}",
    ".iaf-phase{list-style:none;border-left:2px solid rgba(255,255,255,.08);padding:0 0 12px 10px;margin:0;}",
    ".iaf-phase.is-now{border-color:#10b981;}",
    ".iaf-phase.is-done{border-color:rgba(16,185,129,.45);}",
    ".iaf-phase b{display:block;font-size:12px;letter-spacing:.06em;}",
    ".iaf-phase span,.iaf-phase p{font-size:12px;}",
    ".iaf-nodes{display:flex;gap:6px;flex-wrap:wrap;}",
    ".iaf-node{border:1px solid rgba(245,158,11,.5);background:transparent;color:#fbbf24;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:800;cursor:pointer;}",
    ".iaf-node.is-selected{background:#f59e0b;color:#1c1303;}",
    ".iaf-bio{background:#10141f;border-radius:16px;padding:14px;border:1px solid rgba(255,255,255,.08);margin-top:8px;}",
    ".iaf-bio h3{margin:0 0 8px;}",
    ".iaf-bio h4{margin:10px 0 4px;font-size:11px;letter-spacing:.08em;color:#fbbf24;}",
    ".iaf-bio p{margin:0 0 6px;}",
    ".iaf-order{color:#f8fafc!important;}",
    ".iaf-fine{font-size:11px!important;color:#64748b!important;}",
    ".iaf-stakes{display:flex;gap:6px;}",
    ".iaf-stake{flex:1;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#f8fafc;padding:8px;font-weight:800;cursor:pointer;}",
    ".iaf-stake.is-on{border-color:#ef4444;color:#fecaca;}",
    ".iaf-confirm{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);}",
    ".iaf-ledger{list-style:none;padding:0;margin:8px 0;font-size:12px;color:#94a3b8;}",
    ".iaf-overlay{position:fixed;inset:0;z-index:400;overflow:auto;background:rgba(5,7,12,.97);padding:14px 14px 28px;}",
    ".iaf-sheet{width:min(430px,100%);margin:0 auto;}",
    ".iaf-panic-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;}",
    ".iaf-mirror{position:relative;height:220px;border-radius:16px;overflow:hidden;border:2px solid #ef4444;background:#05070b;margin:8px 0;}",
    ".iaf-video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);background:#05070b;}",
    ".iaf-reticle{position:absolute;inset:14px;pointer-events:none;}",
    ".iaf-reticle .c{position:absolute;width:18px;height:18px;border:2px solid rgba(255,255,255,.9);}",
    ".iaf-reticle .tl{top:0;left:0;border-right:0;border-bottom:0;}",
    ".iaf-reticle .tr{top:0;right:0;border-left:0;border-bottom:0;}",
    ".iaf-reticle .bl{bottom:0;left:0;border-right:0;border-top:0;}",
    ".iaf-reticle .br{bottom:0;right:0;border-left:0;border-top:0;}",
    ".iaf-reticle .x{position:absolute;left:50%;top:50%;width:22px;height:22px;transform:translate(-50%,-50%);}",
    ".iaf-reticle .x:before,.iaf-reticle .x:after{content:'';position:absolute;background:#ef4444;}",
    ".iaf-reticle .x:before{left:10px;top:0;width:2px;height:22px;}",
    ".iaf-reticle .x:after{top:10px;left:0;height:2px;width:22px;}",
    ".iaf-hud-top{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 6px #000;}",
    ".iaf-rec{background:rgba(239,68,68,.9);border-radius:4px;padding:3px 6px;letter-spacing:.06em;}",
    ".iaf-quote{position:absolute;left:10px;right:10px;bottom:8px;margin:0;text-align:center;font-weight:900;font-size:14px;color:#fff;text-shadow:0 2px 10px #000;}",
    ".iaf-quote-row,.iaf-gauges{display:flex;justify-content:space-between;gap:8px;}",
    ".iaf-gauges{margin:8px 0;}",
    ".iaf-gauges div{flex:1;background:#10141f;border-radius:12px;padding:8px;}",
    ".iaf-gauges span{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;font-weight:800;}",
    ".iaf-gauges strong{font-size:18px;}",
    ".iaf-bar{display:block;height:4px;border-radius:99px;background:#1e293b;margin-top:4px;}",
    ".iaf-bar b{display:block;height:100%;background:#ef4444;border-radius:99px;}",
    ".iaf-modes{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0;}",
    ".iaf-mode{border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#94a3b8;padding:8px;font-weight:800;cursor:pointer;}",
    ".iaf-mode.is-on{color:#fff;border-color:#ef4444;background:rgba(239,68,68,.15);}",
    ".iaf-path-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#fca5a5;}",
    ".iaf-glass{position:relative;height:128px;border-radius:16px;overflow:hidden;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.08),rgba(239,68,68,.16) 42%,#12080b);border:1px solid rgba(239,68,68,.5);display:flex;align-items:flex-end;justify-content:center;gap:4px;cursor:pointer;touch-action:none;user-select:none;}",
    ".iaf-glass *{pointer-events:none;}",
    ".iaf-glass strong{font-size:42px;line-height:1;}",
    ".iaf-glass em{font-style:normal;margin-bottom:10px;color:#fca5a5;}",
    ".iaf-crack{position:absolute;left:50%;top:18px;width:2px;height:0;background:rgba(255,255,255,.75);transform-origin:top center;}",
    ".iaf-crack.is-on{height:78px;}",
    ".iaf-crack.n0{transform:rotate(-8deg);}.iaf-crack.n1{transform:rotate(14deg);}.iaf-crack.n2{transform:rotate(-24deg);}.iaf-crack.n3{transform:rotate(28deg);}.iaf-crack.n4{transform:rotate(-36deg);}",
    ".iaf-crack.n5{transform:rotate(40deg);}.iaf-crack.n6{transform:rotate(6deg);}.iaf-crack.n7{transform:rotate(-16deg);}.iaf-crack.n8{transform:rotate(20deg);}.iaf-crack.n9{transform:rotate(-4deg);}",
    ".iaf-split{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;}",
    ".iaf-orb{width:84px;height:84px;margin:6px auto;border-radius:99px;border:3px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#6ee7b7;}",
    ".iaf-breath{text-align:center;}",
    ".iaf-check{text-align:center;font-weight:800;color:#e2e8f0!important;}",
    ".is-hidden{display:none!important;}",
    ".iaf-empty{padding:12px;border:1px dashed rgba(255,255,255,.12);border-radius:12px;}",
    ".iaf-root button:focus-visible,.iaf-overlay button:focus-visible,.iaf-glass:focus-visible{outline:2px solid #10b981;outline-offset:2px;}",
    "@keyframes iaf-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.55);}50%{box-shadow:0 0 0 6px rgba(16,185,129,0);}}",
    "@media (prefers-reduced-motion:reduce){.iaf-day.is-today,.iaf-panic-launch{animation:none;}}"
  ].join("");

  var state = createState();
  var listeners = {};
  var live = {
    hubEl: null,
    hubAbort: null,
    tab: "grid",
    selectedDay: null,
    draft: "",
    notice: "",
    purchaseOpen: false,
    confirmBreak: false,
    confirmErase: false,
    stake: 25,
    payee: "Winter Arc jar",
    panic: null,
    panicAbort: null
  };

  function storage() {
    try {
      if (typeof localStorage === "undefined") return null;
      localStorage.setItem("__iaf__", "1");
      localStorage.removeItem("__iaf__");
      return localStorage;
    } catch (err) {
      return null;
    }
  }

  function snapshot() {
    return {
      v: 1,
      streakDay: state.streakDay,
      run: state.run,
      willpowerXP: state.willpowerXP,
      urgesDefeated: state.urgesDefeated,
      quoteIndex: state.quoteIndex,
      inviteCode: state.inviteCode,
      dayLog: state.dayLog,
      messages: state.messages,
      ledger: state.ledger,
      history: state.history,
      awarded: state.awarded,
      confessionRequired: state.confessionRequired,
      shield: state.shield,
      pledge: state.pledge
    };
  }

  function commit() {
    var box = storage();
    if (!box) return;
    try {
      box.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch (err) {}
  }

  function load() {
    var box = storage();
    if (!box) return;
    try {
      var raw = JSON.parse(box.getItem(STORAGE_KEY) || "null");
      if (raw) state = trimStore(raw);
    } catch (err) {
      state = createState();
    }
  }

  function emit(event, detail) {
    var list = listeners[event] || [];
    list.forEach(function (fn) {
      try { fn(detail); } catch (err) {}
    });
    if (typeof root.dispatchEvent === "function" && typeof CustomEvent === "function") {
      root.dispatchEvent(new CustomEvent("ironarc:" + event, { detail: detail }));
    }
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return function () {
      listeners[event] = listeners[event].filter(function (item) { return item !== fn; });
    };
  }

  function getState() {
    var copy = JSON.parse(JSON.stringify(snapshot()));
    copy.phase = phaseForDay(copy.streakDay);
    copy.rank = rankForDay(copy.streakDay);
    copy.shieldArmed = copy.shield.charges > 0;
    return copy;
  }

  function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("iaf-styles")) return;
    var style = document.createElement("style");
    style.id = "iaf-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function hubView() {
    return {
      tab: live.tab,
      selectedDay: live.selectedDay || defaultMilestone(state.streakDay),
      notice: live.notice,
      purchaseOpen: live.purchaseOpen,
      confirmBreak: live.confirmBreak,
      confirmErase: live.confirmErase,
      stake: live.stake,
      payee: live.payee,
      draft: live.draft
    };
  }

  function paintHub() {
    if (!live.hubEl) return;
    live.hubEl.innerHTML = renderHub(state, hubView());
    bindHub(live.hubEl);
    var box = live.hubEl.querySelector(".iaf-transcript");
    if (box) box.scrollTop = box.scrollHeight;
    var field = live.hubEl.querySelector("#iaf-chat");
    if (field && live.draft && field.value !== live.draft) field.value = live.draft;
  }

  function bindHub(el) {
    if (live.hubAbort) live.hubAbort.abort();
    var ac = typeof AbortController === "function" ? new AbortController() : null;
    live.hubAbort = ac;
    var opts = ac ? { signal: ac.signal } : false;
    el.addEventListener("click", onHubClick, opts || false);
    el.addEventListener("submit", onHubSubmit, opts || false);
    el.addEventListener("input", onHubInput, opts || false);
  }

  function requireDocument() {
    if (typeof document === "undefined") {
      throw new Error("FeaturesModule UI needs a browser document.");
    }
  }

  function speak(text) {
    try {
      if (!root.speechSynthesis || typeof root.SpeechSynthesisUtterance !== "function") return false;
      root.speechSynthesis.cancel();
      var utter = new root.SpeechSynthesisUtterance(text);
      utter.rate = 0.92;
      utter.pitch = 0.82;
      var voices = root.speechSynthesis.getVoices ? root.speechSynthesis.getVoices() : [];
      var voice = null;
      var i;
      for (i = 0; i < voices.length; i++) {
        if (/en/i.test(voices[i].lang) && /male|david|daniel|alex|guy|george/i.test(voices[i].name)) {
          voice = voices[i];
          break;
        }
      }
      if (!voice) {
        for (i = 0; i < voices.length; i++) {
          if (/en/i.test(voices[i].lang)) { voice = voices[i]; break; }
        }
      }
      if (voice) utter.voice = voice;
      root.speechSynthesis.speak(utter);
      return true;
    } catch (err) {
      return false;
    }
  }

  function stopSpeech() {
    try {
      if (root.speechSynthesis) root.speechSynthesis.cancel();
    } catch (err) {}
  }

  function stopCamera() {
    var session = live.panic;
    if (session && session.stream) {
      session.stream.getTracks().forEach(function (track) { track.stop(); });
      session.stream = null;
    }
  }

  function paintPanic() {
    var session = live.panic;
    var overlay = document.getElementById("iaf-panic-root");
    if (!session || !overlay) return;
    var view = panicView(session, state, Date.now());
    session.breathCycles = view.breathCycles;
    var setText = function (id, value) {
      var node = document.getElementById(id);
      if (node) node.textContent = value;
    };
    setText("iaf-clock", view.clock);
    setText("iaf-quote", view.quote);
    setText("iaf-cam", view.cameraNote);
    setText("iaf-bpm", String(view.arousal.bpm));
    setText("iaf-index", String(view.arousal.index));
    setText("iaf-remain", view.arousal.remainMs <= 0 ? "00:00  CREST PASSED" : formatRemain(view.arousal.remainMs));
    var bar = document.getElementById("iaf-index-bar");
    if (bar) bar.style.width = view.arousal.index + "%";
    setText("iaf-tap-count", String(view.shatter.taps));
    setText("iaf-tap-left", (view.shatter.leftMs / 1000).toFixed(1) + "s");
    var note = "HIT IT. TEN TAPS INSIDE EIGHT SECONDS.";
    if (view.shatter.cleared) note = "SHATTERED. THE URGE LOST THE ROOM.";
    else if (view.shatter.failed) note = "TOO SLOW. AGAIN. EIGHT SECONDS. TEN TAPS.";
    else if (view.shatter.started && view.shatter.leftMs <= 0) note = "WINDOW CLOSED. TAP ONCE TO START A CLEAN SET.";
    setText("iaf-tap-note", note);
    var cracks = overlay.querySelectorAll(".iaf-crack");
    Array.prototype.forEach.call(cracks, function (node, index) {
      node.classList.toggle("is-on", index < view.shatter.taps);
    });
    setText("iaf-push-count", String(view.pushups));
    if (view.frame) {
      setText("iaf-breath-phase", view.frame.phase);
      setText("iaf-breath-cue", view.frame.cue);
      setText("iaf-breath-cycle", view.frame.complete ? "3 / 3 CYCLES" : (view.frame.cyclesDone + 1) + " / 3 CYCLES");
      var orb = document.getElementById("iaf-orb");
      if (orb) orb.style.transform = "scale(" + view.frame.scale.toFixed(3) + ")";
    }
    setText("iaf-check", "Shatter " + view.shatter.taps + "/10   or   pushups " + view.pushups + "/20 + breath " + view.breathCycles + "/3");
    var dismiss = document.getElementById("iaf-dismiss");
    if (dismiss) {
      dismiss.disabled = !view.cleared;
      dismiss.textContent = view.cleared
        ? "DISMISS URGE  ·  +" + URGE_XP + " WILLPOWER XP"
        : "COMPLETE THE INTERRUPT TO DISMISS";
    }
    var voiceBtn = overlay.querySelector('[data-act="voice"]');
    if (voiceBtn) voiceBtn.textContent = view.voice ? "Voice on" : "Voice off";
    var breathBtn = overlay.querySelector('[data-act="breath"]');
    if (breathBtn) {
      breathBtn.disabled = view.breathRunning;
      breathBtn.textContent = view.breathRunning ? "Pacer running" : "Start 4-7-8";
    }
    var restartBtn = document.getElementById("iaf-breath-restart");
    if (restartBtn) {
      var showRestart = view.breathRunning && !(view.frame && view.frame.complete);
      restartBtn.classList.toggle("is-hidden", !showRestart);
    }
  }

  function closePanic() {
    if (live.panic && live.panic.timer) clearInterval(live.panic.timer);
    if (live.panicAbort) live.panicAbort.abort();
    live.panicAbort = null;
    stopCamera();
    stopSpeech();
    var overlay = typeof document !== "undefined" && document.getElementById("iaf-panic-root");
    if (overlay) overlay.remove();
    live.panic = null;
  }

  function startMirror(video, sessionId) {
    var media = root.navigator && root.navigator.mediaDevices;
    if (!media || !media.getUserMedia) {
      if (live.panic && live.panic.id === sessionId) {
        live.panic.cameraNote = "MIRROR OFFLINE — HOLD THE RETICLE";
        paintPanic();
      }
      return;
    }
    media.getUserMedia({ video: { facingMode: { ideal: "user" } }, audio: false }).then(function (stream) {
      if (!live.panic || live.panic.id !== sessionId) {
        stream.getTracks().forEach(function (track) { track.stop(); });
        return;
      }
      live.panic.stream = stream;
      video.srcObject = stream;
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
      live.panic.cameraNote = "FRONT MIRROR LIVE";
      paintPanic();
    }).catch(function () {
      if (live.panic && live.panic.id === sessionId) {
        live.panic.cameraNote = "CAMERA BLOCKED — EYES UP";
        paintPanic();
      }
    });
  }

  function openPanic(opts) {
    requireDocument();
    injectStyles();
    closePanic();
    if (opts && opts.streakDay != null) state.streakDay = clampDay(opts.streakDay);
    var session = {
      id: "S" + Date.now().toString(36),
      openedAt: Date.now(),
      mode: "shatter",
      shatter: { taps: 0, startedAt: null, cleared: false, failed: false },
      pushups: 0,
      breathStartedAt: null,
      breathCycles: 0,
      quoteCursor: state.quoteIndex || 0,
      voice: true,
      stream: null,
      timer: null,
      cameraNote: "ARMING FRONT MIRROR"
    };
    live.panic = session;
    var overlay = document.createElement("div");
    overlay.id = "iaf-panic-root";
    overlay.className = "iaf-overlay";
    overlay.innerHTML = renderPanic(panicView(session, state, Date.now()));
    document.body.appendChild(overlay);
    var ac = typeof AbortController === "function" ? new AbortController() : null;
    live.panicAbort = ac;
    var listen = ac ? { signal: ac.signal } : false;
    overlay.addEventListener("click", onPanicClick, listen || false);
    overlay.addEventListener("pointerdown", onPanicPointer, listen || false);
    overlay.addEventListener("keydown", onPanicKey, listen || false);
    document.addEventListener("keydown", onEscape, listen || false);
    var video = overlay.querySelector("video");
    if (session.voice) speak(applyDay(QUOTES[session.quoteCursor % QUOTES.length], state.streakDay));
    startMirror(video, session.id);
    session.timer = setInterval(paintPanic, 200);
    return session.id;
  }

  function onEscape(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      standDown();
    }
  }

  function onPanicPointer(event) {
    if (!event.target.closest) return;
    if (!event.target.closest("[data-act=tap]")) return;
    event.preventDefault();
    onTap();
  }

  function onPanicKey(event) {
    var pad = event.target.closest && event.target.closest("[data-act=tap]");
    if (!pad) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTap();
    }
  }

  function onTap() {
    var session = live.panic;
    if (!session || session.shatter.cleared) return;
    session.shatter = reduceShatter(session.shatter, Date.now());
    try {
      if (root.navigator && root.navigator.vibrate) root.navigator.vibrate(session.shatter.cleared ? 28 : 10);
    } catch (err) {}
    paintPanic();
  }

  function onPanicClick(event) {
    var btn = event.target.closest ? event.target.closest("[data-act]") : null;
    if (!btn || !live.panic) return;
    var act = btn.getAttribute("data-act");
    if (act === "tap") return;
    if (act === "stand-down") standDown();
    else if (act === "dismiss") completeUrge();
    else if (act === "quote") nextQuote();
    else if (act === "voice") toggleVoice();
    else if (act === "mode") setPanicMode(btn.getAttribute("data-mode"));
    else if (act === "push") addReps(Number(btn.getAttribute("data-delta")));
    else if (act === "breath") startBreath();
    else if (act === "breath-restart") restartBreath();
  }

  function setPanicMode(mode) {
    if (!live.panic || (mode !== "shatter" && mode !== "body")) return;
    live.panic.mode = mode;
    var shatter = document.getElementById("iaf-panel-shatter");
    var body = document.getElementById("iaf-panel-body");
    if (shatter) shatter.classList.toggle("is-hidden", mode !== "shatter");
    if (body) body.classList.toggle("is-hidden", mode !== "body");
    var overlay = document.getElementById("iaf-panic-root");
    if (!overlay) return;
    Array.prototype.forEach.call(overlay.querySelectorAll("[data-act=mode]"), function (button) {
      button.classList.toggle("is-on", button.getAttribute("data-mode") === mode);
    });
  }

  function addReps(delta) {
    if (!live.panic) return;
    live.panic.pushups = addPushups(live.panic.pushups, delta);
    try {
      if (root.navigator && root.navigator.vibrate) root.navigator.vibrate(8);
    } catch (err) {}
    paintPanic();
  }

  function startBreath() {
    if (!live.panic || live.panic.breathStartedAt) return;
    live.panic.breathStartedAt = Date.now();
    paintPanic();
  }

  function restartBreath() {
    if (!live.panic) return;
    var frame = live.panic.breathStartedAt ? breathFrame(Date.now() - live.panic.breathStartedAt) : null;
    if (frame && frame.complete) return;
    live.panic.breathStartedAt = Date.now();
    live.panic.breathCycles = 0;
    paintPanic();
  }

  function nextQuote() {
    if (!live.panic) return;
    live.panic.quoteCursor = (live.panic.quoteCursor + 1) % QUOTES.length;
    state.quoteIndex = live.panic.quoteCursor;
    commit();
    paintPanic();
    if (live.panic.voice) speak(applyDay(QUOTES[live.panic.quoteCursor], state.streakDay));
  }

  function toggleVoice() {
    if (!live.panic) return;
    live.panic.voice = !live.panic.voice;
    if (!live.panic.voice) stopSpeech();
    else speak(applyDay(QUOTES[live.panic.quoteCursor % QUOTES.length], state.streakDay));
    paintPanic();
  }

  function standDown() {
    closePanic();
    live.notice = "Mirror off. No XP — the interrupt was not finished.";
    paintHub();
  }

  function completeUrge() {
    var session = live.panic;
    if (!session) return { ok: false, reason: "No live intervention." };
    var progress = sessionProgress(session, Date.now());
    if (!interruptCleared(progress)) return { ok: false, reason: "Interrupt not complete." };
    var award = awardUrgeClear(state, session.id, state.streakDay);
    if (!award.ok && award.reason !== "Already awarded.") return award;
    commit();
    if (award.gained) {
      emit("xp", { xp: state.willpowerXP, gained: award.gained, reason: "urge-destroyer" });
      emit("urge-defeated", { xp: state.willpowerXP, gained: award.gained, day: state.streakDay, sessionId: session.id });
      live.notice = "+" + URGE_XP + " Willpower XP. Urge destroyed on day " + state.streakDay + ".";
    }
    closePanic();
    paintHub();
    return award;
  }

  function ensureBriefing() {
    if (state.messages.length) return;
    var phase = phaseForDay(state.streakDay);
    state.messages.push({
      role: "marcus",
      text: briefing(state.streakDay),
      phase: phase.name,
      day: state.streakDay,
      at: new Date().toISOString()
    });
    commit();
  }

  function ask(text, promptId) {
    var prompt = null;
    var i;
    if (promptId) {
      for (i = 0; i < CRISIS_PROMPTS.length; i++) {
        if (CRISIS_PROMPTS[i].id === promptId) prompt = CRISIS_PROMPTS[i];
      }
    }
    var clean = String(text || "").trim().slice(0, 500);
    if (!clean && !prompt) return { ok: false, reason: "Say something or hit a crisis prompt." };
    var userText = clean || prompt.label;
    var reply = commanderReply(userText, state.streakDay, prompt ? prompt.id : null);
    var at = new Date().toISOString();
    state.messages.push({ role: "user", text: userText, at: at });
    state.messages.push({ role: "marcus", text: reply.text, phase: reply.phase, day: reply.day, at: at });
    if (state.messages.length > 40) state.messages.splice(0, state.messages.length - 40);
    live.draft = "";
    live.tab = "marcus";
    commit();
    paintHub();
    return { ok: true, reply: reply };
  }

  function copyText(text) {
    var clipboard = root.navigator && root.navigator.clipboard;
    if (clipboard && clipboard.writeText) {
      return clipboard.writeText(text).then(function () { return "copied"; }).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    if (typeof document === "undefined") return "manual";
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    area.remove();
    return ok ? "copied" : "manual";
  }

  function inviteFriend() {
    var payload = invitePayload(state);
    var nav = root.navigator;
    var sharePromise;
    if (nav && typeof nav.share === "function") {
      sharePromise = nav.share({ title: "IRON ARC", text: payload.message, url: payload.url }).then(function () {
        return "shared";
      });
    } else {
      sharePromise = copyText(payload.message);
    }
    return sharePromise.then(function (method) {
      return finishInvite(method, payload);
    }).catch(function (err) {
      if (err && err.name === "AbortError") {
        live.notice = "Invite canceled. Shield not armed.";
        paintHub();
        return { ok: false, reason: "canceled" };
      }
      return copyText(payload.message).then(function (method) {
        return finishInvite(method, payload);
      });
    });
  }

  function finishInvite(method, payload) {
    if (method !== "shared" && method !== "copied") {
      live.notice = "Send this link yourself: " + payload.url;
      paintHub();
      return { ok: false, reason: "copy-failed", url: payload.url };
    }
    var earned = earnShieldByInvite(state);
    commit();
    emit("shield", earned);
    live.notice = earned.armed
      ? "Invite sent. One Streak Shield is armed."
      : "Invite logged. Shield already armed — spend it before earning another.";
    live.tab = "vault";
    paintHub();
    return { ok: true, method: method, earned: earned };
  }

  function purchaseShield() {
    var result = buyShield(state);
    if (result.ok) {
      commit();
      emit("shield", result);
    }
    return result;
  }

  function lockCurrentPledge() {
    var field = live.hubEl && live.hubEl.querySelector("#iaf-payee");
    if (field) live.payee = field.value;
    var result = lockPledge(state, live.stake, live.payee);
    if (result.ok) {
      commit();
      emit("pledge", result);
      live.notice = "Oath locked. $" + result.amount + " to " + result.payee + " if you fold.";
    } else {
      live.notice = result.reason;
    }
    paintHub();
    return result;
  }

  function deployCurrentShield() {
    var result = deployShield(state, state.streakDay);
    if (result.ok) {
      commit();
      emit("shield-deployed", result);
      live.notice = "Streak Shield spent on day " + result.day + ". Counter holds.";
    } else {
      live.notice = result.reason;
    }
    paintHub();
    return result;
  }

  function confirmBreak() {
    var result = breakOath(state, state.streakDay, { resetStreak: true });
    if (!result.ok) {
      live.notice = result.reason;
      paintHub();
      return result;
    }
    commit();
    emit("oath-broken", result);
    live.confirmBreak = false;
    live.selectedDay = 3;
    live.notice = "Penalty paid. $" + result.amount + " ledgered to " + result.payee + ". XP wiped. Counter reset to Day 1.";
    paintHub();
    return result;
  }

  function eraseVault() {
    var box = storage();
    if (box) {
      try { box.removeItem(STORAGE_KEY); } catch (err) {}
    }
    var day = state.streakDay;
    state = createState({ streakDay: day });
    live.notice = "Vault erased on this device.";
    live.confirmErase = false;
    live.purchaseOpen = false;
    live.confirmBreak = false;
    ensureBriefing();
    paintHub();
    return { ok: true };
  }

  function onHubClick(event) {
    var btn = event.target.closest ? event.target.closest("[data-act]") : null;
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    if (act === "tab") {
      live.tab = btn.getAttribute("data-tab");
      live.notice = "";
      live.purchaseOpen = false;
      live.confirmBreak = false;
      live.confirmErase = false;
      paintHub();
    } else if (act === "panic") {
      openPanic();
    } else if (act === "day") {
      live.selectedDay = Number(btn.getAttribute("data-day"));
      live.tab = "grid";
      live.notice = "";
      paintHub();
    } else if (act === "prompt") {
      ask("", btn.getAttribute("data-id"));
    } else if (act === "stake") {
      live.stake = Number(btn.getAttribute("data-stake"));
      paintHub();
    } else if (act === "invite") {
      inviteFriend();
    } else if (act === "buy") {
      live.purchaseOpen = true;
      live.tab = "vault";
      paintHub();
    } else if (act === "buy-cancel") {
      live.purchaseOpen = false;
      paintHub();
    } else if (act === "buy-confirm") {
      var bought = purchaseShield();
      live.purchaseOpen = false;
      live.notice = bought.ok
        ? "Shield armed. Local receipt " + bought.receiptId + " · $2.99. No card charged."
        : bought.reason;
      paintHub();
    } else if (act === "deploy") {
      deployCurrentShield();
    } else if (act === "lock") {
      lockCurrentPledge();
    } else if (act === "break") {
      live.confirmBreak = true;
      paintHub();
    } else if (act === "break-cancel") {
      live.confirmBreak = false;
      paintHub();
    } else if (act === "break-confirm") {
      confirmBreak();
    } else if (act === "confessed") {
      state.confessionRequired = false;
      commit();
      live.notice = "Confession marked sent. The debt stays on the ledger.";
      paintHub();
    } else if (act === "erase") {
      live.confirmErase = true;
      paintHub();
    } else if (act === "erase-confirm") {
      eraseVault();
    }
  }

  function onHubSubmit(event) {
    if (!event.target || event.target.id !== "iaf-chat-form") return;
    event.preventDefault();
    var input = event.target.querySelector("#iaf-chat");
    ask(input ? input.value : "");
  }

  function onHubInput(event) {
    if (!event.target) return;
    if (event.target.id === "iaf-payee") live.payee = event.target.value;
    if (event.target.id === "iaf-chat") live.draft = event.target.value;
  }

  function mount(el, opts) {
    requireDocument();
    injectStyles();
    if (typeof el === "string") el = document.querySelector(el);
    if (!el) throw new Error("FeaturesModule.mount needs a container.");
    if (opts && opts.streakDay != null) state.streakDay = clampDay(opts.streakDay);
    if (opts && opts.tab) live.tab = opts.tab;
    live.selectedDay = defaultMilestone(state.streakDay);
    live.hubEl = el;
    ensureBriefing();
    paintHub();
    return api;
  }

  function unmount() {
    if (live.hubAbort) live.hubAbort.abort();
    live.hubAbort = null;
    if (live.hubEl) live.hubEl.innerHTML = "";
    live.hubEl = null;
    closePanic();
  }

  function sync(partial) {
    if (!partial || typeof partial !== "object") return getState();
    if (partial.streakDay != null) state.streakDay = clampDay(partial.streakDay);
    if (typeof partial.willpowerXP === "number" && partial.willpowerXP >= 0) {
      state.willpowerXP = Math.floor(partial.willpowerXP);
    }
    commit();
    if (!live.selectedDay) live.selectedDay = defaultMilestone(state.streakDay);
    paintHub();
    return getState();
  }

  function reset() {
    return eraseVault();
  }

  function selfTest() {
    var failed = [];
    function check(name, cond) {
      if (!cond) failed.push(name);
    }
    check("phase day 3", phaseForDay(3).id === "withdrawal");
    check("phase day 9", phaseForDay(9).id === "flatline");
    check("phase day 90", phaseForDay(90).id === "sovereign");
    check("phase day 200", phaseForDay(200).id === "maintain");
    check("rank day 14", rankForDay(14).name === "SPARTAN");
    check("default milestone early", defaultMilestone(1) === 3);
    check("default milestone 45", defaultMilestone(45) === 30);
    check("default milestone 100", defaultMilestone(100) === 90);

    var gridState = createState({ streakDay: 14, dayLog: { "4": { status: "urge-defeated" }, "6": { status: "freeze" } } });
    check("past day locked", dayStatus(5, gridState).key === "locked");
    check("gold overrides", dayStatus(4, gridState).key === "urge-defeated");
    check("freeze day", dayStatus(6, gridState).key === "freeze");
    check("today pulse", dayStatus(14, gridState).key === "today");
    check("upcoming", dayStatus(15, gridState).key === "upcoming");

    var shatter = { taps: 0, startedAt: null, cleared: false, failed: false };
    var t = 1000;
    var n;
    for (n = 0; n < 9; n++) {
      shatter = reduceShatter(shatter, t);
      t += 500;
    }
    check("nine taps hold", shatter.taps === 9 && !shatter.cleared);
    shatter = reduceShatter(shatter, t);
    check("tenth tap clears", shatter.cleared && shatter.taps === 10);
    var slow = reduceShatter({ taps: 0, startedAt: null, cleared: false, failed: false }, 0);
    slow = reduceShatter(slow, 8001);
    check("slow tap restarts", slow.failed && slow.taps === 1 && !slow.cleared);

    check("pushup cap", addPushups(18, 5) === 20);
    check("body incomplete", !interruptCleared({ shatter: { cleared: false }, pushups: 20, breathCycles: 2 }));
    check("body complete", interruptCleared({ shatter: { cleared: false }, pushups: 20, breathCycles: 3 }));
    check("shatter path skips body", interruptCleared({ shatter: { cleared: true }, pushups: 0, breathCycles: 0 }));

    check("breath inhale", breathFrame(0).phase === "INHALE");
    check("breath hold", breathFrame(4000).phase === "HOLD");
    check("breath exhale", breathFrame(11000).phase === "EXHALE");
    check("breath done", breathFrame(57000).complete && breathFrame(57000).cyclesDone === 3);
    var calm = arousalCurve(0, 0).index > arousalCurve(90000, 3).index;
    check("arousal falls", calm);

    var xpState = createState({ streakDay: 9 });
    var first = awardUrgeClear(xpState, "abc", 9);
    var second = awardUrgeClear(xpState, "abc", 9);
    check("xp grant", first.ok && first.gained === 50 && xpState.willpowerXP === 50);
    check("xp once", !second.ok && xpState.willpowerXP === 50);
    check("gold logged", xpState.dayLog["9"].status === "urge-defeated");

    var vault = createState({ streakDay: 12, willpowerXP: 80 });
    var invite = earnShieldByInvite(vault);
    var again = earnShieldByInvite(vault);
    check("invite arms", invite.armed && vault.shield.charges === 1 && vault.shield.invites === 2);
    check("no stack", again.armed === false);
    vault.dayLog["12"] = { status: "urge-defeated" };
    check("deploy blocked on gold", deployShield(vault, 12).ok === false);
    delete vault.dayLog["12"];
    check("deploy spends", deployShield(vault, 12).ok && vault.shield.charges === 0 && vault.dayLog["12"].status === "freeze");
    check("rearm after spend", earnShieldByInvite(vault).armed);
    check("buy blocked while armed", buyShield(vault).ok === false);
    vault.shield.charges = 0;
    var receipt = buyShield(vault);
    check("buy arms", receipt.ok && receipt.amount === 2.99 && vault.shield.receipts.length === 1);

    check("bad stake", lockPledge(vault, 7, "Jar").ok === false);
    check("lock pledge", lockPledge(vault, 25, "Winter Arc jar").ok);
    check("double lock", lockPledge(vault, 10, "Other").ok === false);
    var penalty = breakOath(vault, 12, { resetStreak: true });
    check("penalty", penalty.ok && penalty.xpLost === 80 && penalty.shieldBurned && vault.willpowerXP === 0);
    check("debt", vault.pledge.debt === 25 && vault.streakDay === 1 && vault.run === 2);
    check("log cleared", Object.keys(vault.dayLog).length === 0);

    check("intent bed", detectIntent("I'm alone in bed and scrolling") === "bed");
    check("intent flatline", detectIntent("brain fog and flatline") === "flatline");
    check("intent gym", detectIntent("How do I channel sexual energy into the gym?") === "transmute");
    check("intent reset", detectIntent("I almost relapsed") === "reset");
    var marcus = commanderReply("I feel flat", 9, "flatline");
    check("marcus day", marcus.text.indexOf("Day 9") !== -1 && marcus.phase === "FLATLINE WATCH");
    check("briefing day", briefing(14).indexOf("Day 14") !== -1 && briefing(14).indexOf("SPARTAN") !== -1);

    MILESTONE_DAYS.forEach(function (day) {
      var card = milestoneByDay(day);
      check("milestone " + day, card && card.brain && card.body && card.order && card.source);
    });
    var fakeStat = JSON.stringify(MILESTONES).indexOf("+38%") === -1;
    check("no fake receptor percent", fakeStat);
    check("day 7 source", milestoneByDay(7).source.indexOf("Jiang") !== -1);
    check("day 21 source", milestoneByDay(21).source.indexOf("66") !== -1);

    var view = {
      tab: "grid",
      selectedDay: 7,
      notice: "",
      purchaseOpen: false,
      confirmBreak: false,
      confirmErase: false,
      stake: 25,
      payee: "Winter Arc jar",
      draft: ""
    };
    var hubHtml = renderHub(gridState, view);
    var gridCount = (hubHtml.match(/data-grid="1"/g) || []).length;
    var roadCount = (hubHtml.match(/data-road="1"/g) || []).length;
    check("30 cells", gridCount === 30);
    check("7 road nodes", roadCount === 7);
    check("day 7 brief rendered", hubHtml.indexOf("short androgen window") !== -1);
    var marcusHtml = renderCommander(createState({ streakDay: 9, messages: [] }), "");
    check("four prompts", CRISIS_PROMPTS.every(function (prompt) {
      return marcusHtml.indexOf(prompt.label) !== -1;
    }));
    var panicHtml = renderPanic(panicView({
      openedAt: Date.now(),
      mode: "shatter",
      shatter: { taps: 0, startedAt: null, cleared: false, failed: false },
      pushups: 0,
      breathStartedAt: null,
      quoteCursor: 0,
      voice: true,
      cameraNote: "TEST"
    }, createState({ streakDay: 14 }), Date.now()));
    check("reticle", panicHtml.indexOf("iaf-reticle") !== -1);
    check("pacer label", panicHtml.indexOf("4-7-8") !== -1);
    check("dismiss gated", panicHtml.indexOf("disabled") !== -1);
    var oathState = createState({ streakDay: 4 });
    lockPledge(oathState, 25, "Winter Arc jar");
    var oathHtml = renderVault(oathState, {
      stake: 25,
      payee: "Winter Arc jar",
      purchaseOpen: false,
      confirmBreak: false,
      confirmErase: false
    });
    check("oath sentence", oathHtml.indexOf("zeros Willpower XP, ledgers $25") !== -1);

    return { ok: failed.length === 0, passed: failed.length === 0 ? "all" : "partial", failed: failed };
  }

  load();

  var api = {
    version: "2.0.0",
    data: {
      quotes: QUOTES,
      milestones: MILESTONES,
      crisisPrompts: CRISIS_PROMPTS,
      phases: PHASES,
      ranks: RANKS,
      milestoneDays: MILESTONE_DAYS,
      stakes: [10, 25, 50],
      shieldPrice: SHIELD_PRICE,
      urgeXp: URGE_XP,
      shatterTaps: SHATTER_TAPS,
      shatterWindowMs: SHATTER_WINDOW_MS,
      pushupsRequired: PUSHUPS_REQUIRED,
      breathCycles: BREATH_CYCLES,
      breathPattern: [
        { name: "INHALE", seconds: 4 },
        { name: "HOLD", seconds: 7 },
        { name: "EXHALE", seconds: 8 }
      ],
      urgeWindowMs: URGE_WINDOW_MS,
      statusLabels: STATUS_META
    },
    logic: logic,
    render: render,
    getState: getState,
    sync: sync,
    reset: reset,
    mount: mount,
    unmount: unmount,
    openPanic: openPanic,
    closePanic: closePanic,
    ask: ask,
    inviteFriend: inviteFriend,
    purchaseShield: purchaseShield,
    lockPledge: function (amount, payee) {
      var result = lockPledge(state, amount, payee);
      if (result.ok) commit();
      paintHub();
      return result;
    },
    deployShield: function () { return deployCurrentShield(); },
    breakOath: function () { return confirmBreak(); },
    on: on,
    speak: speak,
    injectStyles: injectStyles,
    selfTest: selfTest
  };

  root.FeaturesModule = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
