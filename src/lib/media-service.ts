
'use server';

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { MediaAsset, MediaType } from './types';


const getFileType = (file: File): MediaType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image'; // default
};

/**
 * Adds a new media asset. This function now handles uploading the file to Firebase Storage.
 * @param file The file to be uploaded.
 * @param folderPath The path of the folder to upload the file into.
 */
export async function addMediaAsset(file: File, folderPath: string): Promise<void> {
  if (!file) {
    throw new Error("File is required for upload.");
  }
  
  const fullPath = folderPath ? `media/${folderPath}/${file.name}` : `media/${file.name}`;
  
  // 1. Upload file to Firebase Storage
  const storageRef = ref(storage, fullPath);
  const snapshot = await uploadBytes(storageRef, file);
  
  // 2. Get the public URL of the uploaded file
  const downloadURL = await getDownloadURL(snapshot.ref);

  // 3. Add the asset metadata to Firestore
  const mediaCollection = collection(db, 'media');
  await addDoc(mediaCollection, {
    url: downloadURL,
    description: file.name,
    type: getFileType(file),
    hint: 'user upload',
    folderPath: folderPath,
    createdAt: serverTimestamp(),
  });
}

/**
 * Deletes a media asset from Firestore and the corresponding file from Firebase Storage.
 * @param id The ID of the media document to delete.
 */
export async function deleteMediaAsset(id: string): Promise<void> {
  const mediaRef = doc(db, 'media', id);
  const mediaSnap = await getDoc(mediaRef);

  if (mediaSnap.exists()) {
    const mediaData = mediaSnap.data() as MediaAsset;
    
    // 1. Delete the file from Firebase Storage
    // The URL contains the full path to the file in storage.
    if (mediaData.url) {
        try {
            const fileRef = ref(storage, mediaData.url);
            await deleteObject(fileRef);
        } catch(error: any) {
            // If file doesn't exist in storage, we can still proceed to delete the DB record.
            if (error.code !== 'storage/object-not-found') {
                throw error; // Re-throw other storage errors
            }
            console.warn(`File not found in Storage for URL: ${mediaData.url}. Deleting Firestore record anyway.`);
        }
    }

    // 2. Delete the document from Firestore
    await deleteDoc(mediaRef);
  } else {
    throw new Error("Media asset not found in database.");
  }
}

/**
 * Creates a "folder" by adding a placeholder document to the media collection.
 * This does not create a physical folder in Firebase Storage, but allows the UI to represent it.
 * @param folderPath The path of the new folder.
 */
export async function createFolder(folderPath: string): Promise<void> {
    const mediaCollection = collection(db, 'media');
    await addDoc(mediaCollection, {
        description: folderPath.split('/').pop(),
        type: 'folder',
        folderPath: folderPath,
        url: '',
        hint: '',
        createdAt: serverTimestamp(),
    });
}
