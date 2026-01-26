Claude Code Build Prompt — Accountability Website (GitHub Pages) v0.3

Use this as the single source of truth for building the app. Build exactly what's described, make pragmatic choices where specified, and document any assumptions.

0) Build Objective

Create a single-page accountability web app hosted on GitHub Pages using React + Vite, with:

Google Sign-In (two whitelisted emails)

Location-verified University Sign In / Sign Out (Feature 1)

Progress dashboard: core stats above the fold, secondary stats on scroll

Shared cloud storage with Firebase Auth + Cloud Firestore

The app must be optimized for Mac laptop + iPhone.

1) Non‑Negotiables

One page UI only (no separate “Progress” vs “University” pages). Everything is on the main page.

Google Sign-In required on load.

Only these emails can access:

JAMES_EMAIL = ptcgjamesc@gmail.com (can write)

PARTNER_EMAIL = datnumberguy20@gmail.com (read-only)

Firestore rules must enforce:

James: read/write

Partner: read-only

Everyone else: no access

Sign in/out is allowed only when within 1 km of the University coordinates.

All date/time logic must use Europe/Amsterdam.

2) Tech Stack

Frontend: React + Vite + TypeScript

Styling: Tailwind CSS (modern light blue theme, accessible)

Firebase Web SDK:

Firebase Auth (Google provider)

Cloud Firestore

Date/time: Luxon (for Europe/Amsterdam timezone correctness)

Testing: Vitest + React Testing Library (unit tests for calculations, geolocation, time utilities)

Deployment:

GitHub Pages static hosting

Manual deployment (no GitHub Actions required)

3) Firebase Requirements

3.1 Authentication

Use Google Sign-In.

Must work on iPhone Safari: use signInWithRedirect for cross-platform compatibility.

Configure Firebase Auth "Authorized domains" to include the GitHub Pages domain.

Firebase credentials: Hardcoded in source is acceptable (client-side keys are public; security enforced by Firestore rules).

3.2 Firestore

All session data and settings stored in Firestore.

3.3 Firestore Security Rules (must be implemented)

Only allow access to the two emails.

Partner must be read-only.

Rules must enforce permissions server-side (no frontend-only checks).

4) Data Model (Firestore)

Use a simple single-user schema (this app is for one person + one partner viewer).

Collections / Documents

config/app

monthStartAnchorDateTime (ISO string)

dailyTargetHours (number; default 7.5)

holidayExclusionsEnabled (boolean; default true)

sessions/{sessionId}

startTime (Firestore Timestamp)

endTime (Firestore Timestamp | null)

durationHours (number | null until closed)

verification:

method = "geolocation"

distanceMeters (number)

withinRadius (boolean)

accuracyMeters (number | null)

createdAt (Timestamp)

updatedAt (Timestamp)

Derived values (computed in app)

Signed-in status: existence of a session with endTime == null

Monthly totals: computed from closed sessions within the month period

5) University Location Verification

5.1 Coordinates

Latitude: 51.91741972748361

Longitude: 4.526238323980921

Allowed radius: 1000 meters

5.2 Geolocation

Use navigator.geolocation.getCurrentPosition.

Set enableHighAccuracy: true.

Use timeout and maximumAge reasonably.

5.3 Distance Calculation

Use Haversine formula.

5.4 Required UX on failure

If outside radius:

Show distance to university in meters.

If accuracy is poor (e.g., accuracyMeters is large), include a hint (e.g., "GPS accuracy is ±X m; try again outside / with better signal").

Allow user to retry the check-in/out attempt after viewing error.

If permission denied:

Hard block sign in/out for that attempt.

Show clear steps to re-enable location:

iPhone Safari: Settings → Privacy & Security → Location Services → Safari Websites → Allow

Mac: System Settings → Privacy & Security → Location Services → enable for browser

Include "Try Again" button to retry after fixing permissions.

Do not allow manual override bypass.

5.5 Development Mode

For local development and testing, support a dev bypass mode:

Use environment variable VITE_DEV_BYPASS_LOCATION=true to skip geolocation checks.

When active, log bypassed coordinates to console and show dev mode indicator in UI.

6) Feature 1 — Sign In / Sign Out

6.1 Core rules

Only JAMES_EMAIL can perform sign in/out.

If already signed in (open session exists): show Sign Out.

If not signed in: show Sign In.

6.2 Sign In flow

User taps Sign In.

Get geolocation.

Compute distance.

If within 1km:

Create a new session doc with startTime = now and endTime = null.

Else: show error with distance + accuracy hint.

6.3 Sign Out flow

User taps Sign Out.

Get geolocation.

Compute distance.

If within 1km:

Determine the intended end time:

If now() is on a later calendar date than the session startTime in Europe/Amsterdam, do not allow crossing midnight. Clamp end time using the same punishment rule:

endTime = min(start + 2 hours, 23:59 of start day in Europe/Amsterdam)

Else (same day): endTime = now()

Update the open session with endTime, compute durationHours.

Else: show error with distance + accuracy hint.

6.4 Session Duration Timer

When signed in (open session exists), display a live timer below the Sign Out button showing elapsed time since sign-in.

Timer requirements:

Format: HH:MM:SS (e.g., "02:45:32")

Updates every second in real-time

Uses clean sans-serif font with tabular numbers (no slashed zeros)

Calculates elapsed time as: current time - session startTime

Only visible when signed in

Timer resets to 00:00:00 when a new session starts

6.5 End-of-day auto-close punishment

If there is an open session from a past day:

Close it as: assumedEnd = min(start + 2 hours, 23:59 of start day in Europe/Amsterdam)

Store endTime = assumedEnd and compute durationHours.

Trigger auto-close:

On app load after auth

Whenever progress is computed

7) Progress Calculations

7.1 Month initialization + month periods (anchor + Start button)

The app must not track monthly progress until the month system is initialized.

Initialization UX (required):

After Google sign-in, if config/app.monthStartAnchorDateTime does not exist, show an interstitial setup state with a single prominent button: “Start”.

Pressing Start sets monthStartAnchorDateTime = now() in Europe/Amsterdam and begins tracking immediately.

Start is a one-time setup only: once monthStartAnchorDateTime is set, the app must never show Start again and must not provide any UI to reset/restart the anchor.

To minimize accidental activation:

Only JAMES_EMAIL can press Start.

PARTNER_EMAIL sees a message like “Waiting for setup” (no Start button).

Month period definition (anchor-based):

The app uses the stored monthStartAnchorDateTime as a repeating anchor.

The current month period is from the most recent anchor occurrence up to (but not including) the next monthly boundary.

When the next monthly boundary occurs, the UI naturally “resets” because calculations move to the new period; you do not need to overwrite the anchor in Firestore.

7.2 Holidays excluded

If holidayExclusionsEnabled is true, subtract expected hours for:

Dec 25

Jan 1
Only if the holiday falls on a weekday (Mon–Fri).

7.3 Targets

dailyTargetHours default 7.5.

Used in expected-hours computations.

7.4 Expected hours so far

Compute:

actualHoursSoFar = sum(durationHours of closed sessions within current month period)

expectedHoursSoFar = (# of eligible weekdays elapsed) × dailyTargetHours - (excluded holiday days × dailyTargetHours)

Timing rule:

If today has an incomplete session (signed in, not signed out): expected is counted up to yesterday.

Otherwise: include today if eligible weekday.

7.5 Attendance count

“You’ve shown up to university X times this month”

X = number of unique calendar dates (Amsterdam time) that have any sign-in within the month period.

7.6 Average stay

“Your average stay is X hours”

X = (total hours from closed sessions) / (days attended)

7.7 Color rules

If actualHoursSoFar < expectedHoursSoFar: display red

Else: display green

8) UI/UX Requirements (Single Page)

8.1 Layout

Single-column layout optimized for mobile and desktop.

Background: modern light blue (e.g., #E3F2FD or similar accessible shade).

Text: black by default with good contrast.

Styling: Clean, minimal design focused on functionality.

8.2 Above the fold (must be visible without scrolling)

A primary Sign In / Sign Out card with a large button.

Core stats:

Prominent “actual / expected” with red/green

Progress bar (green fill)

8.3 On scroll (secondary)

Attendance count

Average stay

Recent session list (last 7 days only)

Settings section (high-friction edits)

8.5 Time Display Format

Display all times in 12-hour format with AM/PM (e.g., "9:30 AM - 5:45 PM")

Use Europe/Amsterdam timezone for all time calculations

8.4 Partner restrictions

If signed in as PARTNER_EMAIL:

Hide or disable Sign In/Out button

Hide or disable Settings edits

Still display all stats and session history

9) Settings (High Friction)

Settings exist on the same page, below the fold.

Editable fields

dailyTargetHours (number)

holidayExclusionsEnabled (boolean)

High-friction requirement

Implement a deliberate unlock mechanism before edits are allowed. Any reasonable method is acceptable, e.g.:

“Unlock Settings” button → modal → requires typing a confirmation phrase (e.g., “UNLOCK”) → then allows editing.

Show a clear warning that changing targets affects comparisons.

Target change rule (decided)

Changes to dailyTargetHours apply retroactively to the entire current month period (i.e., expected-hours recalculates using the new value).

Settings changes must persist to Firestore.

10) App Architecture Requirements

Design so Feature 2+ can be added easily.

Suggested structure

src/

components/ (SignInGate, StartScreen, CheckInCard, ProgressStats, SecondaryStats, SessionList, SettingsPanel, ErrorDisplay)

hooks/ (useAuth, useGeolocation, useSessions, useConfig)

lib/ (firebase.ts, firestore.ts, time.ts, geo.ts, calculations.ts)

Keep it simple and extensible; skip formal feature registry pattern in favor of clean, well-organized code.

11) Deployment Requirements

Build with Vite.

Deploy to GitHub Pages (manual deployment by user after implementation is complete).

Include a README with:

Local dev steps

Firebase project creation and setup steps (from scratch)

How to deploy Firestore security rules

How to set Authorized Domains

How to build and deploy to GitHub Pages manually

Include .env.example template for Firebase config (credentials will be hardcoded in source)

12) Acceptance Tests (Developer Checklist)

After implementation:

Unit tests: Run npm test to verify calculations, geolocation, and time utilities (>80% coverage on lib/ functions).

Manual tests:

Sign in with James email → app loads → can sign in/out near uni only (or dev mode).

Sign in with Partner email → app loads → cannot sign in/out or change settings.

Non-whitelisted email → Access Denied.

Outside 1km → blocked with distance shown, "Try Again" button allows retry.

Location denied → blocked with platform-specific instructions shown, "Try Again" button allows retry.

If an open session exists from yesterday → it auto-closes with punishment rule on app load.

Core stats match calculations (verify actual/expected hours, attendance, average stay).

Settings unlock mechanism works, changes persist to Firestore.

Start button initializes month anchor (one-time only).

Test on Mac laptop and iPhone Safari for responsiveness.

13) Resolved Clarifications

All previously open ambiguities are now decided:

Month anchor initialization: Use a Start button with minimal explanation. When monthStartAnchorDateTime is missing, show Start interstitial and set anchor when James presses Start.

Changing dailyTargetHours mid-month: Apply retroactively to the entire current month period.

Session crossing midnight: Do not allow it. If sign-out occurs after midnight relative to session start, clamp endTime to min(start+2h, 23:59 of start day).

Firebase setup: Include complete Firebase project creation instructions in README (user does not have existing credentials).

Credentials management: Firebase config can be hardcoded in source code (acceptable for client-side web apps).

Date/time library: Use Luxon exclusively for timezone handling.

Styling approach: Tailwind CSS with modern, accessible light blue theme, clean and minimal design.

Architecture: Simple, well-organized structure without formal feature registry pattern.

Session list display: Show last 7 days of sessions only.

Time format: 12-hour format with AM/PM for all displayed times.

Geolocation failure handling: Block the attempt, show clear error and "Try Again" button, no manual override allowed.

Development mode: Include VITE_DEV_BYPASS_LOCATION environment variable to bypass location checks during development.

Testing: Include unit tests with Vitest for core calculations, geolocation, and time utilities.

Deployment: Manual deployment to GitHub Pages (no automated CI/CD needed).