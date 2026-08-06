

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicFooter } from '@/components/blog/public-footer';
import { PublicHeader } from '@/components/blog/public-header';
import { Lock, Twitter, Facebook, Linkedin, Link2 as LinkIcon, Rss, Bell, Check, Heart, Bookmark } from 'lucide-react';
import { CommentsSection } from '@/components/blog/comments-section';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { AdPlaceholder } from '@/components/blog/ad-placeholder';
import { AuthorTipping } from '@/components/blog/author-tipping';
import type { Post, User } from '@/lib/types';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { ExpandableBanner } from '@/components/expandable-banner';
import { SponsoredSurvey } from '@/components/blog/sponsored-survey';
import { ReadingAssistant } from '@/components/blog/reading-assistant';
import { RecommendedPosts } from '@/components/blog/recommended-posts';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, updateDoc, arrayRemove, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserProfile } from '@/lib/user-service';
import { AffiliateBanner } from '@/components/blog/affiliate-banner';
import { cn } from '@/lib/utils';
import { togglePostLike } from '@/lib/post-service';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSettings } from '@/contexts/settings-context';


function Paywall({ title, message }: { title: string; message: string }) {
  return (
    <div className="relative mt-12">
        <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-background to-transparent"></div>
        <div className="text-center p-12 bg-secondary/50 rounded-lg max-w-2xl mx-auto relative z-10 border">
            <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
            <h3 className="text-3xl font-bold font-headline mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6">
                {message}
            </p>
            <Button asChild size="lg">
                <Link href="/subscribe">Subscribe Now</Link>
            </Button>
        </div>
    </div>
  );
}


export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user, anonymousId, isLoading: isSubscriptionLoading } = usePublicSubscription();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [currentUrl, setCurrentUrl] = useState('');
  
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPaywalled, setIsPaywalled] = useState(false);


  useEffect(() => {
    if (!slug) return;

    const fetchPostAndAuthor = async () => {
        setIsLoading(true);
        try {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, where("slug", "==", slug));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                notFound();
                return;
            }
            
            const postSnap = querySnapshot.docs[0];
            const postData = postSnap.data() as Omit<Post, 'id' | 'publishedAt'>;

            if (postData.status !== 'Published' && !isAuthenticated) { // Allow logged-in users to see non-published for preview? Maybe only admins? For now, public only sees published.
                notFound();
                return;
            }

            if (postData.authorId) {
                const authorProfile = await getUserProfile(postData.authorId);
                setAuthor(authorProfile);
            }
            
            const fetchedPost = {
                id: postSnap.id,
                ...postData,
                publishedAt: (postData.publishedAt as Timestamp)?.toDate(),
            } as Post;

            setPost(fetchedPost);
            setLikes(fetchedPost.likes || 0);

            // Increment view count
            const postRef = doc(db, 'posts', postSnap.id);
            await updateDoc(postRef, {
                views: increment(1)
            });

        } catch (error) {
            console.error("Error fetching post and author", error);
            toast({ variant: 'destructive', title: 'Error loading post' });
            notFound();
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchPostAndAuthor();
    setCurrentUrl(window.location.href);

  }, [slug, toast, isAuthenticated]);
  
  useEffect(() => {
    if (post && user) {
        setIsSaved(user.readingList?.includes(post.id) || false);
    }
    // Check for guest likes
    if (post && !user) {
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        setHasLiked(likedPosts.includes(post.id));
    }
  }, [post, user]);

  useEffect(() => {
    if (isLoading || isSubscriptionLoading || isSettingsLoading || !post || isAuthenticated) {
      return;
    }

    if (post.premium && settings.paywall.enabled) {
      const now = new Date();
      const month = now.getFullYear() + '-' + (now.getMonth() + 1);
      
      const viewedArticlesData = JSON.parse(localStorage.getItem('viewedArticles') || '{}');
      
      if (viewedArticlesData.month !== month) {
        // Reset for new month
        viewedArticlesData.month = month;
        viewedArticlesData.articles = [];
      }

      if (!viewedArticlesData.articles.includes(post.id)) {
        viewedArticlesData.articles.push(post.id);
        localStorage.setItem('viewedArticles', JSON.stringify(viewedArticlesData));
      }
      
      if (viewedArticlesData.articles.length > settings.paywall.freeArticlesCount) {
        setIsPaywalled(true);
      }
    }
  }, [post, isLoading, isSubscriptionLoading, isAuthenticated, settings, isSettingsLoading]);


  const handleLike = async () => {
    if (!post) return;
    
    // Prevent double-liking
    if (hasLiked) {
        toast({ title: "You've already liked this post." });
        return;
    }

    const newLikedState = true;
    const newLikesCount = likes + 1;

    setHasLiked(newLikedState);
    setLikes(newLikesCount);

    if (!user) {
        // Guest user
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        likedPosts.push(post.id);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    }

    try {
        await togglePostLike(post.id, true);
    } catch (error) {
        console.error("Failed to update like status:", error);
        // Revert optimistic update on failure
        setHasLiked(false);
        setLikes(likes);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update like status.',
        });
        if (!user) {
            const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
            const updatedLikedPosts = likedPosts.filter((id: string) => id !== post.id);
            localStorage.setItem('likedPosts', JSON.stringify(updatedLikedPosts));
        }
    }
};


  const handleSavePost = async () => {
    if (!isAuthenticated || !post || !user) {
        toast({ title: 'Please log in to save articles.' });
        return;
    }
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    try {
        await updateDoc(doc(db, "users", user.id), {
            readingList: newSavedState ? arrayUnion(post.id) : arrayRemove(post.id)
        });
        toast({ title: newSavedState ? 'Article Saved!' : 'Article Removed', description: newSavedState ? 'This article has been added to your reading list.' : 'This article has been removed from your reading list.' });
    } catch (e) {
        setIsSaved(!newSavedState); // Revert on error
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your reading list.'});
    }
  };
  
  const handleFollowAuthor = async () => {
    if (!user || !author) return;
    const isFollowing = user.followingAuthors?.includes(author.id);
    try {
        await updateDoc(doc(db, "users", user.id), {
            followingAuthors: isFollowing
                ? arrayRemove(author.id)
                : arrayUnion(author.id),
        });
        toast({ title: isFollowing ? `Unfollowed ${author.name}` : `Now following ${author.name}` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your following status.'});
    }
  };
  
  const handleFollowTag = async (tag: string) => {
    if (!user) return;
    const isFollowing = user.followingTags?.includes(tag);
     try {
        await updateDoc(doc(db, "users", user.id), {
            followingTags: isFollowing
                ? arrayRemove(tag)
                : arrayUnion(tag),
        });
        toast({ title: isFollowing ? `Unfollowed #${tag}` : `Now following #${tag}` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your following status.'});
    }
  };

  const pageIsLoading = isLoading || isSubscriptionLoading || isSettingsLoading;

  if (pageIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!post || !author) {
      // notFound() should be called within the effect, but as a fallback:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Post not found.</p>
        </div>
      )
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: 'Link Copied!',
      description: 'The post URL has been copied to your clipboard.',
    });
  };

  const postImage = PlaceHolderImages.find(p => p.id === post.imageUrl);
  const authorImage = PlaceHolderImages.find(p => p.id === author.avatar);

  const showPaywall = post.premium && isPaywalled && !isAuthenticated;
  
  const contentParagraphs = post.content.split('\n\n');
  
  const contentToShow = showPaywall ? [contentParagraphs[0]] : contentParagraphs.map((p, i) => <p key={`p-${i}`}>{p}</p>);
    
  const isFollowingAuthor = user?.followingAuthors?.includes(author.id);

  return (
    <div className="bg-background text-foreground">
      <ExpandableBanner />
      <PublicHeader />
       {post && <ReadingAssistant post={post} />}
      <main className="w-full py-12">
        <div className="px-4 lg:px-6">
        <article className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex justify-center gap-2 pb-4">
                        {post.tags.map(tag => {
                            const isFollowing = user?.followingTags?.includes(tag);
                            return (
                                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => isAuthenticated && handleFollowTag(tag)}>
                                    {isFollowing && <Check className="h-3 w-3 mr-1" />}
                                    {tag}
                                </Badge>
                            );
                        })}
                        {post.premium && <Badge>Premium</Badge>}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <h1 className="text-4xl md:text-6xl font-bold font-headline mt-4">{post.title}</h1>
                <div className="mt-6 flex items-center justify-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            {authorImage && <AvatarImage src={authorImage.url} alt={author.name} data-ai-hint={authorImage.hint} />}
                            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground">{author.name}</p>
                            <p className="text-sm">{author.roles[0]?.name || 'Contributor'}</p>
                        </div>
                        {isAuthenticated && (
                            <Button size="sm" variant={isFollowingAuthor ? "secondary" : "outline"} onClick={handleFollowAuthor}>
                                {isFollowingAuthor ? <Check className="mr-2 h-4 w-4" /> : <Rss className="mr-2 h-4 w-4" />}
                                {isFollowingAuthor ? 'Following' : 'Follow'}
                            </Button>
                        )}
                    </div>
                    <span>&bull;</span>
                    <time dateTime={new Date(post.publishedAt).toISOString()}>
                        {format(new Date(post.publishedAt), 'MMMM dd, yyyy')}
                    </time>
                </div>
            </div>
            
             <div className="my-8 flex flex-col items-center gap-4">
              <Separator />
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Share post:</span>
                 <Button variant="outline" size="icon" onClick={handleSavePost}>
                  <Bookmark className={cn("h-4 w-4", isSaved && "fill-current text-primary")} />
                  <span className="sr-only">Save for later</span>
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4 hover:text-sky-500" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" asChild>
                   <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4 hover:text-blue-600" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" asChild>
                   <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 hover:text-blue-700" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <AuthorTipping author={author} />
              </div>
              <Separator />
            </div>

            {postImage && (
                <div className="aspect-video relative rounded-lg overflow-hidden my-8">
                    <Image
                        src={postImage.url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={post.imageHint}
                    />
                </div>
            )}
            
            <div className={cn("prose dark:prose-invert prose-lg max-w-none mx-auto mt-8 space-y-6", showPaywall && "blur-lg")}>
              {contentToShow}
            </div>

            {showPaywall ? <Paywall title={settings.paywall.paywallMessageTitle} message={settings.paywall.paywallMessageBody} /> : (
              <>
                <AdPlaceholder />
                <SponsoredSurvey />
                <RecommendedPosts post={post} />
                <CommentsSection post={post} handleLike={handleLike} likes={likes} hasLiked={hasLiked} />
              </>
            )}
            
        </article>
        </div>
      </main>
      <AffiliateBanner />
      <PublicFooter />
    </div>
  );
}
