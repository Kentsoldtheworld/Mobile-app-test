# Engineering Standards (MVP)

## Architecture

- Keep core timing logic in a pure domain layer.
- Use lifecycle handlers only to emit events and trigger reconciliation.
- Isolate notification scheduling behind a small adapter interface.

## Reliability

- Persist timestamps immediately on transitions.
- Reconcile on app active, cold launch, and significant time shifts.
- Assume notification delivery can be delayed or dropped.

## Testing

- Unit test all state transitions with deterministic clock injection.
- Add tests for delayed notifications and background/foreground churn.
- Validate no auto-restart occurs after break completion.

## Data

- Local-first storage only for MVP.
- Track interruption counts and timestamps for analytics.
- Avoid collecting unnecessary personal data.

## Product Constraints

- Preserve explicit user agency for starting sessions.
- Keep nudges intentional and minimal.
- Do not implement out-of-scope features without PM approval.
