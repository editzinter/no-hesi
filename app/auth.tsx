import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authService } from '@/services/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await authService.login({ email: email.trim(), password });
      } else {
        result = await authService.register({ 
          email: email.trim(), 
          password, 
          displayName: displayName.trim() 
        });
      }

      if (result.success) {
        if (isLogin) {
          router.replace('/(tabs)');
        } else {
          Alert.alert(
            'Account Created!',
            'Please check your email to verify your account.',
            [{ text: 'OK', onPress: () => setIsLogin(true) }]
          );
        }
      } else {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    const result = await authService.resetPassword(email.trim());
    
    if (result.success) {
      Alert.alert('Success', 'Password reset email sent!');
    } else {
      Alert.alert('Error', result.error || 'Failed to send reset email');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    
    // For development - skip auth and go directly to app
    try {
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to enter demo mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.logo}>🧠</ThemedText>
          <ThemedText type="title" style={styles.title}>CognifAI</ThemedText>
          <ThemedText style={styles.subtitle}>
            Intelligent Learning with Spaced Repetition
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </ThemedText>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={handleAuth}
            disabled={loading}
          >
            <ThemedText style={styles.authButtonText}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </ThemedText>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity onPress={handleForgotPassword}>
              <ThemedText style={styles.linkText}>Forgot Password?</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <ThemedText style={styles.linkText}>
              {isLogin 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Sign In"
              }
            </ThemedText>
          </TouchableOpacity>

          {/* Demo Mode for Development */}
          <ThemedView style={styles.demoSection}>
            <ThemedText style={styles.demoText}>Development Mode</ThemedText>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <ThemedText style={styles.demoButtonText}>
                Continue as Demo User
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  authButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
  },
  switchButton: {
    marginTop: 16,
    padding: 8,
  },
  demoSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  demoText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  demoButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
