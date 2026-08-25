

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Globe, FileText, Share2, Loader2 } from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';
import type { AppSettings } from '@/lib/types';


const seoSchema = z.object({
  seoTitleTemplate: z.string().min(1, 'Title template is required.'),
  defaultMetaDescription: z.string().min(1, 'Default description is required.'),
  defaultSocialImage: z.string().url('Must be a valid URL.').or(z.literal('')),
  generateSitemap: z.boolean(),
  discourageSearchEngines: z.boolean(),
});

type SeoFormValues = z.infer<typeof seoSchema>;

export default function SeoPage() {
  const { toast } = useToast();
  const { settings, setSettings, isLoading } = useSettings();

  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: settings?.seo,
  });
  
  useEffect(() => {
    if (settings) {
      form.reset(settings.seo)
    }
  }, [settings, form]);
  

  const onSubmit = async (data: SeoFormValues) => {
    if (!settings) return;
    try {
        await setSettings({ ...settings, seo: data });
        toast({
            title: 'SEO Settings Saved',
            description: 'Your SEO settings have been successfully updated.',
        });
    } catch(e) {
        console.error(e);
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
                <Globe />
                <CardTitle>Global SEO Settings</CardTitle>
              </div>
            <CardDescription>
              Manage default SEO settings for your entire blog. These can be overridden on a per-post basis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <FormField
                control={form.control}
                name="seoTitleTemplate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Site Title Template</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormDescription>Use %post_title% as a placeholder for the individual post's title.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="defaultMetaDescription"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Default Meta Description</FormLabel>
                    <FormControl><Textarea placeholder="A short, compelling description of your blog." {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 />
              <CardTitle>OpenGraph & Social Sharing</CardTitle>
            </div>
            <CardDescription>
              Customize how your content appears when shared on social media platforms like Facebook, Twitter, and LinkedIn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
                control={form.control}
                name="defaultSocialImage"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Default Social Share Image URL</FormLabel>
                    <FormControl><Input placeholder="https://your-domain.com/default-social-image.png" {...field} /></FormControl>
                    <FormDescription>This image will be used if a post doesn't have its own featured image. Recommended size: 1200x630px.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText />
              <CardTitle>Sitemap & Robots.txt</CardTitle>
            </div>
            <CardDescription>
              Manage how search engines crawl and index your site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="generateSitemap"
              render={({ field }) => (
                 <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="font-medium">
                      Auto-generate sitemap.xml
                    </FormLabel>
                    <FormDescription>Keep your sitemap updated automatically.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="discourageSearchEngines"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="font-medium">
                      Discourage search engines from indexing this site
                    </FormLabel>
                    <FormDescription>This will update your `robots.txt` file.</FormDescription>
                  </div>
                   <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save All Settings
            </Button>
          </CardFooter>
        </Card>

      </form>
    </Form>
  );
}
