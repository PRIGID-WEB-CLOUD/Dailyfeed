
'use server';

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Adds a new subscriber if they don't already exist.
 * @param email The email of the subscriber.
 */
export async function addSubscriber(email: string): Promise<void> {
  const subscribersCollection = collection(db, 'subscribers');
  
  // Check if subscriber already exists
  const q = query(subscribersCollection, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Optionally, you can just return without an error if you consider this a success
    // Or throw an error to be caught by the calling function.
    throw new Error('This email is already subscribed.');
  }

  await addDoc(subscribersCollection, {
    email,
    subscribedAt: serverTimestamp(),
  });
}
