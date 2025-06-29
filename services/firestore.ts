import { db } from '@/lib/firebase';
import { Progress, Question, Topic } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';

// Topics Service
export const topicsService = {
  // Create a new topic
  async createTopic(userId: string, topicData: Omit<Topic, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'questionCount' | 'completedQuestions'>): Promise<string> {
    const topic = {
      ...topicData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      questionCount: 0,
      completedQuestions: 0
    };
    
    const docRef = await addDoc(collection(db, 'topics'), topic);
    return docRef.id;
  },

  // Get all topics for a user
  async getUserTopics(userId: string): Promise<Topic[]> {
    const q = query(
      collection(db, 'topics'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Topic));
  },

  // Get a specific topic
  async getTopic(topicId: string): Promise<Topic | null> {
    const docRef = doc(db, 'topics', topicId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Topic;
    }
    
    return null;
  },

  // Update a topic
  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<void> {
    const docRef = doc(db, 'topics', topicId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a topic
  async deleteTopic(topicId: string): Promise<void> {
    const docRef = doc(db, 'topics', topicId);
    await deleteDoc(docRef);
  },

  // Listen to topic changes
  subscribeToUserTopics(userId: string, callback: (topics: Topic[]) => void) {
    const q = query(
      collection(db, 'topics'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const topics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Topic));
      
      callback(topics);
    });
  }
};

// Questions Service
export const questionsService = {
  // Create a new question
  async createQuestion(userId: string, questionData: Omit<Question, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const question = {
      ...questionData,
      userId,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'questions'), question);
    
    // Update topic question count
    await this.updateTopicQuestionCount(questionData.topicId);
    
    return docRef.id;
  },

  // Get questions for a topic
  async getTopicQuestions(topicId: string): Promise<Question[]> {
    const q = query(
      collection(db, 'questions'),
      where('topicId', '==', topicId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as Question));
  },

  // Get a specific question
  async getQuestion(questionId: string): Promise<Question | null> {
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as Question;
    }
    
    return null;
  },

  // Update a question
  async updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
    const docRef = doc(db, 'questions', questionId);
    await updateDoc(docRef, updates);
  },

  // Delete a question
  async deleteQuestion(questionId: string): Promise<void> {
    const docRef = doc(db, 'questions', questionId);
    await deleteDoc(docRef);
  },

  // Update topic question count
  async updateTopicQuestionCount(topicId: string): Promise<void> {
    const q = query(
      collection(db, 'questions'),
      where('topicId', '==', topicId)
    );
    
    const snapshot = await getDocs(q);
    const questionCount = snapshot.size;
    
    await topicsService.updateTopic(topicId, { questionCount });
  }
};

// Progress Service
export const progressService = {
  // Create or update progress (simple version)
  async createOrUpdateProgress(userId: string, questionId: string, topicId: string, isCorrect: boolean): Promise<void> {
    const progressId = `${userId}_${questionId}`;
    const docRef = doc(db, 'progress', progressId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentProgress = docSnap.data() as Progress;
      const newCorrectAnswers = isCorrect ? currentProgress.correctAnswers + 1 : currentProgress.correctAnswers;
      const newTotalAttempts = currentProgress.totalAttempts + 1;
      const accuracy = newCorrectAnswers / newTotalAttempts;

      // Calculate next review interval based on performance
      let newInterval = currentProgress.reviewInterval;
      if (isCorrect) {
        newInterval = Math.min(newInterval * 2, 168); // Max 1 week
      } else {
        newInterval = Math.max(newInterval / 2, 1); // Min 1 hour
      }

      const nextReviewAt = new Date();
      nextReviewAt.setHours(nextReviewAt.getHours() + newInterval);

      await updateDoc(docRef, {
        correctAnswers: newCorrectAnswers,
        totalAttempts: newTotalAttempts,
        lastAnsweredAt: Timestamp.now(),
        nextReviewAt: Timestamp.fromDate(nextReviewAt),
        reviewInterval: newInterval,
        masteryLevel: Math.round(accuracy * 100),
        isCompleted: accuracy >= 0.8 && newTotalAttempts >= 3
      });
    } else {
      // Create new progress record
      const nextReviewAt = new Date();
      nextReviewAt.setHours(nextReviewAt.getHours() + 5); // Initial 5-hour interval

      const newProgress = {
        id: progressId,
        userId,
        questionId,
        topicId,
        correctAnswers: isCorrect ? 1 : 0,
        totalAttempts: 1,
        lastAnsweredAt: Timestamp.now(),
        nextReviewAt: Timestamp.fromDate(nextReviewAt),
        reviewInterval: 5,
        masteryLevel: isCorrect ? 100 : 0,
        isCompleted: false
      };

      await updateDoc(docRef, newProgress);
    }
  },

  // Get user progress for a topic
  async getTopicProgress(userId: string, topicId: string): Promise<Progress[]> {
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('topicId', '==', topicId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      lastAnsweredAt: doc.data().lastAnsweredAt.toDate(),
      nextReviewAt: doc.data().nextReviewAt.toDate()
    } as Progress));
  },

  // Get questions due for review
  async getDueQuestions(userId: string): Promise<Progress[]> {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('nextReviewAt', '<=', now),
      where('isCompleted', '==', false),
      orderBy('nextReviewAt', 'asc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      lastAnsweredAt: doc.data().lastAnsweredAt.toDate(),
      nextReviewAt: doc.data().nextReviewAt.toDate()
    } as Progress));
  },

  // Get specific progress record
  async getProgress(progressId: string): Promise<Progress | null> {
    const docRef = doc(db, 'progress', progressId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastAnsweredAt: data.lastAnsweredAt.toDate(),
        nextReviewAt: data.nextReviewAt.toDate()
      } as Progress;
    }

    return null;
  },

  // Update progress with detailed data
  async updateProgress(
    userId: string,
    questionId: string,
    topicId: string,
    progressData: Partial<Progress>
  ): Promise<void> {
    const progressId = `${userId}_${questionId}`;
    const docRef = doc(db, 'progress', progressId);

    const updateData = {
      ...progressData,
      userId,
      questionId,
      topicId,
      lastAnsweredAt: progressData.lastAnsweredAt ? Timestamp.fromDate(progressData.lastAnsweredAt) : Timestamp.now(),
      nextReviewAt: progressData.nextReviewAt ? Timestamp.fromDate(progressData.nextReviewAt) : Timestamp.now()
    };

    await updateDoc(docRef, updateData);
  }
};
