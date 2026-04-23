# AI Agent Operating Guide for Pulsar

Use this file as the default behavior contract for AI agents editing this repository.

## Primary Mission

Deliver a reliable iOS MVP that helps users maintain focus by staying in-app during focus and intentionally returning after breaks.

## Must-Read Context

Before implementing features or refactors, read:

1. `docs/context/product/prd.md`
2. `docs/context/engineering/state-machine.md`
3. `docs/context/engineering/implementation-standards.md`

## Non-Negotiable Rules

- Derive session state from timestamps, not notification timing.
- Treat notifications as side effects only.
- Never auto-start next focus session.
- Respect MVP out-of-scope boundaries.
- Prefer local-first and guest mode assumptions.

## Implementation Workflow

1. Clarify assumptions in PR/commit notes.
2. Implement smallest vertical slice possible.
3. Add or update tests for transition and lifecycle behavior.
4. Verify no regression in destabilization and break-return flow.

## Quality Bar

- Deterministic timer logic with injectable clock abstraction.
- Idempotent lifecycle reconciliation.
- Minimal, readable, maintainable code over cleverness.
