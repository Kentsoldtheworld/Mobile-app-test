# Pulsar MVP Tech Stack & Development Environment

## Purpose

This document defines the recommended tech stack and local development setup for the Pulsar MVP. It is written for a two-developer workflow:

- **Mac developer:** primary iOS validation, simulator testing, TestFlight/App Store readiness
- **Windows developer:** shared app development, UI implementation, business logic, Android/browser testing, Expo cloud builds where needed

Pulsar is an iPhone-first focus timer for digital workers who use their phone as the main distraction while working at a computer. The MVP should stay lean: focus timers, break timers, app-exit destabilization, notifications, and timestamp-based state reconciliation.

---

## Product Constraints That Affect the Tech Stack

The MVP depends on mobile behavior, especially:

- detecting when the app is foregrounded or backgrounded
- scheduling local notifications
- storing session timestamps reliably
- reconciling timer state when the user returns
- keeping the app simple enough to launch quickly

Because iOS limits background execution, Pulsar should not rely on constant background monitoring. Instead, the app should use lifecycle events, stored timestamps, and local notifications.

---

## Recommended Stack

### Core App

- **Expo**
- **React Native**
- **TypeScript**
- **Expo Router**

This gives us a fast cross-platform foundation while keeping the project friendly for Cursor, AI agents, and future Android support.

### State Management

Recommended:

- **Zustand** for app/session state

Why:

- lightweight
- easy to reason about
- simple for AI agents to modify
- avoids overcomplicated Redux-style boilerplate

### Local Persistence

Recommended for MVP:

- **AsyncStorage** or **MMKV** for simple persisted session state
- consider **SQLite** only if session history becomes more complex

For the MVP, we only need to persist:

- current session state
- focus start timestamp
- break start timestamp
- interruption timestamps
- completed session history
- basic user settings

### Notifications

Recommended:

- **expo-notifications**

MVP notification types:

1. **Destabilization notification**
   - scheduled shortly after the user exits during focus
   - example: "Fermi is destabilizing..."

2. **Break-complete notification**
   - scheduled when a break ends
   - example: "Break complete. Ready to stabilize?"

Important: notifications should not be treated as perfect clocks. Session state should always be calculated from stored timestamps when the app becomes active again.

### App Lifecycle

Use React Native / Expo app state tools to detect transitions such as:

- active
- inactive
- background

During an active focus session, if the app moves away from active state, transition the session into `destabilized` or record a destabilization timestamp.

### Backend

No backend for MVP.

Do not add auth, cloud sync, or accounts until the core loop is proven.

Future backend option:

- **Supabase** for auth, cross-device sync, cloud history, and desktop companion state

### Desktop Companion

Out of scope for MVP.

Future option:

- **Next.js** web app
- reads/writes shared session state from Supabase
- mirrors timer and task UI
- does not act as the enforcement source

The phone remains the source of truth.

---

## MVP Scope

### In Scope

- iPhone-first mobile app
- focus timer
- break timer
- preset modes such as 25/5 and 50/10
- optional custom focus/break duration
- guest mode
- local persistence
- app-exit detection during focus
- destabilized state
- single destabilization notification
- break-complete notification
- manual restart after break, not auto-start
- timestamp-based state reconciliation

### Out of Scope

- desktop/web companion
- to-do lists
- AI task suggestions
- account creation
- cross-device sync
- Picture in Picture behavior
- aggressive repeated notifications
- continuous background monitoring

---

## Session State Model

Suggested states:

```ts
type SessionState =
  | "idle"
  | "focus_active"
  | "break_active"
  | "destabilized"
  | "completed";
```

Suggested session shape:

```ts
type PulsarSession = {
  id: string;
  state: SessionState;
  focusDurationMs: number;
  breakDurationMs: number;
  focusStartedAt?: string;
  breakStartedAt?: string;
  destabilizedAt?: string;
  completedAt?: string;
  interruptionCount: number;
};
```

Use ISO strings or epoch timestamps consistently. Epoch milliseconds are usually easier for timer math.

---

## Timestamp Reconciliation Rule

The app should never rely only on the visible timer or notification delivery.

When the app becomes active:

1. Load the persisted session.
2. Compare current time to stored timestamps.
3. Determine the correct state.
4. Update UI accordingly.

Example:

- break started at `10:00:00`
- break duration is 5 minutes
- notification arrives at `10:05:20`
- app should still know the break ended at `10:05:00`

This protects the MVP from iOS notification delay, app suspension, and low-power behavior.

---

## Mac Development Setup

The Mac developer owns iOS validation and release readiness.

### Required Tools

Install:

- **Xcode** from the Mac App Store
- **Node.js LTS**
- **Git**
- **VS Code** or **Cursor**
- **Expo CLI via npx**
- optional: **Watchman**

### Verify Setup

```bash
node -v
npm -v
git --version
xcodebuild -version
```

### Create Project

```bash
npx create-expo-app pulsar --template
cd pulsar
npm install
```

Choose a TypeScript Expo template if prompted.

### Run iOS Simulator

```bash
npx expo start
```

Then press:

```bash
i
```

This opens the app in the iOS Simulator.

### Physical iPhone Testing

Install Expo Go on the iPhone for early testing.

Run:

```bash
npx expo start
```

Then scan the QR code with the iPhone.

For features that require a custom native runtime or deeper iOS behavior, use Expo development builds later.

### iOS Release Path

Eventually needed:

- Apple Developer account
- Expo EAS account
- EAS Build
- TestFlight

Install EAS CLI when needed:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Build for iOS:

```bash
eas build --platform ios
```

---

## Windows Development Setup

The Windows developer can build most of the MVP without Xcode.

Windows can support:

- React Native/Expo app development
- UI implementation
- timer state machine
- notification logic scaffolding
- local persistence
- Android testing
- web preview where applicable
- GitHub collaboration

Windows cannot support:

- Xcode
- iOS Simulator
- local native iOS builds
- direct App Store/TestFlight submission without cloud/Mac support

### Required Tools

Install:

- **Node.js LTS**
- **Git**
- **VS Code** or **Cursor**
- optional: **Android Studio** for Android emulator testing
- Expo Go on physical iPhone for limited testing

### Verify Setup

```bash
node -v
npm -v
git --version
```

### Clone Project

```bash
git clone <repo-url>
cd pulsar
npm install
```

### Run Expo

```bash
npx expo start
```

Options:

- scan QR with Expo Go on iPhone for basic testing
- run on Android emulator if Android Studio is installed
- run web preview if useful for layout checks

### Notes for Windows Developer

The Windows developer should avoid making assumptions about final iOS behavior without validation from the Mac developer.

Any feature involving:

- app backgrounding
- notification timing
- iOS lifecycle behavior
- permissions
- TestFlight behavior

should be tested on the Mac/iPhone path before being marked complete.

---

## Recommended Repo Structure

```txt
pulsar/
  app/
    index.tsx
    session/
      index.tsx
    settings/
      index.tsx
  src/
    components/
    features/
      session/
        sessionStore.ts
        sessionTypes.ts
        sessionUtils.ts
        useSessionLifecycle.ts
      notifications/
        notificationService.ts
      persistence/
        storage.ts
    theme/
    utils/
  assets/
  docs/
    prd.md
    tech-stack.md
  package.json
```

Keep core logic out of screens where possible. Cursor and other agents perform better when business logic is separated into clear files.

---

## Recommended Cursor Rules

Create a `.cursor/rules/pulsar.md` file with guidance like:

```md
# Pulsar Coding Rules

You are helping build Pulsar, an iPhone-first focus timer for ADHD-prone digital workers.

Prioritize:
- simple TypeScript
- clear state machines
- local-first persistence
- accessible UI
- reliable timestamp-based logic
- minimal dependencies

Do not add:
- backend/auth unless explicitly requested
- AI task features
- desktop companion code
- aggressive notification loops
- background monitoring assumptions that iOS will not allow

All timer state must be derived from persisted timestamps, not only setInterval.

When implementing notifications, treat them as nudges, not as the source of truth.
```

---

## AI/Vibe Coding Workflow

Recommended workflow:

1. Keep PRD in `/docs/prd.md`.
2. Keep this tech stack doc in `/docs/tech-stack.md`.
3. Create small implementation tickets.
4. Prompt Cursor against one ticket at a time.
5. Ask Cursor to explain files changed before accepting large edits.
6. Commit after each working slice.

Example ticket prompt:

```md
Implement the Pulsar session state machine.

Use the PRD and tech stack docs for context.

Requirements:
- create session types
- create Zustand session store
- support idle, focus_active, break_active, destabilized, completed
- store timestamps using epoch milliseconds
- include helper functions for elapsed time and state reconciliation
- do not add backend or auth
- keep logic separate from UI components
```

---

## First Build Milestones

### Milestone 1: App Shell

- Expo app running
- basic navigation
- placeholder home screen
- theme foundation

### Milestone 2: Timer State Machine

- create session
- start focus
- start break
- complete session
- persist session locally

### Milestone 3: Lifecycle Detection

- detect app leaving active state
- if focus is active, mark destabilized
- show recovery screen when user returns

### Milestone 4: Notifications

- request notification permission
- schedule destabilization notification
- schedule break-complete notification
- cancel irrelevant notifications when state changes

### Milestone 5: Timestamp Reconciliation

- reconcile active focus/break state when app returns
- avoid relying on notification delivery timing
- handle delayed return gracefully

### Milestone 6: MVP Polish

- Fermi copy system
- simple motion/visual feedback
- session result screen
- basic local history

---

## Core Build Principle

Do not overbuild the app before validating the core behavior.

The MVP succeeds if users understand and feel this loop:

**Stay in Pulsar during focus. Leave during break. Return intentionally when Fermi calls you back.**
