import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { functions, appwriteConfig } from "./appwrite";

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and get the Expo push token
 * @returns {Promise<string|null>} The Expo push token or null if unavailable
 */
export const registerForPushNotifications = async () => {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return null;
  }

  try {
    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || appwriteConfig.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2ECC71",
      });

      await Notifications.setNotificationChannelAsync("matches", {
        name: "Match Updates",
        description: "Notifications about matches and challenges",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2ECC71",
      });
    }

    return tokenData.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
};

/**
 * Save the push token to the backend via Appwrite function
 * @param {string} userId - The user's ID
 * @param {string} token - The Expo push token
 */
export const savePushToken = async (userId, token) => {
  try {
    await functions.createExecution(
      "save-push-token",
      JSON.stringify({ userId, token, platform: Platform.OS }),
      false
    );
    console.log("Push token saved successfully");
  } catch (error) {
    // If function doesn't exist yet, log warning but don't crash
    console.warn("Failed to save push token (function may not exist yet):", error.message);
  }
};

/**
 * Add listeners for notification events
 * @param {Function} onNotificationReceived - Called when a notification is received while app is open
 * @param {Function} onNotificationResponse - Called when user taps on a notification
 * @returns {Function} Cleanup function to remove listeners
 */
export const addNotificationListeners = (onNotificationReceived, onNotificationResponse) => {
  // Listener for when notification is received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener for when user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification tapped:", response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(receivedSubscription);
    Notifications.removeNotificationSubscription(responseSubscription);
  };
};

/**
 * Get the last notification response (useful for handling app launch from notification)
 * @returns {Promise<Notifications.NotificationResponse|null>}
 */
export const getLastNotificationResponse = async () => {
  return Notifications.getLastNotificationResponseAsync();
};

/**
 * Schedule a local notification (useful for reminders)
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} options.data - Custom data to include
 * @param {number} options.seconds - Seconds from now to show notification
 */
export const scheduleLocalNotification = async ({ title, body, data, seconds = 1 }) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get badge count
 * @returns {Promise<number>}
 */
export const getBadgeCount = async () => {
  return Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 * @param {number} count
 */
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};
