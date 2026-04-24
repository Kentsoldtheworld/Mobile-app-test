export type PresetId = 'frequent' | 'balanced' | 'minimal';

export type SessionPreset = {
  id: PresetId;
  label: string;
  focusDurationMs: number;
  breakDurationMs: number;
};

export const PRESETS: Record<PresetId, SessionPreset> = {
  frequent: {
    id: 'frequent',
    label: 'Frequent breaks',
    focusDurationMs: 10 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced breaks',
    focusDurationMs: 20 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal breaks',
    focusDurationMs: 30 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
  },
};
