
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import masterIntegrationsList from '@/lib/integrations-data.json';
import { useAdminSubscription } from '@/hooks/use-subscription';

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  installed?: boolean;
  connected?: boolean;
  enabled?: boolean;
  credentials?: Record<string, any>;
  managementUrl?: string | null;
}

interface IntegrationsContextType {
  integrations: Integration[];
  loading: boolean;
  updateIntegration: (id: string, data: Partial<Integration>) => Promise<void>;
  getIntegration: (id: string) => Integration | undefined;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export const IntegrationsProvider = ({ children }: { children: ReactNode }) => {
  const [dbIntegrations, setDbIntegrations] = useState<Record<string, Partial<Integration>>>({});
  const [loading, setLoading] = useState(true);
  const { isAuthenticated: isAdminAuthenticated } = useAdminSubscription();

  const settingsDocRef = doc(db, 'settings', 'site');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setDbIntegrations(data.integrations || {});
        } else {
          setDbIntegrations({});
        }
        setLoading(false);
      },
      (error) => {
        console.error('Failed to fetch integrations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const mergedIntegrations = useMemo<Integration[]>(() => {
    return masterIntegrationsList.map(masterIntegration => {
      const dbData = dbIntegrations[masterIntegration.id] || {};
      return {
        ...masterIntegration,
        ...dbData,
      };
    });
  }, [dbIntegrations]);

  const updateIntegration = async (id: string, data: Partial<Integration>) => {
    if (!isAdminAuthenticated) {
      console.error("User is not an admin. Cannot update integration settings.");
      return;
    }
    
    const newDbIntegrations = { ...dbIntegrations };
    newDbIntegrations[id] = { ...newDbIntegrations[id], ...data };
    
    await updateDoc(settingsDocRef, {
      'integrations': newDbIntegrations,
    });
  };

  const getIntegration = (id: string) => {
    return mergedIntegrations.find(int => int.id === id);
  }

  return (
    <IntegrationsContext.Provider
      value={{
        integrations: mergedIntegrations,
        loading,
        updateIntegration,
        getIntegration,
      }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
};

export const useIntegrations = (): IntegrationsContextType => {
  const context = useContext(IntegrationsContext);
  if (!context) {
    throw new Error('useIntegrations must be used within an IntegrationsProvider');
  }
  return context;
};
