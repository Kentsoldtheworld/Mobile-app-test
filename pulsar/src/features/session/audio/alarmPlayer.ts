import { Audio } from 'expo-av';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ALARM_ASSET = require('../../../../assets/sounds/alarm.mp3') as number;

// When a dedicated break-end sound is available, drop it in assets/sounds/
// and update BREAK_ALARM_ASSET to point to it.
const BREAK_ALARM_ASSET = ALARM_ASSET;

let activeSound: Audio.Sound | null = null;

async function playOnce(asset: number): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync(asset, {
    shouldPlay: true,
    volume: 1.0,
  });

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
    }
  });

  return sound;
}

async function ensureAudioMode() {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    shouldDuckAndroid: false,
  });
}

async function stopActive() {
  if (activeSound) {
    await activeSound.stopAsync().catch(() => {});
    await activeSound.unloadAsync().catch(() => {});
    activeSound = null;
  }
}

/**
 * Focus complete — single calm chime.
 */
export async function playFocusAlarm(): Promise<void> {
  try {
    await ensureAudioMode();
    await stopActive();
    activeSound = await playOnce(ALARM_ASSET);
  } catch {
    // Non-fatal
  }
}

/**
 * Break complete — double chime with a short gap, intentionally more urgent
 * than the focus alarm so the user knows it's time to get back to work.
 * Swap BREAK_ALARM_ASSET for a separate file whenever one is added.
 */
export async function playBreakAlarm(): Promise<void> {
  try {
    await ensureAudioMode();
    await stopActive();

    await playOnce(BREAK_ALARM_ASSET);

    // Short pause then second hit — the double-ring is the urgency signal
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    activeSound = await playOnce(BREAK_ALARM_ASSET);
  } catch {
    // Non-fatal
  }
}

export function stopAlarm(): void {
  if (activeSound) {
    activeSound.stopAsync().catch(() => {});
    activeSound.unloadAsync().catch(() => {});
    activeSound = null;
  }
}
