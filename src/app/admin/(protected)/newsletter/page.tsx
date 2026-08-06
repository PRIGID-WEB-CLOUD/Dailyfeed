

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Sparkles, Send, History } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateNewsletterSubject } from '@/ai/flows/generate-newsletter-subject';
import { generateNewsletterContent } from '@/ai/flows/generate-newsletter-content';
import { sendNewsletter } from '@/ai/flows/send-newsletter';
import { format } from 'date-fns';
import type { Subscriber, Post } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSettings } from '@/contexts/settings-context';

const newsletterSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  topic: z.string().min(10, 'Topic must be at least 10 characters.'),
  content: z.string().min(20, 'Content must be at least 20 characters.'),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

interface PastCampaign {
    id: string;
    subject: string;
    sentAt: Date;
    recipients: number;
    openRate: number;
}

export default function NewsletterPage() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [subscribersSnapshot, isSubscribersLoading, subscribersError] = useCollection(
    query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'))
  );
  const [postsSnapshot, isPostsLoading, postsError] = useCollection(
    query(collection(db, 'posts'), where('status', '==', 'Published'), orderBy('publishedAt', 'desc'))
  );
  
  const subscribers: Subscriber[] = useMemo(() => {
    if (!subscribersSnapshot) return [];
    return subscribersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      subscribedAt: (doc.data().subscribedAt as Timestamp),
    }))
  }, [subscribersSnapshot]);

  const pastCampaigns: PastCampaign[] = useMemo(() => {
    if (!postsSnapshot || subscribers.length === 0) return [];
    return postsSnapshot.docs.slice(0, 3).map((doc, index) => {
        const post = doc.data() as Post;
        return {
            id: doc.id,
            subject: `Newsletter: ${post.title}`,
            sentAt: (post.publishedAt as unknown as Timestamp).toDate(),
            recipients: subscribers.length - (index * 15), // Simulate slight change in subscribers
            openRate: 0.35 + (Math.random() * 0.1) // Simulate open rate between 35-45%
        }
    })
  }, [postsSnapshot, subscribers]);

  useEffect(() => {
    if (subscribersError || postsError) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load newsletter data.' });
    }
  }, [subscribersError, postsError, toast]);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { subject: '', topic: '', content: '' },
  });

  const handleGenerateSubject = async () => {
    const topic = form.getValues('topic');
    if (!topic) {
      form.setError('topic', { message: 'Please provide a topic first.' });
      return;
    }
    setIsGeneratingSubject(true);
    try {
      const result = await generateNewsletterSubject({ topic });
      form.setValue('subject', result.subject);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error generating subject' });
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const handleGenerateContent = async () => {
    const topic = form.getValues('topic');
    const subject = form.getValues('subject');
    if (!topic) {
      form.setError('topic', { message: 'Please provide a topic first.' });
      return;
    }
    setIsGeneratingContent(true);
    try {
      const result = await generateNewsletterContent({ topic, subject, blogName: settings.site.blogName });
      form.setValue('content', result.content);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error generating content' });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsSending(true);
    try {
      const result = await sendNewsletter({
        subject: data.subject,
        content: data.content,
        subscribers: subscribers.map(s => s.email),
      });

      if (result.success) {
        toast({ title: 'Newsletter Sent! (Simulated)', description: result.message });
        form.reset();
      } else {
        toast({ variant: 'destructive', title: 'Sending Failed', description: result.message });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An Error Occurred', description: 'Could not send the newsletter.' });
    } finally {
      setIsSending(false);
    }
  };

  const isLoading = isSubscribersLoading || isPostsLoading;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="md:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail />
                  <CardTitle>Newsletter Composer</CardTitle>
                </div>
                <CardDescription>
                  Create and send a newsletter to all your subscribers. Use AI to assist with content creation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic / Main Idea</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A recap of this week's posts about AI in design." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                       <div className="flex items-center gap-2">
                        <FormControl>
                            <Input placeholder="Your catchy subject line" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={handleGenerateSubject} disabled={isGeneratingSubject}>
                          {isGeneratingSubject ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex items-center justify-between">
                        <FormLabel>Content</FormLabel>
                         <Button type="button" variant="outline" size="sm" onClick={handleGenerateContent} disabled={isGeneratingContent}>
                          {isGeneratingContent ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2" />}
                          Generate with AI
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea className="min-h-[300px]" placeholder="Write your newsletter here..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                 <Button type="submit" disabled={isSending || isLoading}>
                  {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                  Send to {subscribers.length} subscribers
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>

       <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History />
            <CardTitle>Past Campaigns</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="animate-spin"/></div>
          ) : pastCampaigns.length > 0 ? (
            pastCampaigns.map(campaign => (
                <div key={campaign.id} className="p-3 border rounded-lg">
                <p className="font-semibold truncate">{campaign.subject}</p>
                <p className="text-sm text-muted-foreground">{format(campaign.sentAt, 'MMM d, yyyy')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {campaign.recipients.toLocaleString()} recipients &middot; {(campaign.openRate * 100).toFixed(1)}% open rate
                </p>
                </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground p-4">No past campaigns found.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
