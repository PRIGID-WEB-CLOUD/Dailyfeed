
'use server';

/**
 * @fileOverview A Genkit flow to generate and download a backup of Firestore data.
 *
 * This flow reads data from key collections, packages it into a JSON string,
 * and returns it for the client to download.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DownloadBackupInputSchema = z.object({
  backupId: z.string().describe('An identifier for logging purposes, can be empty.'),
});
export type DownloadBackupInput = z.infer<typeof DownloadBackupInputSchema>;

const DownloadBackupOutputSchema = z.object({
  backupData: z.string().describe('A JSON string containing the data from all backed-up collections.'),
});
export type DownloadBackupOutput = z.infer<typeof DownloadBackupOutputSchema>;

export async function downloadBackup(input: DownloadBackupInput): Promise<DownloadBackupOutput> {
  return downloadBackupFlow(input);
}

// Helper to fetch all documents from a collection
async function fetchCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const downloadBackupFlow = ai.defineFlow(
  {
    name: 'downloadBackupFlow',
    inputSchema: DownloadBackupInputSchema,
    outputSchema: DownloadBackupOutputSchema,
  },
  async () => {
    // 1. Fetch data from all relevant collections
    const collectionsToBackup = [
      'posts', 'users', 'categories', 'comments', 'inquiries',
      'media', 'polls', 'subscribers', 'subscriptions', 'affiliateLinks', 'tips'
    ];
    
    const backupData: Record<string, any[]> = {};

    for (const collectionName of collectionsToBackup) {
      const data = await fetchCollection(collectionName);
      backupData[collectionName] = data;
    }
    
    // Also back up the site settings document
    const settingsRef = doc(db, 'settings', 'site');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      backupData['settings'] = [{ id: 'site', ...settingsSnap.data() }];
    }

    // 2. Convert the aggregated data to a JSON string
    const backupJson = JSON.stringify(backupData, null, 2); // Pretty-print the JSON
    
    return {
      backupData: backupJson,
    };
  }
);
