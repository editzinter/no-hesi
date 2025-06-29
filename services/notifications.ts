import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { progressService } from './firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification permissions and settings
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('review-reminders', {
          name: 'Review Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('daily-goals', {
          name: 'Daily Goals',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#34C759',
          sound: 'default',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Schedule review reminders for due questions
   */
  async scheduleReviewReminders(userId: string): Promise<void> {
    try {
      // Cancel existing review reminders
      await this.cancelNotificationsByTag('review-reminder');

      // Get questions due for review in the next 24 hours
      const dueQuestions = await progressService.getDueQuestions(userId);
      
      if (dueQuestions.length === 0) return;

      // Group questions by review time (rounded to nearest hour)
      const questionsByHour = new Map<string, number>();
      
      dueQuestions.forEach(question => {
        const reviewTime = new Date(question.nextReviewAt);
        const hourKey = `${reviewTime.getFullYear()}-${reviewTime.getMonth()}-${reviewTime.getDate()}-${reviewTime.getHours()}`;
        questionsByHour.set(hourKey, (questionsByHour.get(hourKey) || 0) + 1);
      });

      // Schedule notifications for each hour with due questions
      for (const [hourKey, count] of questionsByHour) {
        const [year, month, date, hour] = hourKey.split('-').map(Number);
        const scheduledTime = new Date(year, month, date, hour, 0, 0);
        
        // Only schedule future notifications
        if (scheduledTime > new Date()) {
          await this.scheduleNotification({
            id: `review-${hourKey}`,
            title: '🧠 Time to Review!',
            body: `You have ${count} question${count > 1 ? 's' : ''} ready for review`,
            scheduledTime,
            data: {
              type: 'review-reminder',
              questionCount: count,
              userId
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to schedule review reminders:', error);
    }
  }

  /**
   * Schedule daily goal reminders
   */
  async scheduleDailyGoalReminder(
    userId: string, 
    reminderTime: string = '19:00', // Default 7 PM
    enabled: boolean = true
  ): Promise<void> {
    try {
      // Cancel existing daily reminders
      await this.cancelNotificationsByTag('daily-goal');

      if (!enabled) return;

      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      // Schedule for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + i);
        scheduledTime.setHours(hours, minutes, 0, 0);

        await this.scheduleNotification({
          id: `daily-goal-${i}`,
          title: '🎯 Daily Learning Goal',
          body: 'Keep your learning streak alive! Review some questions today.',
          scheduledTime,
          data: {
            type: 'daily-goal',
            userId
          }
        });
      }
    } catch (error) {
      console.error('Failed to schedule daily goal reminders:', error);
    }
  }

  /**
   * Schedule streak reminder
   */
  async scheduleStreakReminder(
    userId: string,
    currentStreak: number,
    enabled: boolean = true
  ): Promise<void> {
    try {
      // Cancel existing streak reminders
      await this.cancelNotificationsByTag('streak-reminder');

      if (!enabled || currentStreak === 0) return;

      // Schedule reminder for tomorrow evening if user hasn't studied
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(20, 0, 0, 0); // 8 PM

      await this.scheduleNotification({
        id: 'streak-reminder-tomorrow',
        title: '🔥 Don\'t Break Your Streak!',
        body: `You have a ${currentStreak}-day streak. Study today to keep it going!`,
        scheduledTime: tomorrow,
        data: {
          type: 'streak-reminder',
          currentStreak,
          userId
        }
      });
    } catch (error) {
      console.error('Failed to schedule streak reminder:', error);
    }
  }

  /**
   * Schedule a single notification
   */
  private async scheduleNotification(schedule: NotificationSchedule): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: schedule.id,
        content: {
          title: schedule.title,
          body: schedule.body,
          data: schedule.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: schedule.scheduledTime
        },
      });

      console.log(`Scheduled notification: ${schedule.title} at ${schedule.scheduledTime}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Cancel notifications by tag/type
   */
  private async cancelNotificationsByTag(tag: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const notificationsToCancel = scheduledNotifications
        .filter(notification => 
          notification.identifier.includes(tag) ||
          notification.content.data?.type === tag
        )
        .map(notification => notification.identifier);

      if (notificationsToCancel.length > 0) {
        for (const notificationId of notificationsToCancel) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        }
        console.log(`Cancelled ${notificationsToCancel.length} notifications with tag: ${tag}`);
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Handle notification received while app is in foreground
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Handle notification response (user tapped notification)
   */
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Update notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear notification badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
