import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { progressService } from '@/services/firestore';
import { Progress } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const [dueQuestions, setDueQuestions] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock user ID for development - replace with actual auth
  const userId = 'demo-user';

  useEffect(() => {
    loadDueQuestions();
  }, []);

  const loadDueQuestions = async () => {
    try {
      setLoading(true);
      const questions = await progressService.getDueQuestions(userId);
      setDueQuestions(questions);
    } catch (error) {
      console.error('Error loading due questions:', error);
      Alert.alert('Error', 'Failed to load review questions');
    } finally {
      setLoading(false);
    }
  };

  const startReviewSession = () => {
    if (dueQuestions.length === 0) {
      Alert.alert('No Reviews', 'You have no questions due for review right now!');
      return;
    }

    router.push('/review-session?sessionType=spaced');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>🧠 CognifAI</ThemedText>
        <ThemedText style={styles.subtitle}>
          Intelligent Learning with Spaced Repetition
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statCard}>
          <ThemedText type="subtitle" style={styles.statNumber}>
            {dueQuestions.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Due for Review</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="subtitle" style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Topics</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="subtitle" style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Streak</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={startReviewSession}
        >
          <ThemedText style={styles.buttonText}>
            🎯 Start Review Session
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push('/(tabs)/topics')}
        >
          <ThemedText style={styles.buttonText}>
            📚 Browse Topics
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.quickActions}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>

        <TouchableOpacity style={styles.quickActionItem}>
          <ThemedText style={styles.quickActionText}>➕ Create New Topic</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionItem}>
          <ThemedText style={styles.quickActionText}>🤖 Generate AI Questions</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionItem}>
          <ThemedText style={styles.quickActionText}>📊 View Progress</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  actionContainer: {
    marginBottom: 24,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  quickActionItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
  },
});
