export type PresetId = 'pomodoro' | 'long' | 'custom';

export type SessionPreset = {
  id: PresetId;
  label: string;
  focusDurationMs: number;
  breakDurationMs: number;
};

export const PRESETS: Record<'pomodoro' | 'long', SessionPreset> = {
  pomodoro: {
    id: 'pomodoro',
    label: '25 / 5',
    focusDurationMs: 25 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
  },
  long: {
    id: 'long',
    label: '50 / 10',
    focusDurationMs: 50 * 60 * 1000,
    breakDurationMs: 10 * 60 * 1000,
  },
};

/** Plumbing default for “Custom” until a picker exists */
export const CUSTOM_PLACEHOLDER_PRESET: SessionPreset = {
  id: 'custom',
  label: 'Custom (30 / 5)',
  focusDurationMs: 30 * 60 * 1000,
  breakDurationMs: 5 * 60 * 1000,
};
