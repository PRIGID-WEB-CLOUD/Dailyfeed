
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/types';
import { adminAuth } from '@/lib/firebase'; // Use the dedicated admin auth instance
import { getUserProfile } from '@/lib/user-service';

interface AdminSubscriptionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AdminSubscriptionContext = createContext<AdminSubscriptionContextType | undefined>(undefined);

export function AdminSubscriptionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    // Listen for auth state changes on the dedicated admin auth instance
    const unsubscribe = onAuthStateChanged(adminAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await getUserProfile(firebaseUser.uid);
          const allowedRoles = ['Admin', 'Editor', 'Author'];
          // Check if the user has an allowed role
          if (userProfile && userProfile.roles?.some(role => allowedRoles.includes(role.name))) {
            setUserState(userProfile);
          } else {
            // User is authenticated but not an authorized admin/editor/author, so sign them out of the admin context
            await firebaseSignOut(adminAuth);
            setUserState(null);
          }
        } else {
          setUserState(null);
        }
      } catch (error) {
        // A failed profile lookup (for example, a Firestore permission error)
        // must not leave the whole app stuck in its loading state.
        console.error('Firebase admin profile error:', error);
        setUserState(null);
        try {
          await firebaseSignOut(adminAuth);
        } catch (signOutError) {
          console.error('Firebase admin sign-out error:', signOutError);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const setUser = (updatedUser: User) => {
    setUserState(updatedUser);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Use the dedicated admin auth instance for sign-in
      await signInWithEmailAndPassword(adminAuth, email, password);
      // onAuthStateChanged will handle setting the user state after role verification
      return true;
    } catch (error) {
      console.error("Firebase admin login error:", error);
      return false;
    }
  };

  const logout = async () => {
    // Use the dedicated admin auth instance for sign-out
    await firebaseSignOut(adminAuth);
  };
  
  const isAuthenticated = !!user;

  return (
    <AdminSubscriptionContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, setUser }}>
      {children}
    </AdminSubscriptionContext.Provider>
  );
}

export function useAdminSubscription() {
  const context = useContext(AdminSubscriptionContext);
  if (context === undefined) {
    throw new Error('useAdminSubscription must be used within an AdminSubscriptionProvider');
  }
  return context;
}
