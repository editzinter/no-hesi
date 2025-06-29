import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User as AppUser } from '@/types';

export interface AuthResult {
  success: boolean;
  user?: AppUser;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AppUser | null = null;
  private authStateListeners: ((user: AppUser | null) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await this.getOrCreateUserProfile(firebaseUser);
        this.currentUser = appUser;
      } else {
        this.currentUser = null;
      }
      
      // Notify listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const { email, password, displayName } = credentials;
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, { displayName });
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      // Create user profile in Firestore
      const appUser = await this.createUserProfile(firebaseUser, displayName);
      
      return {
        success: true,
        user: appUser
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Sign in existing user
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get or create user profile
      const appUser = await this.getOrCreateUserProfile(firebaseUser);
      
      // Update last login time
      await this.updateLastLogin(appUser.id);
      
      return {
        success: true,
        user: appUser
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Add auth state change listener
   */
  addAuthStateListener(listener: (user: AppUser | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Create user profile in Firestore
   */
  private async createUserProfile(firebaseUser: User, displayName: string): Promise<AppUser> {
    const appUser: AppUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...appUser,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    return appUser;
  }

  /**
   * Get or create user profile
   */
  private async getOrCreateUserProfile(firebaseUser: User): Promise<AppUser> {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName || 'User',
        createdAt: userData.createdAt.toDate(),
        lastLoginAt: userData.lastLoginAt.toDate()
      };
    } else {
      // Create new profile if it doesn't exist
      return await this.createUserProfile(
        firebaseUser, 
        firebaseUser.displayName || 'User'
      );
    }
  }

  /**
   * Update last login time
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), {
        lastLoginAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
