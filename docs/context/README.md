# Pulsar Context Docs

This folder is the shared source of truth for product intent, constraints, and implementation behavior.

The Expo + React Native app lives in the `pulsar/` directory at the repository root.

## Structure

- `product/prd.md`: Product requirements and MVP scope.
- `product/ux-principles.md`: Behavioral design principles and notification tone.
- `engineering/state-machine.md`: Canonical session state machine and timestamp reconciliation.
- `engineering/implementation-standards.md`: Engineering standards for iOS MVP delivery.
- `engineering/pulsar-tech-stack-cursor.md`: Recommended stack, environments, and implementation workflow.

## How Agents Should Use This

1. Read `product/prd.md` before making product-impacting changes.
2. Validate all timer logic against `engineering/state-machine.md`.
3. Keep solutions aligned with MVP constraints and out-of-scope boundaries.
4. Prefer small, testable changes with explicit assumptions.
