
'use server';

import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  increment,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CommentStatus, Comment } from './types';
import { moderateComment } from '@/ai/flows/moderate-comment';

/**
 * Checks and awards badges to a user.
 * @param userId The ID of the user to check.
 */
async function checkAndAwardBadges(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const existingBadges = userData.badges?.map((b: any) => b.id) || [];

  // Check for "Top Commenter" badge
  if (!existingBadges.includes('badge-2')) {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('authorId', '==', userId),
      where('status', '==', 'Approved')
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    if (commentsSnapshot.size >= 50) {
      await updateDoc(userRef, {
        badges: arrayUnion({ id: 'badge-2', assignedAt: Timestamp.now() }),
      });
    }
  }
}


/**
 * Updates the status of a comment and checks for badge awards on approval.
 * @param id The ID of the comment document.
 * @param status The new status.
 */
export async function updateCommentStatus(id: string, status: CommentStatus): Promise<void> {
  const commentRef = doc(db, 'comments', id);
  const commentSnap = await getDoc(commentRef);

  if (commentSnap.exists()) {
    const commentData = commentSnap.data();
    
    // Only proceed if status is actually changing
    if (commentData.status === status) return;
    
    await updateDoc(commentRef, { status });

    // If a comment is approved, check if the user qualifies for a badge
    if (status === 'Approved' && commentData.status !== 'Approved') {
        const postRef = doc(db, 'posts', commentData.postId);
        await updateDoc(postRef, {
            comments: increment(1)
        });
        await checkAndAwardBadges(commentData.authorId);
    } else if (status !== 'Approved' && commentData.status === 'Approved') {
        // If a comment is un-approved, decrement the count
        const postRef = doc(db, 'posts', commentData.postId);
        await updateDoc(postRef, {
            comments: increment(-1)
        });
    }
  }
}


/**
 * Deletes a comment from Firestore and decrements the post's comment count.
 * @param id The ID of the comment document to delete.
 */
export async function deleteComment(id: string): Promise<void> {
  const commentRef = doc(db, 'comments', id);
  const commentSnap = await getDoc(commentRef);

  if (commentSnap.exists()) {
    const commentData = commentSnap.data();
    const postRef = doc(db, 'posts', commentData.postId);

    // Decrement comment count only if the comment was approved
    if (commentData.status === 'Approved') {
      await updateDoc(postRef, {
        comments: increment(-1),
      });
    }
    
    await deleteDoc(commentRef);
  }
}

/**
 * Adds a new comment to a post, gives it a 'Pending' status,
 * and then runs AI moderation to update the status.
 * @param postId The ID of the post being commented on.
 * @param commentData The comment data.
 * @param parentId The ID of the parent comment, if this is a reply.
 */
export async function addComment(
  postId: string,
  commentData: Omit<Comment, 'id' | 'createdAt' | 'status' | 'postId' | 'postTitle' | 'likes' | 'parentId'>,
  parentId: string | null = null
): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
        throw new Error("Post not found");
    }

    const postTitle = postSnap.data().title;
    
    const commentsCollection = collection(db, 'comments');
    const docRef = await addDoc(commentsCollection, {
        ...commentData,
        postId,
        postTitle,
        status: 'Pending', // Start as pending
        createdAt: serverTimestamp(),
        likes: 0,
        parentId: parentId || null,
    });

    // Run AI moderation in the background (fire-and-forget)
    (async () => {
        try {
            const moderationResult = await moderateComment({
                author: commentData.author,
                commentText: commentData.text,
            });
            
            // Update the comment with the AI's verdict
            await updateCommentStatus(docRef.id, moderationResult.status);
            
            console.log(`Comment ${docRef.id} status updated to ${moderationResult.status} by AI.`);
        } catch (e) {
            console.error(`AI moderation failed for comment ${docRef.id}:`, e);
            // Optional: Handle failure, e.g., leave as pending for manual review
        }
    })();
}

/**
 * Likes or unlikes a comment.
 * @param commentId The ID of the comment to like/unlike.
 * @param like true to like, false to unlike.
 */
export async function likeComment(commentId: string, like: boolean): Promise<void> {
  const commentRef = doc(db, 'comments', commentId);
  await updateDoc(commentRef, {
    likes: increment(like ? 1 : -1),
  });
}
