import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export const NOTIF_ID_BREAK_END = 'pulsar-break-end';
export const NOTIF_ID_DESTABILIZE = 'pulsar-destabilize-nudge';
export const NOTIF_ID_FOCUS_COMPLETE = 'pulsar-focus-complete';
export const NOTIF_ID_GRACE_WARNING = 'pulsar-grace-warning';
export const NOTIF_ID_GRACE_EXPIRED = 'pulsar-grace-expired';

export const GRACE_PERIOD_MS = 60_000;

let handlerConfigured = false;

function ensureAndroidChannel() {
  void Notifications.setNotificationChannelAsync('pulsar-default', {
    name: 'Pulsar',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

function ensureHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
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

export async function cancelFocusCompleteNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_FOCUS_COMPLETE).catch(() => {});
}

export async function cancelBreakEndNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_BREAK_END).catch(() => {});
}

export async function cancelDestabilizeNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_DESTABILIZE).catch(() => {});
}

export async function cancelGraceNotifications(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_GRACE_WARNING).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_GRACE_EXPIRED).catch(() => {});
}

export async function cancelAllPulsarNotifications(): Promise<void> {
  await cancelFocusCompleteNotification();
  await cancelBreakEndNotification();
  await cancelDestabilizeNotification();
  await cancelGraceNotifications();
}

export async function scheduleGraceNotifications(): Promise<void> {
  ensureHandler();
  ensureAndroidChannel();
  await cancelGraceNotifications();

  const now = Date.now();

  // Immediate warning
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_GRACE_WARNING,
    content: {
      title: 'Come back!',
      body: 'Your focus session ends in 60 seconds if you stay away.',
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(now + 1000),
      channelId: 'pulsar-default',
    },
  });

  // 60s later: session lost
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_GRACE_EXPIRED,
    content: {
      title: 'Session lost',
      body: 'You were away too long. Start fresh when you\'re ready.',
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(now + GRACE_PERIOD_MS),
      channelId: 'pulsar-default',
    },
  });
}

export async function scheduleFocusCompleteNotification(fireAtMs: number): Promise<void> {
  ensureHandler();
  ensureAndroidChannel();
  await cancelFocusCompleteNotification();
  const when = Math.max(fireAtMs, Date.now() + 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_FOCUS_COMPLETE,
    content: {
      title: 'Focus complete',
      body: 'Great work — ready to start your break?',
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(when),
      channelId: 'pulsar-default',
    },
  });
}

export async function scheduleBreakCompleteNotification(fireAtMs: number): Promise<void> {
  ensureHandler();
  ensureAndroidChannel();
  await cancelBreakEndNotification();
  const when = Math.max(fireAtMs, Date.now() + 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_BREAK_END,
    content: {
      title: 'Break over',
      body: 'Time to get back in focus.',
      sound: 'default',
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
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(when),
      channelId: 'pulsar-default',
    },
  });
}
