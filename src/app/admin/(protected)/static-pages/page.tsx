
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, StickyNote, PlusCircle, Trash2 } from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';


const socialLinkSchema = z.object({
    platform: z.string(),
    url: z.string().url("Please enter a valid URL."),
});

const staticPagesSchema = z.object({
  about: z.string().min(10, 'About content is too short.'),
  contact: z.string().min(10, 'Contact content is too short.'),
  terms: z.string().min(10, 'Terms content is too short.'),
  privacy: z.string().min(10, 'Privacy content is too short.'),
  socialLinks: z.array(socialLinkSchema),
});

type StaticPagesFormValues = z.infer<typeof staticPagesSchema>;

export default function StaticPagesPage() {
  const { toast } = useToast();
  const { settings, setSettings, isLoading } = useSettings();

  const form = useForm<StaticPagesFormValues>({
    resolver: zodResolver(staticPagesSchema),
    defaultValues: {
      about: '',
      contact: '',
      terms: '',
      privacy: '',
      socialLinks: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialLinks"
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings.staticPages);
    }
  }, [form, settings]);

  const onSubmit = async (data: StaticPagesFormValues) => {
    if (!settings) return;
    try {
        await setSettings({ ...settings, staticPages: data });
        toast({
        title: 'Static Pages Updated',
        description: 'The content for your static pages has been saved.',
        });
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error Saving Settings',
        });
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StickyNote />
              <CardTitle>Static Pages & Footer</CardTitle>
            </div>
            <CardDescription>
              Edit the content for your static pages and manage footer links.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Accordion type="multiple" className="w-full" defaultValue={['social']}>
              <AccordionItem value="about">
                <AccordionTrigger>About Us Page</AccordionTrigger>
                <AccordionContent>
                   <FormField
                        control={form.control}
                        name="about"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <Textarea className="min-h-[200px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="contact">
                <AccordionTrigger>Contact Page</AccordionTrigger>
                <AccordionContent>
                    <FormField
                        control={form.control}
                        name="contact"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <Textarea className="min-h-[200px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="terms">
                <AccordionTrigger>Terms of Service Page</AccordionTrigger>
                <AccordionContent>
                     <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <Textarea className="min-h-[200px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy">
                <AccordionTrigger>Privacy Policy Page</AccordionTrigger>
                <AccordionContent>
                    <FormField
                        control={form.control}
                        name="privacy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <Textarea className="min-h-[200px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="social">
                <AccordionTrigger>Footer Social Links</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                             <div key={field.id} className="flex flex-col items-stretch gap-2 rounded-lg border bg-muted/50 p-4 sm:flex-row sm:items-end">
                                <FormField
                                    control={form.control}
                                    name={`socialLinks.${index}.platform`}
                                    render={({ field }) => (
                                        <FormItem className="w-1/3">
                                            <FormLabel>Platform</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Twitter" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`socialLinks.${index}.url`}
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://twitter.com/yourhandle" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ platform: '', url: ''})}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Social Link
                        </Button>
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Save All Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
