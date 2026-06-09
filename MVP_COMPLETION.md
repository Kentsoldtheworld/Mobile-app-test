# MVP Completion Checklist

> Delete this file when all items are checked off.

---

## 1. Behavior Verification (remaining edge cases)

- [ ] Kill app mid-session → reopen → state reconciles correctly (does not resume focus as if still active)
- [ ] Multi-cycle sessions (2+ cycles): focus → break → next focus → complete flows end-to-end without stale state

---

## 2. Interstitial Countdown Timers on Confirmation Buttons

Users can sit in `focus_complete` or `break_complete` indefinitely without proceeding, breaking the engagement loop.

- [ ] Add a 2-minute (120s) countdown displayed inside the "Start break" button (`focus_complete` state)
- [ ] Add a 2-minute (120s) countdown displayed inside the "Start next focus" button (`break_complete` state)
- [ ] If the countdown expires before the user taps: call `resetSessionToIdle()` and navigate home
- [ ] Countdown resets if the state changes (e.g. user taps in time)
- [ ] Format: `"Start break  1:47"` — time appended after two spaces at end of button label

---

## 3. Wire Focus-Complete Background Notification

`scheduleFocusCompleteNotification` exists in `notificationService.ts` but is never called.

- [ ] Call `scheduleFocusCompleteNotification(focusEndsAt)` inside `onAppBackground` when `session.state === 'focus_active'`, alongside the existing grace notifications
- [ ] Confirm it cancels correctly when the user returns to foreground before focus ends

---

## 3. Fermi ↔ Session State Integration

Fermi is a home-screen proof-of-concept only. Not connected to session state or notifications.

- [ ] Show Fermi on the session screen (focus_active, break_active, destabilized, completed states)
- [ ] Map session states to Fermi expressions (e.g. focus → focused/intense, break → happy, destabilized → sad/distressed, completed → happy)
- [ ] Update notification copy to match UX tone from docs (`"Fermi is destabilizing..."`, `"Break complete. Ready to stabilize?"`)

---

## 4. Post-Session "Start Another Round"

`startNextRound` is implemented in the store and imported in `session.tsx` but the completed screen only offers "Return home."

- [ ] Add a "Start another round" button to the completed screen that calls `startNextRound`
- [ ] Confirm it does not auto-trigger — must be an explicit user tap (guardrail: never auto-start)

---

## 5. Lifecycle Test Coverage

Per `implementation-standards.md`: unit test all transitions with injectable clock; cover background/foreground churn.

- [ ] Grace period: background during focus → wait 60s → foreground → assert destabilized
- [ ] Pause compensation: background during focus → return within grace → assert `focusStartedAt` was pushed forward and countdown resumes correctly
- [ ] Cold-start reconciliation: persist `focus_active` session, create fresh store instance, call `reconcile` → assert correct derived state
- [ ] Multi-cycle reconciliation: assert `break_active` → `break_complete` and `focus_active` → `focus_complete` transitions fire correctly across cycles

---

## 6. Polish

- [ ] Wire `hasSeenWelcome` — build a first-run welcome/onboarding screen and set the flag on dismiss
- [ ] Pass `presetId` into `startSessionCustomMinutes` when a preset chip is active, so history can distinguish Flow vs Deep Work vs custom
- [ ] Notification tap → deep link to `/session` if a session is active
- [ ] Manual "end session" (X button → confirm) should log a history record (same as destabilized, or its own outcome type)
