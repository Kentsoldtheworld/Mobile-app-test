# Session State Machine (Source of Truth)

## States

- `idle`
- `focus_active`
- `break_active`
- `destabilized`
- `completed`

## Required Timestamps

- `focusStartedAt`
- `focusDurationSec`
- `breakStartedAt` (nullable)
- `breakDurationSec` (nullable)
- `destabilizedAt` (nullable)
- `completedAt` (nullable)
- `interruptions[]` (timestamp list)

## Transition Rules

1. `idle -> focus_active`: user taps Start.
2. `focus_active -> destabilized`: app backgrounds/exits before focus ends.
3. `focus_active -> break_active`: focus duration elapsed and not destabilized.
4. `break_active -> completed`: break duration elapsed.
5. `completed -> focus_active`: user manually starts next session.

## Reconciliation (On Foreground / Resume)

1. Read persisted timestamps.
2. Compute expected phase from `now`.
3. If previously `focus_active` and app had background event during focus window, set `destabilized`.
4. If break window elapsed, set `completed`.
5. Never trust notification arrival time for state.

## Invariants

- Notifications are side effects, not authority.
- State must be derivable from storage plus current time.
- Reconciliation must be idempotent and safe to run repeatedly.
