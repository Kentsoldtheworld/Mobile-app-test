# Pulsar PRD (MVP)

## Product Overview

Pulsar is an iPhone-first focus timer for people doing digital work on a computer while their phone is the primary distraction. Focus is maintained by staying in the app and broken by leaving it.

## Problem

Current productivity tools measure time but do not intervene when impulsive phone distraction happens, causing context switching and lost time.

## Goal

Build a lightweight, emotionally engaging system that:

- interrupts automatic phone usage
- reinforces intentional focus sessions
- nudges deliberate return after breaks

## Target User

Distraction-sensitive knowledge workers (including ADHD-prone users) who work on a desktop and impulsively check phones.

## MVP Loop

1. User opens app.
2. Selects mode (preset or custom).
3. Starts focus session.
4. If app exits during focus, session destabilizes.
5. Break starts after focus completion.
6. Break completion notification invites return.
7. User manually starts next session.

## In Scope

- Focus timer: presets plus custom duration
- Session states: idle, focus active, break active, destabilized, completed
- App exit detection during focus
- Minimal notifications
- Local session history and interruption tracking
- Guest mode, local-first storage

## Critical Behavior

- Derive session state from timestamps, never from notification delivery time.
- Reconcile state on app foregrounding.
- Notification delays must not corrupt true state.

## Out of Scope

- Desktop/web companion
- To-do or task planning systems
- AI task suggestions
- Accounts or sync
- Cross-device logic
- Aggressive notification loops

## Success Criteria

- Higher uninterrupted-session completion rate
- Return-after-break rate
- Lower interruptions per session
- Repeat usage over 3 to 7 days
