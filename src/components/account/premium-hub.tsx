
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export function PremiumHub() {
    const { toast } = useToast();
    const [premiumPosts, setPremiumPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPremiumPosts = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, 'posts'), where('premium', '==', true), where('status', '==', 'Published'), orderBy('publishedAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const postsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    publishedAt: (doc.data().publishedAt as Timestamp).toDate(),
                } as Post));
                setPremiumPosts(postsData);

            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error loading content',
                    description: 'Could not load premium articles at this time.'
                });
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchPremiumPosts();
    }, [toast]);
    
    const categoryCounts = premiumPosts.reduce((acc, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryCounts).map(([name, value], index) => ({ 
        name, 
        value,
        fill: `hsl(var(--chart-${(index % 5) + 1}))` 
    }));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Exclusive Content</CardTitle>
                    <CardDescription>Your access to all premium articles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : premiumPosts.length > 0 ? (
                        premiumPosts.map(post => (
                             <Link key={post.id} href={`/blog/${post.slug}`} className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                                <div>
                                    <h4 className="font-semibold group-hover:text-primary">{post.title}</h4>
                                    <Badge variant="outline">{post.category}</Badge>
                                </div>
                                <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </Link>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No premium articles found.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Enhanced Insights</CardTitle>
                    <CardDescription>Analytics based on your reading habits.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <ChartContainer config={{}} className="h-[200px] w-full max-w-xs">
                       <PieChart>
                            <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                               {categoryData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                       </PieChart>
                    </ChartContainer>
                     <p className="text-center text-sm text-muted-foreground mt-2">Your most read categories</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/account/billing">Manage Subscription & Billing</Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Premium Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Button variant="outline" asChild className="w-full">
                            <Link href="/contact">
                                <LifeBuoy className="mr-2 h-4 w-4"/>
                                Contact Support
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
