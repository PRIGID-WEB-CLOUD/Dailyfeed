
'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Integration } from '@/contexts/integrations-context';
import masterIntegrationsList from '@/lib/integrations-data.json';

/**
 * Fetches the settings for a specific integration from Firestore.
 * This is a server-side utility function.
 * @param id The ID of the integration.
 * @returns A promise that resolves with the merged integration data, or undefined.
 */
export async function getIntegration(id: string): Promise<Integration | undefined> {
  const masterIntegration = masterIntegrationsList.find(int => int.id === id);
  if (!masterIntegration) {
    return undefined;
  }

  try {
    const settingsDocRef = doc(db, 'settings', 'site');
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const dbIntegrations = docSnap.data().integrations || {};
      const dbData = dbIntegrations[id] || {};
      return {
        ...masterIntegration,
        ...dbData,
      } as Integration;
    }
    // If settings doc doesn't exist, return master data with defaults.
    return masterIntegration as Integration;
  } catch (error) {
    console.error(`Failed to fetch integration settings for ${id}:`, error);
    // On error, fall back to master data.
    return masterIntegration as Integration;
  }
}
