import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { progressService, topicsService } from '@/services/firestore';
import { Progress, Topic } from '@/types';

export default function ProgressScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progressData, setProgressData] = useState<{ [topicId: string]: Progress[] }>({});
  const [loading, setLoading] = useState(true);

  // Mock user ID for development - replace with actual auth
  const userId = 'demo-user';

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Load user topics
      const userTopics = await topicsService.getUserTopics(userId);
      setTopics(userTopics);
      
      // Load progress for each topic
      const progressByTopic: { [topicId: string]: Progress[] } = {};
      
      for (const topic of userTopics) {
        const topicProgress = await progressService.getTopicProgress(userId, topic.id);
        progressByTopic[topic.id] = topicProgress;
      }
      
      setProgressData(progressByTopic);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTopicStats = (topicId: string) => {
    const progress = progressData[topicId] || [];
    const totalQuestions = progress.length;
    const completedQuestions = progress.filter(p => p.isCompleted).length;
    const averageAccuracy = totalQuestions > 0 
      ? Math.round(progress.reduce((sum, p) => sum + (p.correctAnswers / p.totalAttempts), 0) / totalQuestions * 100)
      : 0;
    
    return {
      totalQuestions,
      completedQuestions,
      averageAccuracy,
      completionRate: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
    };
  };

  const ProgressCard = ({ topic }: { topic: Topic }) => {
    const stats = calculateTopicStats(topic.id);
    
    return (
      <TouchableOpacity style={styles.progressCard}>
        <ThemedView style={[styles.cardHeader, { backgroundColor: topic.color + '20' }]}>
          <ThemedText type="subtitle" style={styles.topicTitle}>
            {topic.title}
          </ThemedText>
          <ThemedText style={styles.completionRate}>
            {stats.completionRate}% Complete
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.cardBody}>
          <ThemedView style={styles.statsRow}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.totalQuestions}</ThemedText>
              <ThemedText style={styles.statLabel}>Questions</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.completedQuestions}</ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.averageAccuracy}%</ThemedText>
              <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.progressBarContainer}>
            <ThemedView style={styles.progressBarBackground}>
              <ThemedView 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${stats.completionRate}%`,
                    backgroundColor: topic.color 
                  }
                ]} 
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const OverallStats = () => {
    const totalTopics = topics.length;
    const totalQuestions = Object.values(progressData).flat().length;
    const completedQuestions = Object.values(progressData).flat().filter(p => p.isCompleted).length;
    const overallAccuracy = totalQuestions > 0 
      ? Math.round(Object.values(progressData).flat().reduce((sum, p) => sum + (p.correctAnswers / p.totalAttempts), 0) / totalQuestions * 100)
      : 0;

    return (
      <ThemedView style={styles.overallStats}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>📊 Overall Progress</ThemedText>
        
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statCardNumber}>{totalTopics}</ThemedText>
            <ThemedText style={styles.statCardLabel}>Topics</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statCardNumber}>{totalQuestions}</ThemedText>
            <ThemedText style={styles.statCardLabel}>Questions</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statCardNumber}>{completedQuestions}</ThemedText>
            <ThemedText style={styles.statCardLabel}>Completed</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statCardNumber}>{overallAccuracy}%</ThemedText>
            <ThemedText style={styles.statCardLabel}>Accuracy</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">📈 Progress</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        <OverallStats />
        
        <ThemedView style={styles.topicsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>📚 Topics Progress</ThemedText>
          
          {loading ? (
            <ThemedText style={styles.loadingText}>Loading progress...</ThemedText>
          ) : topics.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>📊</ThemedText>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No Progress Yet
              </ThemedText>
              <ThemedText style={styles.emptyDescription}>
                Create topics and start learning to see your progress here
              </ThemedText>
            </ThemedView>
          ) : (
            topics.map((topic) => (
              <ProgressCard key={topic.id} topic={topic} />
            ))
          )}
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
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 32,
  },
  overallStats: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  topicsSection: {
    marginBottom: 24,
  },
  progressCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTitle: {
    flex: 1,
  },
  completionRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
