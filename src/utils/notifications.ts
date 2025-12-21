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

// 2. REQUEST PERMISSIONS (Local Only)
export async function requestLocalNotificationPermissions() {
  // Android 13+ requires this specific permission check
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;

  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    finalStatus = newStatus;
  }

  // Setup Android Channel (Required for Alarms)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  return finalStatus === 'granted';
}

// 3. SCHEDULE NOTIFICATION
export async function scheduleDoseNotification(title: string, body: string, hour: number, minute: number, weekday?: number) {
  try {
    const trigger: any = weekday !== undefined 
      ? { weekday: weekday + 1, hour, minute, repeats: true } 
      : { hour, minute, repeats: true };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default', // Make sure to use default sound
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'medicine_reminder' },
      },
      trigger,
    });
    
    console.log(`Scheduled ${id} for ${hour}:${minute}`);
    return id;

  } catch (e) {
    console.error("Notification Schedule Error:", e);
    return null;
  }
}

// 4. CANCEL NOTIFICATION
export async function cancelNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log(`Canceled notification ${id}`);
  } catch (e) {
    console.error("Cancel Error:", e);
  }
}
