
'use client';

import { useState, useEffect } from 'react';
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
import { BadgeDollarSign, BookOpen, Link as LinkIcon, HandCoins, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { db } from '@/lib/firebase';
import type { Post, AffiliateLink, Tip as TipType } from '@/lib/types';
import { useAdminSubscription } from '@/hooks/use-subscription';
import RevenueChart from '@/components/dashboard/revenue-chart';

interface EarningsData {
  totalRevenue: number;
  paidContentRevenue: number;
  affiliateRevenue: number;
  tipRevenue: number;
  earningsBreakdown: { id: string; type: 'Paid Article' | 'Affiliate Link' | 'Tip'; title: string; earnings: number; clicks: number | null }[];
  dailyRevenue: { date: string; revenue: number }[];
}

export default function MyRevenuePage() {
  const { toast } = useToast();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAdminSubscription();

  useEffect(() => {
    if (!user?.id) return;

    const fetchEarnings = async () => {
        setIsLoading(true);
        try {
            const thirtyDaysAgo = subDays(new Date(), 30);
            
            const postsQuery = query(collection(db, 'posts'), where('premium', '==', true));
            const linksQuery = query(collection(db, 'affiliateLinks'));
            const tipsQuery = query(collection(db, 'tips'), where('authorId', '==', user.id), where('createdAt', '>=', thirtyDaysAgo));

            const [postsSnapshot, linksSnapshot, tipsSnapshot] = await Promise.all([
                getDocs(postsQuery),
                getDocs(linksQuery),
                getDocs(tipsQuery)
            ]);

            const posts: Post[] = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)) || [];
            const affiliateLinks: AffiliateLink[] = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AffiliateLink)) || [];
            const tips: TipType[] = tipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TipType)) || [];
            
            const paidContentRevenue = posts.reduce((acc, p) => acc + (p.likes * 0.1), 0); // Mock calculation
            const affiliateRevenue = affiliateLinks.reduce((acc, link) => acc + link.earnings, 0);
            const tipRevenue = tips.reduce((acc, tip) => acc + tip.amount, 0);
            const totalRevenue = paidContentRevenue + affiliateRevenue + tipRevenue;

            const earningsBreakdown = [
                ...posts.slice(0,2).map(p => ({
                    id: p.id,
                    type: 'Paid Article' as const,
                    title: p.title,
                    earnings: (p.likes * 0.1), // Mock calculation
                    clicks: null
                })),
                ...affiliateLinks.slice(0,2).map((l) => ({
                    id: l.id,
                    type: 'Affiliate Link' as const,
                    title: l.name,
                    earnings: l.earnings,
                    clicks: l.clicks
                })),
                ...tips.slice(0, 2).map((t) => ({
                    id: t.id,
                    type: 'Tip' as const,
                    title: `Tip from ${t.tipperName}`,
                    earnings: t.amount,
                    clicks: null,
                })),
            ].sort((a,b) => b.earnings - a.earnings);
            
             // Process daily revenue from tips
            const dailyRevenueMap: Record<string, number> = {};
            for (let i = 0; i < 30; i++) {
                const date = subDays(new Date(), i);
                const dateString = date.toISOString().split('T')[0];
                dailyRevenueMap[dateString] = 0;
            }

            tips.forEach(tip => {
                const dateString = (tip.createdAt as Timestamp).toDate().toISOString().split('T')[0];
                if(dailyRevenueMap[dateString] !== undefined) {
                    dailyRevenueMap[dateString] += tip.amount;
                }
            });

            const dailyRevenue = Object.entries(dailyRevenueMap)
                .map(([date, revenue]) => ({ date, revenue }))
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


            setEarningsData({
              totalRevenue,
              paidContentRevenue,
              affiliateRevenue,
              tipRevenue,
              earningsBreakdown,
              dailyRevenue,
            });
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load earnings data.' });
        } finally {
            setIsLoading(false);
        }
    };
    fetchEarnings();
  }, [toast, user]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!earningsData) {
    return <div className="text-center p-8">Could not load earnings data.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Revenue</CardTitle>
          <CardDescription>
            Track your revenue from paid content, affiliate marketing, and tips.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             <p className="text-xs text-muted-foreground">
              All-time revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Content</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.paidContentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Simulated from premium article likes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.affiliateRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">from affiliate links</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tips</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.tipRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">from reader tips</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Showing daily revenue from tips for the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <RevenueChart data={earningsData.dailyRevenue} />
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <CardDescription>
              A detailed look at your top revenue sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earningsData.earningsBreakdown.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                         <div className="flex items-center gap-2">
                            {item.type === 'Paid Article' && <BookOpen className="h-4 w-4 text-muted-foreground"/>}
                            {item.type === 'Affiliate Link' && <LinkIcon className="h-4 w-4 text-muted-foreground"/>}
                            {item.type === 'Tip' && <HandCoins className="h-4 w-4 text-muted-foreground"/>}
                            {item.type}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">{item.clicks?.toLocaleString() ?? 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">${item.earnings.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
      </Card>

    </div>
  );
}
