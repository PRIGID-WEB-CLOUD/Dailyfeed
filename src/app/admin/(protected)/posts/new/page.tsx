
'use client';
import { useRouter } from 'next/navigation';
import { PostEditor } from '@/components/posts/post-editor';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdminSubscription } from '@/hooks/use-subscription';
import { shareOnFacebook } from '@/ai/flows/share-on-facebook';
import { shareOnTwitter } from '@/ai/flows/share-on-twitter';
import { toast as sonnerToast } from 'sonner';
import { createFolder } from '@/lib/media-service';

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAdminSubscription();

  const handleSave = async (data: any, status: 'published' | 'draft') => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a post.' });
        return;
    }

    try {
        let publishedAtValue = null;
        if (status === 'published') {
            publishedAtValue = serverTimestamp();
        }
        
        const postData = {
          ...data,
          status,
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatar,
          likes: 0,
          comments: 0,
          views: 0,
          publishedAt: publishedAtValue,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'posts'), postData);
        
        // Auto-create media folder
        await createFolder(`posts/${data.slug}`);

        toast({
          title: `Post "${data.title}" created!`,
          description: `Your new post has been saved as ${status}. Media folder "posts/${data.slug}" also created.`,
        });

        if (status === 'published') {
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
          router.push('/admin/posts');
        } else {
          router.push(`/admin/posts/${docRef.id}/edit`);
        }
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create post.' });
    }
  };

  return (
    <PostEditor 
      onSave={handleSave}
    />
  );
}
