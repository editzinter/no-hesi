import { Progress, Question, ReviewSession } from '@/types';
import { progressService } from './firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Spaced Repetition Algorithm Implementation
 * Based on the SuperMemo SM-2 algorithm with modifications for mobile learning
 */

export interface SpacedRepetitionConfig {
  initialInterval: number; // hours
  maxInterval: number; // hours (1 week = 168 hours)
  minInterval: number; // hours
  easyBonus: number; // multiplier for easy answers
  hardPenalty: number; // divisor for hard answers
}

const DEFAULT_CONFIG: SpacedRepetitionConfig = {
  initialInterval: 5, // 5 hours for first review
  maxInterval: 168, // 1 week maximum
  minInterval: 1, // 1 hour minimum
  easyBonus: 2.5,
  hardPenalty: 2,
};

export class SpacedRepetitionService {
  private config: SpacedRepetitionConfig;

  constructor(config: SpacedRepetitionConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate the next review interval based on performance
   */
  calculateNextInterval(
    currentInterval: number,
    performance: 'easy' | 'good' | 'hard' | 'again',
    consecutiveCorrect: number = 0
  ): number {
    let newInterval = currentInterval;

    switch (performance) {
      case 'again':
        // Reset to minimum interval for failed recall
        newInterval = this.config.minInterval;
        break;
      
      case 'hard':
        // Reduce interval but don't go below minimum
        newInterval = Math.max(
          currentInterval / this.config.hardPenalty,
          this.config.minInterval
        );
        break;
      
      case 'good':
        // Standard progression
        if (consecutiveCorrect === 0) {
          newInterval = this.config.initialInterval;
        } else if (consecutiveCorrect === 1) {
          newInterval = this.config.initialInterval * 2; // 10 hours
        } else {
          newInterval = currentInterval * 2; // Double the interval
        }
        break;
      
      case 'easy':
        // Accelerated progression
        if (consecutiveCorrect === 0) {
          newInterval = this.config.initialInterval * 2;
        } else {
          newInterval = currentInterval * this.config.easyBonus;
        }
        break;
    }

    // Ensure interval stays within bounds
    return Math.min(Math.max(newInterval, this.config.minInterval), this.config.maxInterval);
  }

  /**
   * Calculate mastery level based on performance history
   */
  calculateMasteryLevel(
    correctAnswers: number,
    totalAttempts: number,
    consecutiveCorrect: number,
    currentInterval: number
  ): number {
    if (totalAttempts === 0) return 0;

    const accuracy = correctAnswers / totalAttempts;
    const consistencyBonus = Math.min(consecutiveCorrect * 10, 30); // Max 30% bonus
    const intervalBonus = Math.min((currentInterval / this.config.maxInterval) * 20, 20); // Max 20% bonus

    const masteryLevel = (accuracy * 50) + consistencyBonus + intervalBonus;
    return Math.min(Math.round(masteryLevel), 100);
  }

  /**
   * Determine if a question is mastered
   */
  isQuestionMastered(progress: Progress): boolean {
    return (
      progress.masteryLevel >= 80 &&
      progress.correctAnswers >= 3 &&
      progress.reviewInterval >= 24 // At least 24 hours interval
    );
  }

  /**
   * Get questions due for review
   */
  async getQuestionsForReview(
    userId: string,
    sessionType: 'immediate' | 'spaced' | 'manual' = 'spaced',
    limit: number = 20
  ): Promise<Progress[]> {
    const dueQuestions = await progressService.getDueQuestions(userId);
    
    // Filter based on session type
    let filteredQuestions = dueQuestions;
    
    if (sessionType === 'immediate') {
      // Only questions answered in the last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      filteredQuestions = dueQuestions.filter(
        q => q.lastAnsweredAt >= oneHourAgo
      );
    } else if (sessionType === 'spaced') {
      // Only questions that haven't been reviewed recently
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      filteredQuestions = dueQuestions.filter(
        q => q.lastAnsweredAt <= twoHoursAgo
      );
    }

    // Sort by priority (overdue questions first, then by mastery level)
    filteredQuestions.sort((a, b) => {
      const now = new Date();
      const aOverdue = now.getTime() - a.nextReviewAt.getTime();
      const bOverdue = now.getTime() - b.nextReviewAt.getTime();
      
      // Prioritize overdue questions
      if (aOverdue > 0 && bOverdue <= 0) return -1;
      if (bOverdue > 0 && aOverdue <= 0) return 1;
      
      // Then by mastery level (lower mastery = higher priority)
      return a.masteryLevel - b.masteryLevel;
    });

    return filteredQuestions.slice(0, limit);
  }

  /**
   * Process answer and update progress
   */
  async processAnswer(
    userId: string,
    questionId: string,
    topicId: string,
    performance: 'easy' | 'good' | 'hard' | 'again',
    responseTime?: number // in seconds
  ): Promise<void> {
    const progressId = `${userId}_${questionId}`;
    
    // Get current progress or create new
    const currentProgress = await progressService.getProgress(progressId);
    
    const isCorrect = performance !== 'again';
    const newCorrectAnswers = isCorrect 
      ? (currentProgress?.correctAnswers || 0) + 1 
      : (currentProgress?.correctAnswers || 0);
    const newTotalAttempts = (currentProgress?.totalAttempts || 0) + 1;
    
    // Calculate consecutive correct answers
    let consecutiveCorrect = 0;
    if (isCorrect) {
      consecutiveCorrect = (currentProgress?.consecutiveCorrect || 0) + 1;
    }

    // Calculate next interval
    const currentInterval = currentProgress?.reviewInterval || this.config.initialInterval;
    const nextInterval = this.calculateNextInterval(
      currentInterval,
      performance,
      consecutiveCorrect
    );

    // Calculate next review time
    const nextReviewAt = new Date();
    nextReviewAt.setHours(nextReviewAt.getHours() + nextInterval);

    // Calculate mastery level
    const masteryLevel = this.calculateMasteryLevel(
      newCorrectAnswers,
      newTotalAttempts,
      consecutiveCorrect,
      nextInterval
    );

    // Update progress
    await progressService.updateProgress(
      userId,
      questionId,
      topicId,
      {
        correctAnswers: newCorrectAnswers,
        totalAttempts: newTotalAttempts,
        consecutiveCorrect,
        lastAnsweredAt: new Date(),
        nextReviewAt,
        reviewInterval: nextInterval,
        masteryLevel,
        isCompleted: this.isQuestionMastered({
          masteryLevel,
          correctAnswers: newCorrectAnswers,
          reviewInterval: nextInterval
        } as Progress),
        lastPerformance: performance,
        averageResponseTime: responseTime
          ? this.calculateAverageResponseTime(
              currentProgress?.averageResponseTime,
              responseTime,
              newTotalAttempts
            )
          : currentProgress?.averageResponseTime
      }
    );
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(
    currentAverage: number | undefined,
    newTime: number,
    totalAttempts: number
  ): number {
    if (!currentAverage || totalAttempts === 1) {
      return newTime;
    }
    
    // Weighted average favoring recent performance
    const weight = 0.3; // 30% weight to new time
    return (currentAverage * (1 - weight)) + (newTime * weight);
  }

  /**
   * Generate review session statistics
   */
  generateSessionStats(
    questionsReviewed: number,
    correctAnswers: number,
    sessionDuration: number, // in seconds
    averageResponseTime: number
  ): {
    accuracy: number;
    questionsPerMinute: number;
    efficiency: number;
    performance: 'excellent' | 'good' | 'needs_improvement';
  } {
    const accuracy = questionsReviewed > 0 ? (correctAnswers / questionsReviewed) * 100 : 0;
    const questionsPerMinute = sessionDuration > 0 ? (questionsReviewed / (sessionDuration / 60)) : 0;
    
    // Efficiency based on response time (lower is better, but not too low)
    const idealResponseTime = 15; // 15 seconds ideal
    const efficiency = Math.max(0, 100 - Math.abs(averageResponseTime - idealResponseTime) * 2);
    
    let performance: 'excellent' | 'good' | 'needs_improvement';
    if (accuracy >= 80 && efficiency >= 70) {
      performance = 'excellent';
    } else if (accuracy >= 60 && efficiency >= 50) {
      performance = 'good';
    } else {
      performance = 'needs_improvement';
    }

    return {
      accuracy: Math.round(accuracy),
      questionsPerMinute: Math.round(questionsPerMinute * 10) / 10,
      efficiency: Math.round(efficiency),
      performance
    };
  }
}

// Export singleton instance
export const spacedRepetitionService = new SpacedRepetitionService();
