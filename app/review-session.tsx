import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { questionsService } from '@/services/firestore';
import { spacedRepetitionService } from '@/services/spacedRepetition';
import { Progress, Question } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, StyleSheet, TouchableOpacity } from 'react-native';

export default function ReviewSessionScreen() {
  const params = useLocalSearchParams();
  const sessionType = (params.sessionType as 'immediate' | 'spaced' | 'manual') || 'spaced';

  const [questions, setQuestions] = useState<(Progress & { question: Question })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [sessionStats, setSessionStats] = useState({
    questionsReviewed: 0,
    correctAnswers: 0,
    totalTime: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock user ID for development
  const userId = 'demo-user';

  useEffect(() => {
    loadReviewQuestions();

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [loadReviewQuestions]);

  const handleBackPress = () => {
    Alert.alert(
      'Exit Review Session',
      'Are you sure you want to exit? Your progress will be saved.',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Exit', onPress: () => router.back() }
      ]
    );
    return true;
  };

  const loadReviewQuestions = React.useCallback(async () => {
    try {
      setLoading(true);

      // Get questions for review
      const progressItems = await spacedRepetitionService.getQuestionsForReview(
        userId,
        sessionType,
        20
      );

      // Load question details
      const questionsWithDetails = await Promise.all(
        progressItems.map(async (progress) => {
          const question = await questionsService.getQuestion(progress.questionId);
          return { ...progress, question: question! };
        })
      );

      setQuestions(questionsWithDetails.filter(q => q.question));
      setSessionStartTime(new Date());
      setQuestionStartTime(new Date());
    } catch (error) {
      console.error('Error loading review questions:', error);
      Alert.alert('Error', 'Failed to load review questions');
    } finally {
      setLoading(false);
    }
  }, [userId, sessionType]);

  const handleAnswer = async (performance: 'easy' | 'good' | 'hard' | 'again') => {
    if (currentIndex >= questions.length) return;

    const currentQuestion = questions[currentIndex];
    const responseTime = (new Date().getTime() - questionStartTime.getTime()) / 1000;

    try {
      // Process the answer
      await spacedRepetitionService.processAnswer(
        userId,
        currentQuestion.questionId,
        currentQuestion.topicId,
        performance,
        responseTime
      );

      // Update session stats
      const isCorrect = performance !== 'again';
      setSessionStats(prev => ({
        questionsReviewed: prev.questionsReviewed + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        totalTime: prev.totalTime + responseTime
      }));

      // Move to next question or finish session
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
        setQuestionStartTime(new Date());
      } else {
        finishSession();
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      Alert.alert('Error', 'Failed to save your answer');
    }
  };

  const finishSession = () => {
    const sessionDuration = (new Date().getTime() - sessionStartTime.getTime()) / 1000;
    const averageResponseTime = sessionStats.totalTime / sessionStats.questionsReviewed;
    
    const stats = spacedRepetitionService.generateSessionStats(
      sessionStats.questionsReviewed,
      sessionStats.correctAnswers,
      sessionDuration,
      averageResponseTime
    );

    Alert.alert(
      'Session Complete! 🎉',
      `Questions: ${sessionStats.questionsReviewed}\nAccuracy: ${stats.accuracy}%\nPerformance: ${stats.performance}`,
      [
        { text: 'OK', onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading review session...</ThemedText>
      </ThemedView>
    );
  }

  if (questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyEmoji}>🎯</ThemedText>
          <ThemedText type="title" style={styles.emptyTitle}>
            No Questions Due
          </ThemedText>
          <ThemedText style={styles.emptyDescription}>
            Great job! You&apos;re all caught up with your reviews.
          </ThemedText>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Back to Home</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <ThemedText style={styles.backText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.progressText}>
          {currentIndex + 1} / {questions.length}
        </ThemedText>
      </ThemedView>

      {/* Progress Bar */}
      <ThemedView style={styles.progressBarContainer}>
        <ThemedView style={[styles.progressBar, { width: `${progress}%` }]} />
      </ThemedView>

      {/* Question Card */}
      <ThemedView style={styles.questionCard}>
        <ThemedText type="subtitle" style={styles.questionText}>
          {currentQuestion.question.question}
        </ThemedText>

        {currentQuestion.question.type === 'multiple_choice' && currentQuestion.question.options && (
          <ThemedView style={styles.optionsContainer}>
            {currentQuestion.question.options.map((option, index) => (
              <ThemedView key={index} style={styles.option}>
                <ThemedText style={styles.optionText}>
                  {String.fromCharCode(65 + index)}. {option}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {showAnswer && (
          <ThemedView style={styles.answerContainer}>
            <ThemedText style={styles.answerLabel}>Answer:</ThemedText>
            <ThemedText style={styles.answerText}>
              {currentQuestion.question.answer}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {/* Action Buttons */}
      <ThemedView style={styles.actionContainer}>
        {!showAnswer ? (
          <TouchableOpacity 
            style={styles.showAnswerButton}
            onPress={() => setShowAnswer(true)}
          >
            <ThemedText style={styles.showAnswerText}>Show Answer</ThemedText>
          </TouchableOpacity>
        ) : (
          <ThemedView style={styles.responseButtons}>
            <ThemedText style={styles.responsePrompt}>How did you do?</ThemedText>
            
            <ThemedView style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.responseButton, styles.againButton]}
                onPress={() => handleAnswer('again')}
              >
                <ThemedText style={styles.buttonText}>Again</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.responseButton, styles.hardButton]}
                onPress={() => handleAnswer('hard')}
              >
                <ThemedText style={styles.buttonText}>Hard</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            <ThemedView style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.responseButton, styles.goodButton]}
                onPress={() => handleAnswer('good')}
              >
                <ThemedText style={styles.buttonText}>Good</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.responseButton, styles.easyButton]}
                onPress={() => handleAnswer('easy')}
              >
                <ThemedText style={styles.buttonText}>Easy</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  questionCard: {
    margin: 16,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 16,
  },
  option: {
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
  answerContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionContainer: {
    padding: 16,
  },
  showAnswerButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  showAnswerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  responseButtons: {
    alignItems: 'center',
  },
  responsePrompt: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  responseButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: '#FF3B30',
  },
  hardButton: {
    backgroundColor: '#FF9500',
  },
  goodButton: {
    backgroundColor: '#34C759',
  },
  easyButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
