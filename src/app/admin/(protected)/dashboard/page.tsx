
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Metadata } from 'next';
import {
  Activity,
  ArrowUpRight,
  Eye,
  Users,
  MousePointerClick,
  PlusCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import type { Post, User as UserType } from '@/lib/types';
import StatCard from '@/components/dashboard/stat-card';
import TrafficChart from '@/components/dashboard/traffic-chart';
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdminSubscription } from '@/hooks/use-subscription';

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAdminSubscription();
  
  const [postsSnapshot, postsLoading, postsError] = useCollection(
    query(collection(db, 'posts'), orderBy('publishedAt', 'desc'))
  );
  
  const [totalReaders, setTotalReaders] = useState(0);
  const [readersLoading, setReadersLoading] = useState(true);

  useEffect(() => {
    const fetchReaderCount = async () => {
      try {
        const coll = collection(db, "users");
        const snapshot = await getCountFromServer(coll);
        setTotalReaders(snapshot.data().count);
      } catch (e) {
        console.error("Failed to fetch reader count:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load total readers.' });
      } finally {
        setReadersLoading(false);
      }
    };

    fetchReaderCount();
  }, [toast]);


  const allPosts = useMemo(() => {
    if (!postsSnapshot) return [];
    return postsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        publishedAt: (data.publishedAt as Timestamp)?.toDate(),
      } as Post;
    });
  }, [postsSnapshot]);

  const recentPosts = useMemo(() => allPosts.slice(0, 5), [allPosts]);

  const stats = useMemo(() => {
    const totalPosts = allPosts.length;
    const engagement = allPosts.reduce((acc, post) => acc + (post.likes || 0) + (post.comments || 0), 0);
    const totalViews = allPosts.reduce((acc, post) => acc + (post.views || 0), 0);
    
    return { totalViews, engagement, totalPosts };
  }, [allPosts]);
  
  const isLoading = postsLoading || readersLoading;

  useEffect(() => {
    if (postsError) {
      toast({
        variant: 'destructive',
        title: 'Error loading data',
        description: postsError.message
      });
    }
  }, [postsError, toast]);


  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Card><CardHeader><CardTitle>Welcome back, {user?.name.split(' ')[0] || 'Admin'}!</CardTitle><CardDescription>Here's a quick overview of your blog's performance. Ready to create some magic?</CardDescription></CardHeader></Card>
            <div className="flex items-center justify-center p-8 min-h-[50vh]">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.name.split(' ')[0] || 'Admin'}!</CardTitle>
          <CardDescription>
            Here's a quick overview of your blog's performance. Ready to create some magic?
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Views" value={stats.totalViews.toLocaleString()} change="All-time" changeType="neutral" icon={<Eye className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Readers" value={totalReaders.toLocaleString()} change="Registered Users" changeType="neutral" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Total Posts" value={stats.totalPosts.toLocaleString()} change="All-time" changeType="neutral" icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Engagement" value={stats.engagement.toLocaleString()} change="All-time" changeType="neutral" icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>
              A simulated overview of traffic sources based on content categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <TrafficChart posts={allPosts} />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>
                Your most recently published and drafted articles.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/posts">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             {recentPosts.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentPosts.map((post) => (
                    <TableRow key={post.id}>
                        <TableCell>
                        <div className="font-medium">{post.title}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                            by {post.authorName}
                        </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Badge
                            className="text-xs"
                            variant={
                            post.status === 'published'
                                ? 'secondary'
                                : post.status === 'draft'
                                ? 'outline'
                                : 'default'
                            }
                        >
                            {post.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    No posts found.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
