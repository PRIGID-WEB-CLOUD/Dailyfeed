
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/lib/types';
import { PostEditor } from '@/components/posts/post-editor';
import { Loader2 } from 'lucide-react';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, updateDoc, serverTimestamp, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdminSubscription } from '@/hooks/use-subscription';
import { shareOnFacebook } from '@/ai/flows/share-on-facebook';
import { shareOnTwitter } from '@/ai/flows/share-on-twitter';
import { toast as sonnerToast } from 'sonner';

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [postSnapshot, isLoading] = useDocument(id ? doc(db, 'posts', id) : undefined);
  const { user } = useAdminSubscription();

  const post = postSnapshot?.data() as Post | undefined;

  const handleSave = async (data: any, status: 'published' | 'draft') => {
    if (!post || !user) return;

    try {
        const postRef = doc(db, 'posts', id);
        const postData = data;
        const currentStatus = post.status;
        
        let publishedAtValue;
        
        const isPublishingFirstTime = status === 'published' && currentStatus !== 'published';

        if (isPublishingFirstTime) {
            publishedAtValue = serverTimestamp();
        } else if (post.publishedAt) {
            publishedAtValue = post.publishedAt;
        } else {
            publishedAtValue = null;
        }

        await updateDoc(postRef, {
            ...postData,
            status,
            publishedAt: publishedAtValue,
            updatedAt: serverTimestamp(),
        });

        toast({
          title: `Post "${data.title}" updated!`,
          description: `The post has been saved as ${status}.`,
        });

        if (isPublishingFirstTime) {
          // Fire-and-forget social sharing and notification
          (async () => {
            const postUrl = `${window.location.origin}/blog/${data.slug}`;

            const socialPromises = [
              shareOnTwitter({ postTitle: data.title, postUrl }),
              shareOnFacebook({ postTitle: data.title, postUrl, postExcerpt: data.content.substring(0, 150) })
            ];
            
            socialPromises.forEach(promise => {
                promise.then(result => {
                    if (result.success) {
                        sonnerToast.success(result.message);
                    } else {
                        sonnerToast.error(result.message);
                    }
                })
            });

            await addDoc(collection(db, 'notifications'), {
              message: `New post by ${user.name}: "${data.title}"`,
              slug: data.slug,
              date: serverTimestamp(),
              authorId: user.id,
              tags: data.tags,
            });
          })();
        }

        if (status !== 'draft') {
          router.push('/admin/posts');
        }

    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save post.' });
    }
  };

  const handleDelete = async () => {
    if (!post || !user) return;
    try {
        await deleteDoc(doc(db, 'posts', id));
        toast({
            variant: 'destructive',
            title: 'Post Deleted',
            description: `"${post?.title}" has been deleted.`,
        });
        router.push('/admin/posts');
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete post.' });
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!postSnapshot?.exists()) {
     return <div className="text-center p-6">Post not found.</div>;
  }

  return (
    <PostEditor 
      post={post}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
