
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from './settings-context';


interface BannerContextType {
  bannerContent: {
    headline: string;
    collapsedText: string;
    expandedText: string;
  };
  isLoading: boolean;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const { settings, isLoading } = useSettings();
  
  const bannerContent = settings ? settings.banner : {
    headline: '',
    collapsedText: '',
    expandedText: '',
  };

  return (
    <BannerContext.Provider value={{ bannerContent, isLoading }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}
