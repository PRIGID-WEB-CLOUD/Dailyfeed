

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { initialSettings, type AppSettings } from '@/lib/initial-settings';
import { useAdminSubscription } from '@/hooks/use-subscription';
import { usePublicSubscription } from '@/hooks/use-public-subscription';

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  setSettings: (settings: AppSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated: isAdminAuthenticated, isLoading: isAdminLoading } = useAdminSubscription();
  const { isAuthenticated: isPublicAuthenticated, isLoading: isPublicLoading } = usePublicSubscription();

  const settingsDocRef = useMemo(() => {
    // Wait for authentication checks to complete before deciding.
    if (isAdminLoading || isPublicLoading) {
      return null;
    }
    // If an admin is logged in, or a public user is logged in, or it's a public user who is NOT logged in,
    // we should fetch the settings. The rules allow public reads for this document.
    return doc(db, 'settings', 'site');
  }, [isAdminAuthenticated, isPublicAuthenticated, isAdminLoading, isPublicLoading]);

  const [settingsDoc, isFetchingSettings, error] = useDocument(settingsDocRef);
  
  const [localSettings, setLocalSettings] = useState<AppSettings>(initialSettings);
  
  // The overall loading state depends on auth and data fetching.
  const isLoading = isAdminLoading || isPublicLoading || (settingsDocRef && isFetchingSettings);

  useEffect(() => {
    // Load from localStorage as an initial fallback for guests
    const storedSettings = localStorage.getItem('dailyfeed-settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setLocalSettings(parsed);
      } catch (e) {
        // Corrupted settings, use initial.
        setLocalSettings(initialSettings);
      }
    }
  }, []);


  useEffect(() => {
    if (settingsDoc && settingsDoc.exists()) {
      const fetchedData = settingsDoc.data();
      const mergedSettings: AppSettings = {
        ...initialSettings,
        ...fetchedData,
        site: { ...initialSettings.site, ...fetchedData.site },
        appearance: { ...initialSettings.appearance, ...fetchedData.appearance },
        banner: { ...initialSettings.banner, ...fetchedData.banner },
        paywall: { ...initialSettings.paywall, ...fetchedData.paywall },
        staticPages: { ...initialSettings.staticPages, ...fetchedData.staticPages },
        seo: { ...initialSettings.seo, ...fetchedData.seo },
      };
      setLocalSettings(mergedSettings);

      // Persist to local storage for public pages
      localStorage.setItem('dailyfeed-settings', JSON.stringify(mergedSettings));
      
    } else if (!isFetchingSettings && settingsDocRef && !settingsDoc?.exists()) {
        // If the settings doc doesn't exist at all, create it.
        setDoc(doc(db, 'settings', 'site'), initialSettings);
        setLocalSettings(initialSettings);
    }
  }, [settingsDoc, isFetchingSettings, settingsDocRef]);
  
  if (error) {
    console.error("Error fetching settings:", error);
  }

  const handleSetSettings = async (newSettings: AppSettings) => {
    setLocalSettings(newSettings);
    localStorage.setItem('dailyfeed-settings', JSON.stringify(newSettings));
    // Only admins can write settings.
    if(isAdminAuthenticated) {
      const ref = doc(db, 'settings', 'site');
      await setDoc(ref, newSettings, { merge: true });
    }
  };

  return (
    <SettingsContext.Provider value={{ settings: localSettings, isLoading, setSettings: handleSetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
