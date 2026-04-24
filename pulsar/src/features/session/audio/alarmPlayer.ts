import { Audio } from 'expo-av';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ALARM_ASSET = require('../../../../assets/sounds/alarm.mp3') as number;

let activeSound: Audio.Sound | null = null;

export async function playAlarm(): Promise<void> {
  try {
    // Ensure audio plays even in silent mode on iOS
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });

    // Unload any previously playing alarm first
    if (activeSound) {
      await activeSound.stopAsync().catch(() => {});
      await activeSound.unloadAsync().catch(() => {});
      activeSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(ALARM_ASSET, {
      shouldPlay: true,
      volume: 1.0,
    });
    activeSound = sound;

    // Auto-unload after playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        activeSound = null;
      }
    });
  } catch {
    // Non-fatal — alarm is best-effort
  }
}

export function stopAlarm(): void {
  if (activeSound) {
    activeSound.stopAsync().catch(() => {});
    activeSound.unloadAsync().catch(() => {});
    activeSound = null;
  }
}
