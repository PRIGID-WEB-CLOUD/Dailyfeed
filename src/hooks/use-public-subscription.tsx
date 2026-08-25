

'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, createUserWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/lib/user-service';
import { doc, onSnapshot } from 'firebase/firestore';

interface PublicSubscriptionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  anonymousId: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<{success: boolean, message: string}>;
  logout: () => Promise<void>;
}

const PublicSubscriptionContext = createContext<PublicSubscriptionContextType | undefined>(undefined);

export function PublicSubscriptionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  useEffect(() => {
    // Generate or retrieve an anonymous ID for guest users
    let anonId = localStorage.getItem('anonymousId');
    if (!anonId) {
      anonId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('anonymousId', anonId);
    }
    setAnonymousId(anonId);
    
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      try {
        if (firebaseUser) {
          // Keep the public profile in sync, but always release the loading
          // state if Firestore rejects or loses the listener.
          const userDocRef = doc(db, "users", firebaseUser.uid);
          unsubscribeProfile = onSnapshot(
            userDocRef,
            (profileSnapshot) => {
              if (profileSnapshot.exists()) {
                setUserState({ id: profileSnapshot.id, ...profileSnapshot.data() } as User);
              } else {
                setUserState(null);
              }
              setIsLoading(false);
            },
            (error) => {
              console.error('Firebase public profile error:', error);
              setUserState(null);
              setIsLoading(false);
            }
          );
        } else {
          setUserState(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Firebase public auth error:', error);
        setUserState(null);
        setIsLoading(false);
      }
    });

    // Return the unsubscribe function for the auth listener
    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Firebase public login error:", error);
      return false;
    }
  };
  
  const signup = async (name: string, email: string, password: string): Promise<{success: boolean, message: string}> => {
     try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, name, email);
      return { success: true, message: 'Signup successful!' };
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const isAuthenticated = !!user;

  return (
    <PublicSubscriptionContext.Provider value={{ isAuthenticated, isLoading, user, anonymousId, login, logout, signup }}>
      {children}
    </PublicSubscriptionContext.Provider>
  );
}

export function usePublicSubscription() {
  const context = useContext(PublicSubscriptionContext);
  if (context === undefined) {
    throw new Error('usePublicSubscription must be used within a PublicSubscriptionProvider');
  }
  return context;
}
