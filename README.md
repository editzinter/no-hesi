# CognifAI 🧠✨

An intelligent learning platform powered by AI and cognitive science. CognifAI combines advanced retrieval-based learning methods with adaptive AI to create personalized learning experiences that maximize retention and understanding.

## Features

- 📚 Create and manage learning topics
- 🤖 AI-generated questions using Google Gemini 2.5 Flash
- 🧠 Spaced repetition system (immediate + 5 hours later)
- 📊 Progress tracking and analytics
- 🔔 Smart notifications for review sessions
- 🔥 Real-time database with Firebase Firestore

## Tech Stack

- **Frontend**: Expo (React Native)
- **Database**: Firebase Firestore
- **AI**: Google Gemini 2.5 Flash API
- **Authentication**: Firebase Auth (ready for implementation)
- **Notifications**: Expo Notifications

## Setup Instructions

### 1. Prerequisites

- Node.js 18 or later
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cognifai

# Install dependencies
npm install
```

### 3. Firebase Configuration

The app is already configured with Firebase project `education-f59b8`. The configuration includes:

- ✅ Firestore database with proper indexes
- ✅ Security rules configured
- ✅ Web app configuration
- ✅ Service account for admin operations

### 4. Environment Variables

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Test Firebase Connection

```bash
npm run test-firebase
```

This will verify that your Firebase configuration is working correctly.

## Development

### Start the development server

```bash
npm start
```

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run test-firebase` - Test Firebase connection
- `npm run test-gemini` - Test Gemini AI integration
- `npm run test-rn-firebase` - Test React Native Firebase config
- `npm run test-all` - Run all tests
- `npm run firebase-deploy` - Deploy all Firebase resources
- `npm run firebase-deploy-rules` - Deploy only Firestore rules
- `npm run firebase-deploy-indexes` - Deploy only Firestore indexes

## Firebase Structure

### Collections

- **topics**: User learning topics
  - `userId`: User identifier
  - `title`: Topic title
  - `content`: Topic content
  - `summary`: AI-generated summary
  - `createdAt`: Creation timestamp
  - `recallSchedule`: Spaced repetition tracking

- **questions**: AI-generated questions for topics
  - `topicId`: Reference to topic
  - `question`: Question text
  - `options`: Multiple choice options
  - `correctAnswer`: Correct answer
  - `explanation`: Answer explanation

- **recallSessions**: User quiz sessions
  - `userId`: User identifier
  - `topicId`: Reference to topic
  - `questionsCount`: Number of questions
  - `correctAnswers`: Number correct
  - `score`: Percentage score
  - `sessionType`: 'immediate' or 'spaced'

### Security Rules

The app uses Firebase security rules that:
- Allow users to access only their own data
- Validate data structure and ownership
- Include development mode for testing without auth

## Deployment

### Firebase Deployment

```bash
# Deploy all Firebase resources
npm run firebase-deploy

# Deploy only specific resources
npm run firebase-deploy-rules
npm run firebase-deploy-indexes
```

### App Deployment

Follow Expo's deployment guides for your target platforms:
- [iOS App Store](https://docs.expo.dev/submit/ios/)
- [Google Play Store](https://docs.expo.dev/submit/android/)
- [Web Hosting](https://docs.expo.dev/distribution/publishing-websites/)

## Troubleshooting

### React Native Issues

If you encounter Firebase Auth warnings or errors when running on Android/iOS:

1. **AsyncStorage Warning** (Safe to ignore):
   ```
   @firebase/auth: Auth (11.9.0): You are initializing Firebase Auth for React Native without providing AsyncStorage.
   ```
   This warning is expected and won't break functionality.

2. **Component auth not registered** - Fixed in current configuration

3. **Clear Metro cache** if you have issues:
   ```bash
   npx expo start --clear
   ```

See `REACT_NATIVE_FIXES.md` for detailed troubleshooting.

### Testing

Run comprehensive tests:
```bash
npm run test-all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (`npm run test-all`)
5. Submit a pull request

## License

This project is licensed under the MIT License.
# no-hesi
