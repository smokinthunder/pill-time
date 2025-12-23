import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. CONFIGURE
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. CHANNEL (Required for Android)
async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pill Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

// 3. PERMISSIONS
export async function requestLocalNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

// 4. SCHEDULE
export async function scheduleDoseNotification(
    title: string, 
    body: string, 
    rawHour: number, 
    rawMinute: number, 
    days: number[] = [] 
) {
  try {
    await ensureNotificationChannel();

    const hour = Number(rawHour);
    const minute = Number(rawMinute);

    if (isNaN(hour) || isNaN(minute)) {
        console.error("❌ Invalid Time:", { rawHour, rawMinute });
        return null;
    }

    // --- THE FINAL FIX ---
    // We strictly distinguish between DAILY and WEEKLY types.
    // We do NOT use 'calendar' or 'repeats: true'.
    
    let trigger: any;

    if (days.length > 0) {
        // WEEKLY TRIGGER
        // Expo Weekdays: 1 (Sun) - 7 (Sat)
        // JS Days: 0 (Sun) - 6 (Sat)
        trigger = {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: Number(days[0]) + 1,
            hour,
            minute,
        };
    } else {
        // DAILY TRIGGER
        trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
        };
    }

    // --- CONTENT ---
    const content: Notifications.NotificationContentInput = {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
    };

    // Attach Channel ID to CONTENT (Correct place for Android)
    if (Platform.OS === 'android') {
        // @ts-ignore
        content.channelId = 'default';
    }

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
    
    console.log(`🔔 Scheduled (${trigger.type}): ${hour}:${minute} (ID: ${id})`);
    return id;

  } catch (e) {
    console.error("Notification Schedule Error:", e);
    return null;
  }
}

// 5. CANCEL
export async function cancelNotification(id: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log(`🔕 Canceled: ${id}`);
  } catch (e) {
    console.log("Error canceling:", e);
  }
}
