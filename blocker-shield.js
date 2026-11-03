/**
 * IRON ARC — Visual Porn URL Blocker.
 *
 * window.BlockerShield
 *   .mount(el, opts)                 paint + bind. opts.onXp(amount, state), opts.onChange(state)
 *   .unmount()
 *   .renderHTML(state)               self-contained panel markup
 *   .openBlockTestModal(domain)      iPhone Safari slam → stoic intercept
 *   .downloadMobileConfig()          Apple DNS-over-HTTPS profile (Cloudflare 1.1.1.3)
 *   .getState()
 *   .toggleMaster()
 *
 * Styles ship in one injected <style id="bs-shield-styles"> tag.
 * Audio and particles go through window.DopamineFX when it is present.
 * The .mobileconfig is an unsigned, removable DNS profile. It does not
 * install a VPN, a certificate, or an MDM lock.
 */
(function (root) {
  "use strict";

  if (root.BlockerShield && root.BlockerShield.__built) return;

  var STORAGE_KEY = "ironarc.blocker.v1";
  var STYLE_ID = "bs-shield-styles";
  var XP_REWARD = 25;
  var SLAM_MS = 420;
  var MAX_DOMAINS = 40;

  var DEFAULT_DOMAINS = [
    "pornhub.com",
    "xvideos.com",
    "onlyfans.com",
    "xnxx.com",
    "chaturbate.com"
  ];

  var FILTERS = [
    { id: "porn", icon: "🔞", title: "Porn & Tube Sites", badge: "42,000+ URLs", tone: "rose" },
    { id: "cams", icon: "🍑", title: "OnlyFans & Cam Sites", badge: "8,400+ URLs", tone: "amber" },
    { id: "nsfw", icon: "📱", title: "NSFW X / Reddit / TikTok", badge: "SafeSearch Lock", tone: "indigo" },
    { id: "strict", icon: "🕵️‍♂️", title: "Block Incognito & VPN Bypass", badge: "Strict Mode", tone: "slate" }
  ];

  var PORN_ROOTS = ["pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com", "youporn.com", "spankbang.com", "eporner.com"];
  var CAM_ROOTS = ["onlyfans.com", "chaturbate.com", "stripchat.com", "bongacams.com", "fansly.com", "myfreecams.com", "livejasmin.com", "camsoda.com"];
  var NSFW_ROOTS = ["reddit.com", "x.com", "twitter.com", "tiktok.com", "instagram.com"];

  var CSS = [
    ".bs-root,.bs-root *,.bs-modal,.bs-modal *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}",
    ".bs-root{position:relative;margin:0 0 12px;padding:14px 12px 12px;border-radius:22px;color:#f8fafc;",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;",
    "background:radial-gradient(120% 80% at 50% -10%,rgba(16,185,129,.22),transparent 55%),linear-gradient(180deg,#121a28,#0a0e16);",
    "border:1px solid rgba(52,211,153,.38);box-shadow:0 18px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05);",
    "user-select:none;-webkit-user-select:none}",
    ".bs-root.is-off{border-color:rgba(251,113,133,.5);",
    "background:radial-gradient(120% 70% at 50% -10%,rgba(225,29,72,.28),transparent 52%),linear-gradient(180deg,#241016,#0c0a0d)}",
    ".bs-count{position:absolute;top:12px;right:12px;z-index:2;padding:4px 8px;border-radius:999px;",
    "background:#34d399;color:#04130c;font-size:10px;font-weight:900;letter-spacing:.08em}",
    ".bs-power{appearance:none;width:100%;border:0;background:transparent;color:inherit;cursor:pointer;",
    "padding:2px 0 0;text-align:center;font:inherit}",
    ".bs-power:active .bs-halo{transform:scale(.97)}",
    ".bs-power:focus-visible{outline:2px solid #6ee7b7;outline-offset:3px;border-radius:18px}",
    ".bs-halo{position:relative;width:220px;height:228px;margin:0 auto;display:grid;place-items:center}",
    ".bs-power.is-on .bs-halo{filter:drop-shadow(0 0 16px rgba(16,185,129,.8))}",
    ".bs-power.is-off .bs-halo{filter:drop-shadow(0 0 14px rgba(225,29,72,.85))}",
    ".bs-power.is-arming .bs-halo{animation:bs-pop .42s cubic-bezier(.2,.8,.2,1)}",
    ".bs-ping{position:absolute;width:148px;height:148px;border-radius:50%;border:2px solid rgba(52,211,153,.75);opacity:0;pointer-events:none}",
    ".bs-power.is-on .bs-ping{animation:bs-ping 2.2s ease-out infinite}",
    ".bs-power.is-on .bs-ping.delay{animation-delay:1.1s}",
    ".bs-power.is-off .bs-ping{border-color:rgba(251,113,133,.9);animation:bs-ping 1.05s ease-out infinite}",
    ".bs-marksvg{width:200px;height:208px;display:block;overflow:visible}",
    ".bs-kicker{display:block;margin-top:2px;font-size:15px;font-weight:900;letter-spacing:.08em}",
    ".bs-power.is-on .bs-kicker{color:#d1fae5}",
    ".bs-power.is-off .bs-kicker{color:#fecdd3}",
    ".bs-stat{display:block;margin-top:2px;font-size:40px;line-height:.95;font-weight:900;letter-spacing:-.045em;color:#ecfdf5}",
    ".bs-power.is-on .bs-stat{background:linear-gradient(180deg,#fff,#6ee7b7);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}",
    ".bs-power.is-off .bs-stat{font-size:28px;letter-spacing:.14em;color:#fecdd3;-webkit-text-fill-color:#fecdd3}",
    ".bs-sub{display:block;margin-top:4px;font-size:11px;font-weight:800;letter-spacing:.16em;color:#6ee7b7}",
    ".bs-power.is-off .bs-sub{color:#fda4af}",
    ".bs-label{margin:14px 2px 8px;font-size:10px;font-weight:800;letter-spacing:.18em;color:#64748b}",
    ".bs-root.is-off .bs-rows{opacity:.72}",
    ".bs-rows{display:flex;flex-direction:column;gap:8px}",
    ".bs-row{width:100%;display:flex;align-items:center;gap:10px;text-align:left;padding:10px;border-radius:16px;",
    "border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);color:inherit;font:inherit;cursor:pointer}",
    ".bs-row:active{transform:scale(.985)}",
    ".bs-row:focus-visible{outline:2px solid #6ee7b7;outline-offset:2px}",
    ".bs-ico{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;flex:none;background:rgba(16,185,129,.12)}",
    ".bs-row[data-tone='rose'] .bs-ico{background:rgba(244,63,94,.16)}",
    ".bs-row[data-tone='amber'] .bs-ico{background:rgba(245,158,11,.16)}",
    ".bs-row[data-tone='indigo'] .bs-ico{background:rgba(99,102,241,.18)}",
    ".bs-row[data-tone='slate'] .bs-ico{background:rgba(148,163,184,.14)}",
    ".bs-copy{flex:1;min-width:0}",
    ".bs-title{display:block;font-size:13.5px;font-weight:800;line-height:1.2;letter-spacing:-.01em}",
    ".bs-badge{display:inline-flex;margin-top:5px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800;",
    "letter-spacing:.06em;text-transform:uppercase;color:#6ee7b7;background:rgba(16,185,129,.12);border:1px solid rgba(52,211,153,.35);white-space:nowrap}",
    ".bs-switch{width:51px;height:31px;border-radius:31px;background:#3a3a3c;position:relative;flex:none;transition:background .2s ease}",
    ".bs-switch i{position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;",
    "box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .22s cubic-bezier(.3,.9,.4,1.15)}",
    ".bs-row[aria-checked='true'] .bs-switch{background:#10b981;box-shadow:0 0 12px rgba(16,185,129,.45)}",
    ".bs-row[aria-checked='true'] .bs-switch i{transform:translateX(20px)}",
    ".bs-pills{display:flex;flex-wrap:wrap;gap:8px}",
    ".bs-pill{display:inline-flex;align-items:center;gap:4px;padding:4px 4px 4px 0;border-radius:999px;",
    "background:linear-gradient(180deg,rgba(225,29,72,.28),rgba(127,29,29,.45));border:1px solid rgba(251,113,133,.6);",
    "box-shadow:0 0 16px rgba(225,29,72,.2)}",
    ".bs-pill-hit,.bs-pill-x{border:0;background:transparent;color:#ffe4e6;font:inherit;font-weight:800;cursor:pointer}",
    ".bs-pill-hit{padding:8px 4px 8px 12px;font-size:12.5px}",
    ".bs-pill-x{width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.35);font-size:16px;line-height:1}",
    ".bs-pill-hit:focus-visible,.bs-pill-x:focus-visible{outline:2px solid #fecdd3;outline-offset:1px}",
    ".bs-add{display:flex;gap:8px;margin-top:10px}",
    ".bs-input{flex:1;min-width:0;background:#070b12;color:#f8fafc;border:1px solid rgba(255,255,255,.12);border-radius:14px;",
    "padding:12px;font-size:16px;font-weight:700;font-family:inherit;user-select:text;-webkit-user-select:text}",
    ".bs-input::placeholder{color:#64748b;font-weight:600}",
    ".bs-input:focus{outline:none;border-color:#34d399;box-shadow:0 0 0 3px rgba(16,185,129,.2)}",
    ".bs-input.is-bad{border-color:#fb7185;box-shadow:0 0 0 3px rgba(225,29,72,.25)}",
    ".bs-blockbtn{border:0;border-radius:14px;padding:0 14px;font:inherit;font-weight:900;font-size:14px;color:#fff;",
    "background:linear-gradient(180deg,#fb7185,#e11d48);box-shadow:0 0 16px rgba(225,29,72,.4);cursor:pointer}",
    ".bs-note,.bs-status{min-height:16px;margin:8px 2px 0;text-align:center;font-size:11px;font-weight:800;letter-spacing:.08em}",
    ".bs-note{color:#fda4af}",
    ".bs-status{color:#6ee7b7}",
    ".bs-test,.bs-install,.bs-safety,.bs-arm,.bs-dismiss{width:100%;border-radius:16px;font:inherit;font-weight:900;cursor:pointer}",
    ".bs-test{margin-top:12px;padding:14px 12px;border:1px solid rgba(52,211,153,.5);background:rgba(16,185,129,.12);",
    "color:#d1fae5;font-size:14px;letter-spacing:.01em}",
    ".bs-test:active,.bs-install:active{transform:scale(.985)}",
    ".bs-install{margin-top:8px;padding:14px;border:0;display:flex;align-items:center;justify-content:space-between;gap:8px;",
    "background:linear-gradient(180deg,#1c2433,#0c1018);color:#f8fafc;font-size:14px;text-align:left;",
    "box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.28)}",
    ".bs-install span{line-height:1.25}",
    ".bs-install em{flex:none;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.08em;color:#04130c;",
    "background:#34d399;border-radius:999px;padding:5px 7px}",
    ".bs-modal{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;padding:12px;",
    "background:rgba(2,6,12,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif}",
    ".bs-device{width:min(390px,100%);height:min(780px,calc(100vh - 24px));background:#0a0a0c;border-radius:44px;padding:12px;",
    "box-shadow:0 0 0 2px #2a2a2e,0 30px 80px rgba(0,0,0,.55);display:flex;position:relative}",
    ".bs-modal.is-slammed .bs-device{animation:bs-shake .42s linear}",
    ".bs-screen{position:relative;flex:1;border-radius:32px;overflow:hidden;background:#fff;min-height:0;display:flex}",
    ".bs-safari{flex:1;min-height:0;display:flex;flex-direction:column;background:#fff;color:#111}",
    ".bs-status{position:relative;height:54px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 18px 8px;font-weight:700;font-size:15px}",
    ".bs-island{position:absolute;top:10px;left:50%;width:96px;height:28px;transform:translateX(-50%);background:#0a0a0c;border-radius:20px}",
    ".bs-sys{display:flex;align-items:center;gap:5px}",
    ".bs-sys svg{width:16px;height:12px;display:block}",
    ".bs-bat{width:25px;height:12px;border:1.5px solid #111;border-radius:3px;padding:1px;position:relative}",
    ".bs-bat:after{content:'';position:absolute;right:-3px;top:3px;width:2px;height:4px;background:#111;border-radius:0 1px 1px 0}",
    ".bs-bat i{display:block;height:100%;width:78%;background:#111;border-radius:1px}",
    ".bs-addr{display:flex;align-items:center;gap:8px;padding:0 10px 8px}",
    ".bs-aa,.bs-reload{width:32px;height:32px;display:grid;place-items:center;font-weight:800;font-size:13px;color:#111}",
    ".bs-url{flex:1;height:36px;border-radius:12px;background:#e9e9ed;display:flex;align-items:center;justify-content:center;gap:6px;",
    "font-size:15px;font-weight:700;color:#111}",
    ".bs-url svg{width:12px;height:14px;display:block}",
    ".bs-progress{height:2px;background:transparent}",
    ".bs-progress i{display:block;height:100%;width:0;background:#0a84ff;animation:bs-load .4s ease-out forwards}",
    ".bs-page{flex:1;min-height:0;padding:18px 16px;background:#fff}",
    ".bs-skel i,.bs-skel b{display:block;border-radius:8px;background:linear-gradient(90deg,#ececf1,#f8f8fb,#ececf1);background-size:200% 100%;animation:bs-shimmer 1s linear infinite}",
    ".bs-skel i{height:14px;margin-bottom:10px}",
    ".bs-skel i:nth-child(1){width:72%}",
    ".bs-skel i:nth-child(2){width:48%}",
    ".bs-skel i:nth-child(3){width:86%}",
    ".bs-skel b{height:92px;margin-top:14px;border-radius:14px}",
    ".bs-skel b+b{height:64px}",
    ".bs-tabbar{height:58px;border-top:1px solid #d8d8de;display:flex;align-items:center;justify-content:space-around;color:#8e8e93;padding:0 8px 6px}",
    ".bs-tabbar svg{width:22px;height:22px;display:block}",
    ".bs-tabbar .is-dim{opacity:.35}",
    ".bs-gate{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;gap:8px;",
    "padding:22px 16px 28px;overflow:auto;color:#f8fafc;text-align:center;transform:translateY(-102%);pointer-events:none;",
    "background:radial-gradient(90% 48% at 50% 12%,rgba(16,185,129,.42),transparent 62%),linear-gradient(180deg,#122033,#07090d 46%,#05060a)}",
    ".bs-gate.is-danger{background:radial-gradient(90% 48% at 50% 8%,rgba(225,29,72,.5),transparent 60%),linear-gradient(180deg,#3a1020,#14080d 52%,#070507)}",
    ".bs-modal.is-slammed .bs-gate{transform:translateY(0);pointer-events:auto;transition:transform .32s cubic-bezier(.12,.85,.2,1)}",
    ".bs-gate .bs-marksvg{width:148px;height:154px;margin:0 auto}",
    ".bs-brand{margin:0;font-size:11px;font-weight:900;letter-spacing:.28em;color:#6ee7b7}",
    ".bs-gate.is-danger .bs-brand{color:#fda4af}",
    ".bs-block-title{margin:0;font-size:22px;line-height:1.05;font-weight:900;letter-spacing:-.03em}",
    ".bs-stop{display:block;font-size:40px;line-height:1;margin-bottom:4px}",
    ".bs-urlchip{margin:0;font-size:12px;font-weight:800;color:#fda4af}",
    ".bs-urlchip s{text-decoration-thickness:2px}",
    ".bs-quote{margin:2px 0 0;padding:10px 12px;border-radius:0 14px 14px 0;border-left:3px solid #fbbf24;",
    "background:rgba(251,191,36,.1);color:#fef3c7;font-size:14px;font-weight:700;font-style:italic;line-height:1.35;text-align:left}",
    ".bs-attempt{margin:2px auto 0;display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;",
    "background:rgba(16,185,129,.14);border:1px solid rgba(52,211,153,.5);color:#6ee7b7;font-size:13px;font-weight:900;letter-spacing:.03em}",
    ".bs-modal.is-slammed .bs-attempt{animation:bs-pop .45s cubic-bezier(.2,.8,.2,1)}",
    ".bs-live{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;animation:bs-blink 1s ease-in-out infinite}",
    ".bs-safety{margin-top:8px;padding:16px 12px;border:0;color:#04130c;font-size:15px;line-height:1.2;",
    "background:linear-gradient(180deg,#6ee7b7,#10b981 46%,#047857);box-shadow:0 0 28px rgba(16,185,129,.55)}",
    ".bs-safety:active{transform:scale(.985)}",
    ".bs-arm{margin-top:8px;padding:16px 12px;border:0;color:#fff;font-size:16px;",
    "background:linear-gradient(180deg,#fb7185,#e11d48);box-shadow:0 0 24px rgba(225,29,72,.5)}",
    ".bs-dismiss{margin-top:8px;padding:14px;border:1px solid rgba(255,255,255,.16);background:transparent;color:#e2e8f0;font-size:14px}",
    ".bs-flash{position:absolute;inset:0;z-index:4;background:#fff;opacity:0;pointer-events:none}",
    ".bs-modal.is-slammed .bs-flash{animation:bs-flash .42s ease-out}",
    ".bs-homebar{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:118px;height:4px;border-radius:4px;background:#111;z-index:6;pointer-events:none}",
    ".bs-modal.is-slammed .bs-homebar{background:rgba(255,255,255,.72)}",
    "@keyframes bs-ping{0%{transform:scale(.7);opacity:.8}100%{transform:scale(1.32);opacity:0}}",
    "@keyframes bs-pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}",
    "@keyframes bs-warn{0%,100%{filter:drop-shadow(0 0 4px rgba(225,29,72,.35))}50%{filter:drop-shadow(0 0 16px rgba(225,29,72,.95))}}",
    "@keyframes bs-load{0%{width:10%}100%{width:100%}}",
    "@keyframes bs-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}",
    "@keyframes bs-flash{0%{opacity:.92}100%{opacity:0}}",
    "@keyframes bs-blink{0%,100%{opacity:1}50%{opacity:.25}}",
    "@keyframes bs-shake{0%,100%{transform:translate3d(0,0,0)}18%{transform:translate3d(-7px,2px,0)}36%{transform:translate3d(7px,-2px,0)}54%{transform:translate3d(-4px,1px,0)}72%{transform:translate3d(3px,-1px,0)}}",
    "@media (max-height:740px){.bs-gate .bs-marksvg{width:108px;height:112px}.bs-block-title{font-size:18px}.bs-stop{font-size:32px}.bs-quote{font-size:13px;padding:8px 10px}}",
    "@media (prefers-reduced-motion:reduce){.bs-root *,.bs-modal *{animation:none !important}.bs-modal.is-slammed .bs-gate{transition:none}}"
  ].join("");

  var model = null;
  var host = null;
  var hook = {};
  var paintSeq = 0;
  var armPulse = false;
  var modalEl = null;
  var modalTimer = 0;
  var modalGen = 0;
  var modalDomain = "pornhub.com";
  var scrollLocked = false;
  var scrollPrev = "";
  var keyBound = false;

  function defaultState() {
    return {
      master: true,
      filters: { porn: true, cams: true, nsfw: true, strict: true },
      domains: DEFAULT_DOMAINS.slice(),
      attempts: 0,
      xpBanked: 0
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function xmlEscape(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function reducedMotion() {
    try {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) {
      return false;
    }
  }

  function uuid() {
    var cryptoObj = root.crypto;
    if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
      return cryptoObj.randomUUID().toUpperCase();
    }
    var bytes = [];
    var i;
    if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
      var buf = new Uint8Array(16);
      cryptoObj.getRandomValues(buf);
      for (i = 0; i < 16; i++) bytes.push(buf[i]);
    } else {
      for (i = 0; i < 16; i++) bytes.push(Math.floor(Math.random() * 256));
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (i = 0; i < 16; i++) hex.push((bytes[i] < 16 ? "0" : "") + bytes[i].toString(16));
    return (
      hex.slice(0, 4).join("") + "-" +
      hex.slice(4, 6).join("") + "-" +
      hex.slice(6, 8).join("") + "-" +
      hex.slice(8, 10).join("") + "-" +
      hex.slice(10, 16).join("")
    ).toUpperCase();
  }

  function normalizeDomain(raw) {
    var s = String(raw || "").trim().toLowerCase();
    if (!s) return "";
    s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
    s = s.replace(/^\/\//, "");
    s = s.split("/")[0].split("?")[0].split("#")[0];
    s = s.split("@").pop();
    s = s.replace(/:\d+$/, "");
    if (s.indexOf("www.") === 0) s = s.slice(4);
    s = s.replace(/\.$/, "");
    if (!s || s.length > 253) return "";
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(s)) return "";
    return s;
  }

  function hostMatches(hostName, rootName) {
    if (hostName === rootName) return true;
    var suffix = "." + rootName;
    return hostName.length > suffix.length && hostName.slice(-suffix.length) === suffix;
  }

  function matchesList(hostName, roots) {
    var i;
    for (i = 0; i < roots.length; i++) {
      if (hostMatches(hostName, roots[i])) return true;
    }
    return false;
  }

  function listed(state, hostName) {
    var i;
    var domains = state.domains || [];
    for (i = 0; i < domains.length; i++) {
      if (hostMatches(hostName, domains[i])) return true;
    }
    return false;
  }

  function shouldBlock(state, hostName) {
    if (!state || !state.master || !hostName) return false;
    if (listed(state, hostName)) return true;
    if (state.filters.porn && matchesList(hostName, PORN_ROOTS)) return true;
    if (state.filters.cams && matchesList(hostName, CAM_ROOTS)) return true;
    if (state.filters.nsfw && matchesList(hostName, NSFW_ROOTS)) return true;
    return false;
  }

  function storageGet() {
    try {
      if (!root.localStorage) return null;
      return root.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function persist() {
    try {
      if (!root.localStorage) return;
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        master: model.master,
        filters: model.filters,
        domains: model.domains,
        attempts: model.attempts,
        xpBanked: model.xpBanked
      }));
    } catch (err) { /* private mode / quota */ }
  }

  function load() {
    model = defaultState();
    var raw = storageGet();
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (typeof parsed.master === "boolean") model.master = parsed.master;
      var filters = parsed.filters || {};
      var keys = ["porn", "cams", "nsfw", "strict"];
      var i;
      for (i = 0; i < keys.length; i++) {
        if (typeof filters[keys[i]] === "boolean") model.filters[keys[i]] = filters[keys[i]];
      }
      if (Array.isArray(parsed.domains)) {
        var cleaned = [];
        for (i = 0; i < parsed.domains.length; i++) {
          var domain = normalizeDomain(parsed.domains[i]);
          if (domain && cleaned.indexOf(domain) === -1) cleaned.push(domain);
        }
        model.domains = cleaned.slice(0, MAX_DOMAINS);
      }
      var attempts = Number(parsed.attempts);
      if (Number.isFinite(attempts) && attempts >= 0) model.attempts = Math.floor(attempts);
      var xp = Number(parsed.xpBanked);
      if (Number.isFinite(xp) && xp >= 0) model.xpBanked = Math.floor(xp);
    } catch (err) { /* keep defaults */ }
  }

  function cloneState(state) {
    return {
      master: !!state.master,
      filters: {
        porn: !!state.filters.porn,
        cams: !!state.filters.cams,
        nsfw: !!state.filters.nsfw,
        strict: !!state.filters.strict
      },
      domains: (state.domains || []).slice(),
      attempts: state.attempts || 0,
      xpBanked: state.xpBanked || 0
    };
  }

  function getState() {
    return cloneState(model);
  }

  function viewFrom(input) {
    if (!input) return model;
    var base = defaultState();
    if (typeof input.master === "boolean") base.master = input.master;
    if (input.filters) {
      var keys = ["porn", "cams", "nsfw", "strict"];
      var i;
      for (i = 0; i < keys.length; i++) {
        if (typeof input.filters[keys[i]] === "boolean") base.filters[keys[i]] = input.filters[keys[i]];
      }
    }
    if (Array.isArray(input.domains)) {
      base.domains = [];
      for (var d = 0; d < input.domains.length && base.domains.length < MAX_DOMAINS; d++) {
        var domain = normalizeDomain(input.domains[d]);
        if (domain && base.domains.indexOf(domain) === -1) base.domains.push(domain);
      }
    }
    var attempts = Number(input.attempts);
    if (Number.isFinite(attempts) && attempts >= 0) base.attempts = Math.floor(attempts);
    var xp = Number(input.xpBanked);
    if (Number.isFinite(xp) && xp >= 0) base.xpBanked = Math.floor(xp);
    return base;
  }

  function heroCopy(state) {
    if (!state.master) {
      return { on: false, kicker: "⚠️ SHIELD OFF", stat: "UNPROTECTED", sub: "" };
    }
    if (state.filters.porn) {
      return { on: true, kicker: "🛡️ SHIELD ON", stat: "42,850+", sub: "PORN SITES BLOCKED" };
    }
    if (state.filters.cams) {
      return { on: true, kicker: "🛡️ SHIELD ON", stat: "8,400+", sub: "CAM SITES BLOCKED" };
    }
    if (state.filters.nsfw) {
      return { on: true, kicker: "🛡️ SHIELD ON", stat: "LOCKED", sub: "SAFESEARCH ON" };
    }
    if (state.filters.strict) {
      return { on: true, kicker: "🛡️ SHIELD ON", stat: "STRICT", sub: "DNS LOCK ON" };
    }
    return { on: true, kicker: "🛡️ SHIELD ON", stat: "IDLE", sub: "NO FILTERS ARMED" };
  }

  function fxCall(name, arg) {
    var fx = root.DopamineFX;
    if (!fx || typeof fx[name] !== "function") return;
    try { fx[name](arg); } catch (err) { /* audio optional */ }
  }

  function fxUnlock() {
    fxCall("unlock");
  }

  function fxTick(freq, dur) {
    var fx = root.DopamineFX;
    if (!fx || typeof fx.playTick !== "function") return;
    try { fx.playTick(freq, dur); } catch (err) { /* ignore */ }
  }

  function fxArm(anchor) {
    fxUnlock();
    fxCall("playOathSealed");
    var fx = root.DopamineFX;
    if (fx && typeof fx.burstParticles === "function") {
      try { fx.burstParticles({ anchor: anchor || null, mode: "seal", zIndex: 4000 }); } catch (err) { /* ignore */ }
    }
  }

  function fxRank(anchor) {
    fxUnlock();
    fxCall("playRankUp");
    var fx = root.DopamineFX;
    if (fx && typeof fx.burstParticles === "function") {
      try { fx.burstParticles({ anchor: anchor || null, mode: "rank", zIndex: 22000 }); } catch (err) { /* ignore */ }
    }
  }

  function emitChange() {
    if (hook && typeof hook.onChange === "function") {
      try { hook.onChange(getState()); } catch (err) { /* host listener */ }
    }
  }

  function shieldMark(uid, on) {
    var edge = on ? "#6ee7b7" : "#fda4af";
    var hi = on ? "#ecfdf5" : "#ffe4e6";
    var mid = on ? "#34d399" : "#fb7185";
    var low = on ? "#064e3b" : "#881337";
    var plume = on ? "#fbbf24" : "#fb7185";
    var eye = on ? "#022c22" : "#1c0a10";
    var glow = on ? "#6ee7b7" : "#fecdd3";
    var cheek = on ? "#047857" : "#9f1239";
    var cx = 120;
    var cy = 118;
    var motion = on && !reducedMotion();
    var pulse = motion
      ? "<circle cx='" + cx + "' cy='" + cy + "' r='64' fill='none' stroke='" + mid + "' stroke-width='2' opacity='0'>" +
        "<animate attributeName='r' values='60;108' dur='2.3s' repeatCount='indefinite'/>" +
        "<animate attributeName='opacity' values='.7;0' dur='2.3s' repeatCount='indefinite'/>" +
        "</circle>" +
        "<circle cx='" + cx + "' cy='" + cy + "' r='64' fill='none' stroke='" + mid + "' stroke-width='2' opacity='0'>" +
        "<animate attributeName='r' values='60;108' dur='2.3s' begin='1.15s' repeatCount='indefinite'/>" +
        "<animate attributeName='opacity' values='.55;0' dur='2.3s' begin='1.15s' repeatCount='indefinite'/>" +
        "</circle>"
      : "";
    var spin = motion
      ? "<animateTransform attributeName='transform' type='rotate' from='0 " + cx + " " + cy + "' to='360 " + cx + " " + cy + "' dur='2.8s' repeatCount='indefinite'/>"
      : "";
    var ringSpin = motion
      ? "<animateTransform attributeName='transform' type='rotate' from='360 " + cx + " " + cy + "' to='0 " + cx + " " + cy + "' dur='16s' repeatCount='indefinite'/>"
      : "";
    var warn = !on && !reducedMotion()
      ? "<animate attributeName='opacity' values='1;.4;1' dur='1.05s' repeatCount='indefinite'/>"
      : "";

    return "<svg class='bs-marksvg' viewBox='0 0 240 250' aria-hidden='true'>" +
      "<defs>" +
      "<linearGradient id='" + uid + "-shield' x1='0' y1='0' x2='0' y2='1'>" +
      "<stop offset='0' stop-color='" + hi + "'/>" +
      "<stop offset='.42' stop-color='" + mid + "'/>" +
      "<stop offset='1' stop-color='" + low + "'/>" +
      "</linearGradient>" +
      "<linearGradient id='" + uid + "-metal' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + hi + "'/>" +
      "<stop offset='.55' stop-color='" + mid + "'/>" +
      "<stop offset='1' stop-color='" + low + "'/>" +
      "</linearGradient>" +
      "<filter id='" + uid + "-glow' x='-30%' y='-30%' width='160%' height='160%'>" +
      "<feGaussianBlur stdDeviation='2.4' result='b'/>" +
      "<feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge>" +
      "</filter>" +
      "</defs>" +
      pulse +
      "<circle cx='" + cx + "' cy='" + cy + "' r='104' fill='none' stroke='" + mid + "' stroke-width='1.2' stroke-dasharray='3 7' opacity='.7'>" + ringSpin + "</circle>" +
      "<g>" + spin +
      "<path d='M" + cx + " " + cy + " L" + cx + " 16 A102 102 0 0 1 208 78 Z' fill='" + mid + "' opacity='.2'/>" +
      "</g>" +
      "<g filter='url(#" + uid + "-glow)'>" +
      "<path d='M120 16 L192 50 V124 C192 176 160 210 120 230 C80 210 48 176 48 124 V50 Z' fill='url(#" + uid + "-shield)' stroke='" + edge + "' stroke-width='3' stroke-linejoin='round'>" + warn + "</path>" +
      "</g>" +
      "<path d='M120 32 L176 58 V122 C176 164 152 192 120 210 C88 192 64 164 64 122 V58 Z' fill='none' stroke='rgba(255,255,255,.42)' stroke-width='1.4'/>" +
      "<path d='M120 84 C112 62 106 42 120 26 C134 42 128 62 120 84 Z' fill='" + plume + "'/>" +
      "<path fill-rule='evenodd' d='M88 114 C88 80 152 80 152 114 L158 140 C160 162 146 176 120 178 C94 176 80 162 82 140 Z M102 116 H138 V126 H126 L120 150 L114 126 H102 Z' fill='url(#" + uid + "-metal)' stroke='" + edge + "' stroke-width='1.7' stroke-linejoin='round'/>" +
      "<path d='M86 132 C70 146 74 166 98 160 L102 142 Z' fill='" + cheek + "' stroke='" + edge + "' stroke-width='1.2' stroke-linejoin='round'/>" +
      "<path d='M154 132 C170 146 166 166 142 160 L138 142 Z' fill='" + cheek + "' stroke='" + edge + "' stroke-width='1.2' stroke-linejoin='round'/>" +
      "<path d='M106 119 H116' stroke='" + glow + "' stroke-width='2.2' stroke-linecap='round'/>" +
      "<path d='M124 119 H134' stroke='" + glow + "' stroke-width='2.2' stroke-linecap='round'/>" +
      "</svg>";
  }

  function ensureStyles() {
    var doc = root.document;
    if (!doc || typeof doc.getElementById !== "function" || typeof doc.createElement !== "function") return;
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    var parent = doc.head || doc.documentElement;
    if (parent) parent.appendChild(style);
  }

  function filtersHTML(state) {
    var html = "";
    var i;
    for (i = 0; i < FILTERS.length; i++) {
      var item = FILTERS[i];
      var on = !!state.filters[item.id];
      html += "<button type='button' class='bs-row' role='switch' data-act='filter' data-filter='" + item.id + "' data-tone='" + item.tone + "' aria-checked='" + (on ? "true" : "false") + "' aria-label='" + escapeHtml(item.title + ". " + item.badge) + "'>" +
        "<span class='bs-ico' aria-hidden='true'>" + item.icon + "</span>" +
        "<span class='bs-copy'><span class='bs-title'>" + escapeHtml(item.title) + "</span>" +
        "<span class='bs-badge'>" + escapeHtml(item.badge) + "</span></span>" +
        "<span class='bs-switch' aria-hidden='true'><i></i></span></button>";
    }
    return html;
  }

  function pillsHTML(domains) {
    var html = "";
    var i;
    for (i = 0; i < domains.length; i++) {
      var safe = escapeHtml(domains[i]);
      html += "<span class='bs-pill'>" +
        "<button type='button' class='bs-pill-hit' data-act='pill' data-domain='" + safe + "'>" + safe + " 🚫</button>" +
        "<button type='button' class='bs-pill-x' data-act='remove' data-domain='" + safe + "' aria-label='Remove " + safe + "'>×</button>" +
        "</span>";
    }
    return html;
  }

  function renderHTML(state) {
    ensureStyles();
    var view = state ? viewFrom(state) : model;
    paintSeq += 1;
    var uid = "bs" + paintSeq;
    var copy = heroCopy(view);
    var aria = copy.kicker + " " + copy.stat + (copy.sub ? " " + copy.sub : "");
    return "<section class='bs-root" + (view.master ? "" : " is-off") + "'>" +
      (view.attempts > 0 ? "<span class='bs-count'>" + view.attempts + " BLOCKED</span>" : "") +
      "<button type='button' class='bs-power " + (copy.on ? "is-on" : "is-off") + "' data-act='master' aria-pressed='" + (view.master ? "true" : "false") + "' aria-label='" + escapeHtml(aria) + "'>" +
      "<span class='bs-halo'><i class='bs-ping'></i><i class='bs-ping delay'></i>" + shieldMark(uid, copy.on) + "</span>" +
      "<span class='bs-kicker'>" + copy.kicker + "</span>" +
      "<span class='bs-stat'>" + escapeHtml(copy.stat) + "</span>" +
      (copy.sub ? "<span class='bs-sub'>" + escapeHtml(copy.sub) + "</span>" : "") +
      "</button>" +
      "<p class='bs-label'>FILTERS</p>" +
      "<div class='bs-rows'>" + filtersHTML(view) + "</div>" +
      "<p class='bs-label'>BLOCK LIST</p>" +
      "<div class='bs-pills'>" + pillsHTML(view.domains) + "</div>" +
      "<form class='bs-add'>" +
      "<input class='bs-input' type='text' inputmode='url' enterkeyhint='done' autocapitalize='off' autocorrect='off' spellcheck='false' autocomplete='off' maxlength='80' placeholder='Add domain' aria-label='Add domain'>" +
      "<button class='bs-blockbtn' type='submit'>🚫 Block</button>" +
      "</form>" +
      "<p class='bs-note' data-note></p>" +
      "<button type='button' class='bs-test' data-act='test' data-domain='pornhub.com'>🧪 Test Block in iPhone Safari</button>" +
      "<button type='button' class='bs-install' data-act='install'><span>📲 Install Real iPhone Blocker</span><em>1.1.1.3</em></button>" +
      "<p class='bs-status' data-status></p>" +
      "</section>";
  }

  function paint() {
    if (!host) return;
    var pulse = armPulse;
    armPulse = false;
    host.innerHTML = renderHTML();
    if (pulse) {
      var btn = host.querySelector(".bs-power");
      if (btn) btn.classList.add("is-arming");
    }
  }

  function setNote(text, badValue) {
    if (!host) return;
    var note = host.querySelector("[data-note]");
    if (note) note.textContent = text || "";
    if (badValue) {
      var input = host.querySelector(".bs-input");
      if (input) {
        input.value = badValue;
        input.classList.add("is-bad");
        try { input.focus(); } catch (err) { /* ignore */ }
      }
    }
  }

  function setStatus(text) {
    if (!host) return;
    var el = host.querySelector("[data-status]");
    if (el) el.textContent = text || "";
  }

  function toggleMaster() {
    fxUnlock();
    model.master = !model.master;
    if (model.master) armPulse = true;
    persist();
    paint();
    if (model.master) fxArm(host && host.querySelector(".bs-power"));
    else fxTick(220, 0.04);
    emitChange();
    return getState();
  }

  function toggleFilter(id) {
    if (!model.filters || typeof model.filters[id] === "undefined") return getState();
    fxUnlock();
    model.filters[id] = !model.filters[id];
    persist();
    fxTick(model.filters[id] ? 720 : 340, 0.03);
    paint();
    emitChange();
    return getState();
  }

  function addDomain(raw) {
    var domain = normalizeDomain(raw);
    if (!domain) {
      paint();
      setNote("Use a domain", raw);
      return getState();
    }
    if (model.domains.indexOf(domain) !== -1) {
      paint();
      setNote("Already blocked", raw);
      return getState();
    }
    if (model.domains.length >= MAX_DOMAINS) {
      paint();
      setNote("List full", raw);
      return getState();
    }
    model.domains.push(domain);
    persist();
    fxTick(760, 0.035);
    paint();
    emitChange();
    return getState();
  }

  function removeDomain(raw) {
    var domain = normalizeDomain(raw) || String(raw || "").toLowerCase();
    var next = [];
    var i;
    for (i = 0; i < model.domains.length; i++) {
      if (model.domains[i] !== domain) next.push(model.domains[i]);
    }
    if (next.length === model.domains.length) return getState();
    model.domains = next;
    persist();
    fxTick(300, 0.03);
    paint();
    emitChange();
    return getState();
  }

  function onHostClick(event) {
    var target = event.target && event.target.closest ? event.target.closest("[data-act]") : null;
    if (!target || !host || !host.contains(target)) return;
    var act = target.getAttribute("data-act");
    if (act === "master") toggleMaster();
    else if (act === "filter") toggleFilter(target.getAttribute("data-filter"));
    else if (act === "pill" || act === "test") openBlockTestModal(target.getAttribute("data-domain") || "pornhub.com");
    else if (act === "remove") removeDomain(target.getAttribute("data-domain"));
    else if (act === "install") downloadMobileConfig();
  }

  function onHostSubmit(event) {
    var form = event.target;
    if (!form || !form.classList || !form.classList.contains("bs-add")) return;
    event.preventDefault();
    var input = form.querySelector(".bs-input");
    addDomain(input ? input.value : "");
  }

  function resolveEl(el) {
    if (!el || !root.document) return null;
    if (typeof el === "string") return root.document.querySelector(el);
    if (el.nodeType === 1) return el;
    return null;
  }

  function mount(el, opts) {
    ensureStyles();
    var node = resolveEl(el);
    if (!node) return api;
    if (opts && typeof opts === "object") hook = opts;
    if (host !== node) {
      if (host) {
        host.removeEventListener("click", onHostClick);
        host.removeEventListener("submit", onHostSubmit);
      }
      node.addEventListener("click", onHostClick);
      node.addEventListener("submit", onHostSubmit);
    }
    host = node;
    paint();
    return api;
  }

  function unmount() {
    dismissModal();
    if (host) {
      host.removeEventListener("click", onHostClick);
      host.removeEventListener("submit", onHostSubmit);
      host.innerHTML = "";
      host = null;
    }
    return api;
  }

  function lockScroll() {
    var body = root.document && root.document.body;
    if (!body || scrollLocked) return;
    scrollPrev = body.style.overflow || "";
    scrollLocked = true;
    body.style.overflow = "hidden";
  }

  function unlockScroll() {
    var body = root.document && root.document.body;
    if (!body || !scrollLocked) return;
    body.style.overflow = scrollPrev;
    scrollLocked = false;
  }

  function dismissModal() {
    modalGen += 1;
    if (modalTimer) {
      root.clearTimeout(modalTimer);
      modalTimer = 0;
    }
    if (modalEl) {
      modalEl.removeEventListener("click", onModalClick);
      if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
      modalEl = null;
    }
    unlockScroll();
  }

  function closeModal() {
    dismissModal();
    paint();
  }

  function ensureKey() {
    if (keyBound || !root.document) return;
    keyBound = true;
    root.document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modalEl) closeModal();
    });
  }

  function clockLabel() {
    try {
      var d = new Date();
      var h = d.getHours();
      var m = d.getMinutes();
      var hr = h % 12 || 12;
      return hr + ":" + (m < 10 ? "0" : "") + m;
    } catch (err) {
      return "9:41";
    }
  }

  function safariChrome(domain) {
    var safe = escapeHtml(domain);
    return "<div class='bs-safari'>" +
      "<div class='bs-status'><span class='bs-time'>" + clockLabel() + "</span><span class='bs-island'></span>" +
      "<span class='bs-sys' aria-hidden='true'>" +
      "<svg viewBox='0 0 16 12'><rect x='0' y='8' width='2.4' height='4' rx='.4' fill='#111'/><rect x='4' y='5' width='2.4' height='7' rx='.4' fill='#111'/><rect x='8' y='2.5' width='2.4' height='9.5' rx='.4' fill='#111'/><rect x='12' y='0' width='2.4' height='12' rx='.4' fill='#111'/></svg>" +
      "<svg viewBox='0 0 16 12'><path d='M1 4.5 C4 2 12 2 15 4.5' fill='none' stroke='#111' stroke-width='1.4' stroke-linecap='round'/><path d='M3.2 7 C5.2 5.4 10.8 5.4 12.8 7' fill='none' stroke='#111' stroke-width='1.4' stroke-linecap='round'/><circle cx='8' cy='10' r='1.1' fill='#111'/></svg>" +
      "<span class='bs-bat'><i></i></span></span></div>" +
      "<div class='bs-addr'><span class='bs-aa'>AA</span>" +
      "<span class='bs-url'><svg viewBox='0 0 12 14' aria-hidden='true'><rect x='2' y='6' width='8' height='7' rx='1.2' fill='none' stroke='#111' stroke-width='1.4'/><path d='M4 6 V4.2 a2 2 0 0 1 4 0 V6' fill='none' stroke='#111' stroke-width='1.4'/></svg><b>" + safe + "</b></span>" +
      "<span class='bs-reload' aria-hidden='true'>↻</span></div>" +
      "<div class='bs-progress'><i></i></div>" +
      "<div class='bs-page'><div class='bs-skel' aria-hidden='true'><i></i><i></i><i></i><b></b><b></b></div></div>" +
      "<div class='bs-tabbar' aria-hidden='true'>" +
      "<svg viewBox='0 0 24 24'><path d='M14 6 L8 12 L14 18' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>" +
      "<svg class='is-dim' viewBox='0 0 24 24'><path d='M10 6 L16 12 L10 18' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>" +
      "<svg viewBox='0 0 24 24'><path d='M12 14 V4 M8 8 L12 4 L16 8' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M6 12 V18 H18 V12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>" +
      "<svg viewBox='0 0 24 24'><path d='M7 5 H15 L19 9 V19 H7 Z' fill='none' stroke='currentColor' stroke-width='2'/></svg>" +
      "<svg viewBox='0 0 24 24'><rect x='6' y='6' width='12' height='12' rx='2.5' fill='none' stroke='currentColor' stroke-width='2'/></svg>" +
      "</div></div>";
  }

  function gateHTML(kind, domain, attemptNo) {
    var safeUrl = escapeHtml("https://" + domain);
    var mark = shieldMark("bsg" + modalGen, kind === "blocked");
    if (kind === "blocked") {
      return "<div class='bs-gate'>" +
        "<p class='bs-brand'>IRON ARC</p>" +
        mark +
        "<h2 class='bs-block-title'><span class='bs-stop' aria-hidden='true'>🛑</span> PORN URL BLOCKED BY IRON ARC</h2>" +
        "<p class='bs-urlchip'><s>" + safeUrl + "</s></p>" +
        "<p class='bs-quote'>\"You control your mind, not your impulses.\" — Marcus Aurelius</p>" +
        "<p class='bs-attempt'><i class='bs-live'></i> Attempt #" + attemptNo + " Blocked</p>" +
        "<button type='button' class='bs-safety' data-act='safety'>💪 Back to Safety (+25 XP)</button>" +
        "</div>";
    }
    if (kind === "off") {
      return "<div class='bs-gate is-danger'>" +
        "<p class='bs-brand'>IRON ARC</p>" +
        mark +
        "<h2 class='bs-block-title'><span class='bs-stop' aria-hidden='true'>⚠️</span> SHIELD OFF</h2>" +
        "<p class='bs-urlchip'><s>" + safeUrl + "</s></p>" +
        "<p class='bs-attempt' style='color:#fecdd3;border-color:rgba(251,113,133,.6);background:rgba(225,29,72,.15)'>UNPROTECTED</p>" +
        "<button type='button' class='bs-arm' data-act='arm'>Arm Shield</button>" +
        "</div>";
    }
    return "<div class='bs-gate is-danger'>" +
      "<p class='bs-brand'>IRON ARC</p>" +
      mark +
      "<h2 class='bs-block-title'>NOT BLOCKED</h2>" +
      "<p class='bs-urlchip'><s>" + safeUrl + "</s></p>" +
      "<p class='bs-attempt' style='color:#fecdd3;border-color:rgba(251,113,133,.6);background:rgba(225,29,72,.15)'>OFF THE LIST</p>" +
      "<button type='button' class='bs-dismiss' data-act='dismiss'>Close</button>" +
      "</div>";
  }

  function slamModal(gen, blocked) {
    if (gen !== modalGen || !modalEl) return;
    modalEl.classList.add("is-slammed");
    var gate = modalEl.querySelector(".bs-gate");
    if (gate) gate.removeAttribute("aria-hidden");
    fxUnlock();
    if (blocked) {
      fxTick(150, 0.07);
      fxCall("vibrate", [18, 36, 16]);
    } else {
      fxTick(240, 0.05);
    }
    var focus = modalEl.querySelector(".bs-safety, .bs-arm, .bs-dismiss");
    if (focus) {
      try { focus.focus(); } catch (err) { /* ignore */ }
    }
  }

  function openBlockTestModal(domain) {
    ensureStyles();
    ensureKey();
    var doc = root.document;
    if (!doc || !doc.body) return getState();
    var hostName = normalizeDomain(domain || "pornhub.com") || "pornhub.com";
    modalDomain = hostName;
    var blocked = shouldBlock(model, hostName);
    dismissModal();
    if (blocked) {
      model.attempts += 1;
      persist();
    }
    paint();
    var kind = blocked ? "blocked" : (model.master ? "open" : "off");
    var reduced = reducedMotion();
    modalEl = doc.createElement("div");
    modalEl.id = "bs-modal";
    modalEl.className = "bs-modal" + (reduced ? " is-slammed" : "");
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-label", blocked ? "Porn URL blocked" : "Shield check");
    modalEl.innerHTML = "<div class='bs-device'><div class='bs-screen'>" +
      safariChrome(hostName) +
      gateHTML(kind, hostName, model.attempts) +
      "<div class='bs-flash'></div><i class='bs-homebar'></i></div></div>";
    if (reduced) {
      var gateNow = modalEl.querySelector(".bs-gate");
      if (gateNow) gateNow.removeAttribute("aria-hidden");
    } else {
      var gate = modalEl.querySelector(".bs-gate");
      if (gate) gate.setAttribute("aria-hidden", "true");
    }
    modalEl.addEventListener("click", onModalClick);
    doc.body.appendChild(modalEl);
    lockScroll();
    var gen = modalGen;
    modalTimer = root.setTimeout(function () {
      modalTimer = 0;
      slamModal(gen, blocked);
    }, reduced ? 0 : SLAM_MS);
    return getState();
  }

  function grantXp(anchor) {
    model.xpBanked += XP_REWARD;
    persist();
    fxRank(anchor);
    var snapshot = getState();
    if (hook && typeof hook.onXp === "function") {
      try { hook.onXp(XP_REWARD, snapshot); } catch (err) { /* host */ }
    }
    try {
      if (root.CustomEvent && root.dispatchEvent) {
        root.dispatchEvent(new root.CustomEvent("ironarc:blocker-xp", {
          detail: { xp: XP_REWARD, state: snapshot }
        }));
      }
    } catch (err) { /* ignore */ }
  }

  function onModalClick(event) {
    var target = event.target && event.target.closest ? event.target.closest("[data-act]") : null;
    if (!target || !modalEl || !modalEl.contains(target)) return;
    var act = target.getAttribute("data-act");
    if (act === "safety") {
      if (target.getAttribute("data-locked") === "1") return;
      target.setAttribute("data-locked", "1");
      grantXp(target);
      closeModal();
      return;
    }
    if (act === "arm") {
      var again = modalDomain;
      if (!model.master) toggleMaster();
      openBlockTestModal(again);
      return;
    }
    if (act === "dismiss") closeModal();
  }

  function isIOS() {
    var nav = root.navigator || {};
    var ua = nav.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
  }

  function buildMobileConfig(state) {
    var strict = !!(state && state.filters && state.filters.strict);
    var rootId = uuid();
    var dnsId = uuid();
    var desc = strict
      ? "Cloudflare 1.1.1.3 malware and adult DNS. Strict lock."
      : "Cloudflare 1.1.1.3 malware and adult DNS.";
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      "<dict>",
      "<key>PayloadContent</key>",
      "<array>",
      "<dict>",
      "<key>DNSSettings</key>",
      "<dict>",
      "<key>DNSProtocol</key>",
      "<string>HTTPS</string>",
      "<key>ServerAddresses</key>",
      "<array>",
      "<string>1.1.1.3</string>",
      "<string>1.0.0.3</string>",
      "<string>2606:4700:4700::1113</string>",
      "<string>2606:4700:4700::1003</string>",
      "</array>",
      "<key>ServerURL</key>",
      "<string>https://family.cloudflare-dns.com/dns-query</string>",
      "</dict>",
      "<key>PayloadDescription</key>",
      "<string>" + xmlEscape(desc) + "</string>",
      "<key>PayloadDisplayName</key>",
      "<string>IRON ARC DNS</string>",
      "<key>PayloadIdentifier</key>",
      "<string>com.ironarc.shield.dns</string>",
      "<key>PayloadType</key>",
      "<string>com.apple.dnsSettings.managed</string>",
      "<key>PayloadUUID</key>",
      "<string>" + dnsId + "</string>",
      "<key>PayloadVersion</key>",
      "<integer>1</integer>",
      "<key>ProhibitDisablement</key>",
      strict ? "<true/>" : "<false/>",
      "</dict>",
      "</array>",
      "<key>PayloadDescription</key>",
      "<string>" + xmlEscape(desc) + "</string>",
      "<key>PayloadDisplayName</key>",
      "<string>IRON ARC Shield</string>",
      "<key>PayloadIdentifier</key>",
      "<string>com.ironarc.shield</string>",
      "<key>PayloadOrganization</key>",
      "<string>IRON ARC</string>",
      "<key>PayloadRemovalDisallowed</key>",
      "<false/>",
      "<key>PayloadType</key>",
      "<string>Configuration</string>",
      "<key>PayloadUUID</key>",
      "<string>" + rootId + "</string>",
      "<key>PayloadVersion</key>",
      "<integer>1</integer>",
      "</dict>",
      "</plist>"
    ].join("\n");
  }

  function blobDownload(xml) {
    var doc = root.document;
    var BlobCtor = root.Blob;
    var URLRef = root.URL || root.webkitURL;
    if (!doc || !doc.body || !doc.createElement || !BlobCtor || !URLRef || !URLRef.createObjectURL) return false;
    var blob = new BlobCtor([xml], { type: "application/x-apple-aspen-config" });
    var url = URLRef.createObjectURL(blob);
    if (isIOS()) {
      root.location.assign(url);
      return true;
    }
    var link = doc.createElement("a");
    link.href = url;
    link.download = "IRON-ARC-Shield.mobileconfig";
    link.rel = "noopener";
    doc.body.appendChild(link);
    link.click();
    if (link.parentNode) link.parentNode.removeChild(link);
    root.setTimeout(function () {
      try { URLRef.revokeObjectURL(url); } catch (err) { /* ignore */ }
    }, 4000);
    return true;
  }

  function profileHref() {
    try {
      return new URL("iron-arc-shield.mobileconfig", root.location.href).href;
    } catch (err) {
      return "iron-arc-shield.mobileconfig";
    }
  }

  function deliverProfile(xml) {
    var nav = root.navigator;
    var sw = nav && nav.serviceWorker;
    if (!sw || !sw.ready || typeof sw.ready.then !== "function" || typeof root.MessageChannel !== "function") {
      blobDownload(xml);
      return;
    }
    var settled = false;
    var timer = root.setTimeout(function () {
      if (settled) return;
      settled = true;
      blobDownload(xml);
    }, 900);
    sw.ready.then(function (reg) {
      if (settled) return;
      var worker = sw.controller;
      if (!worker && reg) worker = null;
      if (!sw.controller) {
        settled = true;
        root.clearTimeout(timer);
        blobDownload(xml);
        return;
      }
      try {
        var channel = new root.MessageChannel();
        channel.port1.onmessage = function () {
          if (settled) return;
          settled = true;
          root.clearTimeout(timer);
          root.location.assign(profileHref());
        };
        sw.controller.postMessage({ type: "ironarc-profile", xml: xml }, [channel.port2]);
      } catch (err) {
        if (!settled) {
          settled = true;
          root.clearTimeout(timer);
          blobDownload(xml);
        }
      }
    }).catch(function () {
      if (settled) return;
      settled = true;
      root.clearTimeout(timer);
      blobDownload(xml);
    });
  }

  function downloadMobileConfig() {
    fxUnlock();
    if (!model.master) {
      model.master = true;
      armPulse = true;
      persist();
      paint();
      fxArm(host && host.querySelector(".bs-power"));
      emitChange();
    } else {
      fxTick(640, 0.03);
    }
    var xml = buildMobileConfig(getState());
    deliverProfile(xml);
    setStatus(isIOS() ? "OPEN IN SETTINGS" : "PROFILE SAVED");
    return xml;
  }

  load();

  var api = {
    version: "1.0.0",
    __built: true,
    mount: mount,
    unmount: unmount,
    renderHTML: renderHTML,
    openBlockTestModal: openBlockTestModal,
    downloadMobileConfig: downloadMobileConfig,
    getState: getState,
    toggleMaster: toggleMaster
  };

  root.BlockerShield = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
