# IRON ARC — Go-To-Market Playbook

Execution kit for a 2-person team. Film tonight. Charge tonight.

**Product:** IRON ARC — NNN + Winter Arc dopamine reboot (web quiz → paywall → installable app).  
**Customer link:** `https://YOUR-DOMAIN/?mode=prod`  
**Short bio link (set this up in the checklist):** `https://YOUR-DOMAIN/go`  
**Offer you are allowed to say out loud:** 3-day free trial on the Annual Winter Arc + NNN Pass, then **$29.99/year** ($2.49/mo, $0.57/week, **$0.00 due today**). Monthly is the **$9.99** 30-Day NNN Survival Pass. Exit offer is **$14.99/year**, charged today. Optional stake is the **$15 Skin-in-the-Game Relapse Penalty Pact**.

**Split the night**

| Who | Job | Done when |
| --- | --- | --- |
| Dev | Section 2, in order. About 60 minutes. | A phone on cellular data can finish the quiz, pay on Stripe, and land back in the app with the studio bar gone. |
| Partner | Section 1, then Section 3. Do not wait for deploy. | 10 videos filmed from the real UI. First 20 DMs sent. |

Local film server (studio bar visible): `http://localhost:8080/` via `start-dev.ps1`. That server is localhost-only, so record the on-screen phone column from the PC (Win+Alt+R, or a phone camera pointed at the monitor). Crop to 9:16.

---

## 0. Rules that keep the accounts alive

Say **fold, urge, NNN, relapse, doomscroll, streak, vault**. Do not say porn, nut, fap, or horny in voiceover, on-screen text, captions, or DMs. TikTok and Instagram kill those words and the account with them.

Camera-mirror videos: face and shoulders, shirt on, dark room. No nudity.

The diagnosis screen is the ad. In the current build the studio score is **78%** on purpose (`state.quizScore`). Film **78%**. Do not retake hunting for a different number.

The streak dropdown label says `Simulate: Day 14 (Iron Monk)`. The screen itself says **CURRENT RANK: SPARTAN** and **DAY 14**. Read the screen, not the dropdown.

Hide the studio bar before you hit record. In the browser console, on the screen you want:

```js
document.getElementById("studioBar").style.display = "none"
```

If that bar, the word `Ad / Dev Studio`, or `localhost` appears in a video, delete the take.

Every video ends on a spoken CTA plus a pinned comment. Pinned comment for all 10:

```text
3-day free trial, then $29.99/year. Or $9.99 for November.
https://YOUR-DOMAIN/go
```

---

## 1. Ten word-for-word scripts

Format for every script: one take, 12–18 seconds, 9:16, native vertical screen recording of the phone column. Burn the on-screen text in CapCut or Instagram’s text tool in the top third. Leave the bottom third clear for the app’s own buttons. Voice is close-mic, flat, a little tired. Not announcer energy.

### Script 01 — Red Panic Button, the mirror

**Screen:** Red Panic Button camera mirror.  
**Open:** `6. Red Panic Button`. Allow the camera. Default streak is Day 14.  
**You must see:** red pulsing button text `RED PANIC BUTTON (EMERGENCY URGE)`, then the modal `EMERGENCY INTERVENTION ACTIVE`, the badge `● LIVE FRONT MIRROR`, and this exact HUD line:

`LOOK AT YOURSELF. DO NOT TRADE DAY 14 RESPECT FOR 5 SECONDS OF PIXELS.`

**0–2s visual hook:** Hard cut from black to the front camera inside the crimson mirror. Your eyes hit the lens. The red `● LIVE FRONT MIRROR` badge is already on. No intro, no logo.

**On-screen text:** `DAY 14. 1:14 AM. DON'T.`

**Voiceover:**

```text
Day fourteen. One fourteen AM. You're about to fold, so you hit the red button. The phone turns the camera on and puts your own face in front of the urge. Look at yourself. Do not trade day fourteen for five seconds of pixels.
```

**CTA:** Spoken: `IRON ARC. Link in bio. Three days free.` End card, 1 second, black: `IRON ARC`.

**Caption:** `Day 14. The button turns the camera on. #winterarc #nnn #discipline`

---

### Script 02 — Red Panic Button, ninety seconds

**Screen:** same panic modal. Tap `Next Reality Check ↻` once.  
**You must see:** the HUD swap to:

`THE URGE LASTS 90 SECONDS. REGRET LASTS ALL OF NOVEMBER.`

Under it: `LOCK IN YOUR BREATHING • URGE SUBSIDES IN 60s` and the circle `INHALE 4s`. Last frame holds the button `I Defeated The Urge (+1 Willpower) ✓`. Do not tap that button until the camera stops, or the modal closes.

**0–2s visual hook:** The mirror is already live. The white quote slams over your face on frame 1. You do not smile.

**On-screen text:** `THE URGE IS 90 SECONDS. NOVEMBER IS NOT.`

**Voiceover:**

```text
The urge lasts ninety seconds. Regret lasts all of November. IRON ARC keeps you on this screen until it passes. Inhale four seconds. Then you log it. Urge defeated.
```

**CTA:** Spoken: `Red button's in IRON ARC. Link in bio.`

**Caption:** `Ninety seconds. Don't throw the whole month. #winterarc #streak`

---

### Script 03 — 78% Dopamine Score, the shock

**Screen:** Score Diagnosis. Click `2. Score Diagnosis`.  
**You must see:** `ANALYSIS COMPLETE • CLINICAL BENCHMARK`, then

`Your Dopamine Dependency Score: 78%`

in red, the subline about D2 receptor desensitization **3.5x** above baseline, and the two bars: red **78%** `Your Current Stimulation Load` next to green **22%** `Healthy Male Baseline`.

**0–2s visual hook:** The red `78%` is the first frame, full width. Thumb enters from the bottom and points at the short green `22%` bar. No quiz intro before the number.

**On-screen text:** `I SCORED 78%. HEALTHY IS 22%.`

**Voiceover:**

```text
I took the IRON ARC test before November. Dopamine dependency, seventy-eight percent. The healthy male line on the same screen is twenty-two. That's the ad. That's the problem.
```

**CTA:** Spoken: `Take the test. Link in bio. It takes a minute.`

**Caption:** `78% vs 22%. I didn't like this screen. #dopamine #winterarc #nnn`

Optional insert after second 2, if you want a "I just finished" feel: cut back to quiz step `STEP 5 OF 5 • COMMITMENT PROTOCOL` and the option `Yes — Show me my Dopamine Dependency Score first`, then smash back to the 78%. The score will still be 78%.

---

### Script 04 — 78% score, the Dec 12 date

**Screen:** same diagnosis, scrolled to the green block.  
**You must see:** `Good news:` and the line that the **30-Day NNN + Winter Arc Protocol** is projected to restore baseline dopamine sensitivity by **Dec 12, 2026**. Then the milestone `Day 7: Testosterone & morning drive surge (+28% energy)`. Stop there. Do not read Day 14 and Day 30 out loud. Last visible control is `Unlock My Custom 30/90-Day Protocol →`. Do not tap it on camera (it opens the paywall and kills retention).

**0–2s visual hook:** Finger flicks up and the frame lands on `Dec 12, 2026` in emerald. The red 78% is still peeking at the top edge.

**On-screen text:** `REWIRE DATE: DEC 12.`

**Voiceover:**

```text
Seventy-eight percent today. The screen put my rewire date on December twelfth. Day seven is the first surge. I'm not waiting for January to feel like a person again.
```

**CTA:** Spoken: `IRON ARC runs the protocol. Link in bio.`

**Caption:** `It gave me a date, not a quote. Dec 12. #winterarc #dopaminedetox`

---

### Script 05 — Brotherhood snitch

**Screen:** Brotherhood Squad. `5. Live App` → bottom tab `BROTHERHOOD`.  
**You must see:** `Wolfpack Accountability Squad`, the line `If one brother folds, the entire squad gets an instant push notification. Nobody folds in the dark.`, and this row exactly:

`Devon_Lift` · red dot · `Relapsed Nov 4 • In Redemption Arc` · `Day 2` · `fallen`

Also in frame, above him: `Marcus_V` · `Survived Panic Button at 11:40 PM` · `Day 14` · `alive`.

**0–2s visual hook:** Cropped tight on Devon’s red row. The word `fallen` is readable without sound. Then a snap-zoom out so Marcus’s green row and Devon’s red row sit in the same list.

**On-screen text:** `THE APP SNITCHED.`

**Voiceover:**

```text
Marcus is on day fourteen. He hit the panic button at eleven forty PM and lived. Devon folded November fourth. The whole squad got the notification. Nobody folds in the dark.
```

**CTA:** Spoken: `Get a squad on IRON ARC before Friday. Link in bio.`

**Caption:** `Devon folded Nov 4. The group chat knew. #nnn #winterarc #accountability`

---

### Script 06 — Brotherhood, three of four

**Screen:** two cuts. First the home card, then the Kieran row.  
**You must see:** on `STREAK`, the card `Brotherhood Squad Status` / `3 of 4 brothers still standing in NNN`. Then `BROTHERHOOD`, the row `Kieran_99` · `High urge alert • Sent backup flare` · `Day 9` · `danger`.

**0–2s visual hook:** The home card, already on screen. A thumb taps `View Squad →`. Cut on the tap, not before it.

**On-screen text:** `3 OF 4 STILL STANDING.`

**Voiceover:**

```text
Three of four brothers are still in November. Kieran almost folded, so the squad sent a backup flare to his phone. That's the whole product. A streak that other people can see.
```

**CTA:** Spoken: `Squad code's in the app. Link in bio.`

**Caption:** `3 of 4 still standing. Kieran got the flare. #brotherhood #nnn`

The invite card under the list reads `Invite 1 Bro = Unlock Free Streak Shield` and `IRON-ARC-2026`. Save that card for Script 07. Do not put the code in this video’s caption or every viewer shares one public code with no tracking.

---

### Script 07 — Penalty Vault, the shield

**Screen:** Skin-in-the-Game, in-app half. `BROTHERHOOD` tab, bottom card.  
**You must see:** `Invite 1 Bro = Unlock Free Streak Shield` and `Referral Code: IRON-ARC-2026`, button `Copy Squad Invite Link`.

**0–2s visual hook:** The shield card is full frame. The emerald code `IRON-ARC-2026` is the sharpest thing in the shot. Your thumb hovers over `Copy Squad Invite Link` and does not press it until the last second.

**On-screen text:** `NO SKIN IN THE GAME = YOU'LL FOLD.`

**Voiceover:**

```text
A notes app will not keep you in November. IRON ARC makes you put skin in the game. Invite one bro, the streak shield unlocks. Or lock the fifteen-dollar relapse penalty. You fold, it costs you.
```

**CTA:** Spoken: `Lock a vault or don't start. Link in bio.`

**Caption:** `Streak shield is free if one bro joins. The penalty vault is $15. #winterarc #discipline`

If the paywall order bump is already in the build, splice one second of it at the end: the row labeled **Skin-in-the-Game $15 Relapse Penalty Pact**, toggle moving from off to on. That label is the checkout name in `funnel-module.js`.

---

### Script 08 — Penalty Vault, the $15 pact

**Screen:** the $15 stake. Preferred frame is the paywall order bump **Skin-in-the-Game $15 Relapse Penalty Pact** (`3. Paywall`).  
**Fallback frame, if that row is not in the UI yet:** `ANALYTICS` tab, the crimson card, zoomed until this phrase is readable: `stricter penalty lock`. Headline above it: `Folded in November? Enter Redemption Arc`.

**0–2s visual hook:** Toggle flips on, or the words `stricter penalty lock` fill the frame. No face. No logo.

**On-screen text:** `$15 PENALTY VAULT.`

**Voiceover:**

```text
This is the penalty vault. Fifteen dollars, locked before the month starts. Finish the thirty days and the streak stands. Fold, and the vault keeps the fifteen. That's the pact. Willpower was never going to do it.
```

**CTA:** Spoken: `IRON ARC. Penalty vault's on the paywall. Link in bio.`

**Caption:** `$15 says I finish the 30. #nnn #winterarc`

Do not say they get the $15 back. The pact is a cost if they fold. The product does not promise a refund for finishing.

---

### Script 09 — November Redemption Arc

**Screen:** `5. Live App` → `ANALYTICS`.  
**You must see:** tag `RELAPSE PREVENTION & REDEMPTION ARC`, the trigger `1. Late Night Doomscrolling (11 PM - 1 AM)` at **58%**, then the card:

`Folded in November? Enter Redemption Arc`

`Don't binge-relapse until January. Reset your counter into 30-Day Winter Arc Redemption Mode with a stricter penalty lock.`

Button: `Log Relapse & Activate 30-Day Redemption Arc`

**0–2s visual hook:** The 58% red bar is frame 1. Immediate pan down to `Folded in November?` Do not open with your face.

**On-screen text:** `FOLDED? DON'T WAIT FOR JANUARY.`

**Voiceover:**

```text
Most guys fold in week one and then binge until New Year's. IRON ARC doesn't let you. You log it, and it throws you into a thirty-day redemption arc with a stricter penalty lock. November is not over.
```

**CTA:** Spoken: `Start the redemption arc tonight. Link in bio.`

**Caption:** `Folded Nov 4. January is a cope. #winterarc #nnn #redemption`

---

### Script 10 — Redemption Arc, Day 1 again

**Screen:** same button, then the reset. Have `Simulate: Day 14` loaded so the “before” is SPARTAN. Hit `Log Relapse & Activate 30-Day Redemption Arc`. The app jumps to `STREAK` at **DAY 1**, rank **INITIATE**.  
**You must see the after-state:** `CURRENT RANK: INITIATE`, `DAY 1`, and the oath button `HOLD FOR 1.5s TO PLEDGE TODAY'S OATH`.

**0–2s visual hook:** Thumb presses `Log Relapse & Activate 30-Day Redemption Arc`. Cut on the press. Next frame is giant `DAY 1`. That contrast is the whole hook. If the cut is slow, the video fails.

**On-screen text:** `HE FOLDED. THE APP RESET HIM.`

**Voiceover:**

```text
He folded. The app didn't pat him on the back and say try again in January. Day one. Initiate. Stricter lock. Hold the oath for one and a half seconds and November restarts tonight.
```

**CTA:** Spoken: `IRON ARC. Link in bio. Get back on the board.`

**Caption:** `Day 14 to Day 1. That's the redemption arc. #winterarc #streak`

---

### What to post first

Post in this order, one account each, then rotate. These three carry the cold click:

1. Script 03 (78% vs 22%)
2. Script 01 (camera mirror)
3. Script 05 (Devon snitch)

Hold 07 and 08 until the $15 row is actually on the paywall, unless you used the fallback frames and the voiceover matches what is visible.

Whichever organic post clears **25,000 views**, that file becomes the paid ad. Run it as a TikTok Spark Ad and a Meta partnership ad. Send the traffic to `https://YOUR-DOMAIN/go`.

---

## 2. Production go-live checklist (under 60 minutes)

Do the steps in order. Deploy twice: once to get a URL, once after Stripe, pixels, and `?mode=prod` are in the files.

**Upload only the web app.** Include `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, plus `funnel-module.js`, `features-module.js`, and `dopamine-fx.js` when those files are in the folder. Leave `start-dev.ps1` and the markdown files on your machine.

### Minute 0–8 — Deploy once, get a URL

Pick one host. All three are free. You need the `https://` URL before Stripe will redirect customers home.

**Netlify (fastest, no terminal)**  
1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).  
2. Drag the web files onto the page.  
3. Copy the `https://something.netlify.app` URL.

**Cloudflare Pages**  
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.  
2. Project name `iron-arc`. Upload the same files.  
3. Copy the `https://iron-arc.pages.dev` URL.

**Vercel**  
1. [vercel.com/new](https://vercel.com/new) → upload the folder, framework **Other**, no build command, output directory `.`  
2. Or, if Node is installed:

```powershell
cd C:\Users\wcck4\Documents\NNN_App
npx vercel --yes
```

3. Copy the `https://….vercel.app` URL.

Put that URL in a note as `DOMAIN`. Every link below uses it.

### Minute 8–25 — Four Stripe Payment Links

Stripe Dashboard → **Payment Links** → **New**. Turn on **Apple Pay** and **Google Pay** (Settings → Payment methods) before you create the links. Email on, address off, promo codes off.

Create one price per row, then one Payment Link per price.

| Paste this key | Product name in Stripe | Price | Trial | Success URL |
| --- | --- | --- | --- | --- |
| `annual` | Annual Winter Arc + NNN Pass | $29.99 / year | 3 days | `https://DOMAIN/?mode=prod&checkout=success&plan=annual` |
| `monthly` | 30-Day NNN Survival Pass | $9.99 / month | none | `https://DOMAIN/?mode=prod&checkout=success&plan=monthly` |
| `downsell` | Founder Commitment, full year | $14.99 / year | none, charge today | `https://DOMAIN/?mode=prod&checkout=success&plan=downsell` |
| `penaltyStake` | Skin-in-the-Game Relapse Penalty Pact | $15 once | none | `https://DOMAIN/?mode=prod&checkout=success&plan=penaltyStake` |

On each link: **After payment** → **Don't show confirmation page** → redirect to the success URL in that row. Copy the `https://buy.stripe.com/...` URL.

Payment Links cannot add a bump inside the same charge. Wire them as four separate checkouts:

- Annual trial button → `annual`
- Monthly plan → `monthly`
- Exit-offer button `Claim 50% OFF & Enter Dashboard →` → `downsell`
- Penalty vault / the $15 pact button → `penaltyStake`

A customer who wants the subscription and the vault pays twice, on purpose, until you add a backend. Do not block launch on a combined charge.

### Minute 25–35 — Paste the links into `funnel-module.js`

Open `C:\Users\wcck4\Documents\NNN_App\funnel-module.js`. Find `CHECKOUT_CONFIG` and `stripeLinks`. Replace only the four URL strings. Keys are `annual`, `monthly`, `downsell`, `penaltyStake`.

```js
stripeLinks: {
  annual: "https://buy.stripe.com/PASTE_ANNUAL",
  monthly: "https://buy.stripe.com/PASTE_MONTHLY",
  downsell: "https://buy.stripe.com/PASTE_DOWNSELL",
  penaltyStake: "https://buy.stripe.com/PASTE_PENALTY"
}
```

Leave a key as an empty string only if you want that button to keep the on-screen demo wallet. An empty `annual` link means the trial button will not take money.

Search the file for `stripeLinks` and confirm those four keys exist before you upload. The live buttons that must leave the site:

- `Start My 3-Day Free Trial & Lock In →` → `buy.stripe.com` for `annual` or `monthly`, matching the selected card
- `Claim 50% OFF & Enter Dashboard →` → `downsell`
- The $15 penalty control → `penaltyStake`

If a button dumps the user into the streak dashboard without Stripe, the string is empty or the click handler is still the old demo (`state.screen = "app"` in `app.js`). Point that click at the matching `stripeLinks` URL.

### Minute 35–42 — Hide the Dev Studio bar with `?mode=prod`

Customer-facing URL, the one in ads, bios, and pinned comments:

```text
https://DOMAIN/?mode=prod
```

That query is what hides `#studioBar` (`Ad / Dev Studio`, the six jump buttons, and the streak simulator). Filming stays on `http://localhost:8080/` with no query, so the partner can still jump screens.

**Test, local, before you redeploy:**

1. `http://localhost:8080/` shows `Ad / Dev Studio`.
2. `http://localhost:8080/?mode=prod` does not. The quiz still loads.

If the bar is still visible on `?mode=prod`, paste this at the top of the startup code in `app.js`, above `render();`:

```js
(function applyLaunchMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") !== "prod") return;
  const bar = document.getElementById("studioBar");
  if (bar) bar.remove();
  document.documentElement.dataset.mode = "prod";
})();
```

Then set the installed-app start URL so a home-screen install does not bring the studio bar back. In `manifest.webmanifest`:

```json
"start_url": "./index.html?mode=prod"
```

**Clean link for bios.** Add one redirect so `https://DOMAIN/go` lands on `/?mode=prod`.

Netlify, file `_redirects`:

```text
/go  /index.html?mode=prod  302
```

Cloudflare Pages, file `_redirects` (same line).

Vercel, file `vercel.json`:

```json
{
  "redirects": [
    { "source": "/go", "destination": "/index.html?mode=prod", "permanent": false }
  ]
}
```

Use `https://DOMAIN/go` in bios and DMs. Use `https://DOMAIN/?mode=prod` when you need to see the query yourself.

### Minute 42–52 — TikTok Pixel and Meta Pixel

Create the pixels first:

- Meta Events Manager → **Connect data** → **Web** → **Meta Pixel**. Copy the pixel ID.
- TikTok Ads Manager → **Tools** → **Events** → **Web Events** → **TikTok Pixel**. Copy the pixel ID.

Paste this in `index.html` immediately before `</head>`. Replace both IDs.

```html
<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'META_PIXEL_ID');
  fbq('track', 'PageView');
</script>

<!-- TikTok Pixel -->
<script>
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    var ttq = w[t] = w[t] || [];
    ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.load = function (e, n) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
      ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
      ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      n = document.createElement("script"); n.type = "text/javascript"; n.async = true;
      n.src = r + "?sdkid=" + e + "&lib=" + t;
      e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e);
    };
    ttq.load('TIKTOK_PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>

<script>
  window.IronArcPixels = (function () {
    var values = { annual: 29.99, monthly: 9.99, downsell: 14.99, penaltyStake: 15 };
    function once(key) {
      try {
        if (sessionStorage.getItem(key)) return false;
        sessionStorage.setItem(key, "1");
        return true;
      } catch (e) { return true; }
    }
    function meta(event, params) { if (window.fbq) window.fbq("track", event, params || {}); }
    function tiktok(event, params) { if (window.ttq) window.ttq.track(event, params || {}); }
    return {
      viewContent: function () {
        if (!once("ia_vc")) return;
        var p = { content_name: "IRON ARC Quiz", content_category: "NNN" };
        meta("ViewContent", p);
        tiktok("ViewContent", p);
      },
      quizFinish: function (score) {
        if (!once("ia_reg")) return;
        var p = { content_name: "Dopamine Score", status: String(score || 78) };
        meta("CompleteRegistration", p);
        tiktok("CompleteRegistration", p);
      },
      paywall: function (plan) {
        if (!once("ia_ic_" + (plan || "annual"))) return;
        var p = {
          content_name: "IRON ARC Pro",
          content_ids: [plan || "annual"],
          currency: "USD",
          value: values[plan] || values.annual
        };
        meta("InitiateCheckout", p);
        tiktok("InitiateCheckout", p);
      },
      purchase: function (plan) {
        var key = "ia_buy_" + (plan || "annual");
        if (!once(key)) return;
        var p = {
          content_name: plan || "annual",
          currency: "USD",
          value: values[plan] || values.annual
        };
        meta("Purchase", p);
        tiktok("CompletePayment", p);
      }
    };
  })();
</script>
```

TikTok’s purchase event is **`CompletePayment`**. That is the event Ads Manager optimizes when the campaign objective says Purchase. Meta’s purchase event is **`Purchase`**. The helper fires both names on the Stripe return.

**When each event fires**

| Event | Moment | Where to call it |
| --- | --- | --- |
| `ViewContent` | Quiz first paints | Start of the quiz render, once per session |
| `CompleteRegistration` | Quiz finish, the instant the diagnosis screen appears | The branch that leaves the last quiz step for the score screen. Pass the score (`78` in the studio). |
| `InitiateCheckout` | Paywall appears | Start of the paywall render. Pass `annual` or `monthly` from the selected plan. |
| `Purchase` | Stripe redirects home | Page load, only when the URL contains `checkout=success` |

Call sites, matching the current screen functions:

```js
// Quiz screen painted
window.IronArcPixels && window.IronArcPixels.viewContent();

// Last quiz answer — diagnosis is about to show (quiz finish)
window.IronArcPixels && window.IronArcPixels.quizFinish(state.quizScore);

// Paywall painted
window.IronArcPixels && window.IronArcPixels.paywall(state.selectedPlan);

// Boot, after the pixel helper exists
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get("checkout") === "success" && window.IronArcPixels) {
    window.IronArcPixels.purchase(q.get("plan") || "annual");
  }
})();
```

`sessionStorage` stops a refresh from firing a second `Purchase`.

**Value you send**

| `plan` | `value` | What Stripe actually takes today |
| --- | --- | --- |
| `annual` | 29.99 | $0.00 until the 3-day trial ends |
| `monthly` | 9.99 | $9.99 |
| `downsell` | 14.99 | $14.99 |
| `penaltyStake` | 15 | $15 |

The annual pixel value is the contract price, so the ad algorithms have a number to optimize. Day-0 cash for that plan is **$0**. Scale spend off the Stripe balance and trial-to-paid, not off Ads Manager ROAS alone. The downsell ($14.99 today) is the cash event.

### Minute 52–55 — Cache bust, then redeploy

`sw.js` is cache-first under `iron-arc-v1`, and the cached list does not include the new modules. A customer can get yesterday’s app with no Stripe and no pixels.

1. Change `CACHE_NAME` to `iron-arc-v2` (bump the number on every later deploy).
2. Add every new JS/CSS file you ship to the `ASSETS` array (`funnel-module.js`, `features-module.js`, `dopamine-fx.js`, and anything else `index.html` loads).
3. Confirm `index.html` loads those files **before** `app.js`.
4. Drag the folder to the host again, or run `npx vercel --yes --prod`.

### Minute 55–60 — Prove it on a phone

Use cellular, not the office Wi-Fi you deployed from. Chrome extensions for the desk check: **Meta Pixel Helper** and **TikTok Pixel Helper**.

- [ ] `https://DOMAIN/?mode=prod` opens the quiz. No `Ad / Dev Studio` text anywhere.
- [ ] `https://DOMAIN/go` lands on that same quiz.
- [ ] Pixel Helper shows `PageView` and `ViewContent` on load.
- [ ] Finish all quiz steps. Diagnosis shows. Helper shows `CompleteRegistration`.
- [ ] Continue to the paywall. Helper shows `InitiateCheckout`.
- [ ] Annual button opens `buy.stripe.com`, not the streak screen.
- [ ] Close the paywall with `✕`. `Claim 50% OFF` opens the **$14.99** link.
- [ ] Pay the downsell on your own card. You return to `/?mode=prod&checkout=success&plan=downsell` and the helper shows Meta `Purchase` and TikTok `CompletePayment` **once**. Refresh. It does not fire again.
- [ ] Refund that $14.99 in Stripe → Payments.
- [ ] Home-screen install (optional): the opened app still has no studio bar.

Stop. You are live. Custom domain `ironarc.app` is a DNS job for tomorrow (CNAME the host gives you). Ads can run on `DOMAIN/go` tonight.

---

## 3. Influencer and theme-page DMs

**Who to DM:** gym, calisthenics, stoic, Winter Arc, and meme pages. **10k–150k followers.** Skip celebrities. The partner sends these. 50 DMs gets you 3–8 posts.

**The only two offers**

- **$20 flat** — one 9–15 second post, live within 48 hours, link up for 24 hours.
- **$1.50 CPM** — $1.50 per 1,000 views, counted on day 7, **capped at $300** (200,000 views). Views past the cap are unpaid.

A 40,000-view post on the CPM deal pays **$60**. If a page refuses the cap, switch them to the $20 flat. Do not sign an uncapped CPM.

**What they post:** your finished cut of Script 01 or Script 05. They do not improvise a medical claim. They add one line in their own voice at the start if they want, then the screen recording. Face-and-shoulders only if they appear.

**Link:** `https://DOMAIN/go?utm_source=PLATFORM&utm_medium=influencer&utm_campaign=nov_wave1&utm_content=HANDLE`  
Example: `https://ironarc.app/go?utm_source=instagram&utm_medium=influencer&utm_campaign=nov_wave1&utm_content=stoicdaily`

**Pay:** PayPal, Venmo, or Revolut. Flat fee within 12 hours of the post going live. CPM on day 7 against a screenshot of the view count plus the live URL. No pay for a deleted post or a post that still shows the studio bar.

Replace the brackets before you send. Keep their handle’s capitalization.

### DM-1 — Gym page, first touch

```text
Yo {Handle} — your {last lift / 5am} clip is the audience I'm buying for.

I run IRON ARC, a November streak app. The feature that films well is a red panic button: it turns the front camera on when a guy is about to fold at 1am.

$20 flat for one 12-second post this week, or $1.50 per 1,000 views capped at $300. I send the cut. You post it. Link in bio for 24h (or a pinned comment if you won't touch the bio).

Want the video?
```

### DM-2 — Stoic / Winter Arc page, first touch

```text
{Handle} — posting because your page already talks like November.

IRON ARC is the Winter Arc streak app: dopamine score, a squad that gets notified if someone folds, and a $15 penalty vault if you want skin in the game.

$20 for one post, or $1.50 CPM capped at $300. I send a finished 12-second screen recording. You add a line in your voice if you want. Link up for a day.

Should I send it?
```

### DM-3 — Meme page, first touch

```text
{Handle} this is a paid post, not a collab-for-exposure thing.

$20 to post a 12-second clip: a guy's NNN squad app snitches the night his boy folds. Or $1.50 per 1k views, cap $300, paid on day 7.

I send the file. You don't write copy. You in?
```

### DM-4 — No reply, day 2

```text
Bumping this once. $20 for one post, file's ready, you keep the page. If it's a no I'll leave it.
```

Stop after this. Do not send a third.

### DM-5 — They ask “what’s the rate?”

```text
Two options, you pick:

1) $20 flat. One post. I pay within 12 hours of it going live.
2) $1.50 per 1,000 views, paid day 7, cap $300. A 40k view post is $60. Anything past 200k views doesn't add pay.

I send the video. 9–15 seconds. Link in bio for 24 hours, or the first comment if bio is off the table. Which one?
```

### DM-6 — They ask for the video first

```text
Sending it. 12 seconds, already cut.

Post it unchanged except you can add one opening line in your voice. Don't add claims about testosterone or brain scans past what's on screen.

Reply "$20" or "CPM" and the handle I should put on the link. I'll send the caption + URL in the same message as the file.
```

### DM-7 — Close the $20 deal

```text
Locked. $20 flat via {PayPal / Venmo / Revolut}: {your handle}.

Deal:
- One post, TikTok or Reels, within 48 hours
- The file I send, no extra claims, no studio bar in frame
- Link live for 24 hours: {URL with their utm_content}
- Caption below
- You send me the live URL
- I pay within 12 hours of that URL

Caption:
{paste the caption from the script}

Pinned comment:
3-day free trial, then $29.99/year. Or $9.99 for November.
{URL}

Reply "posted" with the link and I'll pay.
```

### DM-8 — Close the $1.50 CPM deal

```text
Locked. $1.50 per 1,000 views, cap $300, paid on day 7.

Deal:
- Post the file within 48 hours, keep it up 7 days
- Link live 24 hours: {URL}
- Day 7 you send the view-count screenshot + the live URL
- I pay {PayPal / Venmo / Revolut} {your handle} against that screenshot
- 40,000 views = $60. 200,000 views = $300. Views above that are unpaid.

Same caption and pinned comment as I paste under this.

Reply "posted" with the URL when it's up. I'll calendar day 7.
```

### DM-9 — Posting brief (send with the file, either deal)

```text
Brief:
- 9:16, post native, not a repost watermark from another app
- On screen at some point: the words IRON ARC
- Say "link in bio" once, or point at the comment
- Shirt on if you're in frame
- Words to avoid: porn, nut, fap. Say fold, urge, NNN, streak
- Don't mention a price unless you use the pinned comment I wrote
- If TikTok offers a Spark code after you post, send it. I only run ads on posts that already cleared 25k organically, and I'll ask before spending.
```

### DM-10 — It’s live, flat-fee pay

```text
Saw it. Paying $20 now to {payment handle}.

If you can leave the link up the full 24 hours, do. Send a Spark / partnership code only if you're fine with me boosting this exact post. I won't edit it.
```

### DM-11 — Day 7, CPM pay

```text
Day 7. Views on the screenshot: {N}.
{N} / 1000 × $1.50 = {amount}, cap $300.
Paying {amount} to {payment handle}. Thanks for keeping it up.
```

### Tracker

Copy this into a sheet. One row per page.

| Handle | Platform | Followers | Script sent | Offer | Status | Live URL | Views day 7 | Owed | Paid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| @example | IG | 40k | 05 snitch | $20 | posted |  |  | $20 |  |

Status words: `dm1`, `bumped`, `talking`, `locked`, `posted`, `paid`, `dead`.

Daily target until 8 posts are locked: **25 new DMs**. Gym in the morning, stoic after lunch, meme pages at night. Personalize the bracket in line 1 or don’t send it.

---

## 4. Seven-day board

Assume go-live is Day 0 (tonight).

| Day | Dev | Partner |
| --- | --- | --- |
| 0 | Finish Section 2. Refund the test payment. | Film 01, 03, 05. Send 25 DMs. Post 03 from your own account. |
| 1 | Watch Stripe. Fix any button that doesn’t open `buy.stripe.com`. | Post 01 and 05. 25 more DMs. Reply to every DM from yesterday. |
| 2 | Add `ironarc.app` when DNS is ready. Point `/go` at `?mode=prod`. | Post 02 and 06. First influencer should be live or replaced. |
| 3 | Read pixel counts: quiz finish vs paywall vs purchase. | Post 09. Shift DMs toward whichever script is getting views. |
| 4 | If purchases are only the annual trial, push the partner to mention the score test, not the price. | Post 04 and 10. |
| 5 | Bump `sw.js` cache name if you shipped a fix. | Post 07 only if the $15 row is on screen. |
| 6 | Pull Stripe net vs ad spend. Kill any CPM deal already at the $300 cap. | Take the organic winner (25k+ views) and turn on Spark / partnership ads to `/go`. |
| 7 | Pay every CPM invoice from the screenshots. | Pay them. DM the next 25 pages with the winning script, not all 10. |

Own-account pace: 2 posts a day across TikTok, Reels, and Shorts. One phone, three apps, same file. Do not post all 10 in one hour from a brand-new account.

---

## 5. Screen map (so nobody films the wrong frame)

| Ad moment | Click path | Exact words that prove you’re on the right screen |
| --- | --- | --- |
| Panic mirror | `6. Red Panic Button` → Allow camera | `● LIVE FRONT MIRROR` and `DO NOT TRADE DAY 14 RESPECT FOR 5 SECONDS OF PIXELS.` |
| Panic, 90 seconds | Same modal → `Next Reality Check ↻` once | `THE URGE LASTS 90 SECONDS. REGRET LASTS ALL OF NOVEMBER.` |
| 78% shock | `2. Score Diagnosis` | `Your Dopamine Dependency Score: 78%` and green `22%` |
| Dec 12 | Diagnosis, scroll | `Dec 12, 2026` and `Unlock My Custom 30/90-Day Protocol →` |
| Snitch | `5. Live App` → `BROTHERHOOD` | `Devon_Lift` · `Relapsed Nov 4 • In Redemption Arc` · `fallen` |
| 3 of 4 | `STREAK` card, then `BROTHERHOOD` | `3 of 4 brothers still standing in NNN` and `Kieran_99` · `Sent backup flare` |
| Penalty shield | `BROTHERHOOD`, bottom card | `Invite 1 Bro = Unlock Free Streak Shield` |
| $15 vault | `3. Paywall` order bump, or `ANALYTICS` fallback | `Skin-in-the-Game $15 Relapse Penalty Pact` or `stricter penalty lock` |
| Redemption | `ANALYTICS` | `Folded in November? Enter Redemption Arc` |
| Reset to Day 1 | Tap `Log Relapse & Activate 30-Day Redemption Arc` | `CURRENT RANK: INITIATE` · `DAY 1` |

Other quotes on the panic button, if you need a spare take: `EVERY OTHER GUY IS FOLDING RIGHT NOW. THIS IS WHERE YOU SEPARATE.` and `DROP AND DO 25 PUSHUPS RIGHT NOW. CHANGE YOUR PHYSIOLOGY IMMEDIATELY.`

Paywall lines, if a video needs the price on screen for one second and no longer: `3-DAY FREE TRIAL • SAVE 75%`, `Then $29.99/year ($0.57/week)`, `$2.49 / month`, and `$0.00 due today on Annual Trial`. The exit offer is `ONE-TIME COMMITMENT SCHOLARSHIP`, `$14.99/yr` under a struck `$29.99`.
