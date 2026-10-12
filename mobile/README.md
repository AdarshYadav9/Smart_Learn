# Smart Learn mobile

React Native Community CLI app with native **Android** and **iOS** projects. No Expo runtime, Router, or tooling. React Native 0.87.1; TypeScript.

## Install and run

Use Node 22.13+, 24.3+ or 26+, as required by the React Native template.

```sh
cd mobile
npm ci
npm start
```

Keep Metro running. In another terminal, run one platform:

```sh
cd mobile
npm run android
# or, on macOS with full Xcode and CocoaPods installed:
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

Android requires JDK 17 and the SDK/build-tools versions in `android/build.gradle`, plus a device/emulator. Set ANDROID_HOME to the SDK location or configure `android/local.properties` (untracked). iOS requires full Xcode, an installed simulator runtime and CocoaPods. See https://reactnative.dev/docs/set-up-your-environment . The Android template uses a development signing key; configure release signing before distribution.

## Backend connection

Start the existing FastAPI backend with its configured environment, binding to `0.0.0.0:8000` for phone access. Enter the server origin **without /api** at sign-in:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Physical device: your backend computer’s LAN IP on the same Wi-Fi, or an HTTPS server.

Local HTTP is allowed only in debug native builds. Release builds require HTTPS. No client environment file is needed. Never put backend secrets or AI keys in the app. Sessions remain in memory; sign in again after restarting.

## Features and scope

Existing student-account login, active enrolled classes, published enrolled-class assignments, question details, scores/status and latest 50 campus announcements. Includes pull-to-refresh, loading/empty states, timeout/retry and sign-out on expired authorization.

Teacher/admin workflows, signup, class joining, assignment uploads, AI chat, push notifications and offline persistence remain future contributions. Use the web app for those actions. Web-only localStorage enrollments do not sync; this app reads DB memberships.

The backend student-assignment endpoint returns every published assignment. Mobile filters by enrollment for display; enforce enrollment on the backend before production. Unscoped work is excluded. Announcements are campus-wide.

## Validation

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
cd android
./gradlew assembleDebug
```

For iOS, install pods and build using Xcode or `npm run ios`. Platform JavaScript bundling alone does not confirm native compilation or live API correctness.

## Contribute

Include only `mobile/` in a contribution branch/PR. Manually verify student login, enrollments, assignment questions and zero scores, announcements, offline retry, token expiry and logout on both platforms against a seeded backend.

## Checks completed — 11 October 2026

- TypeScript and ESLint pass without warnings.
- Both Jest suites pass: four tests covering sign-in rendering and API behavior.
- Android and iOS production JavaScript bundles pass.
- Android `assembleDebug` passes for arm64-v8a, armeabi-v7a, x86 and x86_64.
- iOS plist/project syntax and Podfile syntax pass. Native iOS compilation is unverified because this Mac has Command Line Tools rather than full Xcode.
- Live backend/device workflows remain unverified.

The generated React Native dependency tree reports 53 npm audit advisories (48 high, five moderate). Review compatible upstream dependency updates before a production release; no forced framework upgrades/downgrades were applied.
