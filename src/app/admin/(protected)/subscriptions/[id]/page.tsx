
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Subscription } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getStatusBadge = (status: Subscription['status']) => {
    switch (status) {
      case 'Active': return <Badge variant="secondary">Active</Badge>;
      case 'Cancelled': return <Badge variant="outline">Cancelled</Badge>;
      case 'Past Due': return <Badge variant="destructive">Past Due</Badge>;
    }
};

export default function SubscriptionDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [subscriptionDoc, isLoading, error] = useDocument(doc(db, 'subscriptions', id));
  const subscription: Subscription | null = subscriptionDoc?.exists() ? { id: subscriptionDoc.id, ...subscriptionDoc.data() } as Subscription : null;

  const [isCancelAlertOpen, setCancelAlertOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !subscriptionDoc?.exists()) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load subscription details.' });
          router.push('/admin/subscriptions');
    }
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [subscriptionDoc, isLoading, error, router, toast]);
  
  const handleCancel = async () => {
    if (!subscription) return;
    try {
        const subRef = doc(db, 'subscriptions', subscription.id);
        await updateDoc(subRef, { status: 'Cancelled' });
        toast({ title: "Subscription Cancelled", variant: 'destructive' });
        setCancelAlertOpen(false);
    } catch(e) {
        console.error(e);
        toast({ title: "Error", description: "Could not cancel subscription.", variant: 'destructive' });
    }
  };
  
  const handleRefund = () => {
     toast({ title: "Payment Refunded", description: "This is a mock action." });
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (!subscription) {
    return <div className="text-center p-8">Subscription not found.</div>;
  }

  return (
    <>
      <div className="w-full space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/admin/subscriptions')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to all subscriptions
        </Button>
      
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl md:text-3xl font-bold">{subscription.email}</CardTitle>
                        <CardDescription>Subscription Details</CardDescription>
                    </div>
                     <div className="flex gap-2 flex-wrap">
                        {subscription.status === 'Active' && (
                            <Button variant="destructive" onClick={() => setCancelAlertOpen(true)}><XCircle/> Cancel Subscription</Button>
                        )}
                         <Button variant="outline" onClick={handleRefund}><RefreshCw/> Refund Last Payment</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="font-semibold">Status:</span>
                    {getStatusBadge(subscription.status)}
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Plan Information</h4>
                        <p><strong>Plan:</strong> {subscription.plan}</p>
                        <p><strong>Next Renewal:</strong> {subscription.status === 'Active' ? format((subscription.renewalDate as Timestamp).toDate(), 'PPP') : 'N/A'}</p>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Payment History</h4>
                        <p className="text-muted-foreground">Payment history is not available in this demo.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
       </div>
      
       <AlertDialog open={isCancelAlertOpen} onOpenChange={setCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will cancel the subscription for {subscription.email}. They will lose premium access at the end of the current billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} variant="destructive">
              Yes, Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
