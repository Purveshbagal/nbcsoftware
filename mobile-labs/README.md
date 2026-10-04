# NBC Labs — field employee app

The Android app for NBC Labs field staff. It talks only to the NBC Labs
(field force) workspace of the web application at `https://app.nbcpedia.com`,
under `/api/labs`. It is a separate app from the NBC Pedia app in `../mobile`:
different package (`com.nbclabs.nbc_labs_field`), different logins, and the two
can be installed side by side.

## Signing in

An administrator creates each employee's login in the web app:
**NBC Labs → People → Mobile App Access → Create login**. NBC Pedia user
accounts cannot sign in here, and employee logins cannot reach the NBC Pedia
side or the admin API — employee tokens are signed with a separate key.

Disabling access on that page signs the employee out at their next request.

## What the employee can do

| Area | In the app | Where the office sees it |
| --- | --- | --- |
| First launch | Asks for location (incl. "all the time"), notifications, storage/photos, battery-optimisation exemption | — |
| Attendance | Punch in (with work agenda + GPS) and punch out; month history with hours and km | HR Portal → Attendance |
| Live location | Shared from punch-in to punch-out, every ~2 min / 30 m, queued offline | Live Tracking (map, refreshes every 30 s) |
| Route | — | Live Tracking → pick employee → any day's route, punches and visit pins |
| Visits | Doctor or chemist/hospital call with GPS, objective, products, samples, gifts, POB, skipped reason | Visits → Doctors / Firms Visit, Reports |
| Directory | Doctors and firms in their zone or assigned to them; add new ones | People → Doctors, Sales → Firms |
| Orders (POB) | Book an order for a firm from the product list | Sales → Orders |
| Leave | Balance per type, apply (incl. half day), status | HR Portal → Leave Management |
| Expenses | Claim travel and other expenses, status | Expense → Expenses |
| Samples & gifts | Request from the office | Sample Request |
| Targets | This month's target vs. achieved | Sales → Target |
| Tasks | Reminders assigned to them; tick off | Reminders |
| Holidays | Holiday calendar for their zone | Calendar → Holiday & Work |
| E-detailing | Open presentations/media | E-detailing |
| Support | Raise a ticket, read the reply | Support |
| Profile | Details, change password | People → Employees |

Records are linked to an employee by their **name**, as everywhere else in the
field force workspace, so rename an employee only if you also want their
history to stop matching.

## Build

```sh
flutter pub get
flutter build apk --release        # build/app/outputs/flutter-apk/app-release.apk
```

Point a debug build at a local `next dev` server (emulator):

```sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/labs
```

Tracking cadence lives in [lib/config.dart](lib/config.dart).

## Before publishing

- The release build is signed with the debug key (as the NBC Pedia app is).
  Create an upload keystore before distributing widely.
- Google Play requires a declaration and review for background location. If
  you distribute through Play, fill in the location permission declaration;
  for direct APK installs this does not apply.
- Some phones (Xiaomi, Oppo, Vivo, Realme) kill background apps aggressively.
  Ask employees to allow "Autostart" / "No restrictions" for NBC Labs in
  battery settings, in addition to the in-app battery exemption.
