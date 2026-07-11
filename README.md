# ryanroehler.com — Site Update

## What's included
- `index.html` — Home page (restyled, existing content)
- `resume.html` — Resume (restyled, all your existing content preserved)
- `portfolio.html` — New Portfolio tab with 3 sample projects (edit/replace as needed)
- `budget.html` — New password-protected Budget Dashboard (Firebase-backed)
- `styles.css` — Shared stylesheet for all pages

## Before you push to GitHub

### 1. Media files
Your `media/` folder (Headshot.jpg, Security+.jpg, ITIL.png) is referenced the same
way as before — just make sure it stays in the repo alongside these files.

### 2. Contact form
Your existing contact form likely has a working `action="..."` attribute (Formspree
or similar) that I didn't have access to. In `index.html`, find:

```html
<form action="" method="POST">
```

and replace the empty `action=""` with whatever endpoint your current form uses.

### 3. Firestore security rules (important — do this before going live)
Right now, anyone with your Firebase project could theoretically read/write your
`budget` data unless you set rules. In the Firebase Console:

1. Go to **Build → Firestore Database → Rules**
2. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This restricts all reads/writes to logged-in users only — since you're the only
user with a login, this keeps your budget data private while still public-facing
your Home/Resume/Portfolio pages (those don't touch Firestore at all).

4. Click **Publish**.

### 4. Logging in to the Budget tab
Use the email + password you created under **Build → Authentication → Users**
when you set up Firebase. That's what you'll type into the login form on
`budget.html`.

## How the Budget Dashboard works
The Budget tab now has 6 sub-sections (tabs within the page, not separate URLs):

- **Overview**: Net Cash / Total Debt / Checking Goal metrics, a Debt Freedom
  Progress bar, and three charts:
  - **Net Cash & Debt Over Time** (line) — built from your Weekly Tracker history
  - **Spending by Category** (doughnut) — built from the current month's Monthly
    Budget actuals
  - **Budgeted vs Actual** (bar) — every spending category side by side for the
    selected month
- **Accounts**: same as before — edit the four balances, Save Balances syncs
  everywhere.
- **Monthly Budget**: pick a month, fill in Budgeted/Actual across Income, Fixed
  Bills, Debt Payments, Purdue Weekly Spending, and Savings. Totals and a
  Left Over summary calculate live. Each month saves separately.
- **Import CSV**: upload a transaction export from your bank/card. Map which
  column is Date/Description/Amount, set keyword-based category rules (e.g.
  `kroger => purdue.groceries`), preview the categorized totals, then import
  into any month — this **adds** to that month's existing Actuals rather than
  overwriting, so multiple statements in a month stack correctly. Nothing is
  sent to any third party; the CSV is parsed entirely in your browser.
- **Debt Plan**: your Q3/Q4/Q1 milestones (editable) plus a live Payoff
  Calculator.
- **Weekly Tracker**: the Friday log with separate **Win** and **Adjustment**
  fields.

### Firestore data structure
```
budget/
  accounts                     — {navyFederal, purdueFCU, savorOne, oneKey}
  debtProgress                 — {startingDebt}
  debtPlan                     — {quarters: [...], savorOnePayment, oneKeyPayment}
  categoryRules                — {rulesText} — your CSV keyword-to-category rules
  monthlyBudget/months/{YYYY-MM} — one doc per month, budgeted/actual fields
  weeklyLog/entries/{auto-id}  — {date, navyFederal, purdueFCU, savorOne, oneKey, win, adjustment}
```
Nothing extra to configure — this all works with the same Firestore rules and
login you already set up.

### External libraries used (both via CDN, no npm/build step needed)
- **Chart.js** — renders the three Overview charts
- **PapaParse** — parses the CSV file entirely client-side in Import CSV



## Progressive Web App (PWA) — "Financial Friday"
Only the Budget Dashboard is set up as an installable app — Home, Resume, and
Portfolio stay as plain web pages with no app hooks.

### New files
- `manifest.json` — names the app "Financial Friday", sets colors, icons, and
  makes `budget.html` the entry point
- `sw.js` — service worker; caches `budget.html` + its stylesheet/icons for
  fast loading (you'll still need a connection to log in or load live budget
  data, since that comes from Firebase, not the cache)
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png` —
  the "Financial Friday" app icon: stacked big-F drop caps in two greens on a
  dark radial background, with "inancial"/"riday" in small pale text

### What changed
Only `budget.html` links to `manifest.json`, sets a theme color, and registers
the service worker. `index.html`, `resume.html`, and `portfolio.html` are
untouched — they will not show an install prompt and are not part of the app.

### After pushing to GitHub
1. Push the `icons/` folder along with `manifest.json`, `sw.js`, and
   `budget.html`.
2. On your Android phone, open **ryanroehler.com/budget.html** in Chrome.
3. Tap the **⋮** menu (top right) → **Install app** (or **Add to Home
   Screen**).
4. You'll get a "Financial Friday" icon on your home screen — tapping it opens
   straight to the login screen in full-screen app mode, no browser bar.

### Cache-busting reminder
`sw.js` has its own hardcoded list of files to cache (`APP_SHELL`), including
`styles.css?v=3`. If you bump the CSS version again later, update that same
version number inside `sw.js`, change `CACHE_NAME` to a new version (e.g.
`financial-friday-shell-v2`), and push both together — this forces the
installed app to fetch fresh files instead of serving old cached ones.
