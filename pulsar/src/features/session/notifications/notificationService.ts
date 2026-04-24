import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export const NOTIF_ID_BREAK_END = 'pulsar-break-end';
export const NOTIF_ID_DESTABILIZE = 'pulsar-destabilize-nudge';

let handlerConfigured = false;

function ensureAndroidChannel() {
  void Notifications.setNotificationChannelAsync('pulsar-default', {
    name: 'Pulsar',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function ensureHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  ensureHandler();
  ensureAndroidChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

export async function cancelBreakEndNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_BREAK_END).catch(() => {});
}

export async function cancelDestabilizeNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_DESTABILIZE).catch(() => {});
}

export async function cancelAllPulsarNotifications(): Promise<void> {
  await cancelBreakEndNotification();
  await cancelDestabilizeNotification();
}

export async function scheduleBreakCompleteNotification(fireAtMs: number): Promise<void> {
  ensureHandler();
  ensureAndroidChannel();
  await cancelAllPulsarNotifications();
  const when = Math.max(fireAtMs, Date.now() + 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_BREAK_END,
    content: {
      title: 'Break complete',
      body: 'Ready to stabilize when you are.',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(when),
      channelId: 'pulsar-default',
    },
  });
}

export async function scheduleDestabilizationNudge(delayMs = 2500): Promise<void> {
  ensureHandler();
  ensureAndroidChannel();
  await cancelDestabilizeNotification();
  const when = Date.now() + delayMs;
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_DESTABILIZE,
    content: {
      title: 'Session destabilized',
      body: 'You left during focus. Come back when you are ready to reset.',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(when),
      channelId: 'pulsar-default',
    },
  });
}
