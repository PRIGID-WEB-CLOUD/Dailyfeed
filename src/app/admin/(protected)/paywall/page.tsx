
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Check, X } from 'lucide-react';
import type { Post } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSettings } from '@/contexts/settings-context';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const paywallSchema = z.object({
  enabled: z.boolean().default(false),
  freeArticlesCount: z.coerce.number().min(0, 'Must be a non-negative number.').default(3),
  paywallMessageTitle: z.string().min(5, 'Title must be at least 5 characters.').default('Unlock Premium Content'),
  paywallMessageBody: z.string().min(10, 'Body must be at least 10 characters.').default('You have reached your limit of free articles. Subscribe for unlimited access.'),
  paymentProvider: z.string().min(1, 'Please select a payment provider.'),
  premiumArticles: z.array(z.string()).default([]),
});

type PaywallFormValues = z.infer<typeof paywallSchema>;

export default function PaywallPage() {
  const { toast } = useToast();
  const { settings, setSettings, isLoading: isSettingsLoading } = useSettings();
  
  const [postsSnapshot, isPostsLoading] = useCollection(
    query(collection(db, 'posts'), orderBy('publishedAt', 'desc'))
  );

  const allPosts: Post[] = useMemo(() => {
    if (!postsSnapshot) return [];
    return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  }, [postsSnapshot]);
  

  const form = useForm<PaywallFormValues>({
    resolver: zodResolver(paywallSchema),
    defaultValues: {
      enabled: false,
      freeArticlesCount: 3,
      premiumArticles: [],
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings.paywall);
    }
  }, [form, settings]);

  const onSubmit = (data: PaywallFormValues) => {
    if (!settings) return;
    const updatedSettings = { ...settings, paywall: data };
    setSettings(updatedSettings);
    toast({
      title: 'Paywall Settings Saved',
      description: 'Your content paywall settings have been successfully updated.',
    });
  };

  const premiumArticles = form.watch('premiumArticles');
  const isPaywallEnabled = form.watch('enabled');

  const toggleArticle = (postId: string) => {
    const currentSelection = form.getValues('premiumArticles');
    const newSelection = currentSelection.includes(postId)
      ? currentSelection.filter((id) => id !== postId)
      : [...currentSelection, postId];
    form.setValue('premiumArticles', newSelection, { shouldDirty: true });
  };
  
  const isLoading = isSettingsLoading || isPostsLoading;
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock />
              <CardTitle>Content Paywall</CardTitle>
            </div>
            <CardDescription>
              Configure rules to restrict access to premium content and prompt users to subscribe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Paywall</FormLabel>
                    <FormDescription>Turn the content paywall on or off for non-subscribers.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {isPaywallEnabled && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Paywall Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 border-t">
                        <FormField
                            control={form.control}
                            name="freeArticlesCount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Free Articles Per Month</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormDescription>The number of free articles a visitor can read per month before seeing the paywall.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name="premiumArticles"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Premium Articles</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                      Select articles to mark as premium...
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                  <Command>
                                    <CommandInput placeholder="Search articles..." />
                                    <CommandList>
                                      <CommandEmpty>No articles found.</CommandEmpty>
                                      <CommandGroup>
                                        {allPosts.map((post) => (
                                          <CommandItem
                                            key={post.id}
                                            value={post.title}
                                            onSelect={() => toggleArticle(post.id)}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", premiumArticles.includes(post.id) ? "opacity-100" : "opacity-0")} />
                                            {post.title}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormDescription>These articles will always be behind the paywall for non-subscribers.</FormDescription>
                              {premiumArticles.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex flex-wrap gap-2">
                                        {premiumArticles.map(postId => {
                                        const post = allPosts.find(p => p.id === postId);
                                        if (!post) return null;
                                        return (
                                            <Badge key={postId} variant="secondary" className="flex items-center gap-2">
                                            {post.title}
                                            <button onClick={() => toggleArticle(postId)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                <X className="h-3 w-3"/>
                                            </button>
                                            </Badge>
                                        );
                                        })}
                                    </div>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Paywall Message</CardTitle>
                        <CardDescription>Customize the message that appears when the paywall is triggered.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="paywallMessageTitle"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Message Title</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="paywallMessageBody"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Message Body</FormLabel>
                                <FormControl><Textarea {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Provider</CardTitle>
                        <CardDescription>Select a payment provider to handle subscriptions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={form.control}
                            name="paymentProvider"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Provider</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a payment provider" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent position="popper">
                                        <SelectItem value="stripe">Stripe</SelectItem>
                                        <SelectItem value="paystack">Paystack</SelectItem>
                                        <SelectItem value="paypal" disabled>PayPal (coming soon)</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <FormDescription>Manage payment provider in <Link href="/admin/monetization/payments" className="underline">Payment Providers</Link>.</FormDescription>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Paywall Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
