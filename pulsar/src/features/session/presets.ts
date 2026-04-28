export type PresetId = 'study' | 'flow' | 'deepwork' | 'mercy';

export type SessionPreset = {
  id: PresetId;
  label: string;
  focusDurationMs: number;
  breakDurationMs: number;
};

/**
 * Study  — 20 min / 5 min
 *   Based on Dr. Russell Barkley and the ADHD Coaches Organisation:
 *   15-20 min is the evidence-based attention ceiling before ADHD drift.
 *   Frequent completions create the dopamine reward loop that sustains effort.
 *
 * Flow   — 35 min / 10 min
 *   Csikszentmihalyi's flow-state research: focus takes ~15 min to fully load,
 *   so 35 min gives a solid peak window without burning out routine work.
 *
 * Deep Work — 90 min / 20 min
 *   Nathaniel Kleitman's Basic Rest-Activity Cycle (BRAC), validated by
 *   Andrew Huberman and NASA: the brain has a hardwired ~90 min performance
 *   window before acetylcholine/dopamine deplete. 20 min break allows full
 *   neurochemical recovery before the next cycle.
 *
 * Mercy — 10 min / 25 min
 *   For heavy-resistance tasks: minimal focus windows, longer recovery so the
 *   ratio rewards showing up without pretending the work is easy. (Chip can be
 *   re-enabled alongside Study via PRESET_ORDER in modes.tsx.)
 */
export const PRESETS: Record<PresetId, SessionPreset> = {
  study: {
    id: 'study',
    label: 'Study',
    focusDurationMs: 20 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
  },
  flow: {
    id: 'flow',
    label: 'Flow',
    focusDurationMs: 35 * 60 * 1000,
    breakDurationMs: 10 * 60 * 1000,
  },
  deepwork: {
    id: 'deepwork',
    label: 'Deep Work',
    focusDurationMs: 90 * 60 * 1000,
    breakDurationMs: 20 * 60 * 1000,
  },
  mercy: {
    id: 'mercy',
    label: 'Mercy',
    focusDurationMs: 10 * 60 * 1000,
    breakDurationMs: 25 * 60 * 1000,
  },
};
