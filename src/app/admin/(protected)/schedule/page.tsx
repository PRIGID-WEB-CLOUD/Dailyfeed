
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { format } from 'date-fns';

import { autoScheduleBlogPosts } from '@/ai/flows/auto-schedule-blog-posts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const scheduleSchema = z.object({
  postId: z.string().min(1, 'Please select a post to schedule.'),
  targetAudience: z.string().min(10, 'Please describe your target audience.'),
  historicalEngagementData: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const engagementPlaceholder = JSON.stringify(
  {
    "peak_days": ["Tuesday", "Thursday"],
    "peak_hours_utc": [14, 19],
    "topic_performance": { "Technology": 0.8, "Design": 0.6 }
  },
  null,
  2
);

export default function SchedulePage() {
  const { toast } = useToast();
  
  const [postsSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
  );
  
  const allPosts: Post[] = useMemo(() => {
    if (!postsSnapshot) return [];
    return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  }, [postsSnapshot]);

  const draftPosts = useMemo(() => allPosts.filter(p => p.status === 'draft'), [allPosts]);
  const scheduledPosts = useMemo(() => {
    return allPosts
      .filter(p => p.status === 'scheduled' && p.publishedAt && (p.publishedAt as unknown as Timestamp).toDate() > new Date())
      .sort((a, b) => (a.publishedAt as unknown as Timestamp).toMillis() - (b.publishedAt as unknown as Timestamp).toMillis());
  }, [allPosts]);

  const [isScheduling, setIsScheduling] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState<Date | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error loading posts', description: error.message });
    }
  }, [error, toast]);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      postId: '',
      targetAudience: '',
      historicalEngagementData: engagementPlaceholder,
    },
  });

  const handleAutoSchedule = async (data: ScheduleFormValues) => {
    setIsScheduling(true);
    setSuggestedDate(null);
    setReasoning('');

    const post = allPosts.find(p => p.id === data.postId);
    if (!post) {
      toast({ variant: 'destructive', title: 'Post not found' });
      setIsScheduling(false);
      return;
    }

    try {
      const result = await autoScheduleBlogPosts({
        blogPostContent: post.content,
        targetAudience: data.targetAudience,
        historicalEngagementData: data.historicalEngagementData || '',
       });
      const scheduledDate = new Date(result.suggestedSchedule);
      setSuggestedDate(scheduledDate);
      setReasoning(result.reasoning);
      setDate(scheduledDate);
      toast({
        title: 'Schedule Suggested!',
        description: `AI suggests publishing on ${format(scheduledDate, 'PPP p')}.`,
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error generating schedule' });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAcceptSchedule = async () => {
    const postId = form.getValues('postId');
    if (!suggestedDate || !postId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No valid post or date to schedule.' });
      return;
    }
    
    setIsAccepting(true);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        status: 'Scheduled',
        publishedAt: Timestamp.fromDate(suggestedDate),
      });
      toast({ title: 'Post Scheduled!', description: 'The post is now scheduled for publication.' });
      // Reset form and suggestions
      form.reset();
      setSuggestedDate(null);
      setReasoning('');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not schedule the post.' });
    } finally {
      setIsAccepting(false);
    }
  };


  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wand2 />
              <CardTitle>AI Content Scheduler</CardTitle>
            </div>
            <CardDescription>
              Let AI find the optimal time to publish your next blog post for maximum reach.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAutoSchedule)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="postId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Draft Post to Schedule</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoading ? "Loading drafts..." : "Select a draft post"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {draftPosts.map(post => (
                            <SelectItem key={post.id} value={post.id}>
                              {post.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web developers, design students, remote workers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="historicalEngagementData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historical Engagement Data (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="font-mono text-xs min-h-[120px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isScheduling}>
                  {isScheduling ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  Generate Schedule
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {reasoning && (
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedDate && (
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="font-semibold text-lg">
                    Suggested Date: {format(suggestedDate, "EEEE, MMMM do, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-2">Reasoning:</h4>
                <p className="text-muted-foreground">{reasoning}</p>
              </div>
              <Button onClick={handleAcceptSchedule} disabled={isAccepting}>
                {isAccepting ? <Loader2 className="animate-spin mr-2"/> : null}
                Accept & Schedule Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{ scheduled: scheduledPosts.map(p => (p.publishedAt as unknown as Timestamp).toDate()) }}
              modifiersStyles={{ scheduled: { 
                borderColor: 'hsl(var(--primary))', 
                borderWidth: '2px',
                borderRadius: 'var(--radius)'
               } }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-24">
                      <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : scheduledPosts.length > 0 ? scheduledPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-right">
                      {post.publishedAt ? format((post.publishedAt as unknown as Timestamp).toDate(), 'MMM d') : 'N/A'}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No upcoming posts.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
