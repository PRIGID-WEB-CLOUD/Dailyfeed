
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePublicSubscription } from '@/hooks/use-public-subscription';

export function ReadingList() {
    const { toast } = useToast();
    const { user } = usePublicSubscription();
    const [readingList, setReadingList] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.readingList || user.readingList.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchReadingList = async () => {
            setIsLoading(true);
            try {
                // Fetch posts where the ID is in the user's readingList
                const q = query(collection(db, 'posts'), where('__name__', 'in', user.readingList));
                const querySnapshot = await getDocs(q);
                const posts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    publishedAt: (doc.data().publishedAt as Timestamp).toDate(),
                } as Post));
                
                // Firestore doesn't guarantee order with 'in' queries, so sort client-side
                const orderedPosts = user.readingList!.map(id => posts.find(p => p.id === id)).filter((p): p is Post => !!p);
                setReadingList(orderedPosts);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load reading list.' });
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReadingList();
    }, [toast, user]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Reading List</CardTitle>
                <CardDescription>Articles you've saved to read later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                 ) : readingList.length > 0 ? (
                    readingList.map(post => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                            <div>
                                <h4 className="font-semibold group-hover:text-primary">{post.title}</h4>
                                <p className="text-sm text-muted-foreground">{post.category}</p>
                            </div>
                            <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </Link>
                    ))
                 ) : (
                    <p className="text-muted-foreground text-center py-8">Your reading list is empty. Save articles using the bookmark icon on post pages!</p>
                 )}
            </CardContent>
        </Card>
    );
}
