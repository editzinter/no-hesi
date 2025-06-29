#!/usr/bin/env node

/**
 * Test Google Gemini AI API connection
 */

require('dotenv').config();

async function testGemini() {
  try {
    console.log('🤖 Testing Google Gemini AI connection...');
    
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️  EXPO_PUBLIC_GEMINI_API_KEY not found in environment');
      console.log('💡 Add your Gemini API key to .env file');
      return;
    }
    
    console.log('🔑 API key found');
    
    // Test API call to Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
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
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      console.log('✅ Gemini AI connection successful');
      console.log('📝 Test response:', data.candidates[0].content.parts[0].text.substring(0, 100) + '...');
    } else {
      throw new Error('Unexpected response format');
    }
    
    console.log('🎉 Gemini AI test passed!');
    
  } catch (error) {
    console.error('❌ Gemini AI test failed:', error.message);
    process.exit(1);
  }
}

testGemini();
