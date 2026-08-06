
'use server';

import {
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Toggles a like on a post.
 * @param postId The ID of the post to like/unlike.
 * @param liked The new liked state.
 */
export async function togglePostLike(postId: string, liked: boolean): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: increment(liked ? 1 : -1),
  });
}
