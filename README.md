# Flight Plan

A student planner that combines a weekly timetable, a Pomodoro focus bank, a study space with spaced review, and progress insights. Everything runs in the browser and stays on your device. No account, no server.

## Run it

Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari). For offline install on a phone or laptop, serve the folder over HTTPS or localhost, for example `python3 -m http.server`, then use "Install app" in the browser menu.

To produce one self-contained file: `python3 tools/build.py` creates `dist/flight-plan.html`.

## Features

| Area | What it does |
|---|---|
| Today | Live date, Hijri date, clock, next or current class, flexible checklist (add or remove any item) |
| Plan | Build a weekly timetable: classes, labs, habits, with days, times, rooms; works for any faculty and year |
| Focus | Pomodoro sessions (15, 25, 50 min), points balance, ranks, streak interest, daily goal, rewards you define |
| Study | Per-subject notes (autosave), questions with spaced review (1, 3, 7, 14, 30 days), file and photo storage |
| Insights | Week, month and term: average, grade, streak, best day, charts, performance by category |

## Points and verification

- Base: 1 point per focused minute.
- Output bonus: 40% extra when you write what you produced (15+ characters). It is also saved into the subject's notes.
- Streak interest: +5% per consecutive focus day, up to 50%.
- Review: 2 points per reviewed question, up to 10 a day.
- Rewards: you define rewards and their cost; redeeming creates a withdrawal in the statement. Ranks use lifetime earned points, so spending never lowers your rank.

No browser app can prove that you studied. The design adds commitment and friction so honest work is the easiest path:

1. You state your intent before the timer starts.
2. Leaving the tab or window is timed and counted (limit: 60 s total, 3 times).
3. Two random focus checks per session (30 s to tap).
4. The output note unlocks the bonus.
5. A flagged session pays half. Giving up pays nothing.
6. The timer runs on timestamps, so refreshing or closing the tab does not pause it; time away is counted on return.

Phones used outside the browser cannot be detected. Treat the bank as a motivation tool, not an audit.

## Data and privacy

- Settings, plan, notes, points: `localStorage` (`plan-v1`, `fp-session`).
- Files and photos: IndexedDB database `flightplan`.
- Nothing is uploaded. Clearing site data erases everything.
- Settings > Backup exports plan, notes and points as text. Files are not included; keep originals elsewhere.

## Project structure

```
index.html            App shell and script order
manifest.webmanifest  Install metadata
sw.js                 Offline cache (http/https only)
assets/icon.svg       App icon
css/tokens.css        Design tokens: colors, radii, line weight, light and dark
css/app.css           Base elements and components
css/focus.css         Bank, focus overlay, study space, segmented control
css/layout.css        Desktop layout (sidebar, two columns)
js/core.js            Constants, helpers, persisted state, theme
js/schedule.js        Daily tasks, scoring, statistics
js/views.js           Today, Plan, Settings, Insights pages
js/db.js              IndexedDB wrapper for files
js/bank.js            Points ledger, ranks, streak
js/focus.js           Pomodoro engine, focus overlay, Focus page
js/study.js           Subjects, notes, questions, review, files
js/app.js             Render loop, events, live clock
js/pwa.js             Service worker registration
tools/build.py        Bundles everything into dist/flight-plan.html
```

Scripts are classic (not ES modules) so the app works from `file://`. Module objects (`Bank`, `Focus`, `Study`, `DB`) expose small public APIs; shared state lives in `st` (see `fresh()` in `core.js`).

## Roadmap

- Per-subject performance in Insights
- Export and import files with notes
- Notifications for upcoming classes
