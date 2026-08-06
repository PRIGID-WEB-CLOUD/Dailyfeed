
'use server';

/**
 * @fileOverview A Genkit flow to create a backup of Firestore data.
 *
 * This flow reads data from key collections, packages it into a JSON string,
 * uploads it to Firebase Storage, and saves a record of this backup
 * to the 'backups' collection in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';

// This flow doesn't require input from the client.
const CreateBackupInputSchema = z.object({});
export type CreateBackupInput = z.infer<typeof CreateBackupInputSchema>;

const CreateBackupOutputSchema = z.object({
  backupId: z.string(),
  files: z.number(),
  size: z.string(),
  downloadURL: z.string(),
});
export type CreateBackupOutput = z.infer<typeof CreateBackupOutputSchema>;

export async function createBackup(input?: CreateBackupInput): Promise<CreateBackupOutput> {
  return createBackupFlow(input || {});
}

// Helper to fetch all documents from a collection
async function fetchCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const createBackupFlow = ai.defineFlow(
  {
    name: 'createBackupFlow',
    inputSchema: CreateBackupInputSchema,
    outputSchema: CreateBackupOutputSchema,
  },
  async () => {
    // 1. Create an initial 'In Progress' backup record
    const backupRecord = {
      createdAt: serverTimestamp(),
      status: 'In Progress' as const,
      size: '0 MB',
      files: 0,
    };
    const backupRef = await addDoc(collection(db, 'backups'), backupRecord);

    try {
      // 2. Fetch data from all relevant collections
      const collectionsToBackup = [
        'posts', 'users', 'categories', 'comments', 'inquiries',
        'media', 'polls', 'subscribers', 'subscriptions', 'affiliateLinks', 'tips'
      ];
      
      const backupData: Record<string, any[]> = {};
      let totalFiles = 0;

      for (const collectionName of collectionsToBackup) {
        const data = await fetchCollection(collectionName);
        backupData[collectionName] = data;
        totalFiles += data.length;
      }
      
      // Also back up the site settings document
      const settingsRef = doc(db, 'settings', 'site');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        backupData['settings'] = [{ id: 'site', ...settingsSnap.data() }];
        totalFiles += 1;
      }

      // 3. Create the backup file content
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupSizeInBytes = new TextEncoder().encode(backupJson).length;
      const backupSizeInMB = (backupSizeInBytes / (1024 * 1024)).toFixed(2);
      
      // 4. Upload backupJson to Firebase Storage
      const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const storagePath = `backups/dailyfeed-backup-${dateStr}.json`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, backupJson, 'raw', { contentType: 'application/json' });
      const downloadURL = await getDownloadURL(storageRef);
      
      // 5. Update the backup record with the final details
      await updateDoc(backupRef, {
        status: 'Completed',
        size: `${backupSizeInMB} MB`,
        files: totalFiles,
        downloadURL: downloadURL,
      });

      return {
        backupId: backupRef.id,
        files: totalFiles,
        size: `${backupSizeInMB} MB`,
        downloadURL: downloadURL,
      };

    } catch (error) {
      // 6. If anything fails, mark the backup as 'Failed'
      console.error('Backup failed:', error);
      await updateDoc(backupRef, {
        status: 'Failed',
      });
      // Re-throw error so the client knows it failed
      throw error;
    }
  }
);
