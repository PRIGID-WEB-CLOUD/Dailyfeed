

'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import TrafficChart from '@/components/dashboard/traffic-chart';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, Zap, BookHeart, Loader2, BarChart3 } from 'lucide-react';
import { AppCard } from '@/components/integrations/app-card';
import { useIntegrations } from '@/contexts/integrations-context';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { getIntegration } = useIntegrations();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsPostsLoading(true);
      try {
        const postsQuery = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                publishedAt: (data.publishedAt as Timestamp)?.toDate()
            } as Post;
        });
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load analytics data.' });
      } finally {
        setIsPostsLoading(false);
      }
    };
    fetchPosts();
  }, [toast]);
  
  const [engagementData, setEngagementData] = useState<{type: string; value: number; fill: string}[]>([]);
  
  const googleAnalyticsIntegration = getIntegration('google-analytics');
  
  const engagementConfig = {
    comments: { label: 'Comments', color: 'hsl(var(--chart-1))' },
    likes: { label: 'Likes', color: 'hsl(var(--chart-3))' },
  } satisfies import('@/components/ui/chart').ChartConfig;


  const sortedTopPosts = useMemo(() => 
    [...posts].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
  , [posts]);

  const sortedBookmarkedPosts = useMemo(() => 
    [...posts].sort((a,b) => b.likes - a.likes).slice(0, 5)
  , [posts]);
  
  const totalLikes = useMemo(() => posts.reduce((acc, post) => acc + post.likes, 0), [posts]);
  const totalComments = useMemo(() => posts.reduce((acc, post) => acc + post.comments, 0), [posts]);

  useEffect(() => {
    if (posts.length > 0) {
        setEngagementData([
            { type: 'Comments', value: totalComments, fill: 'var(--color-comments)' },
            { type: 'Likes', value: totalLikes, fill: 'var(--color-likes)' },
        ]);
    }
  }, [posts, totalLikes, totalComments]);
  
  const dynamicStats = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        avgTimeOnPage: '0m 0s',
        bounceRate: '0%',
        newVsReturning: '0/0',
        topReferrer: 'N/A',
      };
    }
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalEngagement = posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0);

    // Simulate metrics based on engagement
    const avgTimeInSeconds = 60 + Math.min(totalEngagement, 500); // Base 60s, increases with engagement
    const bounceRate = Math.max(15, 70 - (totalEngagement / posts.length) * 2);
    const returningVisitorRatio = Math.min(0.8, 0.1 + (totalEngagement / totalViews) * 5);
    
    // Simulate top referrer from traffic chart data
    const trafficBySource: Record<string, number> = { Google: 0, Social: 0, Direct: 0, Referral: 0, Other: 0 };
    posts.forEach(post => {
        const views = post.views || 0;
        switch (post.category.toLowerCase()) {
            case 'technology': trafficBySource['Google'] += views * 0.6; break;
            case 'design': trafficBySource['Social'] += views * 0.5; break;
            case 'business': trafficBySource['Referral'] += views * 0.3; break;
            default: trafficBySource['Other'] += views; break;
        }
    });

    const topReferrer = Object.keys(trafficBySource).reduce((a, b) => trafficBySource[a] > trafficBySource[b] ? a : b, 'N/A');

    return {
      avgTimeOnPage: `${Math.floor(avgTimeInSeconds / 60)}m ${Math.round(avgTimeInSeconds % 60)}s`,
      bounceRate: `${bounceRate.toFixed(1)}%`,
      newVsReturning: `${((1 - returningVisitorRatio) * 100).toFixed(0)}/${(returningVisitorRatio * 100).toFixed(0)}`,
      topReferrer: topReferrer,
    };
  }, [posts]);

  const isLoading = isPostsLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            A detailed breakdown of your blog's performance and audience engagement.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicStats.avgTimeOnPage}</div>
            <p className="text-xs text-muted-foreground">
              Simulated from engagement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicStats.bounceRate}</div>
            <p className="text-xs text-muted-foreground">
              Simulated from engagement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New vs. Returning</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicStats.newVsReturning}</div>
            <p className="text-xs text-muted-foreground">New / Returning visitors</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Referrer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicStats.topReferrer}</div>
            <p className="text-xs text-muted-foreground">Simulated top traffic source</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
              <CardDescription>
                Your most viewed articles in the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
                  ) : sortedTopPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell className="text-right">{(post.views || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{post.likes} Likes, {post.comments} Comments</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader>
              <CardTitle>Engagement by Type</CardTitle>
              <CardDescription>Breakdown of user interactions.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {isLoading ? (
                 <div className="flex items-center justify-center min-h-[250px] w-full max-w-[300px]"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></div>
              ) : (
                <ChartContainer config={engagementConfig} className="min-h-[250px] w-full max-w-[300px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={engagementData} dataKey="value" nameKey="type" innerRadius={60} strokeWidth={5}>
                      {engagementData.map((entry) => (
                        <Cell key={`cell-${entry.type}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BookHeart />
                        <CardTitle>Top Liked Articles</CardTitle>
                    </div>
                    <CardDescription>
                        The articles your readers are liking the most.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
                    ) : sortedBookmarkedPosts.map(post => (
                        <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="text-right">{post.likes.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Traffic Overview</CardTitle>
                    <CardDescription>
                      A simulated overview of traffic sources based on content categories.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <TrafficChart posts={posts}/>
                </CardContent>
            </Card>
       </div>
       
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 /> Analytics Integrations</CardTitle>
                <CardDescription>Manage your connections to analytics platforms.</CardDescription>
            </CardHeader>
            <CardContent>
                {googleAnalyticsIntegration ? (
                    <AppCard integration={googleAnalyticsIntegration} />
                ) : (
                    <p className="text-muted-foreground">Google Analytics integration not found.</p>
                )}
            </CardContent>
        </Card>

    </div>
  );
}
