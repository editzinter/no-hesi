#!/usr/bin/env node

/**
 * Test React Native Firebase configuration
 */

console.log('📱 Testing React Native Firebase configuration...');

// Check if required packages are installed
const requiredPackages = [
  'firebase',
  '@react-native-async-storage/async-storage',
  'expo-notifications'
];

let allPackagesInstalled = true;

requiredPackages.forEach(pkg => {
  try {
    // Try to resolve from node_modules
    const path = require('path');
    const packagePath = path.join(process.cwd(), 'node_modules', pkg, 'package.json');
    require('fs').accessSync(packagePath);
    console.log(`✅ ${pkg} is installed`);
  } catch (error) {
    console.log(`❌ ${pkg} is NOT installed`);
    allPackagesInstalled = false;
  }
});

if (!allPackagesInstalled) {
  console.log('💡 Run: npm install firebase @react-native-async-storage/async-storage expo-notifications');
  process.exit(1);
}

// Check configuration files
const fs = require('fs');
const path = require('path');

const configFiles = [
  'lib/firebase.ts',
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json'
];

configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing`);
  }
});

console.log('🎉 React Native Firebase configuration test completed!');
console.log('💡 Next steps:');
console.log('   1. Copy .env.example to .env and add your API keys');
console.log('   2. Update Firebase config with your actual API keys');
console.log('   3. Deploy Firestore rules: npm run firebase-deploy-rules');
