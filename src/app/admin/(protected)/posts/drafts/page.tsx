
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/lib/types';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

export default function DraftsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'Draft'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const draftsData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
        } as Post;
      });
      setDrafts(draftsData);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error loading drafts',
        description: 'There was a problem fetching your draft posts.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handlePublishNow = async (postId: string, title: string) => {
    setPublishingId(postId);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        status: 'Published',
        publishedAt: serverTimestamp(),
      });
      toast({
        title: 'Post Published!',
        description: `"${title}" is now live on your blog.`,
      });
      // Refresh the list of drafts
      await fetchDrafts();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Publishing Post',
        description: 'There was a problem publishing the post.',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleEdit = (postId: string) => {
    router.push(`/admin/posts/${postId}/edit`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Posts</CardTitle>
        <CardDescription>
          Here are your unpublished drafts. You can publish them directly or edit them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : drafts.length > 0 ? (
              drafts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post.createdAt ? format(new Date(post.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post.id)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePublishNow(post.id, post.title)}
                      disabled={publishingId === post.id}
                    >
                      {publishingId === post.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Publish Now
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  You have no drafts.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
