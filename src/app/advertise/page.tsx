
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createFolder } from '@/lib/media-service';

import { PublicPage } from '@/components/blog/public-page';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import slugify from 'slugify';

const advertiseSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  contactPerson: z.string().min(2, 'Contact person is required.'),
  email: z.string().email('Please enter a valid email.'),
  website: z.string().url('Please enter a valid website URL.'),
  message: z.string().min(20, 'Please provide a brief message about your campaign.'),
});

type AdvertiseFormValues = z.infer<typeof advertiseSchema>;

export default function AdvertisePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdvertiseFormValues>({
    resolver: zodResolver(advertiseSchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      email: '',
      website: '',
      message: '',
    },
  });

  const onSubmit = async (data: AdvertiseFormValues) => {
    setIsSubmitting(true);
    try {
      // Create the inquiry document
      await addDoc(collection(db, 'inquiries'), {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        website: data.website,
        message: data.message,
        status: 'New',
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Partnership Request Sent!',
        description: 'Thank you for your interest. We will review your request and get back to you soon.',
      });
      form.reset();
      router.push('/');
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was an error submitting your request. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPage title="Advertise With Us">
        <p className="text-center">
            Interested in promoting your brand, product, or service to our engaged audience? Fill out the form below to get in touch with our partnerships team.
        </p>
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>Partnership Inquiry</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Creative Inc." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl><Input placeholder="e.g., Alex Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl><Input type="email" placeholder="alex.doe@creative.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Website</FormLabel>
                                        <FormControl><Input type="url" placeholder="https://creative.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[120px]" placeholder="Tell us about your product and what you'd like to promote..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </PublicPage>
  );
}
