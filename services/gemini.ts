import { GeminiQuestion, Question } from '@/types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not found. AI question generation will not work.');
    }
  }

  /**
   * Generate questions for a given topic
   */
  async generateQuestions(
    topic: string,
    description: string,
    count: number = 5,
    difficulty: Question['difficulty'] = 'medium'
  ): Promise<GeminiQuestion[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildPrompt(topic, description, count, difficulty);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      return this.parseGeneratedQuestions(generatedText, difficulty);

    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for question generation
   */
  private buildPrompt(topic: string, description: string, count: number, difficulty: Question['difficulty']): string {
    const difficultyInstructions = {
      easy: 'Create basic, straightforward questions that test fundamental understanding.',
      medium: 'Create moderately challenging questions that require some analysis and application.',
      hard: 'Create complex questions that require deep understanding, critical thinking, and synthesis.'
    };

    return `You are an expert educator creating learning questions for a spaced repetition system.

Topic: ${topic}
Description: ${description}
Difficulty Level: ${difficulty}
Number of Questions: ${count}

Instructions:
- ${difficultyInstructions[difficulty]}
- Create a mix of question types: open-ended, multiple choice, and true/false
- For multiple choice questions, provide 4 options with only one correct answer
- Make questions clear, concise, and educational
- Ensure answers are accurate and comprehensive
- Focus on key concepts and practical applications

Please generate exactly ${count} questions in the following JSON format:

{
  "questions": [
    {
      "question": "Your question here",
      "answer": "Detailed answer here",
      "type": "open",
      "difficulty": "${difficulty}"
    },
    {
      "question": "Your multiple choice question here",
      "answer": "Correct answer here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "type": "multiple_choice",
      "difficulty": "${difficulty}"
    },
    {
      "question": "Your true/false question here",
      "answer": "True/False with explanation",
      "options": ["True", "False"],
      "type": "true_false",
      "difficulty": "${difficulty}"
    }
  ]
}

Generate the questions now:`;
  }

  /**
   * Parse the generated text into structured questions
   */
  private parseGeneratedQuestions(generatedText: string, difficulty: Question['difficulty']): GeminiQuestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid question format in response');
      }

      return parsed.questions.map((q: any) => ({
        question: q.question || '',
        answer: q.answer || '',
        options: q.options || undefined,
        type: this.validateQuestionType(q.type),
        difficulty: difficulty
      }));

    } catch (error) {
      console.error('Error parsing generated questions:', error);
      
      // Fallback: try to parse line by line
      return this.parseQuestionsFromText(generatedText, difficulty);
    }
  }

  /**
   * Fallback method to parse questions from plain text
   */
  private parseQuestionsFromText(text: string, difficulty: Question['difficulty']): GeminiQuestion[] {
    const questions: GeminiQuestion[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const line of lines) {
      if (line.toLowerCase().includes('question') && line.includes(':')) {
        if (currentQuestion && currentAnswer) {
          questions.push({
            question: currentQuestion,
            answer: currentAnswer,
            type: 'open',
            difficulty
          });
        }
        currentQuestion = line.split(':').slice(1).join(':').trim();
        currentAnswer = '';
      } else if (line.toLowerCase().includes('answer') && line.includes(':')) {
        currentAnswer = line.split(':').slice(1).join(':').trim();
      }
    }
    
    // Add the last question if exists
    if (currentQuestion && currentAnswer) {
      questions.push({
        question: currentQuestion,
        answer: currentAnswer,
        type: 'open',
        difficulty
      });
    }
    
    return questions;
  }

  /**
   * Validate and normalize question type
   */
  private validateQuestionType(type: string): Question['type'] {
    const normalizedType = type?.toLowerCase();
    
    if (normalizedType === 'multiple_choice' || normalizedType === 'multiple choice') {
      return 'multiple_choice';
    } else if (normalizedType === 'true_false' || normalizedType === 'true/false') {
      return 'true_false';
    } else {
      return 'open';
    }
  }

  /**
   * Test the Gemini API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Generate a simple test question about mathematics."
            }]
          }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
