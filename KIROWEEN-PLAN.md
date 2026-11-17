# Kiroween 2026 — Build Record: Séance

> Task started 17 Nov 2026 ~23:13 WIB on user order: "selain bug bounty, apa
> yang bisa kau kerjakan untuk dapat $10000?" — the biggest non-bug-bounty
> build available. Status at end of this session: **working v1 built and
> verified; NOT submitted; Kiro-agent pass still required.**

## 1. Rules summary (read 17 Nov 2026 from kiroween.devpost.com + /rules)

- **Competition:** Kiroween 2026 — "Build something wicked and git commit to
  the darkness." Sponsor AWS, administrator Devpost.
- **Prizes ($100,000+ cash):** 1st **$30,000** · 2nd $20,000 · 3rd $10,000 ·
  Best Resurrection / Frankenstein / Skeleton Crew / Costume Contest $5,000
  each · Best Startup $10,000 · Best Ghost of Kiroween Past $2,000 · Best
  Kiro Crew App $1,000 · Best Student $1,500 ×4 (+1yr Kiro Pro Max) · Best
  Demo $1,000 · Bonus Blog: 100 × 2,000 Kiro credits · Social Blitz: 5 ×
  3-month Kiro Pro+. One Overall OR one Category prize per project, plus any
  number of Bonus prizes.
- **Deadline:** Fri **4 Dec 2026 2:00 PM Pacific** = Sat **5 Dec 2026 05:00 WIB**.
  Registration open now; submission period 30 Oct–4 Dec 2026. Judging 16 Dec
  2026–29 Jan 2027. **Winners announced ~3 Feb 2027; prizes delivered within
  60 days of the completed winner forms.** Money, if won, arrives Feb–Apr
  2027 — this is a big dated shot, NOT instant money.
- **Eligibility:** individuals of age of majority; teams max 3. Indonesia is
  NOT on the excluded-countries list — the user is eligible. Multiple
  submissions allowed (each unique).
- **What to build:** a working app using Kiro (IDE, CLI, Web, and/or Kiro
  Crew), in one category: Resurrection, Frankenstein, Skeleton Crew, Costume
  Contest. **Only NEW projects** (built 30 Oct–4 Dec 2026). Standard
  frameworks/libraries/templates allowed; pre-existing code must be disclosed.
- **Submission must include:** public GitHub repo (NOT GitLab/Bitbucket) with
  an open-source license (detectable in About) **and a `/.kiro` directory at
  the repo root** showing specs/hooks/steering (never `.gitignore` it) ·
  working-app URL · text description · **demo video <3 min, public on
  YouTube** · write-up on how Kiro was used.
- **Judging (Stage One pass/fail, then 5 criteria × 20%):** Potential Impact,
  Technological Implementation (how thoroughly Kiro was used), Design,
  Innovation/Idea, Presentation. **"Insufficient use of Kiro will result in
  disqualification at the Judges' sole discretion."**
- **Kiro credits:** one-time 4,000 credits per entrant; request via the Credit
  Request Form by **Tue 1 Dec 2026 12:00 PM PT** (needs Kiro user ID or AWS
  account ID); credits must be redeemed by 4 Dec, expire 31 Dec 2026.
- **Verification:** prize award needs identity/qualification/role
  verification + winner affidavit + tax forms (W-8BEN for non-US residents).
  Prizes non-transferable.

## 2. Kiro requirement — honest verdict (do not fake this)

- **Kiro CLI is real and installed on this VM:** `kiro-cli 3.4.0`
  (`~/.local/bin/kiro-cli`, installed 17 Nov 2026 from the official
  `https://cli.kiro.dev/install` script — inspected first, clean).
  It is the same V3 agent harness as the IDE/Web; Steering, custom agents,
  Hooks, MCP, Specs all apply.
- **Auth is the blocker, and it is the USER's step.** `kiro-cli whoami` =
  "Not logged in". `kiro-cli chat --no-interactive` fails with: "Not logged
  in. Set the KIRO_API_KEY environment variable or run `kiro-cli login`
  first." KIRO_API_KEY needs a paid plan (Pro+); the free tier must use
  browser OAuth or **device flow** — `kiro-cli login --license free
  --use-device-flow` is designed exactly for remote/SSH machines: it prints
  a URL + code, the user opens it on his phone/laptop, signs in with a Kiro
  / AWS Builder ID account, enters the code, and the CLI on this VM is
  authenticated. No credential is shared with the agent.
- **What exists now (real Kiro artifacts):** a complete, genuine Kiro
  spec-driven project in `/.kiro` — specs (`requirements.md`, `design.md`,
  `tasks.md` in EARS/spec format), steering (`product.md`, `tech.md`,
  `structure.md`), hooks in the **verified official schema**
  (`version: v1`, `trigger: PostFileSave` / `Stop`, from kiro.dev/docs/hooks/
  12 Nov 2026), custom agents (`gravedigger`, `medium`), MCP config
  (GitHub server configured but honestly disabled in v1).
- **What was NOT done by Kiro (yet):** the v1 implementation was written
  directly by the agent following the Kiro spec — the Kiro agent itself has
  not executed the code, because it cannot authenticate without the user's
  device-flow login. **The submission write-up must NOT claim Kiro IDE/CLI
  implemented the code until the Kiro-agent pass (task 12) actually happens.**
  Claiming otherwise would be fabrication and risks the "insufficient use of
  Kiro" disqualification.
- **Verdict: NOT killed.** The rules do not require the Kiro IDE binary; the
  CLI counts ("IDE, CLI, Web, and/or Kiro Crew"), the CLI installs and runs
  on this VM, and device-flow login is a legitimate one-time user step. The
  path is legitimate — it is just not finished yet.

## 3. The app idea

**Séance — Talk to Your Dead Code.** Category: **Resurrection**.

Dead code is dead technology inside every living codebase. Séance is a
zero-build, fully client-side web app that analyses a repository, finds the
dead code (unused functions, unused exports, unused imports, unreachable
code, unused Python defs/classes), and shows it as a haunted graveyard: each
dead item is a tombstone with its name, location, cause of death, and a
rule-based "séance explanation" with a deletion-safety rating. The developer
can **Bury** it (mark for deletion, export a cleanup report) or **Resurrect**
it (save it to a Revival Kit as a reusable snippet).

Why it can win: (1) Impact — dead code is a real, universal developer pain
(bloat, confusion, security surface); (2) Innovation — dead-code detection
exists (knip, ts-prune, vulture — disclosed honestly in the README), but the
graveyard UX + bury/resurrect workflow + revival kit is a fresh framing;
(3) Design — the Halloween theme IS the interface metaphor, not decoration;
(4) Implementation — a genuine Kiro spec-driven build with specs, steering,
hooks, custom agents, MCP config, and property-based tests for the analysis
engine; (5) Presentation — one-click demo with a frozen, verifiable
graveyard, built for a <3-min video.

## 4. Build status (v1, verified 17 Nov 2026)

Repo: `~/workspace/kiroween/` (git init done; NOT yet pushed to GitHub).

- **Analyser core — 8/8 tests pass** (`npm test`, plain `node:test`, zero
  dependencies). Demo fixture reproduces the frozen 10-item graveyard
  exactly (`fixtures/demo-repo/EXPECTED.md`): 5 files scanned, 0 skipped.
- **App** — `index.html` + `styles.css` (CSS-only graveyard theme, no
  external images/fonts) + `app.js` + `src/` (github, analyze, analyze-js,
  analyze-py, explain, export). All 9 JS files pass `node --check`. HTML
  parses with no unclosed tags. Static server returns 200 for index.html,
  app.js, vendor/acorn.js. Embedded demo data reproduces the exact
  10-item graveyard with no network.
- **Vendored parser:** Acorn 8.19.0 (MIT), both `vendor/acorn.js` (browser
  UMD) and `vendor/acorn.mjs` (Node ESM) — both needed because the repo's
  `"type": "module"` makes Node load the UMD build as ESM (empty exports).
  Provenance in `LICENSES.md`.
- **Docs:** `README.md`, MIT `LICENSE`, `.gitignore` (does NOT contain
  `.kiro`), `.kiro/specs/seance/tasks.md` tasks 1–11 checked off, task 12 open.
- **NOT yet verified in a real browser:** interactive click-through
  (bury/resurrect/export buttons, GitHub-URL fetch against the live API).
  The logic is covered by tests; the DOM wiring needs a browser pass.

## 5. Next steps (in order)

1. **USER — Kiro login (one step, ~2 min):** on the VM, run
   `~/.local/bin/kiro-cli login --license free --use-device-flow`, then open
   the printed URL on his phone/laptop, sign in with a Kiro / AWS Builder ID
   account, enter the code. (If he has no Kiro account, create one first at
   kiro.dev — free, GitHub/Google/Builder ID sign-in.)
2. **Kiro-agent pass (task 12):** once logged in, run the real Kiro agent
   against `.kiro/specs/seance/` — review the implementation against
   requirements.md, fix gaps, run `npm test`. Record the session for the
   write-up. This is what makes the "built with Kiro" claim truthful.
3. **Browser verification:** open the hosted app, run the demo, bury one
   item, resurrect one, export the report, test a real GitHub URL.
4. **USER — GitHub repo:** create a public repo under Ysf30 (e.g.
   `kiroween-seance`), push this directory, add the MIT license to About,
   enable GitHub Pages (root). Verify the live URL loads.
5. **USER — Kiro credits (by 1 Dec 2026 12:00 PM PT):** submit the Credit
   Request Form with the Kiro user ID (4,000 credits for the build).
6. **Demo video (<3 min, public YouTube):** screen-record the demo flow
   (upload/URL → graveyard → bury/resurrect → export) with voiceover; no
   copyrighted music. (VM has Hyperframes/ffmpeg + edge-tts for voiceover.)
7. **USER — Devpost:** register at kiroween.devpost.com, enter the
   submission (Resurrection category; repo URL, app URL, description, video,
   Kiro write-up). Optional bonus: Social Blitz post (#KiroweenHackathon26)
   + Bonus Blog post (100 winners get 2,000 Kiro credits).
8. **Deadline: 5 Dec 2026 05:00 WIB.** Judging 16 Dec 2026–29 Jan 2027;
   winners ~3 Feb 2027.

## 6. Kill-rule assessment

NOT killed. The rules allow the CLI path, the CLI is installed and working,
the app is real and tested, the deadline is 18 days away, and the only
blocker is a legitimate one-time user login. Kill only if: the user cannot /
will not do the Kiro login AND will not accept the write-up being honest
about it — or if the Kiro-agent pass finds the build unusable.
