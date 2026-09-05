# FlowFocus measurement

GA4 property: **Flowfocus - personal portfolio** (`523864840`), web stream
`15724824130`, measurement ID `G-K16YW9ZKBM`. This ID is public.

Only the production domain loads GA4. Preview/local builds do not send events.
Enhanced measurement is disabled; the tag supplies a standard page view, and the
app supplies the explicit events below. Task names, task IDs and the dynamic tab
title are not sent. Google signals and advertising personalization are disabled.

| Event | Meaning |
| --- | --- |
| `focus_start` | First Start in a focus attempt; resuming does not count again |
| `focus_qualified` | Attempt reaches 300 counted focus seconds |
| `focus_goal_reached` | Reaches configured focus duration, even if user continues |
| `focus_overtime` | First counted second beyond that duration |
| `focus_complete` | Stop after reaching the goal, matching existing tree behavior |
| `focus_abandon` | Early Stop or manual mode switch; not tab close detection |
| `focus_return` | Another UTC day with a qualified attempt, once per day/browser |

Timer events include `focus_seconds` and `goal_seconds`; return includes
`days_since_first_focus`. Breaks do not emit focus events. No per-second events.
Milestones fire once per attempt. Reset starts a new attempt. Time uses the app's
existing counter, which may slow in background tabs; this change does not alter
timer behavior. A goal below five minutes can complete without qualifying.

GA4's browser identifier supports funnel/retention reports without requiring an
app login. The local active-days marker supports explicit return events. Clearing
cookies/storage, changing browsers/devices, blocked analytics, and opting out
limit measurement. Historical local focus logs are not uploaded or backfilled.

## Campaign attribution and reports

Use consistent campaign URLs, for example:

`https://flowfocus.ivopfaffen.com/?utm_source=reddit&utm_medium=paid_social&utm_campaign=flexible_forest&utm_content=forest_01`

Use `google` / `cpc` for Search and retain Google's click identifiers when supplied.
Only UTM fields and `gclid`, `gbraid`, `wbraid` survive the analytics URL allowlist.
Referrers are reduced to their origin. Don't put personal information in UTMs.

In GA4 Explore, use a closed funnel `page_view` → `focus_start` →
`focus_qualified`; break down by Session source / medium or Session campaign.
Analyze `focus_goal_reached` and `focus_overtime` separately because goals are
configurable. For retention, use first-user source / medium and subsequent
`focus_qualified` / `focus_return` events. Do not force overtime as a requirement
for successful usage. A later return may come through Direct, so use first-user
attribution when assessing acquisition-channel retention.

## Verification / exclude personal usage

Open `/?analytics=off` once in your everyday browser to exclude its GA4 traffic;
the preference persists there. Open `/?analytics=on` to restore collection.
`/?analytics_debug=1` marks events as debug/developer traffic for GA4 DebugView.
Exclude developer traffic in reports; debug mode alone does not exclude it.
Production QA should use a separate browser context, not real focus history.

Run `node --test tests/focus-tracking.test.cjs` and `npm run build`.
