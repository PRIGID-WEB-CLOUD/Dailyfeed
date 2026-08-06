

'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon, Trash2, PlusCircle, LayoutGrid, GripVertical, Globe, AlertTriangle, Loader2, Smile, Twitter, Linkedin, Youtube, Instagram, Github } from 'lucide-react';
import type { BioLink, LinkInBioData, User } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePublicSubscription } from '@/hooks/use-public-subscription';


const iconMap: Record<string, { component: React.ReactNode; color: string }> = {
    Link: { component: <LinkIcon />, color: 'text-white' },
    Twitter: { component: <Twitter />, color: 'text-sky-400' },
    Linkedin: { component: <Linkedin />, color: 'text-blue-500' },
    Youtube: { component: <Youtube />, color: 'text-red-500' },
    Instagram: { component: <Instagram />, color: 'text-pink-500' },
    Github: { component: <Github />, color: 'text-gray-300' },
    Smile: { component: <Smile />, color: 'text-yellow-400' },
};


const iconNames = Object.keys(iconMap) as (keyof typeof iconMap)[];

const linkSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  links: z.array(linkSchema),
  layout: z.enum(['stack', 'grid', 'featured']),
  domain: z.string().optional(),
  domainStatus: z.enum(['unconfigured', 'pending', 'active', 'error']).optional(),
});

type LinkInBioFormValues = z.infer<typeof formSchema>;

const initialLinkInBioData: Omit<LinkInBioData, 'name'> = {
  description: 'Writer, designer, and tech enthusiast. Welcome to my corner of the internet.',
  links: [
    { id: '1', title: 'My Latest Blog Post', url: '#', icon: 'Link' },
    { id: '2', title: 'Follow me on Twitter', url: '#', icon: 'Twitter' },
  ],
  layout: 'stack',
  domain: '',
  domainStatus: 'unconfigured',
};

export function LinkInBioEditor() {
  const { toast } = useToast();
  const { user } = usePublicSubscription();
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<LinkInBioFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: user?.linkInBio || { ...initialLinkInBioData, name: user?.name || '' },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "links",
  });
  
  React.useEffect(() => {
    if (user) {
        form.reset(user.linkInBio || { ...initialLinkInBioData, name: user.name });
    }
  }, [user, form]);
  
  if (!user) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const onSubmit = async (formData: LinkInBioFormValues) => {
    const userRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userRef, { linkInBio: formData });
      toast({
        title: 'Link In Bio Page Updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save your changes.'});
    }
  };

  const handleDomainSave = async () => {
    const domain = form.getValues('domain');
    if (!domain) {
        toast({ variant: 'destructive', title: 'Domain cannot be empty.' });
        return;
    }
    const updatedLinkInBio = { ...user.linkInBio, domain, domainStatus: 'pending' as const };
    const userRef = doc(db, 'users', user.id);
    try {
        await updateDoc(userRef, { linkInBio: updatedLinkInBio });
        toast({
          title: 'Domain Saved',
          description: `Your custom domain "${domain}" is now pending verification.`,
        });
    } catch(e) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not save domain.'});
    }
  };

  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    toast({ title: 'Verification in Progress...', description: 'Checking your DNS records now.' });
    
    // Simulate an API call to verify DNS
    setTimeout(async () => {
        // In a real app, you'd check DNS records. Here we'll just succeed.
        const updatedLinkInBio = { ...user.linkInBio, domainStatus: 'active' as const };
        const userRef = doc(db, 'users', user.id);
        try {
            await updateDoc(userRef, { linkInBio: updatedLinkInBio });
            toast({ title: 'Domain Verified!', description: 'Your custom domain is now active.' });
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify domain.'});
        } finally {
             setIsVerifying(false);
        }
    }, 2000);
  };
  
  const handleDisconnectDomain = async () => {
    const disconnectedDomain = user.linkInBio?.domain;
    const updatedLinkInBio = { ...user.linkInBio, domain: '', domainStatus: 'unconfigured' as const };
    const userRef = doc(db, 'users', user.id);

    try {
        await updateDoc(userRef, { linkInBio: updatedLinkInBio });
        form.setValue('domain', '');
        toast({
          title: 'Domain Disconnected',
          description: `The domain "${disconnectedDomain}" has been disconnected.`,
          variant: 'destructive',
        });
    } catch (e) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not disconnect domain.'});
    }
  }
  
  const linkInBioData = user.linkInBio || initialLinkInBioData;

  const renderDomainContent = () => {
    switch (linkInBioData.domainStatus) {
      case 'active':
        return (
          <div className="space-y-4">
             <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-300">Domain Active</h4>
                <p className="text-sm text-green-700 dark:text-green-400">Your page is live at <a href={`https://${linkInBioData.domain}`} target="_blank" rel="noopener noreferrer" className="font-bold underline">{linkInBioData.domain}</a></p>
            </div>
            <Button type="button" variant="destructive" onClick={handleDisconnectDomain} className="w-full">Disconnect Domain</Button>
          </div>
        );
      case 'pending':
        return (
           <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <p>Status:</p>
                    <Badge variant="secondary">Pending Verification</Badge>
                </div>
                <Button type="button" size="sm" onClick={handleVerifyDomain} disabled={isVerifying}>
                    {isVerifying ? <Loader2 className="animate-spin" /> : 'Verify Now'}
                </Button>
            </div>
            <div className="flex flex-col items-start gap-4 text-sm text-muted-foreground border-t pt-6">
               <h4 className="font-semibold text-foreground">How to configure your domain:</h4>
                <div className="space-y-2">
                    <p>1. Go to your domain provider (e.g., Google Domains, GoDaddy).</p>
                    <p>2. Create a new CNAME record for <code className="p-1 bg-muted rounded-sm text-xs">{linkInBioData.domain}</code>.</p>
                    <p>3. Point it to this value: <code className="p-1 bg-muted rounded-sm text-xs">cname.dailyfeed.com</code></p>
                    <p>4. Save your changes. It may take some time to propagate.</p>
                </div>
            </div>
           </div>
        );
      default:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="links.yourdomain.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={handleDomainSave} className="w-full">Save Domain</Button>
          </div>
        );
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon /> Link In Bio Page</CardTitle>
                <CardDescription>Manage the content and appearance of your public links page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Profile Name</FormLabel>
                        <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bio / Description</FormLabel>
                        <FormControl><Textarea placeholder="A short bio about you..." {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Links</CardTitle>
                    <CardDescription>Add, remove, and reorder your links.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start p-4 border rounded-lg bg-muted/30">
                            <GripVertical className="h-8 w-8 text-muted-foreground mt-8 cursor-grab" />
                            <div className="flex-grow space-y-4">
                                <FormField
                                    control={form.control}
                                    name={`links.${index}.title`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Link Title</FormLabel>
                                            <FormControl><Input placeholder="My Awesome Project" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`links.${index}.url`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL</FormLabel>
                                                <FormControl><Input placeholder="https://example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`links.${index}.icon`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Icon</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select an icon" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {iconNames.map(iconName => (
                                                            <SelectItem key={iconName} value={iconName}>
                                                                <div className="flex items-center gap-2">
                                                                    {React.cloneElement((iconMap[iconName].component as React.ReactElement), { className: `h-4 w-4 ${iconMap[iconName].color}`})}
                                                                    {iconName}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive mt-6" onClick={() => remove(index)}>
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                     <Button type="button" variant="outline" onClick={() => append({ id: `link-${Date.now()}`, title: '', url: '', icon: 'Link' })}>
                        <PlusCircle className="mr-2" />
                        Add Link
                    </Button>
                </CardContent>
            </Card>

             <div className="sticky bottom-0 bg-background py-4 z-10">
                <Button type="submit">Save Changes</Button>
            </div>
        </div>
        <div className="space-y-6">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><LayoutGrid/> Layout</CardTitle>
                  <CardDescription>Choose a layout for your links page.</CardDescription>
              </CardHeader>
              <CardContent>
                  <FormField
                  control={form.control}
                  name="layout"
                  render={({ field }) => (
                      <FormItem className="space-y-3">
                      <FormControl>
                          <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                          >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="stack" /></FormControl>
                              <FormLabel className="font-normal">Stack</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="grid" /></FormControl>
                              <FormLabel className="font-normal">Grid</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="featured" /></FormControl>
                              <FormLabel className="font-normal">Featured</FormLabel>
                          </FormItem>
                          </RadioGroup>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe /> Custom Domain</CardTitle>
                <CardDescription>Connect your own domain to your links page.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderDomainContent()}
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
