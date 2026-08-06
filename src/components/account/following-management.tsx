
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { X, User as UserIcon, Tag, Rss, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp, doc, updateDoc, arrayRemove, arrayUnion, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { usePublicSubscription } from '@/hooks/use-public-subscription';

export function FollowingManagement() {
  const { toast } = useToast();
  const { user } = usePublicSubscription();
  const [relevantPosts, setRelevantPosts] = useState<Post[]>([]);
  const [allAuthorDetails, setAllAuthorDetails] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const followedAuthors = user?.followingAuthors || [];
  const followedTags = user?.followingTags || [];

  const followedAuthorsQuery = useMemo(() => 
    followedAuthors.length > 0 
      ? query(collection(db, 'users'), where('__name__', 'in', followedAuthors))
      : null
  , [followedAuthors]);
  
  const [followedAuthorDetails, authorsLoading] = useCollectionData(followedAuthorsQuery);

  useEffect(() => {
    const fetchRelevantPostsAndAuthors = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const postsMap = new Map<string, Post>();
            const authorIds = new Set<string>(followedAuthors);

            if (followedAuthors.length > 0) {
                const authorPostsQuery = query(collection(db, 'posts'), where('authorId', 'in', followedAuthors), where('status', '==', 'Published'), orderBy('publishedAt', 'desc'));
                const authorPostsSnapshot = await getDocs(authorPostsQuery);
                authorPostsSnapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    postsMap.set(docSnap.id, {
                        id: docSnap.id,
                        ...data,
                        publishedAt: (data.publishedAt as Timestamp).toDate(),
                    } as Post);
                });
            }

            if (followedTags.length > 0) {
                 const tagPostsQuery = query(collection(db, 'posts'), where('tags', 'array-contains-any', followedTags), where('status', '==', 'Published'), orderBy('publishedAt', 'desc'));
                 const tagPostsSnapshot = await getDocs(tagPostsQuery);
                 tagPostsSnapshot.forEach(docSnap => {
                    if (!postsMap.has(docSnap.id)) {
                        const data = docSnap.data();
                         postsMap.set(docSnap.id, {
                            id: docSnap.id,
                            ...data,
                            publishedAt: (data.publishedAt as Timestamp).toDate(),
                        } as Post);
                        authorIds.add(data.authorId);
                    }
                });
            }
            
            const combinedPosts = Array.from(postsMap.values())
                .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

            setRelevantPosts(combinedPosts);

            if (authorIds.size > 0) {
                const authorsQuery = query(collection(db, 'users'), where('__name__', 'in', Array.from(authorIds)));
                const authorsSnapshot = await getDocs(authorsQuery);
                const authorsData = authorsSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as User);
                setAllAuthorDetails(authorsData);
            }

        } catch (error) {
            console.error("Error fetching relevant posts:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your feed.' });
        } finally {
            setIsLoading(false);
        }
    };

    fetchRelevantPostsAndAuthors();
}, [followedAuthors, followedTags, user, toast]);

  const handleUnfollowAuthor = async (authorId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.id);
    try {
        await updateDoc(userRef, {
            followingAuthors: arrayRemove(authorId)
        });
        toast({ title: 'Author Unfollowed' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not unfollow author.'});
    }
  };

  const handleUnfollowTag = async (tag: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.id);
     try {
        await updateDoc(userRef, {
            followingTags: arrayRemove(tag)
        });
        toast({ title: 'Tag Unfollowed' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not unfollow tag.'});
    }
  };
  
  if (!user) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  const isFeedLoading = isLoading || authorsLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <Rss />
                <CardTitle>Your Feed</CardTitle>
             </div>
            <CardDescription>Latest posts from the authors and tags you follow.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFeedLoading ? (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : relevantPosts.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Post</TableHead>
                            <TableHead className="text-right">Published</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {relevantPosts.slice(0, 5).map(post => {
                            const authorName = allAuthorDetails.find(a => a.id === post.authorId)?.name || 'Unknown Author';
                            return (
                                <TableRow key={post.id}>
                                    <TableCell>
                                        <Link href={`/blog/${post.slug}`} className="font-medium hover:underline">{post.title}</Link>
                                        <div className="text-sm text-muted-foreground">by {authorName}</div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            ) : (
              <p className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                Your feed is empty. Follow some authors and tags to get started!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <UserIcon />
                <CardTitle>Followed Authors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
             {authorsLoading ? (
                <div className="flex items-center justify-center h-12">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
             ) : (followedAuthorDetails && followedAuthorDetails.length > 0) ? (followedAuthorDetails as User[]).map(author => {
              const avatarImage = PlaceHolderImages.find(p => p.id === author.avatar);
              return (
                <div key={author.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {avatarImage && <AvatarImage src={avatarImage.url} alt={author.name} data-ai-hint={avatarImage.hint} />}
                      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{author.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnfollowAuthor(author.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center">Not following any authors.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <Tag />
                <CardTitle>Followed Tags</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {followedTags.length > 0 ? followedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-base py-1">
                {tag}
                <button className="ml-2 rounded-full hover:bg-background/50 p-0.5" onClick={() => handleUnfollowTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )) : <p className="text-sm text-muted-foreground text-center w-full">Not following any tags.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
