
'use client';

import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostCard } from '@/components/blog/post-card';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { PublicFooter } from '@/components/blog/public-footer';
import { PublicHeader } from '@/components/blog/public-header';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import type { Post } from '@/lib/types';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { ExpandableBanner } from '@/components/expandable-banner';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { AdPlaceholder } from '@/components/blog/ad-placeholder';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsletterSignupForm } from '@/components/blog/newsletter-signup-form';
import { collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { CommunityHub } from '@/components/blog/community-hub';

export default function PublicBlogPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>(['All']);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<Error | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { isAuthenticated, isLoading: isSubscriptionLoading } = usePublicSubscription();
  const { toast } = useToast();

  const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
  
  useEffect(() => {
    async function fetchPostsAndCategories() {
      setIsPostsLoading(true);
      setPostsError(null);
      try {
        // Fetch Posts - simplified query to avoid index issues
        const postsQuery = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs
          .map(doc => {
              const data = doc.data();
              // Ensure publishedAt exists and is a valid date before converting
              const publishedAtDate = data.publishedAt ? (data.publishedAt as Timestamp).toDate() : null;
              if (!publishedAtDate) return null;

              return {
                  id: doc.id,
                  ...data,
                  publishedAt: publishedAtDate,
                  authorName: data.authorName || "Unknown Author"
              } as Post;
          })
          .filter((post): post is Post => post !== null && post.status === 'published'); // Filter for published posts on the client side

        setAllPosts(postsData);

        // Fetch Categories
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoryData = categoriesSnapshot.docs.map(doc => doc.data().name);
        setAllCategories(['All', ...categoryData]);

      } catch (error: any) {
        console.error("Error fetching data:", error);
        setPostsError(error);
        toast({
          variant: 'destructive',
          title: 'Error Loading Content',
          description: 'There was a problem fetching the blog posts. Please try again later.'
        });
      } finally {
        setIsPostsLoading(false);
      }
    }

    fetchPostsAndCategories();
  }, [toast]);
  
  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      const matchesSearch = !searchTerm ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [allPosts, searchTerm, selectedCategory]);

  const postsPerPage = 4;
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPosts.length / postsPerPage);
  }, [filteredPosts.length, postsPerPage]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredPosts, currentPage, postsPerPage]);
  
  const isLoading = isPostsLoading || isSubscriptionLoading;
  const showNoResults = !isPostsLoading && (searchTerm || selectedCategory) && filteredPosts.length === 0;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category === 'All' ? null : category);
    setCurrentPage(1);
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) { pageNumbers.push(i); }
    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem><PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} isActive={currentPage > 1} /></PaginationItem>
                {startPage > 1 && (<><PaginationItem><PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}</>)}
                {pageNumbers.map((num) => (<PaginationItem key={num}><PaginationLink onClick={() => handlePageChange(num)} isActive={currentPage === num}>{num}</PaginationLink></PaginationItem>))}
                {endPage < totalPages && (<><PaginationItem><PaginationEllipsis /></PaginationItem><PaginationItem><PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink></PaginationItem></>)}
                <PaginationItem><PaginationNext onClick={() => handlePageChange(currentPage + 1)} isActive={currentPage < totalPages}/></PaginationItem>
            </PaginationContent>
        </Pagination>
    );
  }

  const headlinePosts = useMemo(() => allPosts.filter(p => p.featured).slice(0, 5), [allPosts]);

  const showAds = !isAuthenticated;

  const contentWithAds = useMemo(() => {
    const items: React.ReactNode[] = [];
    paginatedPosts.forEach((post, index) => {
      items.push(<PostCard key={post.id} post={post} />);
      // Add an ad after the 1st, 2nd, and 3rd post
      if (showAds && index < 3) {
        items.push(
          <div key={`ad-${index}`}>
            <AdPlaceholder />
          </div>
        );
      }
    });
    return items;
  }, [paginatedPosts, showAds]);

  return (
    <>
        <ExpandableBanner />
        <PublicHeader />
        <main className="w-full">
            <section className="py-20 md:py-32 bg-card border-b">
                <div className="container mx-auto text-center px-4">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-16 w-3/4 mx-auto" />
                        <Skeleton className="h-7 w-1/2 mx-auto mt-4" />
                      </>
                    ) : (
                      <>
                        <h1 className="text-4xl md:text-6xl font-bold font-headline">Breaking the story behind the headlines</h1>
                        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Welcome to Dailyfeed, your source for in-depth analysis and untold stories.</p>
                      </>
                    )}
                    <div className="mt-8 flex gap-4 justify-center">
                        {!isAuthenticated && (
                            <Button size="lg" asChild><Link href="/subscribe">Subscribe</Link></Button>
                        )}
                    </div>
                </div>
            </section>
            
             <section className="py-12">
                <div className="container mx-auto px-4 lg:px-6">
                    <h2 className="text-3xl font-bold font-headline text-center mb-8">Top Headlines</h2>
                     <Carousel
                        opts={{ align: "start", loop: true, slidesToScroll: 'auto' }}
                        plugins={[autoplayPlugin.current]}
                        onMouseEnter={autoplayPlugin.current.stop}
                        onMouseLeave={autoplayPlugin.current.reset}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2">
                           {headlinePosts.map((post) => (
                                <CarouselItem key={post.id} className="pl-2 basis-auto">
                                     <Button asChild variant="outline">
                                        <Link href={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </Button>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </section>

            <div className="container mx-auto px-4 lg:px-6 py-12">
                 <div className="mb-8 max-w-md mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        placeholder="Search articles..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                 <Carousel
                    opts={{ align: "start", slidesToScroll: 'auto' }}
                    className="w-full mb-8"
                >
                    <CarouselContent className="-ml-2">
                        {allCategories.map(category => (
                            <CarouselItem key={category} className="pl-2 basis-auto">
                                <Button
                                    variant={
                                        (selectedCategory === category || (category === 'All' && !selectedCategory)) 
                                            ? 'default' 
                                            : 'outline'
                                    }
                                    onClick={() => handleCategorySelect(category)}
                                >
                                    {category}
                                </Button>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>


                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : postsError ? (
                    <div className="text-center py-16 text-destructive border-2 border-dashed border-destructive/50 rounded-lg">
                        <h2 className="text-2xl font-bold font-headline mb-2">Error Loading Posts</h2>
                        <p>There was a problem fetching content. Please try again later.</p>
                    </div>
                ) : showNoResults ? (
                    <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                        <h2 className="text-2xl font-bold font-headline mb-2 text-foreground">No Results Found</h2>
                        <p>Try a different search term or clear the filter.</p>
                    </div>
                 ) : (
                    <>
                    <section className="space-y-8">
                        {contentWithAds}
                    </section>
                    
                    {totalPages > 1 && (
                        <div className="mt-12">
                            {renderPagination()}
                        </div>
                    )}
                    </>
                 )}
            </div>
             <CommunityHub />
             <section className="container mx-auto px-4 lg:px-6 py-12">
                <NewsletterSignupForm />
            </section>
        </main>
        <PublicFooter />
    </>
  );
}
