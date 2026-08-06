
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';

import type { Post } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { usePublicSubscription } from '@/hooks/use-public-subscription';


export function PostCard({ post, isFeatured = false }: { post: Post, isFeatured?: boolean }) {
  const { isAuthenticated } = usePublicSubscription();
  const postImage = PlaceHolderImages.find(p => p.id === post.imageUrl);
  const authorImage = PlaceHolderImages.find(p => p.id === post.authorAvatar);

  return (
    <Card className={cn(
        "overflow-hidden group flex flex-col h-full",
        isFeatured && "md:col-span-full lg:col-span-3"
    )}>
        <Link href={`/blog/${post.slug}`} className={cn("block")}>
            <div className={cn(
                "aspect-video relative", 
                isFeatured ? "aspect-[16/9] md:aspect-[2/1] lg:aspect-[16/9]" : "aspect-video"
             )}>
                {postImage && (
                    <Image 
                        src={postImage.url}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        data-ai-hint={post.imageHint}
                        sizes={isFeatured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                    />
                )}
            </div>
        </Link>
        <div className={cn("flex flex-col flex-grow")}>
            <CardHeader className="flex-grow">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">{post.category}</Badge>
                        {post.premium && !isAuthenticated && <Badge>Premium</Badge>}
                </div>
                <h2 className={cn("font-headline font-bold leading-tight", isFeatured ? "text-3xl lg:text-4xl" : "text-2xl")}>
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
                </h2>
                <p className={cn("mt-4 text-muted-foreground", isFeatured ? "line-clamp-2 text-lg" : "line-clamp-3")}>
                    {post.content}
                </p>
            </CardHeader>
            <CardContent>
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            {authorImage && <AvatarImage src={authorImage.url} alt={post.authorName} data-ai-hint={authorImage.hint} />}
                            <AvatarFallback>{post.authorName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{post.authorName}</p>
                            <p className="text-sm text-muted-foreground">{format(post.publishedAt, 'MMMM dd, yyyy')}</p>
                        </div>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="flex items-center text-sm font-semibold text-primary">
                        Read More <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>
            </CardContent>
        </div>
    </Card>
  )
}
