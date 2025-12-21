// MOCK FILE: Keeps the app running in Expo Go without crashing

// 1. We removed the crashing 'expo-notifications' import
// import * as Notifications from 'expo-notifications'; 

export async function requestLocalNotificationPermissions() {
  console.log("Mock: Permission requested");
  return true; // Pretend we got permission
}

export async function scheduleDoseNotification(title: string, body: string, hour: number, minute: number, weekday?: number) {
  console.log(`Mock: Scheduled notification for ${hour}:${minute}`);
  return "mock-id-123"; // Return a fake ID so the DB saves something
}

export async function cancelNotification(id: string) {
  console.log(`Mock: Canceled notification ${id}`);
}
