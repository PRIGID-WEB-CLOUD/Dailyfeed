
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePublicSubscription } from '@/hooks/use-public-subscription';

type TrackingStatus = 'Opened' | 'Delivered' | 'Sent' | 'Bounced';
interface TrackingItem {
    id: string;
    postTitle: string;
    status: TrackingStatus;
    date: Date;
}

export function PostTracking() {
    const { user } = usePublicSubscription();
    
    const [trackingData, setTrackingData] = useState<TrackingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrackingData = async () => {
            setIsLoading(true);
            try {
                // This is a simulation. In a real app, you would query a dedicated 'notifications' or 'deliveries' collection.
                // For now, we use published posts to simulate a list of items that could be tracked.
                const postsQuery = query(collection(db, 'posts'), where('status', '==', 'Published'), orderBy('publishedAt', 'desc'));
                const postsSnapshot = await getDocs(postsQuery);
                const posts = postsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    publishedAt: (doc.data().publishedAt as Timestamp).toDate(),
                } as Post));
                
                const statuses: TrackingStatus[] = ['Opened', 'Delivered', 'Sent', 'Bounced'];
                // Simulate a personal tracking list for the user
                const simulatedTrackingData = posts.slice(0, 4).map((post, index) => ({
                    id: post.id,
                    postTitle: post.title,
                    status: statuses[index % statuses.length],
                    date: new Date(post.publishedAt),
                }));
                setTrackingData(simulatedTrackingData);
            } catch (error) {
                console.error("Failed to fetch tracking data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrackingData();
    }, []);
    
    const getStatusBadge = (status: TrackingStatus) => {
        switch(status) {
            case 'Opened': return <Badge variant="secondary">Opened</Badge>;
            case 'Delivered': return <Badge>Delivered</Badge>;
            case 'Sent': return <Badge variant="outline">Sent</Badge>;
            case 'Bounced': return <Badge variant="destructive">Bounced</Badge>;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Post Tracking</CardTitle>
                <CardDescription>Track the delivery status of recent posts sent to you.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Post Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : trackingData.length > 0 ? (
                           trackingData.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.postTitle}</TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell className="text-right">{format(item.date, 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                        ))
                        ) : (
                             <TableRow><TableCell colSpan={3} className="h-24 text-center">No tracking data available.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
