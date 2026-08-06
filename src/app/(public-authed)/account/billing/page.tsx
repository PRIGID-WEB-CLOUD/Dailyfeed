
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Trash2, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { collection, query, where, doc, updateDoc, deleteDoc, Timestamp, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subscription, Invoice, User } from '@/lib/types';
import { format } from 'date-fns';
import { StripeProvider } from '@/components/stripe-provider';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useSettings } from '@/contexts/settings-context';

interface PaymentMethod {
  cardType: string;
  last4: string;
  expires: string;
}

function UpdatePaymentForm({ onCancel }: { onCancel: () => void }) {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsUpdating(true);
    // This is where you would call stripe.createPaymentMethod and update your backend
    // For now, we simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUpdating(false);

    toast({
        title: 'Payment Method Updated (Demo)',
        description: 'Your payment details have been successfully updated.',
    });
    onCancel();
  };

  return (
    <form onSubmit={handleUpdatePayment}>
      <DialogHeader>
        <DialogTitle>Update Payment Method</DialogTitle>
        <DialogDescription>
          Enter your new card details below.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
          <div className="p-3 border rounded-md">
            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
          </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isUpdating || !stripe}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Card
        </Button>
      </DialogFooter>
    </form>
  )
}

function BillingPageContent() {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = usePublicSubscription();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(true);

  // Manual fetching to avoid hook issues
  useEffect(() => {
    if (user?.id) {
      const fetchBillingData = async () => {
        try {
          // Fetch subscription
          const subRef = doc(db, 'subscriptions', user.id);
          const docSnap = await getDoc(subRef);
          if (docSnap.exists()) {
            setUserSubscription({ id: docSnap.id, ...docSnap.data() } as Subscription);
          }
        } catch (e) {
          console.error("Failed to fetch subscription:", e);
        } finally {
            setIsSubscriptionLoading(false);
        }

        try {
            // Fetch invoices
            const invQuery = query(collection(db, 'invoices'), where('userId', '==', user.id));
            const querySnapshot = await getDocs(invQuery);
            setInvoices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
        } catch(e) {
            console.error("Failed to fetch invoices:", e);
        } finally {
            setIsInvoicesLoading(false);
        }
      }
      fetchBillingData();
    } else if (!isUserLoading) {
        setIsSubscriptionLoading(false);
        setIsInvoicesLoading(false);
    }
  }, [user, isUserLoading]);
  
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    // Mock payment method for now as we don't have a real payment provider
    if (userSubscription) {
      setPaymentMethod({
        cardType: 'Visa',
        last4: '4242',
        expires: '12/26',
      });
    }
  }, [userSubscription]);

  const handleCancelSubscription = async () => {
    if (!userSubscription) return;
    try {
        await updateDoc(doc(db, 'subscriptions', userSubscription.id), { status: 'Cancelled' });
        // Optimistically update local state
        setUserSubscription(prev => prev ? {...prev, status: 'Cancelled'} : null);
        setIsCancelAlertOpen(false);
        toast({
          title: 'Subscription Cancelled',
          description: 'Your Premium Monthly Plan has been cancelled.',
          variant: 'destructive',
        });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel your subscription.' });
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: 'Downloading Invoice...',
      description: `Your invoice ${invoiceId} is being downloaded. (This is a demo)`,
    });
  };

  const handleDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        await deleteDoc(doc(db, 'invoices', invoiceToDelete));
        // Optimistically update local state
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete));
        toast({
          title: 'Invoice Deleted',
          description: `Invoice ${invoiceToDelete.substring(0, 8)} has been removed.`,
          variant: 'destructive',
        });
      } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete invoice.' });
      } finally {
        setInvoiceToDelete(null);
      }
    }
  };
  
  const isLoading = isUserLoading || isSubscriptionLoading || isInvoicesLoading || isSettingsLoading;
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const isPaymentConfigured = settings.paywall.enabled && settings.paywall.paymentProvider && settings.paywall.paymentProvider !== 'none';

  return (
    <>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" asChild>
            <Link href="/account">&larr; Back to My Account</Link>
          </Button>
          <h1 className="text-4xl font-bold font-headline mt-4">Billing</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {userSubscription && userSubscription.status === 'Active' ? (
              <>
                <div>
                  <h4 className="font-semibold">{userSubscription.plan}</h4>
                  <p className="text-muted-foreground text-sm">You are billed $10.00 per month.</p>
                </div>
                <Button variant="outline" onClick={() => setIsCancelAlertOpen(true)}>Cancel Subscription</Button>
              </>
            ) : (
                 <div>
                  <h4 className="font-semibold text-destructive">No Active Subscription</h4>
                  <p className="text-muted-foreground text-sm">You are not currently subscribed to a premium plan.</p>
                </div>
            )}
          </CardContent>
        </Card>

        {isPaymentConfigured && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {paymentMethod && userSubscription?.status === 'Active' ? (
                <>
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold">{paymentMethod.cardType} ending in {paymentMethod.last4}</h4>
                      <p className="text-muted-foreground text-sm">Expires {paymentMethod.expires}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setIsUpdatePaymentOpen(true)}>Update Payment Method</Button>
                </>
              ) : (
                <p className="text-muted-foreground">No payment method on file.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and download your past invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id.substring(0, 8)}</TableCell>
                    <TableCell>{format((invoice.date as unknown as Timestamp).toDate(), 'PPP')}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Pending' ? 'outline' : 'destructive'}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice.id)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download invoice</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setInvoiceToDelete(invoice.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete invoice</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {invoices.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No invoice history.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your Premium Monthly Plan. You will lose access to premium content at the end of your current billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} variant="destructive">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={isUpdatePaymentOpen} onOpenChange={setIsUpdatePaymentOpen}>
        <DialogContent>
          <UpdatePaymentForm onCancel={() => setIsUpdatePaymentOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove invoice {invoiceToDelete?.substring(0,8)} from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


export default function BillingPage() {
  return (
    <StripeProvider>
      <BillingPageContent />
    </StripeProvider>
  )
}
