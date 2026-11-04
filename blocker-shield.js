/**
 * IRON ARC — Visual porn-URL shield + live iPhone DNS check.
 *
 * window.BlockerShield
 *   .mount(el, opts)                 paint + bind. opts.onXp(amount, state), opts.onChange(state)
 *   .unmount()
 *   .renderHTML(state)               self-contained panel markup
 *   .openBlockTestModal(domain, telemetry)
 *   .testUrlLive(rawInput)           local shield + Cloudflare 1.1.1.3 DoH + Safari canary
 *   .queryCloudflareFamilyDoH(domain)
 *   .probeSystemDnsShield(domain)
 *   .downloadMobileConfig()          removable Cloudflare Family DNS profile
 *   .buildMobileConfig(state)
 *   .shouldBlock(state, hostName)
 *   .getState()
 *   .toggleMaster()
 *
 * Styles ship in one injected <style id="bs-shield-styles"> tag.
 * Audio and particles go through window.DopamineFX when it is present.
 * The .mobileconfig is an unsigned, removable DNS profile. It does not
 * install a VPN, a certificate, or an MDM lock. ProhibitDisablement is
 * always false so a normal unsupervised iPhone can install it.
 */
(function (root) {
  "use strict";

  if (root.BlockerShield && root.BlockerShield.__built) return;

  var STORAGE_KEY = "ironarc.blocker.v1";
  var STYLE_ID = "bs-shield-styles";
  var XP_REWARD = 25;
  var SLAM_MS = 420;
  var MAX_DOMAINS = 40;
  var DOH_TIMEOUT_MS = 3800;
  var CONTROL_TIMEOUT_MS = 5000;
  var CANARY_TIMEOUT_MS = 6000;
  var PROFILE_ROOT_UUID = "8F3C1A90-6B2E-4D47-9C15-2A6E7B8D9012";
  var PROFILE_DNS_UUID = "3B7E2C14-9A58-4F06-B1D3-6C8A0E5F4721";

  var DEFAULT_DOMAINS = [
    "pornhub.com",
    "xvideos.com",
    "onlyfans.com",
    "xnxx.com",
    "chaturbate.com"
  ];

  var QUICK_TESTS = [
    "pornhub.com",
    "onlyfans.com",
    "xvideos.com",
    "rule34.xxx",
    "nudity.testcategory.com"
  ];

  var FILTERS = [
    { id: "porn", icon: "🔞", title: "Adult & Tube Sites", badge: "42,850+ URLs", tone: "rose" },
    { id: "cams", icon: "🍑", title: "OnlyFans & Cam Sites", badge: "8,400+ URLs", tone: "amber" },
    { id: "nsfw", icon: "📱", title: "X, Reddit & TikTok NSFW", badge: "Feed Filter", tone: "indigo" },
    { id: "strict", icon: "🕵️‍♂️", title: "Incognito & Private Tabs", badge: "Always On", tone: "slate" }
  ];

  var PORN_ROOTS = [
    "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
    "youporn.com", "spankbang.com", "eporner.com", "rule34.xxx", "rule34.paheal.net",
    "nhentai.net", "hentaihaven.xxx", "hanime.tv", "brazzers.com", "realitykings.com",
    "bangbros.com", "naughtyamerica.com", "vixen.com", "tushy.com", "blacked.com",
    "tube8.com", "tnaflix.com", "motherless.com", "txxx.com", "hclips.com",
    "upornia.com", "fuq.com", "daftsex.com", "beeg.com", "thumbzilla.com",
    "xtube.com", "porntrex.com", "hqporner.com", "sxyprn.com", "fapello.com",
    "coomer.su", "kemono.su", "erome.com", "redgifs.com",
    "nudity.testcategory.com", "test-adult.cleanbrowsing.org",
    "sex.com", "xv-videos1.com"
  ];

  var CAM_ROOTS = [
    "onlyfans.com", "chaturbate.com", "stripchat.com", "bongacams.com",
    "fansly.com", "myfreecams.com", "livejasmin.com", "camsoda.com",
    "cam4.com", "jerkmate.com", "manyvids.com", "loyalfans.com", "admireme.vip"
  ];

  var NSFW_ROOTS = [
    "reddit.com", "x.com", "twitter.com", "tiktok.com", "instagram.com", "4chan.org", "9gag.com"
  ];

  var ADULT_TLD_RE = /\.(xxx|porn|sex|adult|cam|erotica)$/i;
  var ADULT_KEYWORD_RE = /(?:^|[.-])(porn|xxx|xvideos|xnxx|hentai|rule34|nsfw|onlyfans|chaturbate|redtube|youporn|xhamster|spankbang|camgirl|sexvids)(?:$|[.-])/i;

  var CSS = [
    ".bs-root,.bs-root *,.bs-modal,.bs-modal *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}",
    ".bs-root{position:relative;margin:0 0 12px;padding:14px 12px 12px;border-radius:22px;color:#f8fafc;",
    "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Inter,Roboto,sans-serif;",
    "background:radial-gradient(120% 80% at 50% -10%,rgba(16,185,129,.18),transparent 55%),linear-gradient(180deg,#10151f,#07090e);",
    "border:1px solid rgba(255,255,255,.08);box-shadow:0 18px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05);",
    "user-select:none;-webkit-user-select:none}",
    ".bs-root.is-off{border-color:rgba(251,113,133,.45);",
    "background:radial-gradient(120% 70% at 50% -10%,rgba(225,29,72,.28),transparent 52%),linear-gradient(180deg,#241016,#0c0a0d)}",
    ".bs-count{position:absolute;top:12px;right:12px;z-index:2;padding:4px 8px;border-radius:999px;",
    "background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#cbd5e1;font-size:10px;font-weight:800;letter-spacing:.08em}",
    ".bs-root.is-off .bs-count{background:#e11d48;border-color:transparent;color:#fff}",
    ".bs-power{appearance:none;width:100%;border:0;background:transparent;color:inherit;cursor:pointer;",
    "padding:2px 0 0;text-align:center;font:inherit}",
    ".bs-power:active .bs-halo{transform:scale(.97)}",
    ".bs-power:focus-visible{outline:2px solid #6ee7b7;outline-offset:3px;border-radius:18px}",
    ".bs-halo{position:relative;width:168px;height:168px;margin:0 auto;display:grid;place-items:center}",
    ".bs-power.is-on .bs-halo{filter:drop-shadow(0 0 14px rgba(16,185,129,.55))}",
    ".bs-power.is-off .bs-halo{filter:drop-shadow(0 0 14px rgba(225,29,72,.85))}",
    ".bs-power.is-arming .bs-halo{animation:bs-pop .42s cubic-bezier(.2,.8,.2,1)}",
    ".bs-ping{position:absolute;left:50%;top:50%;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:50%;border:2px solid rgba(52,211,153,.75);opacity:0;pointer-events:none}",
    ".bs-power.is-on .bs-ping{animation:bs-ping 2.2s ease-out infinite}",
    ".bs-power.is-on .bs-ping.delay{animation-delay:1.1s}",
    ".bs-power.is-off .bs-ping{border-color:rgba(251,113,133,.9);animation:bs-ping 1.05s ease-out infinite}",
    ".bs-marksvg{width:144px;height:150px;display:block;overflow:visible}",
    ".bs-kicker{display:block;margin-top:2px;font-size:15px;font-weight:900;letter-spacing:.08em}",
    ".bs-power.is-on .bs-kicker{color:#d1fae5}",
    ".bs-power.is-off .bs-kicker{color:#fecdd3}",
    ".bs-stat{display:block;margin-top:2px;font-size:40px;line-height:.95;font-weight:900;letter-spacing:-.045em;color:#ecfdf5}",
    ".bs-power.is-on .bs-stat{background:linear-gradient(180deg,#fff,#6ee7b7);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}",
    ".bs-power.is-off .bs-stat{font-size:36px;letter-spacing:.08em;color:#fecdd3;-webkit-text-fill-color:#fecdd3}",
    ".bs-sub{display:block;margin-top:4px;font-size:11px;font-weight:800;letter-spacing:.16em;color:#6ee7b7}",
    ".bs-power.is-off .bs-sub{color:#fda4af}",
    ".bs-label{margin:14px 2px 8px;font-size:10px;font-weight:800;letter-spacing:.18em;color:#64748b}",
    ".bs-root.is-off .bs-rows{opacity:.72}",
    ".bs-rows{display:flex;flex-direction:column;gap:8px}",
    ".bs-row{width:100%;display:flex;align-items:center;gap:10px;text-align:left;padding:10px;border-radius:16px;",
    "border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);color:inherit;font:inherit;cursor:pointer}",
    ".bs-row:active{transform:scale(.985)}",
    ".bs-row:focus-visible{outline:2px solid #6ee7b7;outline-offset:2px}",
    ".bs-ico{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;flex:none;background:rgba(255,255,255,.04)}",
    ".bs-row[data-tone='rose'] .bs-ico{background:rgba(255,255,255,.05)}",
    ".bs-row[data-tone='amber'] .bs-ico{background:rgba(245,158,11,.12)}",
    ".bs-row[data-tone='indigo'] .bs-ico{background:rgba(99,102,241,.14)}",
    ".bs-row[data-tone='slate'] .bs-ico{background:rgba(148,163,184,.12)}",
    ".bs-root.is-off .bs-row[data-tone='rose'] .bs-ico{background:rgba(244,63,94,.16)}",
    ".bs-copy{flex:1;min-width:0}",
    ".bs-title{display:block;font-size:13.5px;font-weight:800;line-height:1.2;letter-spacing:-.01em}",
    ".bs-badge{display:block;margin-top:3px;padding:0;border:0;border-radius:0;background:none;color:#64748b;",
    "font-size:11px;font-weight:600;letter-spacing:.01em;text-transform:none;white-space:nowrap}",
    ".bs-switch{width:51px;height:31px;border-radius:31px;background:#3a3a3c;position:relative;flex:none;transition:background .2s ease}",
    ".bs-switch i{position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;",
    "box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .22s cubic-bezier(.3,.9,.4,1.15)}",
    ".bs-row[aria-checked='true'] .bs-switch{background:#10b981;box-shadow:0 0 12px rgba(16,185,129,.35)}",
    ".bs-row[aria-checked='true'] .bs-switch i{transform:translateX(20px)}",
    ".bs-pills{display:flex;flex-wrap:wrap;gap:8px}",
    ".bs-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 2px 2px 0;border-radius:999px;",
    "background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#cbd5e1;box-shadow:none}",
    ".bs-root.is-off .bs-pill{background:linear-gradient(180deg,rgba(225,29,72,.28),rgba(127,29,29,.45));",
    "border:1px solid rgba(251,113,133,.6);box-shadow:0 0 16px rgba(225,29,72,.2)}",
    ".bs-pill-hit,.bs-pill-x{border:0;background:transparent;color:#cbd5e1;font:inherit;font-weight:700;cursor:pointer}",
    ".bs-pill-hit{padding:8px 4px 8px 12px;font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:-.01em}",
    ".bs-root.is-off .bs-pill-hit,.bs-root.is-off .bs-pill-x{color:#ffe4e6}",
    ".bs-pill-x{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.06);font-size:16px;line-height:1}",
    ".bs-pill-hit:focus-visible,.bs-pill-x:focus-visible{outline:2px solid #94a3b8;outline-offset:1px}",
    ".bs-add,.bs-liveform{display:flex;gap:8px}",
    ".bs-liveform{margin-top:0}",
    ".bs-input,.bs-liveinput{flex:1;min-width:0;background:#070b12;color:#f8fafc;border:1px solid rgba(255,255,255,.12);border-radius:14px;",
    "padding:12px;font-size:16px;font-weight:700;font-family:inherit;user-select:text;-webkit-user-select:text}",
    ".bs-input::placeholder,.bs-liveinput::placeholder{color:#64748b;font-weight:600}",
    ".bs-input:focus,.bs-liveinput:focus{outline:none;border-color:#34d399;box-shadow:0 0 0 3px rgba(16,185,129,.2)}",
    ".bs-input.is-bad,.bs-liveinput.is-bad{border-color:#fbbf24;box-shadow:0 0 0 3px rgba(251,191,36,.2)}",
    ".bs-blockbtn{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:0 14px;font:inherit;font-weight:800;font-size:13px;color:#e2e8f0;",
    "background:rgba(255,255,255,.06);box-shadow:none;cursor:pointer}",
    ".bs-root.is-off .bs-blockbtn{color:#fff;border-color:transparent;background:linear-gradient(180deg,#fb7185,#e11d48);box-shadow:0 0 16px rgba(225,29,72,.4)}",
    ".bs-livebtn{border:0;border-radius:14px;padding:0 12px;font:inherit;font-weight:900;font-size:13px;color:#042014;",
    "background:linear-gradient(180deg,#6ee7b7,#10b981);cursor:pointer;white-space:nowrap}",
    ".bs-livebtn:disabled{opacity:.55;cursor:default}",
    ".bs-livebtn:active{transform:scale(.985)}",
    ".bs-chips{display:flex;gap:6px;margin-top:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px}",
    ".bs-chips::-webkit-scrollbar{display:none}",
    ".bs-chip{flex:none;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:#cbd5e1;border-radius:999px;",
    "padding:6px 8px;font:11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}",
    ".bs-chip:active{transform:scale(.97)}",
    ".bs-chip:focus-visible,.bs-recheck:focus-visible,.bs-livebtn:focus-visible,.bs-canary:focus-visible{outline:2px solid #6ee7b7;outline-offset:2px}",
    ".bs-tester{margin-top:4px}",
    ".bs-receipt{margin-top:8px}",
    ".bs-receipt:not([hidden]){display:flex;flex-direction:column;gap:4px}",
    ".bs-guide[hidden],.bs-receipt[hidden]{display:none !important}",
    ".bs-rcpt{display:flex;flex-direction:column;gap:2px;padding:7px 8px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.05);text-align:left}",
    ".bs-rcpt span{font-size:9px;font-weight:800;letter-spacing:.14em;color:#64748b}",
    ".bs-rcpt b{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.35}",
    ".bs-rcpt.is-block b{color:#6ee7b7}",
    ".bs-livepill{margin:10px 0 0;padding:8px 10px;border-radius:999px;text-align:center;font-size:10px;font-weight:800;letter-spacing:.02em;line-height:1.35;",
    "color:#94a3b8;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}",
    ".bs-livepill.is-on{color:#d1fae5;background:rgba(16,185,129,.1);border-color:rgba(52,211,153,.4)}",
    ".bs-livepill.is-wait{color:#fde68a;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.28)}",
    ".bs-livepill.is-mute{color:#94a3b8}",
    ".bs-strip{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:8px 0 0;text-align:left}",
    ".bs-step{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.35}",
    ".bs-step b{flex:none;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.06);color:#94a3b8;font-size:10px;font-weight:900}",
    ".bs-arr{color:#64748b;font-size:12px;font-weight:700}",
    ".bs-recheck{width:100%;margin-top:8px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);",
    "color:#e2e8f0;font:inherit;font-weight:800;font-size:13px;cursor:pointer}",
    ".bs-recheck:disabled{opacity:.55}",
    ".bs-recheck:active{transform:scale(.985)}",
    ".bs-canary{display:block;margin-top:8px;text-align:center;color:#93c5fd;font-size:12px;font-weight:800;text-decoration:none}",
    ".bs-note,.bs-foot{min-height:16px;margin:8px 2px 0;text-align:center;font-size:11px;font-weight:800;letter-spacing:.08em}",
    ".bs-note{color:#fbbf24}",
    ".bs-root.is-off .bs-note{color:#fda4af}",
    ".bs-foot{color:#6ee7b7}",
    ".bs-install{width:100%;margin-top:8px;padding:14px;border:0;border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:8px;",
    "background:linear-gradient(180deg,#1c2433,#0c1018);color:#f8fafc;font:inherit;font-weight:900;font-size:14px;text-align:left;cursor:pointer;",
    "box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.28)}",
    ".bs-install:active{transform:scale(.985)}",
    ".bs-install span{line-height:1.25}",
    ".bs-install em{flex:none;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.08em;color:#04130c;",
    "background:#34d399;border-radius:999px;padding:5px 7px}",
    ".bs-modal{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;padding:12px;",
    "background:rgba(2,6,12,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);",
    "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Inter,Roboto,sans-serif}",
    ".bs-device{width:min(390px,100%);height:min(780px,calc(100vh - 24px));background:#0a0a0c;border-radius:44px;padding:12px;",
    "box-shadow:0 0 0 2px #2a2a2e,0 30px 80px rgba(0,0,0,.55);display:flex;position:relative}",
    ".bs-modal.is-slammed .bs-device{animation:bs-shake .42s linear}",
    ".bs-screen{position:relative;flex:1;border-radius:32px;overflow:hidden;background:#fff;min-height:0;display:flex}",
    ".bs-safari{flex:1;min-height:0;display:flex;flex-direction:column;background:#fff;color:#111}",
    ".bs-safari .bs-status{position:relative;height:54px;min-height:0;margin:0;display:flex;align-items:flex-end;justify-content:space-between;",
    "padding:0 18px 8px;font-weight:700;font-size:15px;letter-spacing:0;text-align:left;color:#111}",
    ".bs-island{position:absolute;top:10px;left:50%;width:96px;height:28px;transform:translateX(-50%);background:#0a0a0c;border-radius:20px}",
    ".bs-sys{display:flex;align-items:center;gap:5px}",
    ".bs-sys svg{width:16px;height:12px;display:block}",
    ".bs-bat{width:25px;height:12px;border:1.5px solid #111;border-radius:3px;padding:1px;position:relative}",
    ".bs-bat:after{content:'';position:absolute;right:-3px;top:3px;width:2px;height:4px;background:#111;border-radius:0 1px 1px 0}",
    ".bs-bat i{display:block;height:100%;width:78%;background:#111;border-radius:1px}",
    ".bs-addr{display:flex;align-items:center;gap:8px;padding:0 10px 8px}",
    ".bs-aa,.bs-reload{width:32px;height:32px;display:grid;place-items:center;font-weight:800;font-size:13px;color:#111}",
    ".bs-url{flex:1;height:36px;border-radius:12px;background:#e9e9ed;display:flex;align-items:center;justify-content:center;gap:6px;",
    "font-size:13px;font-weight:700;color:#111;min-width:0}",
    ".bs-url b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}",
    ".bs-url svg{width:12px;height:14px;display:block;flex:none}",
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
    "padding:18px 16px 24px;overflow:auto;color:#f8fafc;text-align:center;transform:translateY(-102%);pointer-events:none;",
    "background:radial-gradient(90% 48% at 50% 12%,rgba(16,185,129,.28),transparent 62%),linear-gradient(180deg,#121820,#07090d 46%,#05060a)}",
    ".bs-gate.is-danger{background:radial-gradient(90% 48% at 50% 8%,rgba(225,29,72,.5),transparent 60%),linear-gradient(180deg,#3a1020,#14080d 52%,#070507)}",
    ".bs-gate.is-clear{background:radial-gradient(90% 48% at 50% 12%,rgba(148,163,184,.16),transparent 62%),linear-gradient(180deg,#161b24,#07090d 50%,#05060a)}",
    ".bs-modal.is-slammed .bs-gate{transform:translateY(0);pointer-events:auto;transition:transform .32s cubic-bezier(.12,.85,.2,1)}",
    ".bs-gate .bs-marksvg{width:112px;height:116px;margin:0 auto}",
    ".bs-brand{margin:0;font-size:11px;font-weight:900;letter-spacing:.28em;color:#6ee7b7}",
    ".bs-gate.is-danger .bs-brand{color:#fda4af}",
    ".bs-gate.is-clear .bs-brand{color:#94a3b8}",
    ".bs-block-title{margin:0;font-size:17px;line-height:1.15;font-weight:900;letter-spacing:-.03em}",
    ".bs-urlchip{margin:0;font-size:12px;font-weight:800;color:#cbd5e1;word-break:break-all}",
    ".bs-gate.is-danger .bs-urlchip{color:#fda4af}",
    ".bs-urlchip s{text-decoration-thickness:2px}",
    ".bs-quote{margin:2px 0 0;padding:10px 12px;border-radius:0 14px 14px 0;border-left:3px solid #fbbf24;",
    "background:rgba(251,191,36,.1);color:#fef3c7;font-size:14px;font-weight:700;font-style:italic;line-height:1.35;text-align:left}",
    ".bs-attempt{margin:2px auto 0;display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;",
    "background:rgba(16,185,129,.14);border:1px solid rgba(52,211,153,.45);color:#6ee7b7;font-size:13px;font-weight:900;letter-spacing:.03em}",
    ".bs-attempt.is-bad{color:#fecdd3;border-color:rgba(251,113,133,.6);background:rgba(225,29,72,.15)}",
    ".bs-attempt.is-clear{color:#cbd5e1;border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.04)}",
    ".bs-modal.is-slammed .bs-attempt{animation:bs-pop .45s cubic-bezier(.2,.8,.2,1)}",
    ".bs-live{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;animation:bs-blink 1s ease-in-out infinite;flex:none}",
    ".bs-proof{margin:4px 0 0;padding:8px 10px;border-radius:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;",
    "font-size:10.5px;font-weight:700;line-height:1.4;color:#d1fae5;background:rgba(16,185,129,.1);border:1px solid rgba(52,211,153,.35)}",
    ".bs-proof .bs-ms{display:block;margin-top:3px;color:#6ee7b7;letter-spacing:.04em}",
    ".bs-proof.is-open{color:#cbd5e1;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08)}",
    ".bs-proof.is-wait{color:#fde68a;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.25)}",
    ".bs-osbadge{margin:6px 0 0;font-size:10px;font-weight:800;letter-spacing:.02em;line-height:1.35}",
    ".bs-osbadge.is-on{color:#6ee7b7}",
    ".bs-osbadge.is-wait{color:#fde68a}",
    ".bs-gate .bs-strip{margin-top:6px}",
    ".bs-safety,.bs-arm,.bs-dismiss{width:100%;border-radius:16px;font:inherit;font-weight:900;cursor:pointer}",
    ".bs-safety{margin-top:8px;padding:16px 12px;border:0;color:#04130c;font-size:15px;line-height:1.2;",
    "background:linear-gradient(180deg,#6ee7b7,#10b981 46%,#047857);box-shadow:0 0 28px rgba(16,185,129,.45)}",
    ".bs-safety:active,.bs-arm:active,.bs-dismiss:active{transform:scale(.985)}",
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
    "@media (max-height:740px){.bs-gate .bs-marksvg{width:84px;height:88px}.bs-block-title{font-size:15px}.bs-quote{font-size:13px;padding:8px 10px}}",
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
  var modalRawUrl = "https://pornhub.com";
  var modalTelemetry = null;
  var modalCounted = false;
  var scrollLocked = false;
  var scrollPrev = "";
  var keyBound = false;
  var visBound = false;
  var dnsGen = 0;
  var testToken = 0;
  var guideHold = false;
  var liveDraft = "";
  var lastReceipt = null;
  var dnsState = { status: "checking", detail: "" };

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

  function nowMs() {
    if (root.performance && typeof root.performance.now === "function") return root.performance.now();
    return Date.now();
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

  function prettyUrl(raw, hostName) {
    var s = String(raw || "").trim();
    if (!s) return "https://" + hostName;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return s;
    return "https://" + s.replace(/^\/\//, "");
  }

  function safariLabel(url) {
    var s = String(url || "").replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    if (s.length > 36) s = s.slice(0, 35) + "…";
    return s;
  }

  function clipText(value, max) {
    var s = String(value || "");
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
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
    var domains = (state && state.domains) || [];
    for (i = 0; i < domains.length; i++) {
      if (hostMatches(hostName, domains[i])) return true;
    }
    return false;
  }

  function blockDetail(state, hostName) {
    var host = normalizeDomain(hostName);
    if (!state || !state.master || !host) return { blocked: false, reason: "", host: host || "" };
    var filters = state.filters || {};
    if (filters.porn && (matchesList(host, PORN_ROOTS) || ADULT_TLD_RE.test(host) || ADULT_KEYWORD_RE.test(host))) {
      var reason = "Adult Keyword";
      if (matchesList(host, PORN_ROOTS)) reason = "Adult & Tube Sites";
      else if (matchesList(host, CAM_ROOTS)) reason = "OnlyFans & Cam Sites";
      else if (ADULT_TLD_RE.test(host)) reason = "Adult Domain Extension";
      return { blocked: true, reason: reason, host: host };
    }
    if (filters.cams && matchesList(host, CAM_ROOTS)) return { blocked: true, reason: "OnlyFans & Cam Sites", host: host };
    if (filters.nsfw && matchesList(host, NSFW_ROOTS)) return { blocked: true, reason: "Feed Filter", host: host };
    if (listed(state, host)) return { blocked: true, reason: "Block List", host: host };
    return { blocked: false, reason: "", host: host };
  }

  function shouldBlock(state, hostName) {
    return blockDetail(state, hostName).blocked;
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
      return { on: false, kicker: "⚠️ SHIELD DISARMED", stat: "EXPOSED", sub: "TAP TO ARM SHIELD" };
    }
    return { on: true, kicker: "🛡️ SHIELD ARMED", stat: "42,850+", sub: "ADULT URLS BLOCKED" };
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
    var style = doc.getElementById(STYLE_ID);
    if (!style) {
      style = doc.createElement("style");
      style.id = STYLE_ID;
      var parent = doc.head || doc.documentElement;
      if (parent) parent.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
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
        "<button type='button' class='bs-pill-hit' data-act='live' data-domain='" + safe + "'>" + safe + "</button>" +
        "<button type='button' class='bs-pill-x' data-act='remove' data-domain='" + safe + "' aria-label='Remove " + safe + "'>×</button>" +
        "</span>";
    }
    return html;
  }

  function chipsHTML() {
    var html = "";
    var i;
    for (i = 0; i < QUICK_TESTS.length; i++) {
      var safe = escapeHtml(QUICK_TESTS[i]);
      html += "<button type='button' class='bs-chip' data-act='live' data-domain='" + safe + "'>" + safe + "</button>";
    }
    return html;
  }

  function dnsLabel(state) {
    var status = state && state.status;
    if (status === "protected") return "🟢 iOS SAFARI DNS: PROTECTED (1.1.1.3 ACTIVE)";
    if (status === "unprotected") return "🟡 iOS SAFARI SYSTEM DNS: PROFILE NOT INSTALLED YET";
    if (status === "offline") return "⚪ iOS SAFARI DNS: OFFLINE";
    return "◌ iOS SAFARI DNS: CHECKING…";
  }

  function pillClass(state) {
    var status = state && state.status;
    if (status === "protected") return "bs-livepill is-on";
    if (status === "unprotected") return "bs-livepill is-wait";
    return "bs-livepill is-mute";
  }

  function guideVisible() {
    if (guideHold) return true;
    return !!(dnsState && dnsState.status === "unprotected");
  }

  function stepsHTML() {
    return "<div class='bs-strip'>" +
      "<span class='bs-step'><b>1</b> Tap Activate iOS System Shield</span>" +
      "<span class='bs-arr' aria-hidden='true'>→</span>" +
      "<span class='bs-step'><b>2</b> Open iPhone Settings &gt; Profile Downloaded</span>" +
      "<span class='bs-arr' aria-hidden='true'>→</span>" +
      "<span class='bs-step'><b>3</b> Tap Install</span>" +
      "</div>";
  }

  function canaryLinkHTML() {
    return "<a class='bs-canary' href='https://nudity.testcategory.com' target='_blank' rel='noopener noreferrer' referrerpolicy='no-referrer'>🌐 Test Safe Canary in Safari Tab ↗</a>";
  }

  function guideHTML() {
    return "<div class='bs-guide' data-dns-guide" + (guideVisible() ? "" : " hidden") + ">" +
      stepsHTML() +
      "<button type='button' class='bs-recheck' data-act='reverify'>↻ Re-Verify Safari</button>" +
      canaryLinkHTML() +
      "</div>";
  }

  function receiptInner(receipt) {
    if (!receipt) return "";
    if (receipt.phase === "checking") {
      return "<p class='bs-rcpt'><span>DNS</span><b>Checking " + escapeHtml(receipt.host) + "…</b></p>";
    }
    var local = receipt.local || { blocked: false, reason: "" };
    var doh = receipt.doh;
    var system = receipt.system;
    var shieldText = local.blocked ? ("Blocked · " + local.reason) : "Clear";
    var dnsText = "DNS check unreachable";
    var dnsClass = "";
    if (doh && doh.ok && doh.sinkholed) {
      dnsText = "DNS → 0.0.0.0 • BLOCKED AT NETWORK LAYER · " + doh.latencyMs + " ms";
      dnsClass = " is-block";
    } else if (doh && doh.ok) {
      dnsText = "DNS → " + (doh.ip || "RESOLVED") + " · " + doh.latencyMs + " ms";
    } else if (doh && doh.comment) {
      dnsText = doh.comment;
    }
    var safariText = "Checking Safari…";
    var safariClass = "";
    if (system && system.status === "protected") {
      safariText = system.targetReached === true ? "This URL loaded · profile not covering it" : "Sinkholed · 1.1.1.3 active";
      safariClass = system.targetReached === true ? "" : " is-block";
    } else if (system && system.status === "unprotected") {
      safariText = "Profile not installed yet";
    } else if (system && system.status === "offline") {
      safariText = "Offline";
    }
    return "<p class='bs-rcpt" + (local.blocked ? " is-block" : "") + "'><span>SHIELD</span><b>" + escapeHtml(shieldText) + "</b></p>" +
      "<p class='bs-rcpt" + dnsClass + "'><span>DNS</span><b>" + escapeHtml(dnsText) + "</b></p>" +
      "<p class='bs-rcpt" + safariClass + "'><span>SAFARI</span><b>" + escapeHtml(safariText) + "</b></p>";
  }

  function receiptHTML() {
    if (!lastReceipt) return "<div class='bs-receipt' data-live-receipt hidden></div>";
    return "<div class='bs-receipt' data-live-receipt>" + receiptInner(lastReceipt) + "</div>";
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
      "<p class='bs-livepill " + pillClass(dnsState).replace("bs-livepill ", "") + "' data-dns-pill role='status' aria-live='polite'>" + escapeHtml(dnsLabel(dnsState)) + "</p>" +
      guideHTML() +
      "<button type='button' class='bs-install' data-act='install'><span>📲 Activate iOS System Shield</span><em>1-TAP</em></button>" +
      "<p class='bs-foot' data-status></p>" +
      "<div class='bs-tester'>" +
      "<p class='bs-label'>TEST ANY URL</p>" +
      "<form class='bs-liveform'>" +
      "<input class='bs-liveinput bs-live-input' type='text' inputmode='url' enterkeyhint='go' autocapitalize='off' autocorrect='off' spellcheck='false' autocomplete='off' maxlength='200' placeholder='Test any URL live (e.g. pornhub.com, rule34.xxx)...' aria-label='Test any URL live' value='" + escapeHtml(liveDraft) + "'>" +
      "<button class='bs-livebtn bs-live-btn' type='submit'>⚡ Test Block</button>" +
      "</form>" +
      "<div class='bs-chips bs-quick-pills'>" + chipsHTML() + "</div>" +
      receiptHTML() +
      "</div>" +
      "<p class='bs-label'>PROTECTION LAYERS</p>" +
      "<div class='bs-rows'>" + filtersHTML(view) + "</div>" +
      "<p class='bs-label'>BLOCK LIST</p>" +
      "<div class='bs-pills'>" + pillsHTML(view.domains) + "</div>" +
      "<form class='bs-add'>" +
      "<input class='bs-input' type='text' inputmode='url' enterkeyhint='done' autocapitalize='off' autocorrect='off' spellcheck='false' autocomplete='off' maxlength='80' placeholder='Add domain' aria-label='Add domain'>" +
      "<button class='bs-blockbtn' type='submit'>Block</button>" +
      "</form>" +
      "<p class='bs-note' data-note></p>" +
      "</section>";
  }

  function paint() {
    if (!host) return;
    var pulse = armPulse;
    armPulse = false;
    var note = "";
    var status = "";
    var noteEl = host.querySelector("[data-note]");
    var statusEl = host.querySelector("[data-status]");
    if (noteEl) note = noteEl.textContent || "";
    if (statusEl) status = statusEl.textContent || "";
    host.innerHTML = renderHTML();
    if (note) setNote(note);
    if (status) setStatus(status);
    if (pulse) {
      var btn = host.querySelector(".bs-power");
      if (btn) btn.classList.add("is-arming");
    }
  }

  function paintReceipt() {
    if (!host) return;
    var el = host.querySelector("[data-live-receipt]");
    if (!el) return;
    if (!lastReceipt) {
      el.setAttribute("hidden", "");
      el.innerHTML = "";
      return;
    }
    el.removeAttribute("hidden");
    el.innerHTML = receiptInner(lastReceipt);
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

  function setLiveBusy(busy) {
    if (!host) return;
    var btn = host.querySelector(".bs-livebtn");
    if (!btn) return;
    btn.disabled = !!busy;
    btn.textContent = busy ? "Checking…" : "⚡ Test Block";
  }

  function applyDnsView(result) {
    if (result) dnsState = result;
    if (!host) return;
    var pill = host.querySelector("[data-dns-pill]");
    if (pill) {
      pill.className = pillClass(dnsState);
      pill.textContent = dnsLabel(dnsState);
    }
    var guide = host.querySelector("[data-dns-guide]");
    if (guide) {
      if (guideVisible()) guide.removeAttribute("hidden");
      else guide.setAttribute("hidden", "");
    }
    var re = host.querySelector(".bs-recheck");
    if (re) re.disabled = !!(dnsState && dnsState.status === "checking");
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
    else if (act === "live") {
      var domain = target.getAttribute("data-domain") || "";
      var input = host.querySelector(".bs-liveinput");
      if (input && domain) input.value = domain;
      testUrlLive(domain);
    } else if (act === "remove") removeDomain(target.getAttribute("data-domain"));
    else if (act === "install") downloadMobileConfig();
    else if (act === "reverify") {
      guideHold = true;
      refreshSystemProbe(true);
    }
  }

  function onHostSubmit(event) {
    var form = event.target;
    if (!form || !form.classList) return;
    if (form.classList.contains("bs-add")) {
      event.preventDefault();
      var input = form.querySelector(".bs-input");
      addDomain(input ? input.value : "");
      return;
    }
    if (form.classList.contains("bs-liveform")) {
      event.preventDefault();
      var live = form.querySelector(".bs-liveinput");
      testUrlLive(live ? live.value : "");
    }
  }

  function resolveEl(el) {
    if (!el || !root.document) return null;
    if (typeof el === "string") return root.document.querySelector(el);
    if (el.nodeType === 1) return el;
    return null;
  }

  function onVisibility() {
    if (!host || !root.document) return;
    if (root.document.visibilityState === "visible") refreshSystemProbe(false);
  }

  function bindVisibility() {
    if (visBound || !root.document || !root.document.addEventListener) return;
    visBound = true;
    root.document.addEventListener("visibilitychange", onVisibility);
  }

  function unbindVisibility() {
    if (!visBound || !root.document || !root.document.removeEventListener) return;
    visBound = false;
    root.document.removeEventListener("visibilitychange", onVisibility);
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
    bindVisibility();
    refreshSystemProbe(true);
    return api;
  }

  function unmount() {
    testToken += 1;
    dnsGen += 1;
    dismissModal();
    unbindVisibility();
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

  function safariChrome(url) {
    var safe = escapeHtml(safariLabel(url));
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

  function networkProofHTML(telemetry, local) {
    var doh = telemetry && telemetry.doh;
    var html = "";
    if (!doh) {
      html += "<p class='bs-proof is-wait'>CHECKING NETWORK…</p>";
    } else if (doh.ok && doh.sinkholed) {
      html += "<p class='bs-proof'>DNS → 0.0.0.0 • BLOCKED AT NETWORK LAYER<span class='bs-ms'>" + doh.latencyMs + " ms</span></p>";
    } else if (local && local.blocked) {
      html += "<p class='bs-proof'>INTERCEPTED BY IRON ARC · " + escapeHtml(local.reason) + "<span class='bs-ms'>" + (doh.latencyMs || 0) + " ms</span></p>";
    } else if (doh.ok) {
      html += "<p class='bs-proof is-open'>DNS → " + escapeHtml(doh.ip || "RESOLVED") + "<span class='bs-ms'>" + doh.latencyMs + " ms</span></p>";
    } else {
      html += "<p class='bs-proof is-open'>" + escapeHtml(doh.comment || "DNS CHECK UNREACHABLE") + "</p>";
    }
    var system = telemetry && telemetry.system;
    if (system && system.status === "protected") {
      html += "<p class='bs-osbadge is-on'>🟢 iOS SAFARI DNS: PROTECTED (1.1.1.3 ACTIVE)</p>";
    } else if (system && system.status === "unprotected") {
      html += "<p class='bs-osbadge is-wait'>🟡 iOS SAFARI SYSTEM DNS: PROFILE NOT INSTALLED YET</p>" +
        stepsHTML() +
        "<button type='button' class='bs-install' data-act='install'><span>📲 Activate iOS System Shield</span><em>1-TAP</em></button>";
    } else if (system && system.status === "offline") {
      html += "<p class='bs-osbadge'>⚪ iOS SAFARI DNS: OFFLINE</p>";
    }
    return html;
  }

  function gateHTML(kind, domain, attemptNo, telemetry, local) {
    var safeUrl = escapeHtml(clipText(modalRawUrl || ("https://" + domain), 96));
    var markOn = kind === "blocked";
    var mark = shieldMark("bsg" + modalGen, markOn);
    var proof = "<div data-proof-slot>" + networkProofHTML(telemetry, local) + "</div>";
    if (kind === "blocked") {
      return "<div class='bs-gate' data-kind='blocked'>" +
        "<p class='bs-brand'>IRON ARC</p>" +
        mark +
        "<h2 class='bs-block-title'>🛡️ INTERCEPTED BY IRON ARC</h2>" +
        "<p class='bs-urlchip'><s>" + safeUrl + "</s></p>" +
        proof +
        "<p class='bs-quote'>\"You control your mind, not your impulses.\" — Marcus Aurelius</p>" +
        "<p class='bs-attempt'><i class='bs-live'></i> Urge #" + attemptNo + " Defeated</p>" +
        "<button type='button' class='bs-safety' data-act='safety'>⚡ Close Tab &amp; Claim +25 XP</button>" +
        canaryLinkHTML() +
        "</div>";
    }
    if (kind === "off") {
      return "<div class='bs-gate is-danger' data-kind='off'>" +
        "<p class='bs-brand'>IRON ARC</p>" +
        mark +
        "<h2 class='bs-block-title'>⚠️ SHIELD DISARMED</h2>" +
        "<p class='bs-urlchip'><s>" + safeUrl + "</s></p>" +
        proof +
        "<p class='bs-attempt is-bad'>TAP TO ARM SHIELD</p>" +
        "<button type='button' class='bs-arm' data-act='arm'>Tap to Arm Shield</button>" +
        canaryLinkHTML() +
        "</div>";
    }
    return "<div class='bs-gate is-clear' data-kind='open'>" +
      "<p class='bs-brand'>IRON ARC</p>" +
      mark +
      "<h2 class='bs-block-title'>NOT INTERCEPTED</h2>" +
      "<p class='bs-urlchip'><s>" + safeUrl + "</s></p>" +
      proof +
      "<p class='bs-attempt is-clear'>OFF THE SHIELD LIST</p>" +
      "<button type='button' class='bs-dismiss' data-act='dismiss'>Close</button>" +
      canaryLinkHTML() +
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

  function kindFor(local, telemetry) {
    var net = !!(telemetry && telemetry.doh && telemetry.doh.sinkholed);
    var blocked = !!model.master && ((local && local.blocked) || net);
    if (!model.master) return "off";
    if (blocked) return "blocked";
    return "open";
  }

  function updateModalProof(telemetry) {
    if (!modalEl || !telemetry) return;
    if (telemetry.host && telemetry.host !== modalDomain) return;
    modalTelemetry = telemetry;
    var local = (telemetry.local && telemetry.local.host === modalDomain) ? telemetry.local : blockDetail(model, modalDomain);
    var kind = kindFor(local, telemetry);
    var blocked = kind === "blocked";
    if (blocked && !modalCounted) {
      model.attempts += 1;
      modalCounted = true;
      persist();
    }
    var gate = modalEl.querySelector(".bs-gate");
    if (!gate) return;
    if (gate.getAttribute("data-kind") !== kind) {
      gate.outerHTML = gateHTML(kind, modalDomain, model.attempts, telemetry, local);
      var fresh = modalEl.querySelector(".bs-gate");
      if (fresh) {
        if (modalEl.classList.contains("is-slammed")) fresh.removeAttribute("aria-hidden");
        else fresh.setAttribute("aria-hidden", "true");
      }
      if (blocked) modalEl.setAttribute("aria-label", "Intercepted by IRON ARC");
      return;
    }
    var slot = gate.querySelector("[data-proof-slot]");
    if (slot) slot.innerHTML = networkProofHTML(telemetry, local);
    var urge = gate.querySelector(".bs-attempt");
    if (urge && kind === "blocked") urge.innerHTML = "<i class='bs-live'></i> Urge #" + model.attempts + " Defeated";
  }

  function openBlockTestModal(domain, telemetry, rawUrl) {
    ensureStyles();
    ensureKey();
    var doc = root.document;
    if (!doc || !doc.body) return getState();
    var raw = rawUrl || (telemetry && telemetry.rawUrl) || domain || "pornhub.com";
    var hostName = normalizeDomain(domain || raw) || "pornhub.com";
    modalDomain = hostName;
    modalRawUrl = prettyUrl(raw, hostName);
    modalTelemetry = telemetry || null;
    var local = (telemetry && telemetry.local) || blockDetail(model, hostName);
    var kind = kindFor(local, telemetry);
    var blocked = kind === "blocked";
    dismissModal();
    modalCounted = false;
    if (blocked) {
      model.attempts += 1;
      modalCounted = true;
      persist();
    }
    paint();
    var reduced = reducedMotion();
    modalEl = doc.createElement("div");
    modalEl.id = "bs-modal";
    modalEl.className = "bs-modal" + (reduced ? " is-slammed" : "");
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-label", blocked ? "Intercepted by IRON ARC" : "Shield check");
    modalEl.innerHTML = "<div class='bs-device'><div class='bs-screen'>" +
      safariChrome(modalRawUrl) +
      gateHTML(kind, hostName, model.attempts, telemetry, local) +
      "<div class='bs-flash'></div><i class='bs-homebar'></i></div></div>";
    var gate = modalEl.querySelector(".bs-gate");
    if (gate) {
      if (reduced) gate.removeAttribute("aria-hidden");
      else gate.setAttribute("aria-hidden", "true");
    }
    modalEl.addEventListener("click", onModalClick);
    doc.body.appendChild(modalEl);
    lockScroll();
    var gen = modalGen;
    modalTimer = root.setTimeout(function () {
      modalTimer = 0;
      slamModal(gen, blocked);
    }, reduced ? 0 : SLAM_MS);
    if (!telemetry) {
      var snapHost = hostName;
      var snapGen = modalGen;
      Promise.all([
        queryCloudflareFamilyDoH(hostName),
        probeSystemDnsShield(hostName)
      ]).then(function (pair) {
        if (snapGen !== modalGen || modalDomain !== snapHost) return;
        var packed = packTelemetry(hostName, modalRawUrl, local, pair[0], pair[1]);
        lastReceipt = {
          phase: "done",
          host: hostName,
          rawUrl: modalRawUrl,
          local: local,
          doh: pair[0],
          system: pair[1]
        };
        paintReceipt();
        setLiveBusy(false);
        updateModalProof(packed);
        if (pair[1]) applyDnsView(pair[1]);
      }).catch(function () { setLiveBusy(false); });
    }
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
      var tel = modalTelemetry;
      var raw = modalRawUrl;
      if (!model.master) toggleMaster();
      openBlockTestModal(again, tel, raw);
      return;
    }
    if (act === "install") {
      downloadMobileConfig();
      return;
    }
    if (act === "reverify") {
      guideHold = true;
      refreshSystemProbe(true);
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

  function queryCloudflareFamilyDoH(domain) {
    var hostName = normalizeDomain(domain);
    if (!hostName || typeof root.fetch !== "function") {
      return Promise.resolve({
        ok: false,
        domain: hostName || String(domain || ""),
        sinkholed: false,
        ip: null,
        ips: [],
        comment: "DoH unavailable",
        latencyMs: 0
      });
    }
    var t0 = nowMs();
    var ctrl = typeof root.AbortController === "function" ? new root.AbortController() : null;
    var timer = ctrl ? root.setTimeout(function () {
      try { ctrl.abort(); } catch (e) { /* ignore */ }
    }, DOH_TIMEOUT_MS) : 0;
    var endpoint = "https://family.cloudflare-dns.com/dns-query?name=" + encodeURIComponent(hostName) + "&type=A";
    var opts = {
      method: "GET",
      headers: { accept: "application/dns-json" },
      cache: "no-store"
    };
    if (ctrl) opts.signal = ctrl.signal;

    return root.fetch(endpoint, opts).then(function (res) {
      if (timer) root.clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      var latencyMs = Math.max(1, Math.round(nowMs() - t0));
      var answers = Array.isArray(data && data.Answer) ? data.Answer : [];
      var ips = [];
      var sinkholed = false;
      var i;
      for (i = 0; i < answers.length; i++) {
        var ip = String((answers[i] && answers[i].data) || "").trim();
        if (ip) ips.push(ip);
        if (ip === "0.0.0.0" || ip === "::" || ip === "0:0:0:0:0:0:0:0" || ip === "127.0.0.1") sinkholed = true;
      }
      var commentRaw = "";
      if (data && data.Comment) {
        commentRaw = Array.isArray(data.Comment) ? data.Comment.join("; ") : String(data.Comment);
      }
      if (/EDE\(1[567]\)|Censored|Filtered|Blocked/i.test(commentRaw)) sinkholed = true;
      return {
        ok: true,
        domain: hostName,
        sinkholed: sinkholed,
        ip: sinkholed ? "0.0.0.0" : (ips[0] || "NXDOMAIN"),
        ips: ips,
        comment: commentRaw || (sinkholed ? "EDE(16): Censored by Cloudflare 1.1.1.3" : "Resolved"),
        latencyMs: latencyMs
      };
    }).catch(function (err) {
      if (timer) root.clearTimeout(timer);
      return {
        ok: false,
        domain: hostName,
        sinkholed: false,
        ip: null,
        ips: [],
        comment: err && err.name === "AbortError" ? "DoH Timeout" : "Offline / DoH Unreachable",
        latencyMs: Math.max(0, Math.round(nowMs() - t0))
      };
    });
  }

  function probeNoCorsReachable(url, timeoutMs) {
    if (typeof root.fetch !== "function") return Promise.resolve(false);
    return new Promise(function (resolve) {
      var done = false;
      var ctrl = typeof root.AbortController === "function" ? new root.AbortController() : null;
      function finish(value) {
        if (done) return;
        done = true;
        root.clearTimeout(timer);
        resolve(!!value);
      }
      var timer = root.setTimeout(function () {
        if (ctrl) {
          try { ctrl.abort(); } catch (e) { /* ignore */ }
        }
        finish(false);
      }, timeoutMs || CANARY_TIMEOUT_MS);
      var opts = {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        credentials: "omit"
      };
      if (ctrl) opts.signal = ctrl.signal;
      try {
        root.fetch(url, opts).then(function () { finish(true); }, function () { finish(false); });
      } catch (err) {
        finish(false);
      }
    });
  }

  function probeSystemDnsShield(optionalTargetDomain) {
    var nonce = Date.now();
    var targetHost = normalizeDomain(optionalTargetDomain || "");
    var canaryUrls = [
      "https://nudity.testcategory.com/?_ia=" + nonce,
      "https://www.pornhub.com/favicon.ico?_ia=" + nonce,
      "https://www.xvideos.com/favicon.ico?_ia=" + nonce
    ];
    var jobs = [probeNoCorsReachable("https://cloudflare.com/cdn-cgi/trace", CONTROL_TIMEOUT_MS)];
    var i;
    for (i = 0; i < canaryUrls.length; i++) jobs.push(probeNoCorsReachable(canaryUrls[i], CANARY_TIMEOUT_MS));
    var extra = false;
    if (targetHost && targetHost !== "nudity.testcategory.com" && targetHost !== "pornhub.com" && targetHost !== "xvideos.com") {
      extra = true;
      jobs.push(probeNoCorsReachable("https://" + targetHost + "/favicon.ico?_ia=" + nonce, CANARY_TIMEOUT_MS));
    }
    return Promise.all(jobs).then(function (results) {
      var controlOk = !!results[0];
      var nudityUp = !!results[1];
      var pornhubUp = !!results[2];
      var xvideosUp = !!results[3];
      var anyAdult = nudityUp || pornhubUp || xvideosUp;
      var targetReached = null;
      if (targetHost === "nudity.testcategory.com") targetReached = nudityUp;
      else if (targetHost === "pornhub.com") targetReached = pornhubUp;
      else if (targetHost === "xvideos.com") targetReached = xvideosUp;
      else if (extra) targetReached = !!results[4];
      var status = !controlOk ? "offline" : (anyAdult ? "unprotected" : "protected");
      var detail = status === "protected"
        ? "Adult canaries failed while the network control responded."
        : status === "unprotected"
          ? "An adult canary loaded. The iOS DNS profile is not filtering yet."
          : "The network control did not respond.";
      return {
        status: status,
        online: controlOk,
        controlOk: controlOk,
        canaryReached: nudityUp,
        anyAdultReached: anyAdult,
        targetHost: targetHost,
        targetReached: targetReached,
        detail: detail
      };
    });
  }

  function refreshSystemProbe(forceChecking) {
    var gen = ++dnsGen;
    if (forceChecking) {
      dnsState = { status: "checking", detail: "Probing Safari DNS." };
      applyDnsView(dnsState);
    }
    return probeSystemDnsShield().then(function (result) {
      if (gen !== dnsGen) return result;
      if (result.status === "protected") guideHold = false;
      dnsState = result;
      applyDnsView(result);
      if (modalEl && modalTelemetry && modalDomain) {
        modalTelemetry.system = result;
        updateModalProof(modalTelemetry);
      }
      return result;
    });
  }

  function packTelemetry(hostName, rawUrl, local, doh, system) {
    return {
      host: hostName,
      rawUrl: rawUrl,
      local: local,
      doh: doh,
      system: system,
      sinkholed: !!(doh && doh.sinkholed),
      latencyMs: doh ? doh.latencyMs : 0
    };
  }

  function testUrlLive(rawInput) {
    var raw = String(rawInput || "").trim();
    var hostName = normalizeDomain(raw);
    if (!hostName) {
      setNote("Use a domain");
      if (host) {
        var liveBad = host.querySelector(".bs-liveinput");
        if (liveBad) {
          liveBad.value = raw;
          liveBad.classList.add("is-bad");
          try { liveBad.focus(); } catch (err) { /* ignore */ }
        }
      }
      return Promise.resolve(getState());
    }
    var token = ++testToken;
    var local = blockDetail(model, hostName);
    var pretty = prettyUrl(raw, hostName);
    liveDraft = raw;
    lastReceipt = { phase: "checking", host: hostName, rawUrl: pretty, local: local, doh: null, system: null };
    openBlockTestModal(hostName, {
      pending: true,
      host: hostName,
      rawUrl: pretty,
      local: local,
      doh: null,
      system: null
    }, pretty);
    setLiveBusy(true);
    return Promise.all([
      queryCloudflareFamilyDoH(hostName),
      probeSystemDnsShield(hostName)
    ]).then(function (pair) {
      if (token !== testToken) return getState();
      var telemetry = packTelemetry(hostName, pretty, local, pair[0], pair[1]);
      lastReceipt = {
        phase: "done",
        host: hostName,
        rawUrl: pretty,
        local: local,
        doh: pair[0],
        system: pair[1]
      };
      paintReceipt();
      setLiveBusy(false);
      updateModalProof(telemetry);
      if (pair[1]) applyDnsView(pair[1]);
      return getState();
    }).catch(function () {
      if (token !== testToken) return getState();
      setLiveBusy(false);
      return getState();
    });
  }

  function buildMobileConfig(state) {
    var strict = !!(state && state.filters && state.filters.strict);
    var rootId = PROFILE_ROOT_UUID || uuid();
    var dnsId = PROFILE_DNS_UUID || uuid();
    var desc = strict
      ? "IRON ARC Shield — Cloudflare 1.1.1.3 Adult & Malware DNS-over-HTTPS Filter (On-Demand Active)."
      : "IRON ARC Shield — Cloudflare 1.1.1.3 Adult & Malware DNS-over-HTTPS Filter.";
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
      "<key>OnDemandRules</key>",
      "<array>",
      "<dict>",
      "<key>Action</key>",
      "<string>EvaluateConnection</string>",
      "<key>ActionParameters</key>",
      "<array>",
      "<dict>",
      "<key>DomainAction</key>",
      "<string>NeverConnect</string>",
      "<key>Domains</key>",
      "<array>",
      "<string>captive.apple.com</string>",
      "<string>*.local</string>",
      "</array>",
      "</dict>",
      "</array>",
      "</dict>",
      "<dict>",
      "<key>Action</key>",
      "<string>Connect</string>",
      "</dict>",
      "</array>",
      "<key>PayloadDescription</key>",
      "<string>" + xmlEscape(desc) + "</string>",
      "<key>PayloadDisplayName</key>",
      "<string>IRON ARC DNS (1.1.1.3 Adult Filter)</string>",
      "<key>PayloadIdentifier</key>",
      "<string>com.ironarc.shield.dns</string>",
      "<key>PayloadType</key>",
      "<string>com.apple.dnsSettings.managed</string>",
      "<key>PayloadUUID</key>",
      "<string>" + dnsId + "</string>",
      "<key>PayloadVersion</key>",
      "<integer>1</integer>",
      "<key>ProhibitDisablement</key>",
      "<false/>",
      "</dict>",
      "</array>",
      "<key>ConsentText</key>",
      "<dict>",
      "<key>default</key>",
      "<string>IRON ARC Shield configures encrypted DNS-over-HTTPS (Cloudflare 1.1.1.3 Family Shield) to block adult/pornographic domains (0.0.0.0) across Safari and all apps on this iPhone. You can remove this profile anytime in Settings &gt; General &gt; VPN &amp; Device Management.</string>",
      "</dict>",
      "<key>PayloadDescription</key>",
      "<string>" + xmlEscape(desc) + "</string>",
      "<key>PayloadDisplayName</key>",
      "<string>IRON ARC Porn Blocker Shield</string>",
      "<key>PayloadIdentifier</key>",
      "<string>com.ironarc.shield</string>",
      "<key>PayloadOrganization</key>",
      "<string>IRON ARC</string>",
      "<key>PayloadRemovalDisallowed</key>",
      "<false/>",
      "<key>PayloadScope</key>",
      "<string>System</string>",
      "<key>PayloadType</key>",
      "<string>Configuration</string>",
      "<key>PayloadUUID</key>",
      "<string>" + rootId + "</string>",
      "<key>PayloadVersion</key>",
      "<integer>1</integer>",
      "</dict>",
      "</plist>",
      ""
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
      if (root.location && typeof root.location.assign === "function") root.location.assign(url);
      return true;
    }
    var link = doc.createElement("a");
    link.href = url;
    link.download = "iron-arc-shield.mobileconfig";
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

  function goProfile() {
    var href = profileHref();
    if (root.location && typeof root.location.assign === "function") root.location.assign(href);
  }

  function deliverProfile(xml) {
    var nav = root.navigator;
    var sw = nav && nav.serviceWorker;
    var ios = isIOS();

    function fallback() {
      if (ios) {
        goProfile();
        return;
      }
      blobDownload(xml);
    }

    if (!sw || !sw.controller || typeof root.MessageChannel !== "function") {
      fallback();
      return;
    }

    var settled = false;
    var timer = root.setTimeout(function () {
      if (settled) return;
      settled = true;
      fallback();
    }, 900);

    try {
      var channel = new root.MessageChannel();
      channel.port1.onmessage = function () {
        if (settled) return;
        settled = true;
        root.clearTimeout(timer);
        goProfile();
      };
      sw.controller.postMessage({ type: "ironarc-profile", xml: xml }, [channel.port2]);
    } catch (err) {
      if (!settled) {
        settled = true;
        root.clearTimeout(timer);
        fallback();
      }
    }
  }

  function downloadMobileConfig() {
    fxUnlock();
    guideHold = true;
    if (!model.master) {
      model.master = true;
      armPulse = true;
      persist();
      paint();
      fxArm(host && host.querySelector(".bs-power"));
      emitChange();
    } else {
      fxTick(640, 0.03);
      applyDnsView(dnsState);
    }
    var xml = buildMobileConfig(getState());
    deliverProfile(xml);
    setStatus(isIOS() ? "OPEN IN SETTINGS" : "PROFILE SAVED");
    return xml;
  }

  load();

  var api = {
    version: "1.2.0",
    __built: true,
    mount: mount,
    unmount: unmount,
    renderHTML: renderHTML,
    openBlockTestModal: openBlockTestModal,
    testUrlLive: testUrlLive,
    queryCloudflareFamilyDoH: queryCloudflareFamilyDoH,
    probeSystemDnsShield: probeSystemDnsShield,
    downloadMobileConfig: downloadMobileConfig,
    buildMobileConfig: buildMobileConfig,
    shouldBlock: shouldBlock,
    getState: getState,
    toggleMaster: toggleMaster
  };

  root.BlockerShield = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
