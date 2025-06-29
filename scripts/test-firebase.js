#!/usr/bin/env node

/**
 * Test Firebase connection and configuration
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: "education-f59b8.firebaseapp.com",
  projectId: "education-f59b8",
  storageBucket: "education-f59b8.appspot.com",
  messagingSenderId: "906206853294",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "demo-app-id"
};

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Project ID:', firebaseConfig.projectId);
    
    // Test Firestore connection (this will work in development mode)
    console.log('🔍 Testing Firestore connection...');
    
    // Try to read from a test collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Firestore connection successful');
    console.log('📄 Test collection documents:', snapshot.size);
    
    console.log('🎉 All Firebase tests passed!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    process.exit(1);
  }
}

testFirebase();
