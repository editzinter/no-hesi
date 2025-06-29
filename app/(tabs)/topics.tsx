import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { topicsService } from '@/services/firestore';
import { geminiService } from '@/services/gemini';
import { Topic } from '@/types';

export default function TopicsScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');

  // Mock user ID for development - replace with actual auth
  const userId = 'demo-user';

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const userTopics = await topicsService.getUserTopics(userId);
      setTopics(userTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
      Alert.alert('Error', 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    if (!newTopicTitle.trim()) {
      Alert.alert('Error', 'Please enter a topic title');
      return;
    }

    try {
      const topicData = {
        title: newTopicTitle.trim(),
        description: newTopicDescription.trim(),
        color: '#007AFF' // Default color
      };

      await topicsService.createTopic(userId, topicData);
      setNewTopicTitle('');
      setNewTopicDescription('');
      setShowCreateModal(false);
      loadTopics();
      
      Alert.alert('Success', 'Topic created successfully!');
    } catch (error) {
      console.error('Error creating topic:', error);
      Alert.alert('Error', 'Failed to create topic');
    }
  };

  const generateQuestionsForTopic = async (topic: Topic) => {
    try {
      Alert.alert(
        'Generate Questions',
        `Generate AI questions for "${topic.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              try {
                const questions = await geminiService.generateQuestions(
                  topic.title,
                  topic.description,
                  5,
                  'medium'
                );
                
                Alert.alert(
                  'Success',
                  `Generated ${questions.length} questions for ${topic.title}`
                );
              } catch (error) {
                console.error('Error generating questions:', error);
                Alert.alert('Error', 'Failed to generate questions. Check your Gemini API key.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const TopicCard = ({ topic }: { topic: Topic }) => (
    <TouchableOpacity style={styles.topicCard}>
      <ThemedView style={[styles.topicHeader, { backgroundColor: topic.color + '20' }]}>
        <ThemedText type="subtitle" style={styles.topicTitle}>
          {topic.title}
        </ThemedText>
        <ThemedText style={styles.topicStats}>
          {topic.questionCount} questions
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.topicBody}>
        <ThemedText style={styles.topicDescription}>
          {topic.description || 'No description'}
        </ThemedText>
        
        <ThemedView style={styles.topicActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => generateQuestionsForTopic(topic)}
          >
            <ThemedText style={styles.actionButtonText}>🤖 Generate Questions</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>📝 Add Question</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">📚 Topics</ThemedText>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <ThemedText style={styles.createButtonText}>+ Create Topic</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        {loading ? (
          <ThemedText style={styles.loadingText}>Loading topics...</ThemedText>
        ) : topics.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>📚</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No Topics Yet
            </ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Create your first topic to start learning with AI-powered questions
            </ThemedText>
          </ThemedView>
        ) : (
          topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))
        )}
      </ScrollView>

      {/* Create Topic Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle">Create Topic</ThemedText>
            <TouchableOpacity onPress={createTopic}>
              <ThemedText style={styles.saveButton}>Save</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.inputLabel}>Topic Title</ThemedText>
            <TextInput
              style={styles.textInput}
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
              placeholder="Enter topic title..."
              placeholderTextColor="#999"
            />

            <ThemedText style={styles.inputLabel}>Description (Optional)</ThemedText>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newTopicDescription}
              onChangeText={setNewTopicDescription}
              placeholder="Enter topic description..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
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
    marginTop: 100,
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
  topicCard: {
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
  topicHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTitle: {
    flex: 1,
  },
  topicStats: {
    fontSize: 12,
    opacity: 0.7,
  },
  topicBody: {
    padding: 16,
  },
  topicDescription: {
    marginBottom: 16,
    opacity: 0.8,
  },
  topicActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    color: '#007AFF',
  },
  saveButton: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
