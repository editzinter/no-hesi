import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyGoalEnabled, setDailyGoalEnabled] = useState(true);
  const [streakRemindersEnabled, setStreakRemindersEnabled] = useState(true);

  // Mock user data - replace with actual auth
  const userData = {
    displayName: 'Demo User',
    email: 'demo@cognifai.com',
    joinDate: 'January 2024',
    totalStudyTime: 0,
    currentStreak: 0,
    longestStreak: 0,
  };

  const testFirebaseConnection = async () => {
    Alert.alert(
      'Test Firebase',
      'This will test the Firebase connection. Check the console for results.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: () => {
            // Import and test Firebase
            import('@/services/firestore').then(({ topicsService }) => {
              topicsService.getUserTopics('demo-user')
                .then(() => {
                  Alert.alert('Success', 'Firebase connection is working!');
                })
                .catch((error) => {
                  Alert.alert('Error', `Firebase connection failed: ${error.message}`);
                });
            });
          }
        }
      ]
    );
  };

  const testGeminiConnection = async () => {
    Alert.alert(
      'Test Gemini AI',
      'This will test the Gemini AI connection. Make sure you have set your API key.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            try {
              const { geminiService } = await import('@/services/gemini');
              const isConnected = await geminiService.testConnection();
              
              if (isConnected) {
                Alert.alert('Success', 'Gemini AI connection is working!');
              } else {
                Alert.alert('Error', 'Gemini AI connection failed. Check your API key.');
              }
            } catch (error) {
              Alert.alert('Error', `Gemini AI test failed: ${error}`);
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    type = 'switch' 
  }: {
    title: string;
    description?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button';
  }) => (
    <ThemedView style={styles.settingItem}>
      <ThemedView style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        {description && (
          <ThemedText style={styles.settingDescription}>{description}</ThemedText>
        )}
      </ThemedView>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: '#007AFF' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
        />
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">👤 Profile</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.userInfo}>
            <ThemedView style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {userData.displayName.charAt(0)}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.userDetails}>
              <ThemedText type="subtitle">{userData.displayName}</ThemedText>
              <ThemedText style={styles.userEmail}>{userData.email}</ThemedText>
              <ThemedText style={styles.joinDate}>Joined {userData.joinDate}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Stats Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>📊 Your Stats</ThemedText>
          
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{userData.totalStudyTime}</ThemedText>
              <ThemedText style={styles.statLabel}>Minutes Studied</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{userData.currentStreak}</ThemedText>
              <ThemedText style={styles.statLabel}>Current Streak</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{userData.longestStreak}</ThemedText>
              <ThemedText style={styles.statLabel}>Longest Streak</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Notifications Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>🔔 Notifications</ThemedText>
          
          <SettingItem
            title="Review Reminders"
            description="Get notified when questions are due for review"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          
          <SettingItem
            title="Daily Goal Reminders"
            description="Daily reminders to maintain your learning streak"
            value={dailyGoalEnabled}
            onValueChange={setDailyGoalEnabled}
          />
          
          <SettingItem
            title="Streak Reminders"
            description="Reminders to keep your learning streak alive"
            value={streakRemindersEnabled}
            onValueChange={setStreakRemindersEnabled}
          />
        </ThemedView>

        {/* Development Tools Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>🛠️ Development Tools</ThemedText>
          
          <TouchableOpacity style={styles.testButton} onPress={testFirebaseConnection}>
            <ThemedText style={styles.testButtonText}>🔥 Test Firebase Connection</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testGeminiConnection}>
            <ThemedText style={styles.testButtonText}>🤖 Test Gemini AI Connection</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => Alert.alert('Info', 'This is CognifAI v1.0.0 - Development Build')}
          >
            <ThemedText style={styles.testButtonText}>ℹ️ App Info</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Actions Section */}
        <ThemedView style={styles.section}>
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>📤 Export Data</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>🔄 Sync Data</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
            <ThemedText style={[styles.actionButtonText, styles.dangerText]}>🗑️ Clear All Data</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    opacity: 0.7,
    marginTop: 4,
  },
  joinDate: {
    opacity: 0.5,
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  testButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  dangerText: {
    color: '#FF3B30',
  },
});
