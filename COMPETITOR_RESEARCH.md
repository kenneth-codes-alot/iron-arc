# Competitor research: NNN, porn recovery, dopamine detox, and habit accountability

Research date: 28 October 2026.  
Scope: QUITTR, Brainbuddy, Fortify, I Am Sober, Opal, Forfeit, and Streaks, plus the Winter Arc / dopamine-detox creative cluster around them.

This is a product and monetization brief, not an audit. Founder revenue figures are quoted as claims. Third-party install and revenue estimates often disagree with those claims, especially once web checkout (Stripe) sits outside App Store reporting. Where a number is unaudited, the source is named.

---

## How to read the money claims

| App | What is actually known | Confidence |
| --- | --- | --- |
| QUITTR | Co-founder Alex Slater told *New York* magazine (5 Mar 2026) the app does **more than $500k/month**, with **1.5M downloads**. Sensor Tower, via that article, estimated **~1M MAU** and said QUITTR was the most-downloaded app in the category globally in 2025. Earlier founder statements: **~$140k in 3 months** and **$250k MRR within ~4 months** of the July 2024 launch; **~$30/year** in the US by the 2026 profile. App Store listing (fetched Oct 2026): **34k ratings, 4.7, age 18+**, “Join over 2,000,000 users.” | Revenue is founder-reported. MAU is a third-party estimate. Treat $500k/month as the public ceiling, not a bank statement. |
| Brainbuddy | Live since **11 Nov 2013**. US listing: **~26k ratings, 4.7, age 16+**. Adapty’s paywall library (captured 2024, refreshed Oct 2026) estimates on the order of **$40k–$100k/month** at low download volume. ScreensDesign’s older snapshot says **~$35k/month**. A 2023 marketing page cites Sensor Tower for “top-grossing.” | Directional. It is a durable, high-ARPU niche app, not a 2025 viral spike. |
| Opal | Founder Kenneth Schlenker, RevenueCat *Sub Club* (Jan 2024): near zero to **about $5M ARR in ~12 months**, steered by **Day-8 ROAS above 100%**. Current public pricing is a real product page, not an estimate. | ARR is a 2024 founder interview. Pricing below is from opal.so. |
| I Am Sober | **~190k ratings, 4.9**. Site claims **127M+ daily pledges**, **30M+ addictions tracked**, **11M+ stories**. No public revenue. | Usage claims are company-reported. The free loop is the product. |
| Streaks | **$5.99 one-time**, no subscription. **~27k ratings, 4.8**, Apple Design Award, Editors’ Choice. Listing has ranked **#1 Health & Fitness**; chart rank moves. | Pricing and model are certain. Revenue is not public. |
| Forfeit | Two different products share the name. The YC app at forfeit.app charges a **$10.99/month** subscription and **separate real-money penalties**. An unrelated App Store app, “Forfeit: Habit Commitment,” uses **symbolic** stakes and a one-time Pro purchase. | Pricing pages and terms are primary sources. |
| Fortify | Public pricing page: **$0 basic**, **$12/month** or **$89.99/year**. | Pricing is primary. Revenue is not public. |
| Winter Arc | winterarc.space is a **free, no-ads** habit tracker with share cards and ready-made seasons. It is a distribution format more than a paywall machine. | Product pages, Oct 2026. |

Screen-recording libraries (ScreensDesign) still show QUITTR near **$25k/month** and Brainbuddy near **$35k/month**. Those snapshots undercount a web/Stripe business and lag the 2026 founder claims. Do not plan against them.

---

## 1. The QUITTR funnel, and why it prints cash

QUITTR’s growth is not an App Store ranking story. On 6 Oct 2026, ASOitis checked US App Store search: **“quit porn,” “porn blocker,” “porn addiction,” and “stop porn” returned no apps**. The brand query “quittr” had popularity 60 and QUITTR ranked #1. It also ranked **#1 for “nofap.”** “Dopamine detox” (popularity 20, difficulty 17) was open, and QUITTR was **not in the top 50**.

So the funnel has to do three jobs the store will not do: create the demand, diagnose the buyer, and charge them before they talk themselves out of it.

### What they actually built

Stack, from Alex Slater’s BoringCashCow interview: **SwiftUI, Firebase, Superwall**. Superwall is the important part. Paywalls, prices, and exit offers can change without an App Store release. That is how a 10-day MVP becomes a pricing lab.

Distribution, same interview and the *New York* profile:

1. Product Hunt flopped.
2. Reddit (r/NoFap) made about **$2.5k** before a self-promo ban.
3. Co-founder Connor McLaren put up **$3,000** for Christian Instagram creators. Founder account: **$3k turned into $35k**. *New York* reports the first month, including creator Reshaud (~700k followers), netted about **$30k**.
4. After that, creators are paid **per thousand views**. McLaren’s rate in the 2026 profile: **about $2,000–$3,000 per million views** ($2–$3 CPM).
5. Slater said they were splitting **about half of revenue** back into ads and influencers, and claimed **~90% profit** before that reinvestment. Read those together as a high-gross-margin app that spends its margin on paid distribution.
6. He also said **UGC had not worked yet**. Whitelisted creators and native posts did. Polished “best self” ads did not, in his telling.
7. Web checkout exists. Subscription terms list **Apple, Google, and Stripe**. The web start URL is `join.quittrapp.com`.

### The onboarding sequence

Two independent recordings describe the same machine.

ASOitis installed the app on 6 Oct 2026: **about 2 minutes 50 seconds, 35+ screens**, framed as an assessment. A ScreensDesign capture of an earlier build runs even longer and names every question. The order below merges both. Copy in quotes is from those teardowns or from *New York*’s reporter, who went through the same quiz.

1. **Diagnosis frame, not a signup.** “Welcome! Let’s start by finding out if you have a problem with porn.”
2. **Hand them an object before they give you anything.** A holographic membership card appears with “Active streak: 0 days” and today’s date. The same card returns on the paywall. Paying feels like keeping a thing they already hold.
3. **Account prompt early** (Google sign-in in the longer capture), then the quiz.
4. **Numbered questions, visible progress, a Skip link on every screen.** Named questions include gender, how often they view pornography, where they heard about the app (Instagram, TikTok, X, Facebook, Google, therapist), whether the content has gotten more extreme, age of first exposure, difficulty with arousal, using it to cope, using it when stressed, using it out of boredom, and whether they have spent money on content.
5. **Name and age, then a fake wait.** “Calculating” → “Analysis Complete.”
6. **The score.** Both *New York*’s reporter and the ASOitis tester, who answered “a few times a week,” received **64% versus an “average” of 40%**, labeled “64% higher dependence.” The arithmetic is wrong (64 is 24 points above 40, which is 60% higher, and 64% of what is never defined). The screen says it is **not a medical diagnosis**. The quiz then claims QUITTR helps people quit **76% faster than willpower alone**. That claim is the company’s, and a University of New Mexico researcher told *New York* there is not much evidence that porn “rewires” the brain.
7. **Symptom checklist** across mental, physical, social, and faith. The button is “Reboot my brain.” The user describes their own pain in the product’s words. This is the sale.
8. **Education carousel.** “Porn is a drug,” “destroys relationships,” “shatters sex drive,” “Feeling unhappy?,” then “Path to Recovery.” Problem, agitate, hope.
9. **Social proof and borrowed authority.** “2,000,000 users,” press logos, benefit slides, quotes attributed to Andrew Huberman and Steven Bartlett (the teardown notes these are general dopamine quotes, not endorsements), testimonials, then a chart of QUITTR rising versus willpower relapsing.
10. **Goals, then the system asks.** App Tracking Transparency, a referral code, and an App Store rating prompt, all **before the user has used the product**. The rating ask sits at peak emotion.
11. **Commitment artifact.** A signature, a personalized plan, a **specific quit date** (“Jan 4, 2027” for the October tester), a Day 0–Day 7 preview, and a notification opt-in.
12. **Hard paywall.** One button, “Become a QUITTR.” Under it: “Purchase appears Discretely · Cancel Anytime.” Annual is pre-selected. Lifetime sits beside it. Urgency copy on the plan sheet: “60% Off Sale · 9 spots remaining,” while an earlier card says “Get 80% off.” Scarcity on a digital good, and two different discounts in one flow.

Founder analytics claims, repeated by secondary writeups and **not independently audited**: **99% of people who start the quiz finish it**, and **25% of downloads become paying users**. Industry web-quiz completion is far lower (see section 3). A painful, private topic can beat that median. A 25% download-to-paid rate would be extraordinary for a consumer subscription and should be treated as a ceiling to test, not a forecast.

### Why the hard paywall is the product

McLaren, via *New York*: when the app was free, people did not use it, because “when something’s free, there’s no value in it.”

That is the opposite of Duolingo and of I Am Sober. In this category the paywall is a commitment device. The quiz manufactures the commitment; the charge locks it in. A free week lets the user relapse, feel shame, and delete the app before the card is charged.

### Price history, which is the useful part

They have not had one price. They have had a ladder they keep testing.

| When / source | Offer |
| --- | --- |
| Early founder interview (BoringCashCow) | **$12.99/month**, **$39.99/year**, **$20/year if you dismiss the paywall**. Stated **AOV $20**. |
| Secondary Mar 2025 writeup of the same era | $12.99/month or about **$45/year**. |
| *New York*, Mar 2026 | About **$30/year** in the US. |
| ASOitis install, India storefront, 6 Oct 2026 | Annual **₹2,999** pre-selected (struck-through “$14.99”), lifetime **₹4,999** (struck-through “$449.99”). No monthly plan and **no trial** in that recording. US product page described as testing **$9.99–$49.99**. |
| US App Store IAP list, fetched Oct 2026 | Multiple live products at once: yearly **$19.99 and $29.99**, monthly **$9.99 and $14.99**, lifetime **$49.99**. A reviewer describes paying **$50 lifetime** against a struck-through **$450**. |
| ScreensDesign chapter list | Includes both an urgency paywall and a **free-trial paywall**. So trials have been tested even when a later install showed none. |

The pattern that matches the stated $20 AOV: **show ~$40/year, pre-select it, and catch the dismiss with ~$20/year.** Lifetime at roughly **1.7× to 2×** the annual price (₹4,999 vs ₹2,999; $49.99 vs $29.99) is the decoy for people who hate subscriptions. The $450 reference price is doing anchoring work and, in reviews, also doing trust damage. A believable anchor is closer to Opal’s $399 lifetime against a $99 annual plan than a $450 price that never existed.

### What the app sells after the charge

From the company about page, the *New York* profile, and the App Store listing:

- **Panic Button.** *New York* calls it the most-used feature. Front camera turns on. Early copy was shame: “What’s your excuse this time?” and “You’re going to regret it like you always do.” The current about page reframes the same mechanic as CBT self-confrontation and says shame feeds the habit. The camera is the feature. The insult was the first version of the copy, and they walked it back.
- **Streak plus morning pledge.** 24-hour commitment, then a streak you “build and protect.”
- **Rank ladder.** The reporter’s dashboard went from **Sprout (0 days)** to **Pioneer (5 days)** and topped out at **Nirvana (90 days)**. Intermediate names were not published.
- **Brain-rewiring bar.** At two weeks the reporter was shown **14% rewired**, styled like a delivery tracker. If the bar only moves with the calendar, it is a prop. If check-ins and survived urges move it, it is a daily reason to open the app.
- **Life tree.** The current store description copies Brainbuddy’s tree language almost line for line. QUITTR’s original differentiation was tone and the panic button; the listing now claims the incumbent’s metaphor too.
- **Melius, a 24/7 AI therapist** for triggers and coping.
- **Content blocking** of NSFW sites and apps.
- **Clans.** *New York* describes group chats split by identity: Christians, Muslims, LDS, gym, entrepreneurs, LGBTQ+, “gooners,” and women, plus a Telegram chat the magazine put near **18,000 people**. That chat is also where the product’s moderation and minor-safety problems showed up in the same article.
- **Meditations and challenges**, listed in store copy.

Visual system, from the teardown: near-black UI, purple primary actions, red for the result and the panic state, condensed heavy type, the holographic card as the brand object. Slater’s line: “We made it cool. We made it premium. We made it not cringe.” Brainbuddy, in their words, felt “too corporate.”

### The trust bill

404 Media reported in March 2026 that QUITTR had exposed intimate data on hundreds of thousands of users, many of them minors, after being warned. Slater told *Dazed* the issue was addressed and reviewed. “Purchase appears discretely” does not answer that. For a competitor, on-device journals, an 18+ gate, and a boring charge descriptor are conversion features, not legal footnotes.

Company outcome claims to treat as marketing, not evidence: a **41% one-year abstinence rate**, “more than triple the industry average,” via *The Week* (2025), attributed to QUITTR.

---

## 2. Brainbuddy: the program QUITTR consumerized

Brainbuddy is the 12-year incumbent. QUITTR’s founders positioned against it as corporate. The store listing still sells the same four ideas: a self-test, a 100-day rewiring program, a life tree, and a community. QUITTR won distribution and taste. Brainbuddy still has the deeper daily program and the feature users write reviews about.

### Onboarding shape

ScreensDesign’s chapter map, not a transcript:

1. Welcome and an education carousel.
2. Personalization quiz.
3. Another education slideshow.
4. Quiz results and insights.
5. Symptom selection. Same beat as QUITTR.
6. More education, then **name capture**.
7. “Building your plan,” then a **long plan-and-goal customization** (roughly minutes 3 to 6 of their recording).
8. Paywall.
9. Only then: post-purchase welcome and **account creation**.

QUITTR asks for the account up front and sells a date. Brainbuddy makes the user assemble the plan, then charges, then creates the account. Both withhold the product until payment. Brainbuddy’s version sells “your protocol.” QUITTR’s version sells “your identity, starting today.”

Google Play copy names the self-test explicitly: it “identifies if your porn use is potentially having a negative impact on your life.” That is a softer diagnosis than QUITTR’s “64% higher dependence,” and it is harder to meme.

### The features that show up in reviews

Store and site, corroborated by review text:

- **100-day education program** with CBT-style daily exercises. Reviewers tell other users to actually do the meditations.
- **Life tree** that grows with “every positive choice.” A long positive review asks the developer to animate it more: sway, more life. That is the tell. The tree is not a setting. It is the variable reward.
- **Daily checkup** tied to relationships, clarity, and health, not only a day count.
- **Content filter / site blocker**, which the marketing site calls the way you “remove temptation” while the program runs. On Android this uses the Accessibility API and is optional.
- **Journal, meditations, craving tools, personal and team challenges.**
- **Community and small groups.** One detailed review says groups were randomly broken up and reassembled “to encourage more interaction,” which killed the rapport. People stopped talking because the group was temporary. Identity rooms only work if membership is stable.

### Brainbuddy prices (US App Store IAP list and appslupa, Oct 2026)

| Plan | Price | Trial variants observed |
| --- | --- | --- |
| Weekly | $2.99 | 7-day free trial |
| Monthly | $12.99 | 3-day trial, 7-day trial, or no trial |
| Quarterly | $37.99 | No trial |
| Semiannual | $59.99 | No trial |
| Annual | $99.99 | 7-day free trial |
| One-time courses | $7.99 each | “selfcontrol,” “anxiety,” “confidence” |

All core features require Premium after onboarding. The weekly plan is the impulse offer. The annual plan is the one that can support paid ads. The **$7.99 courses are the one-time upsell**: cheap, specific, and bought by someone who already believes.

A user review cites “around $12/month” as the price that felt fair versus therapy. That is the monthly anchor. $99.99/year is the rational alternative (about $8.33/month).

---

## 3. The other five, and the job each one is best at

### Fortify (joinfortify.com) — trust and a real free tier

Pricing page:

- **Basic, $0:** daily tracking, weekly check-in, one training journey, journal, SOS button, gamification and awards, daily discussions, **one ally**.
- **Premium, $12/month or $89.99/year** (“save 30%”): advanced training and meditations, wellbeing and outcome analytics, full forums, **unlimited allies and messaging**, advanced insights.
- **Students $6.95/month** and **teens 13–17 at $0**, both gated by a short essay.

Marketing also describes PaxAI coaching, SOS support that identifies a feeling and returns a specific action, journeys, and teletherapy. The free SOS and the single accountability partner are the wedge. Premium is community depth and analytics. This will not win a TikTok auction against QUITTR. It is the model to copy if a church, campus, or parent is the buyer, and the pricing proof that **$12/month and ~$90/year** is a normal price in the clinical end of the category.

### I Am Sober — the retention loop, on purpose left mostly free

Free, and genuinely useful: sober-day counter, reasons and photos, **daily pledge and end-of-day review**, money and time saved, trigger recap, milestones with stories from people at the same milestone, a **withdrawal timeline** crowdsourced by symptom, and public communities split by addiction.

Sober Plus, from the US IAP list and the FAQ:

- **$9.99/month**, **$27.49 / 6 months**, **$39.99/year**, plus a second annual SKU at **$29.99** (a price test).
- Unlocks cloud backup, full workbook, full urge history, all reactions, motivation packs, themes, a badge, supporters, **10 tracked habits instead of 2**, Apple Watch, private groups, Face ID lock.
- Separate **$0.99** consumables: “I Am Worthy,” “I Am Letting Go,” “I Am Killing It.”

The site’s scale claims (127M pledges) are the lesson. The open is a **24-hour promise**, not a content library. Milestones are social objects: you see how other people felt at day 7, day 30, day 90. Groups share pledges and milestones, and resets can be hidden. That last switch matters. Public reset-shaming is how streak apps create the relapse spiral a user described to *New York* after trying QUITTR: the streak becomes the thing you are afraid to lose, so a slip turns into a binge.

I Am Sober’s monetization cannot be the plan if the goal is QUITTR’s revenue per install. Giving away the counter and the pledge is why it has ~190k ratings. Charge for privacy (lock, backup, private group) and for power users (more habits), not for the right to count a day.

### Opal — the diagnosis paywall, measured

Opal is screen time, not porn recovery. It is the cleanest public case of a quiz-like diagnosis placed immediately before a paywall.

Schlenker’s account of 121 tests (RevenueCat *Sub Club*, Jan 2024, summarized by GTM Sauce):

- A few questions (current screen time), then a **lifetime projection**. US average framed as **22 years** on a phone (smartphone at 12, life expectancy 77, a bit over 5 hours a day). Then: we can save **3, 4, or 5 years**. Then the trial paywall.
- Moving that paywall **two screens earlier** was worth on the order of **+10 points** of trial starts. Across iterations, **download-to-trial went from about 7% to about 17%**.
- The paywall that beat dozens of challengers is the Blinkist layout: **start the trial now, reminder on day 6, charge on day 7**.
- Hiding or shrinking the close button won while they optimized Day-8 ROAS. Later, making the close easier was part of a freemium shift: more activation, lower ARPU, still acceptable if first-year ARPU stayed above a floor he put near **$2**.
- Price: launched around **$69/year**, then about **$99–$100/year**, 7-day trial. High price is why ads paid back inside 8 days. They did not have a separate marketing budget. If Day-8 ROAS was over 100%, they raised spend. If not, they cut.
- Other winners he named: onboard into a **scheduled block** immediately, **tiered referral rewards** (he cited about +80%), do not offer too many choices in onboarding, and the best win-back is usually a discount.
- They licensed mission-driven organic videos as ads instead of inventing a separate ad style.

Current opal.so pricing (fetched Oct 2026):

| Plan | Price | Trial |
| --- | --- | --- |
| Free | $0 | 1 rule, basic timers, blocking, today’s score only |
| Pro yearly | **$99.99/year** (shown as $8.29/month) | “Start Free Week” |
| Pro monthly | **$19.99/month** (page also shows $239 as the annualized monthly cost) | 3-day trial |
| Lifetime | **$399** once | — |
| Students | Up to 50% off | — |
| Mac promo | $79.99/year | 14-day money-back guarantee |

What is gated is the thing users cannot fake: **Deep Focus / hard mode** (no unblocks, no resets), unlimited rules, allow-list, and score history. Leaderboards, milestones, and a weekly focus report are the shareable layer. Free users can feel a block. They cannot make it inescapable.

Copy the diagnosis timing and the “years of life” math. Do not copy the 7-day free trial into a porn-recovery app without a test. Opal’s value shows up as a lower screen-time number inside a week. A quit-streak’s value is the decision made on the quiz.

### Forfeit — stakes, and which Forfeit

**forfeit.app (Y Combinator)** is the real financial-accountability product.

- You set a task, a deadline, a verification method, and an amount. Miss the proof, the card is charged.
- Verification: live photo or video, GPS, Apple Health, Screen Time, Mac activity, timer. A person or an AI reviews evidence.
- Other punishments, fired automatically: text a contact, call a contact, block apps, email someone. The AI coach (“Overlord”) is allowed to charge, block, and message.
- Appeals: a human reviews within 12 hours. Strictness is chosen up front and **locked** so the user cannot soften it on the night they want to skip.
- Terms: Stripe is the processor. A missed commitment can be charged, and **charges cap at three in a row** for the same commitment. Refunds after two weeks are generally refused.
- Price: **$10.99/month in the US**. The stake is separate and is lost only on a miss. Eligible web signups can include a **7-day subscription trial**. Account deletion does not cancel the subscription.

**App Store “Forfeit: Habit Commitment” (Storq Labs) is a different company.** Stakes are explicitly symbolic. The app does not charge, hold, or transfer money. Free tier: 3 active contracts. Pro is a **one-time** purchase listed at **$5.99 and $39.99**. Photo proof, focus timer, or manual check-in. This is the safe v1. It is also a weaker promise, and the user knows it.

Practical constraint: a real cash penalty is a **web/Stripe** product. Do not implement it as an App Store consumable. Apple’s rules, chargebacks, and the optics of billing someone for a relapse all sit outside IAP. Offer it as an optional oath after the user has a streak, with a human appeal and a consecutive-charge cap copied from Forfeit’s terms.

### Streaks — craft, not the business model

Crunchy Bagel’s Streaks is **$5.99 once**, no ads, no subscription, synced across iPhone, iPad, Watch, Mac, and Vision Pro. Up to **24 tasks**. Health data can complete a task without a tap. Negative habits, timers, widgets, 600+ icons, shared tasks.

The retention mechanic worth stealing is **not** a Duolingo-style streak freeze you buy after you fail. Streaks 10 (Sept 2024) added a **2-Day Rule**: miss one day and the day is marked skipped, streak intact; miss the next day and the streak resets. A “2” badge shows when today is mandatory. One unit of grace, then the chain is real again.

A $6 upfront app can top a chart and still be the wrong monetization if the target is $100k–$500k per month. At $6, that revenue needs on the order of 17,000–83,000 new paying customers a month, with no renewal. QUITTR’s subscription, even at a $20 average order, renews. Streaks is the quality bar for the home screen. It is not the P&L.

### Winter Arc as a format

There is no single Winter Arc app with QUITTR’s reported revenue. The cultural object is a **90-day season** (fitness, cold, reading, no short-form video, monk mode, 75 Hard / 75 Soft).

winterarc.space (updated Oct 2026) gives the loop away for free:

- One-tap logging, progress ring, current and best streak.
- Ready-made plans: Winter Arc, 75 Soft, Monk Mode, 90-Day Glow Up, **Dopamine Detox**, plus student, fitness, and coder arcs. Season starts today, with a day-X-of-Y countdown.
- Dopamine-detox checklist they publish: no phone the first hour, no short videos for 30 days, a screen-time cap, phone out of the bedroom, a walk, 10 pages. They explicitly reject the extreme “no music, no talking” detox.
- **Share cards**: branded card, photo overlay, or a transparent story sticker. Goal names can be hidden. That hide switch is the porn-recovery version of the same feature. People will post a streak. They will not post the habit name.
- Partners. Logging yesterday morning is allowed, so a missed night does not require a lie.

Use Winter Arc as the **creative container and the share object**. Use QUITTR as the **paywall**. A free season tracker will get views. It will not, by itself, produce a $20 AOV.

---

## 4. Which features do which job

“Dopamine hooking” in this category is not a mystery mechanic. It is four loops stacked. Shipping all of them on day one dilutes the paywall. Ship them in the order below.

| Feature | Job | Evidence | Build note |
| --- | --- | --- | --- |
| Quiz score + symptom list + quit date | **Conversion.** Happens before the app is useful. | QUITTR’s entire pre-paywall. Opal’s “years lost” is the same beat in another category. | The score must change with answers. A canned 64% is a known tell. |
| Membership card / streak object on screen 2 | **Conversion.** Endowment. | QUITTR holographic card before question 1, repeated on the paywall. | Put today’s date and “Day 0” on it. |
| Hard annual paywall, exit offer ~50% off | **Conversion and AOV.** | QUITTR: $39.99 shown, $20 exit, AOV $20. FunnelFox: no-trial is 56.8% of web subscription revenue. | One discount story. Not 80% and 60%. |
| Morning pledge | **Retention, daily.** | I Am Sober’s core loop and the stat they lead with. QUITTR added the same pledge. | 24 hours, not “forever.” Forever pledges break. |
| Rank names at days 0, 3, 5, 7, 14, 30, 60, 90 | **Retention and identity.** | QUITTR: Sprout, Pioneer, Nirvana. Loss of rank hurts more than loss of points. | Show the next rank and the date it unlocks. |
| Rewiring bar that moves when an urge is logged as survived | **Retention, session.** | QUITTR shows a % rewired (14% at day 14 for one reporter). | Do not tie it only to the clock or it is a wallpaper. |
| Life tree or brain visual, one new state per day | **Retention, variable reward.** | Brainbuddy reviews single the tree out and ask for more animation. | A new visual state beats another badge. |
| Panic button: front camera + a 10-second body interrupt | **Retention at the moment of churn, and the ad.** | *New York*: most-used QUITTR feature. Fortify’s equivalent is SOS. | Camera on, then a physical task (pushups, a breath count). Drop the insult copy. QUITTR’s own about page now says shame feeds the cycle. |
| Content blocker | **Retention and a reason the subscription is worth it.** | Brainbuddy leads with it. QUITTR lists it. Opal gates the *inescapable* version. | The strict mode is what you charge for. A bypassable block is a demo. |
| Stable clan, matched by identity and stage | **Retention after day 7.** | QUITTR clans; I Am Sober communities by addiction and milestone; Brainbuddy’s reshuffle backfired. | Never auto-scatter a group. Hide resets by default. Moderate. 18+ only. |
| Share card with the habit name hidden | **Organic distribution.** | winterarc.space stickers. QUITTR’s card is the same object, currently trapped inside the paywall. | Story-sized, no porn words on the image. |
| 2-day grace, earned in advance | **Retention without selling a relapse.** | Streaks’ 2-Day Rule. | One skip per streak period. A second miss resets. Do not sell a freeze after the user has already relapsed. |
| Optional cash stake on the web | **Retention for the subset who ask for pain.** | forfeit.app, $10.99/month plus the stake. McLaren’s previous fitness app that took money for missed workouts “failed tremendously” as a whole-product bet. | Optional oath. Cap consecutive charges. Human appeal. Not the default price. |
| $7.99–$9.99 protocol pack | **LTV after the first purchase.** | Brainbuddy courses at $7.99. FunnelFox median upsell about $9.31, claimed LTV lift above 2×. | One offer on the thank-you screen: blocker setup, faith track, or gym track. Not three. |

### What not to copy

- **A score that ignores the answers.** Two independent testers with the same frequency answer got the same 64-versus-40 result. Users compare notes.
- **Medical rewiring claims.** “76% faster than willpower” and “your brain is 14% rewired” are conversion copy with a regulatory and chargeback cost. Ship the bar as a program-progress meter. Put a non-medical disclaimer on the result, the way QUITTR’s own subscription terms now do.
- **Shame as the ongoing voice.** It was the launch positioning (military insult, “loser” framing). The company has publicly moved to “no shame,” because the relapse story they got back was: the streak made the slip feel final, so the slip became a binge.
- **Random group reassignment.** Documented as a Brainbuddy failure.
- **Public chats that include minors.** Documented in the *New York* account of QUITTR’s Telegram. Age-gate and slow moderation are part of the feature, not a later patch.
- **Storing urge journals in a loosely secured backend.** The 2026 exposure is now part of the category’s sales conversation.

---

## 5. Pricing, trials, downsells, and upsells for 2025–2026

### What the category actually charges

| App | Hero price | Entry / downsell | Trial | One-time |
| --- | --- | --- | --- | --- |
| QUITTR | $19.99–$39.99/year tested; ~$30/year in the 2026 profile | Exit offer **$20/year**; monthly $9.99–$14.99 | Mostly **none**. A trial screen has existed in at least one build. | Lifetime **$49.99**, anchored against a fake ~$450 |
| Brainbuddy | **$99.99/year** | **$2.99/week**, $12.99/month | 3- or 7-day on some SKUs; quarterly and semiannual have no trial | Courses **$7.99** |
| Fortify | **$89.99/year** or $12/month | Free basic; student $6.95 | Free tier instead of a trial | — |
| I Am Sober | **$39.99/year** (also $29.99) | $9.99/month; core app free | None listed | Motivation lines **$0.99** |
| Opal | **$99.99/year** | $19.99/month; limited free | **7 days** on annual, **3 days** on monthly | Lifetime **$399**; student ~50% off |
| Forfeit (YC) | **$10.99/month** | Stakes are extra, user-set | 7 days on some web signups | The penalty itself |
| Streaks | — | — | — | **$5.99** forever |

Annual prices that clear paid acquisition in this cluster sit around **$30–$100/year**, not $5/month. Opal had to raise from $69 toward $100 before Day-8 payback was comfortable. QUITTR could stay near $20–$40 because the audience’s intent at the end of a shame quiz is higher than a screen-time browser’s, and because a $20 AOV still worked when creator inventory was $2–$3 CPM.

### Web versus in-app

FunnelFox’s *State of Web2App 2026* (vendor report, January 2026; directional, and in their interest) is the broadest public cut:

- About **13%** of web-funnel sessions reach the paywall and about **3%** purchase, versus about **1.5%** end-to-end in the app funnel they compared. The big leak is **before** the paywall.
- Revenue by plan length: **1 month 48.8%**, **1 week 30.5%**, **1 year 12.2%**, **3 months 8.4%**. Weekly is for urgent, fast-consumption categories. It is a large share of web revenue and a weak retention curve (they show weekly retention falling to about **3% by month 12**, monthly to about **10%**).
- Revenue by trial type: **no trial 56.8%**, **paid trial 28.9%**, **free trial 14.3%**. Direct charge is the majority of web subscription revenue in their data. This matches QUITTR and contradicts the default “always offer 7 days free” advice.
- Once someone pays, ARPPU clusters around **$27–$31** across regions. The lever is conversion, not extracting a different price from a payer in another country after the fact. Localize the sticker before launch (their index runs from Turkey at 0.29× the US to the Netherlands at 1.62×).
- A quoted Health & Fitness comparison from AdQuantum’s CMO, inside that report: **app LTV about $40–$45**, **web LTV about $80–$90**, because of store fees and because quiz traffic is more selected. Scale web and app as separate unit economics.
- Upsells: median around **$9.31**, and they claim upsells behave like an LTV multiplier **above 2×**. Longer plans accept higher upsell prices.

A separate, smaller benchmark note (web2app.tools, updated 13 Jun 2026, explicitly “not a guarantee”) puts **quiz completion at a 55–75% band, median 62%**, **paywall view-to-checkout at 8–18% (median CTR 14%)**, and **checkout completion at 45–70%**. QUITTR’s claimed 99% quiz completion is an in-app, high-emotion outlier. Plan the web quiz to the 62% median, then try to beat it.

web2wave’s public paywall guide adds two tactics with a named result:

- Replacing a free trial with a **$6.99 intro week** raised LTV about **30%** for one fitness client. A paid intro selects intent and gives the ad platform a purchase event instead of a free-start event.
- Checkout-close downsell, in this order: **loss screen** (the specific plan they are about to lose), **announcement** (“you were selected”), **then** the lower price with their name on it. Showing the discount immediately, with no announcement, gets scrolled past.

PaywallPro’s Dec 2025 fitness-paywall roundup (1,200 configs; another vendor piece) argues the other direction on trials: 7 days is common, but longer trials in the 17–32 day range have shown about **46% trial-to-paid** in RevenueCat’s broader data, and they suggest **14–21 days** for annual health plans. They also like annual as the default at roughly **8–10×** a monthly price (about 16–25% off paying monthly), monthly stickers of **$14.99–$24.99**, and annual stickers of **$59.99–$79.99**. That advice fits Opal and a gym app. It fits a quit-porn app only after a no-trial annual has been measured. Their own note that weekly plans attract high churn matches FunnelFox’s retention curves.

### The offer to test first

Built only from prices these apps have already cleared, not from a blended “best practice.”

**Web quiz (paid TikTok / IG / creator traffic)**

1. Result, quit date, Day 0–7 plan.
2. Default selected: **90-day Arc, $39.99**, shown as about $0.44/day, with a reference price near $89. A 90-day product matches Winter Arc and Nirvana-at-day-90 better than a vague forever subscription.
3. Beside it, **annual $79** as the “keep the tools after the arc” upgrade, and **monthly $14.99** for people who refuse a commitment. Do not lead with weekly.
4. No free trial on the first test. Secondary test: **first week $6.99**, then $39.99/month, terms in full under the button.
5. Dismiss or checkout-close: loss screen naming their quit date, then **$19.99 for the 90 days** (QUITTR’s proven floor). One code, one percentage, a real end time.
6. Thank-you upsell, one screen: **$7.99–$9.99** for a single protocol (blocker setup guide, gym track, or faith track). Median market upsell is about $9.
7. Charge descriptor must be boring. Say so next to the button. QUITTR’s “Purchase appears Discretely” is doing real work.
8. Stripe, Apple Pay, Google Pay. FunnelFox’s payment section treats local wallets and retry logic as a conversion feature, not plumbing.

**In the app (organic, brand search, referrals)**

- Same hard wall after a shorter quiz. Superwall or an equivalent so prices move without a release. QUITTR did this from week one.
- Lifetime, if offered, at **about 2× annual** and a reference price you would actually have charged. $49.99 lifetime trains people to wait for the sale and caps LTV. Opal’s $399 lifetime is an anchor, not the plan most people buy.
- Student price is a real lever in this audience (Fortify $6.95, Opal 50% off). Gate it. Do not make it the default SKU.

**Do not use as the core offer**

- Free forever plus a $0.99 tip. That is I Am Sober’s charity model. It builds ratings and a weak ARPU.
- $5.99 once. That is Streaks. It builds love and no renewal.
- A cash stake as the price of admission. Forfeit charges $10.99 **and** the stake, and only the stake is lost on a miss. McLaren’s earlier “we charge you if you skip the gym” app failed as the whole product.

### Unit-economics sketch (illustrative, not QUITTR’s dashboard)

Creator rate from the *New York* profile: **$2–$3 per thousand views**. At $2.50 CPM:

| View-to-install | Implied CPI | Need, to clear CPI on a $20 first purchase |
| --- | --- | --- |
| 0.50% | $0.50 | 2.5% of installs pay |
| 0.20% | $1.25 | 6.3% pay |
| 0.10% | $2.50 | 12.5% pay |

QUITTR’s claimed 25% download-to-paid would make even a $2.50 CPI profitable on the first order, before renewals. That claim is unaudited. A sane planning target is **8–15% of quiz completers paying** on a no-trial annual or 90-day offer, **AOV $20–$40** after the downsell, and creator CPMs held near **$3**. If CPI from Spark Ads rises above ~$8, the free-trial version will not save it; the quiz targeting and the price will.

No public source states QUITTR’s CPI or a Winter Arc app’s CPI. Anyone quoting a specific CPI for this niche is estimating.

---

## 6. Creative: what has actually moved money

### QUITTR, in the order they found it

1. **Values-aligned creators, paid on views, not a UGC farm.** Christian and self-improvement Instagram/TikTok. First $3k. Founder: UGC specifically had not cracked. A later agency case study (Valid) says the unlock was taking **organic winners** and running them as paid, with Adjust as the MMP and Superwall events in the same view. Their published result: **2×+ ROAS within 30 days**, spend up about **300% month over month**, **$1,000+/day** within two months. That is an agency case study. Use the method (whitelist organic, one dashboard), not the ROAS as a promise.

2. **The ad is a quiz door, not a feature tour.** A widely circulated breakdown of their static ads (a July 2025 thread by @Siron93) describes the working layout: a before image, “neuroscience backed approach,” and a yellow **Take The Quiz** button. Video ads in the same account are raw, meme-paced, POV, and willing to call the behavior out. They do not demo settings.

3. **Pattern-interrupt, indirect language.** Slater paid a meme account **$100** for a post on the order of “Anti-🌽 app QUITTR seeks to buy OnlyF\*ns and shut it down.” Reported result, from founder posts repeated by Startup Spells (May 2025): **10.8M views**, a comment holding the link, **5,582 new users**, **$21,758** collected. The **86% “conversion to paid”** in that writeup is not credible as a normal funnel rate and should not be used in a model. What is credible, because it matches how restricted categories have to advertise: the corn emoji and the asterisk get past filters, the absurd claim creates comments, **bookmarks (they reported 9,200) signal intent better than likes**, and the link lives in the reply. Outrage, mockery, and curiosity all extend reach.

4. **One TikTok, in secondary retellings of the founder story, at 10M views and about $100k in sales.** Same caveat: founder-origin, not an ad account export. The format class is “doesn’t look like an ad,” spoken in NoFap / self-improvement dialect.

5. **Brand search is the ASO.** You cannot buy the keyword “quit porn” if the store returns nothing. Creators manufacture searches for the brand. Subtitle and screenshots should also bid on words the store does index: **nofap** (QUITTR already owns it) and **dopamine detox** (open as of Oct 2026).

### Winter Arc and the dopamine-detox cluster

These are format neighbors, not QUITTR’s media buyer.

**BePresent / @screentimejesus / @bepresentbros.** A January 2025 Virengine writeup attributes **40M+ TikTok views and $20k MRR** to two brothers. Treat the totals as unverified. The formats are specific enough to test:

- “You can’t make it to the end,” shot in an empty room. The video is a demo of the problem.
- Text walls that say **KEEP SCROLLING** over the behavior they are selling an exit from.
- Slideshow roasts of the user’s own notifications, escalating from “2 hours already?” to “Do you have friends?”, sometimes over a calm background. They cite heavy bookmarks.
- POV of a thumb doomscrolling.
- Founder walking-and-talking, 1–3 day reset as the promise, not a 90-day personality transplant.
- Silent sign-holding clips that work with sound off, which is the Reels cut.
- Several accounts: one serious, one duo comedy, then creators. Recut the same selfie with a new hook.

**AdQuantum, Shorty Awards case, an unnamed mindfulness and habit app (not QUITTR).** This is the only creative test in the pile with a before and after:

- Starting point, summer 2025: TikTok CPA about **€54**, Day-14 ROAS about **27%**. Meta CPA about **€57**, Day-14 ROAS about **32%**.
- The brief was to stop running “best version of yourself” motivation.
- Winning angles: **burnout, procrastination, ADHD, low mood.** TikTok execution: bold text walls, trending or nostalgic audio. Meta: X-style posts, UGC, simple AI animation, everyday scenes.
- Standout: a burnout funnel at CPA **€23.85** and Day-14 ROAS **64.8%**. Some TikTok creatives reached Day-14 ROAS **71.9%**. Tier-1 English geos were the efficient core; the US worked best inside a geo mix, not as a vanity-only target.

Generic aspiration is the expensive creative in this neighborhood. Specific, slightly embarrassing pain is the cheap creative. QUITTR’s version of that pain is PIED, brain fog, “I can’t look at my girlfriend,” day-3 relapse, and faith guilt. Winter Arc’s version is “I have watched 6 hours of video and lifted nothing.”

### Hooks worth testing, mapped to a format

No CPI is claimed for any row. The “why” column is the evidence class.

| # | First 2 seconds | Format | Lands on | Why it is on the list |
| --- | --- | --- | --- | --- |
| 1 | “If you do this most nights, take the quiz.” | 9–15s talking head, face, captions, sound on | Web quiz | QUITTR’s static winner is the quiz door. TikTok quiz ads work when the result is the payoff. |
| 2 | Film the result, not the logo. “It said I’m worse than average.” | Screen record of a real, varying score | Quiz | Diagnosis is the product. A canned score will get called out in comments. |
| 3 | “Day 11. I threw it away in four minutes.” | POV, bedroom, no music bed | Quiz, quit date | Relapse is the search query. Motivation montages lost in the AdQuantum test. |
| 4 | Faith creator, plain language about lust, no app UI until the last second | Whitelisted Spark Ad | Quiz | The only QUITTR channel with a published $3k → ~$30k story. |
| 5 | Absurd enemy line, 🌽 not the word, link in the reply | X post via a meme page, then cut for Reels | Brand search | The $100 post. Copy the structure, not the 200× ROI story. |
| 6 | “You won’t last 20 seconds.” | Empty room, on-screen text only | Dopamine-detox quiz | BePresent’s dwell-time hook. Works sound-off for Reels. |
| 7 | Notification roast: “You opened it again.” | 4-panel slideshow | Streak card | Bookmarks and shares. Hide the habit name on the end card. |
| 8 | “Stop scrolling” written over someone scrolling | Text wall + a nostalgic audio | 90-day plan | Same device as the AdQuantum text walls that cut CPA. |
| 9 | “Day 17 of 90.” Hand covering the habit label. | Story sticker, native, then boosted | Share card → quiz | winterarc.space already proved the object. Boost posts that get saves. |
| 10 | Founder, walking, “I made it 3 days. That’s the ad.” | 20–30s, no cuts | Quiz | 1–3 day promise outperforms a personality overhaul for cold traffic. The 90 days is the post-purchase plan. |

Operational rules that show up across these accounts:

- Hook by the first second. 9–15 seconds for paid TikTok. Captions always.
- Refresh winners every **1–2 weeks**. Fatigue on TikTok is faster than on Meta.
- Optimize to **quiz complete or purchase**, not to a click. A free-trial start trains the ad system to find free-trial people.
- Run Spark / whitelisted posts so the likes are real.
- Keep porn words out of the video, the caption, and the store subtitle. Use “reboot,” “dopamine,” “that habit,” and the brand name.
- Do not buy a second creative style. License the organic posts that already held retention, which is what both Opal and the Valid/QUITTR engagement describe.

---

## 7. What to ship, in order

### Funnel

1. Ten questions, one per screen, progress visible, skippable, attribution question included. Topics that have already been used successfully: frequency, escalation, age of first exposure, arousal, stress, boredom, money spent.
2. A score that is a weighted function of those answers, banded (low / moderate / high), with one sentence that quotes their own symptom. Disclaimer: not a diagnosis.
3. Symptom chips, then a single CTA in their words (“Build my 90 days”).
4. Streak card with today’s date before the price.
5. A quit date and a Day 0–Day 7 plan. Sell the week.
6. Hard paywall. 90-day at $39.99 selected. Annual beside it. Dismiss drops to $19.99 once.
7. Discretion line on the button. Rating prompt only after the first pledge, not before payment. QUITTR asks early because they want rank; it also produces reviews from people who have not received the product.

### Product, after they pay

Week 1 of the build, because these are the loops with evidence:

- Morning pledge and evening one-line review.
- Rank track with the next rank dated.
- Progress meter that advances when an urge is marked survived.
- One visual that changes every clean day (tree or brain, pick one).
- Panic button: front camera, a short line that is not an insult, then a 10-rep or breathing interrupt before the buttons come back.
- Strict content block as the paid switch, with an easier block available only if you later add a free tier.

Week 2:

- One clan type, capped, stable, 18+, report button, resets private.
- Share card, habit name off by default.
- A single earned grace day (Streaks’ rule), not a shop of freezes.
- Optional web stake only after a 7-day streak, with appeal and a three-charge cap.

### Monetization instrumentation

- Paywall remote-config from day one.
- Events: quiz_start, quiz_complete, paywall_view, checkout_start, purchase, downsell_shown, downsell_taken, upsell_taken, pledge_day_1, panic_used, day_7_retained.
- Judge paid social on **purchase ROAS**, not install CPI. If a trial is introduced later, judge it on **day-8 ROAS** the way Opal did, and kill it if it pulls in users who do not pay.
- Keep a second, shorter in-app quiz for people who arrive by brand search. Do not force the web buyers through it again.

### The competitive gap that is still open

QUITTR owns the brand search and the panic-button story. Brainbuddy owns “the program” and the tree, and looks like 2018. I Am Sober owns the daily pledge and will not charge enough to be bid against. Opal owns measured onboarding. Forfeit owns real stakes and is not a recovery brand. Nobody in the public record owns **“dopamine detox” plus a 90-day Winter Arc paywall** with a score that is honestly computed, a blocker that cannot be shrugged off, and a share card that does not name the habit.

That is the product. The $500k/month outcome is a creator machine on top of a $20–$40 first purchase, and it is a founder claim until a payout report says otherwise. The funnel that produces the claim is documented well enough to build.
