

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Post } from '@/lib/types';
import { recommendArticles, type RecommendArticlesOutput } from '@/ai/flows/recommend-articles';
import { Loader2, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PostCard } from '@/components/blog/post-card';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function RecommendedPosts({ post }: { post: Post }) {
  const [recommendations, setRecommendations] = useState<RecommendArticlesOutput['recommendations'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [allPostsSnapshot, isPostsLoading] = useCollection(
    query(collection(db, 'posts'), orderBy('publishedAt', 'desc'))
  );
  
  const allPosts = useMemo(() => {
    if (!allPostsSnapshot) return [];
    return allPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  }, [allPostsSnapshot]);

  useEffect(() => {
    const getRecommendations = async () => {
      if (isPostsLoading) return;
      setIsLoading(true);
      try {
        const result = await recommendArticles({
          sourceArticleContent: post.content,
          sourceArticleTitle: post.title,
          sourceArticleSlug: post.slug,
        });
        setRecommendations(result.recommendations);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };
    getRecommendations();
  }, [post, isPostsLoading]);

  const recommendedPosts = useMemo(() => {
    if (!recommendations) return [];
    return recommendations
        .map(rec => allPosts.find(p => p.slug === rec.slug))
        .filter((p): p is Post => !!p);
  }, [recommendations, allPosts]);

  const combinedLoading = isLoading || isPostsLoading;

  if (combinedLoading) {
    return (
      <div className="mt-12 pt-8 border-t">
         <h3 className="text-2xl font-bold font-headline flex items-center gap-3 mb-8">
            <Lightbulb className="h-7 w-7" />
            <span>You Might Also Like</span>
        </h3>
        <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!recommendations || recommendedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t">
        <h3 className="text-2xl font-bold font-headline flex items-center gap-3 mb-8">
            <Lightbulb className="h-7 w-7" />
            <span>You Might Also Like</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
            {recommendedPosts.map(p => (
                <PostCard key={p.id} post={p} />
            ))}
        </div>
    </div>
  );
}
