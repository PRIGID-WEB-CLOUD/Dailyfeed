
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Sparkles, Loader2, ArrowLeft, Globe, Mail as MailIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generatePartnershipEmail } from '@/ai/flows/generate-partnership-email';
import type { Inquiry, InquiryStatus } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'New':
        return <Badge>New</Badge>;
      case 'Contacted':
        return <Badge variant="secondary">Contacted</Badge>;
      case 'Negotiating':
        return <Badge variant="outline">Negotiating</Badge>;
      case 'Closed':
        return <Badge>Closed</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
};

export default function PartnershipDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [inquirySnapshot, isLoading, error] = useDocument(doc(db, 'inquiries', id));
  const inquiry: Inquiry | null = inquirySnapshot?.exists() ? { id: inquirySnapshot.id, ...inquirySnapshot.data() } as Inquiry : null;
  
  const [action, setAction] = useState<InquiryStatus | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isLoading && !inquirySnapshot?.exists()) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load partnership inquiry.' });
          router.push('/admin/partnerships');
    }
    if (error) {
        toast({ variant: 'destructive', title: 'Error loading inquiry.', description: error.message });
    }
  }, [inquirySnapshot, isLoading, error, router, toast]);

  const handleStatusUpdate = async (status: InquiryStatus, silent = false) => {
    if (!inquiry) return;
    try {
        await updateDoc(doc(db, 'inquiries', inquiry.id), { status });
        if (!silent) {
            toast({
                title: "Status Updated",
                description: `Inquiry marked as ${status}.`
            });
        }
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    }
  };
  
  const openEmailDialog = (newStatus: 'Closed' | 'Rejected') => {
    setAction(newStatus);
    setSummary('');
    setEmailBody('');
    setIsEmailDialogOpen(true);
  };
  
  const handleGenerateEmail = async () => {
    if (!inquiry || !action || !summary) return;
    setIsGenerating(true);
    try {
      const result = await generatePartnershipEmail({
        blogName: 'Dailyfeed',
        companyName: inquiry.companyName,
        contactPerson: inquiry.contactPerson,
        summary: summary,
        status: action
      });
      setEmailBody(result.emailBody);
      toast({ title: 'Email draft generated!' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error generating email' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = () => {
    if (!inquiry || !action) return;

    handleStatusUpdate(action, true);
    
    toast({
      title: 'Email Sent!',
      description: `An email has been sent to ${inquiry.email}. (This is a demo)`,
    });
    
    setIsEmailDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (!inquiry) {
    return <div className="text-center p-8">Inquiry not found.</div>;
  }

  return (
    <>
      <div className="w-full space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/partnerships')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to all inquiries
        </Button>
      
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold">{inquiry.companyName}</CardTitle>
                        <CardDescription>Partnership inquiry details</CardDescription>
                    </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleStatusUpdate('Contacted')}>Mark as Contacted</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusUpdate('Negotiating')}>Mark as Negotiating</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEmailDialog('Closed')}>Mark as Closed</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => openEmailDialog('Rejected')}>Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="font-semibold">Status:</span>
                    {getStatusBadge(inquiry.status)}
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Contact Information</h4>
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span>{inquiry.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MailIcon className="h-5 w-5 text-muted-foreground" />
                             <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">{inquiry.email}</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                            <a href={inquiry.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {inquiry.website}
                            </a>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Message</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{inquiry.message}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
       </div>
      
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to {inquiry?.companyName}</DialogTitle>
            <DialogDescription>
              Summarize the outcome and generate an email to send to {inquiry?.contactPerson}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Summary of Outcome</Label>
              <Textarea 
                id="summary"
                placeholder="e.g., Offer was too low, not a good fit for our audience, etc."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
             <Button type="button" variant="outline" size="sm" onClick={handleGenerateEmail} disabled={isGenerating || !summary}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Email with AI
            </Button>
            <div className="space-y-2">
              <Label htmlFor="email-body">Email Body</Label>
              <Textarea
                id="email-body"
                className="min-h-[200px]"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSendEmail} disabled={!emailBody}>Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
