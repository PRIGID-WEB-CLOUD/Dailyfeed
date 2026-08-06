
'use client';

import { useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings as SettingsIcon, Palette, Megaphone } from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';
import type { AppSettings } from '@/lib/initial-settings';

// Create a single comprehensive schema for all settings
const settingsSchema = z.object({
  site: z.object({
    blogName: z.string().min(1, 'Blog name is required.'),
    blogDescription: z.string().min(1, 'Blog description is required.'),
    blogUrl: z.string().url('Please enter a valid URL.'),
  }),
  appearance: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    accentColor: z.string(),
    headlineFont: z.string(),
    bodyFont: z.string(),
  }),
  banner: z.object({
    headline: z.string().min(1, 'Headline is required.'),
    collapsedText: z.string(),
    expandedText: z.string(),
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings, isLoading } = useSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site: settings.site,
      appearance: settings.appearance,
      banner: settings.banner,
    },
  });
  
  // When settings are loaded from context, reset the form with those values.
  useEffect(() => {
    if (settings) {
      form.reset({
        site: settings.site,
        appearance: settings.appearance,
        banner: settings.banner,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    // Combine the form data with other settings that are not on this page
    const fullSettings: AppSettings = {
        ...settings,
        ...data,
    };
    try {
      await setSettings(fullSettings);
      toast({
        title: 'Settings Saved',
        description: 'Your blog settings have been successfully updated.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Settings',
        description: 'There was a problem saving your settings. Please try again.',
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon />
                <CardTitle>Site Settings</CardTitle>
              </div>
              <CardDescription>
                Manage your blog's name, description, and URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="site.blogName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blog Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="site.blogDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blog Description</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="site.blogUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blog URL</FormLabel>
                    <FormControl><Input type="url" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <div className="flex items-center gap-2">
                <Megaphone />
                <CardTitle>Announcement Banner</CardTitle>
              </div>
              <CardDescription>
                Manage the content of the expandable banner at the top of your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="banner.headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Headline</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                     <FormDescription>e.g., "🎉 Welcome to the new Dailyfeed!"</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="banner.collapsedText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collapsed Text</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                     <FormDescription>The short text shown when the banner is collapsed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="banner.expandedText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expanded Text</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                     <FormDescription>The full text shown when the banner is expanded.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize your blog's color scheme and fonts. (Note: These fields are placeholders and do not yet affect the site's theme).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="appearance.primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl><Input {...field} disabled /></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="appearance.backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <FormControl><Input {...field} disabled /></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="appearance.accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <FormControl><Input {...field} disabled /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
             <CardFooter>
               <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save All Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}
