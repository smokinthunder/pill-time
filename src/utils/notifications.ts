import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. CONFIGURE BEHAVIOR
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. HELPER: CREATE CHANNEL (Required for Android)
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

// 3. REQUEST PERMISSIONS
export async function requestLocalNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

// 4. SCHEDULE NOTIFICATION
export async function scheduleDoseNotification(
    title: string, 
    body: string, 
    rawHour: number, 
    rawMinute: number, 
    days: number[] = [] 
) {
  try {
    await ensureNotificationChannel();

    // STRICT INT CONVERSION
    const hour = parseInt(rawHour.toString(), 10);
    const minute = parseInt(rawMinute.toString(), 10);

    if (isNaN(hour) || isNaN(minute)) {
        console.error("❌ Invalid Time:", { rawHour, rawMinute });
        return null;
    }

    // --- TRIGGER CONSTRUCTION ---
    // We explicitly attach channelId to the trigger for Android validation
    const trigger: any = {
        hour,
        minute,
        repeats: true,
        ...(Platform.OS === 'android' && { channelId: 'default' }), // <--- ADDED HERE
    };

    if (days.length > 0) {
        // Expo Weekdays: 1 (Sun) - 7 (Sat)
        // JS Days: 0 (Sun) - 6 (Sat)
        trigger.weekday = Number(days[0]) + 1;
    }

    // --- CONTENT CONSTRUCTION ---
    const content: Notifications.NotificationContentInput = {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: 'default' }), // KEEP HERE TOO
    };

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
    
    console.log(`🔔 Scheduled: ${hour}:${minute} (ID: ${id})`);
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
