
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import slugify from 'slugify';
import { format } from 'date-fns';

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
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import {
  Sparkles,
  ImageIcon,
  Settings,
  Eye,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  Loader2,
  Save,
  Send,
  Clock,
  Star,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

import type { Post } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { generateBlogTitle } from '@/ai/flows/generate-blog-title';
import { generateBlogContent } from '@/ai/flows/generate-blog-content';
import { suggestKeywordsForSEO } from '@/ai/flows/suggest-keywords-for-seo';
import { suggestCategoryForPost } from '@/ai/flows/suggest-category-for-post';
import { generateSeoSuggestions } from '@/ai/flows/generate-seo-suggestions';
import { TiptapEditor } from './tiptap-editor';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addCategory } from '@/lib/category-service';

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters.'),
  content: z.string().min(20, 'Content must be at least 20 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  imageUrl: z.string().min(1, 'Please select a featured image.'),
  imageHint: z.string().optional(),
  tags: z.array(z.string()),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featured: z.boolean().default(false),
  premium: z.boolean().default(false),
  views: z.number().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostEditorProps {
  post?: Post;
  onSave: (
    data: PostFormValues,
    status: 'published' | 'draft'
  ) => void;
  onDelete?: () => void;
}

export function PostEditor({ post, onSave, onDelete }: PostEditorProps) {
  const { toast } = useToast();

  const [categoriesSnapshot, isCategoriesLoading] = useCollection(
    query(collection(db, 'categories'), orderBy('name', 'asc'))
  );
  const categories = categoriesSnapshot?.docs.map(doc => doc.data().name as string) || [];

  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      content: post?.content || '',
      category: post?.category || '',
      imageUrl: post?.imageUrl || '',
      imageHint: post?.imageHint || '',
      tags: post?.tags || [],
      seoTitle: post?.seo?.title || '',
      seoDescription: post?.seo?.metaDescription || '',
      featured: post?.featured || false,
      premium: post?.premium || false,
      views: post?.views || 0,
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        imageHint: post.imageHint,
        tags: post.tags,
        seoTitle: post.seo?.title,
        seoDescription: post.seo?.metaDescription,
        featured: post.featured,
        premium: post.premium,
        views: post.views || 0,
      });
    }
  }, [post, form]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('title', e.target.value);
    const slug = slugify(e.target.value, { lower: true, strict: true });
    form.setValue('slug', slug);
  };
  
  const handleGenerateTitle = async () => {
    const content = form.getValues('content');
    if (!content) {
      toast({ variant: 'destructive', title: 'Content is empty', description: 'Please write some content first to generate a title.' });
      return;
    }
    setIsGeneratingTitle(true);
    try {
      const result = await generateBlogTitle({ topic: content.substring(0, 200) });
      form.setValue('title', result.title);
      form.setValue('slug', slugify(result.title, { lower: true, strict: true }));
      toast({ title: 'Title generated!', description: 'A new title has been created based on your content.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error generating title' });
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleGenerateContent = async () => {
    const title = form.getValues('title');
    if (!title) {
        form.setError('title', { message: 'Please enter a title before generating content.' });
        return;
    }

    setIsGeneratingContent(true);
    try {
        const result = await generateBlogContent({ topic: title });
        form.setValue('content', result.content, { shouldValidate: true });
        toast({ title: 'Content generated!', description: 'The AI has drafted the blog post content.' });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error generating content' });
    } finally {
        setIsGeneratingContent(false);
    }
  };

  const handleGenerateSeo = async () => {
    const content = form.getValues('content');
    if (!content) {
      toast({ variant: 'destructive', title: 'Content is empty', description: 'Please write some content first to generate SEO suggestions.' });
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const result = await generateSeoSuggestions({
        blogPostContent: content,
        keywords: form.getValues('tags').join(', '),
      });
      form.setValue('seoTitle', result.titleSuggestion);
      form.setValue('seoDescription', result.metaDescriptionSuggestion);
      toast({ title: 'SEO Suggestions Generated!', description: 'The AI has created a title and meta description for you.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error generating SEO' });
    } finally {
      setIsGeneratingSeo(false);
    }
  };
  
  const handleGenerateKeywords = async () => {
    const content = form.getValues('content');
    if (!content) {
      toast({ variant: 'destructive', title: 'Content is empty', description: 'Please write some content first to suggest keywords.' });
      return;
    }
    setIsGeneratingKeywords(true);
    try {
        const result = await suggestKeywordsForSEO({ content });
        const newTags = [...new Set([...form.getValues('tags'), ...result.keywords])];
        form.setValue('tags', newTags);
        toast({ title: 'Keywords Suggested!', description: 'New keywords have been added.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error generating keywords' });
    } finally {
        setIsGeneratingKeywords(false);
    }
  }

  const handleGenerateCategory = async () => {
    const content = form.getValues('content');
    if (!content) {
        toast({ variant: 'destructive', title: 'Content is empty', description: 'Please write some content first to suggest a category.' });
        return;
    }
    setIsGeneratingCategory(true);
    try {
        const result = await suggestCategoryForPost({ postContent: content, availableCategories: categories });
        // Check if the suggested category exists, otherwise create it
        const suggestedCategory = result.category;
        const categoryExists = categories.some(c => c.toLowerCase() === suggestedCategory.toLowerCase());

        if (categoryExists) {
            form.setValue('category', suggestedCategory, { shouldValidate: true });
        } else {
            await handleCreateCategory(suggestedCategory);
        }
        toast({ title: 'Category Suggested!', description: `AI recommended the category: "${suggestedCategory}".` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error generating category' });
    } finally {
        setIsGeneratingCategory(false);
    }
  }


  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagInput = e.currentTarget;
      const newTag = tagInput.value.trim();
      if (newTag && !form.getValues('tags').includes(newTag)) {
        form.setValue('tags', [...form.getValues('tags'), newTag]);
      }
      tagInput.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', form.getValues('tags').filter(tag => tag !== tagToRemove));
  };
  
  const handleSaveClick = (status: 'published' | 'draft') => {
    form.handleSubmit((data) => onSave(data, status))();
  };
  
  const handleCreateCategory = async (categoryName: string) => {
    if (!categories.find(c => c.toLowerCase() === categoryName.toLowerCase())) {
        try {
            await addCategory(categoryName);
            form.setValue('category', categoryName, { shouldValidate: true });
            toast({ title: `Category "${categoryName}" created!` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error creating category.' });
        }
    }
  };

  const MediaDialog = () => (
    <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>Select a featured image for your post.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto p-4">
          {PlaceHolderImages.map((image) => (
            <button
              key={image.id}
              onClick={() => {
                form.setValue('imageUrl', image.id, { shouldValidate: true });
                form.setValue('imageHint', image.hint, { shouldValidate: true });
                setIsMediaDialogOpen(false);
              }}
              className={cn(
                'border-2 rounded-lg overflow-hidden focus:ring-2 focus:ring-primary focus:outline-none',
                form.watch('imageUrl') === image.id ? 'border-primary' : 'border-transparent'
              )}
            >
              <img src={image.url} alt={image.description} className="w-full h-full object-cover aspect-square" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <MediaDialog />
      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Title</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Post Title..."
                          className="text-4xl font-extrabold leading-tight tracking-tighter border-none focus-visible:ring-0 p-0 resize-none"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleTitleChange(e as any);
                          }}
                          rows={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                     <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-muted-foreground">slug:</FormLabel>
                        <FormControl>
                            <Input className="h-auto p-0 border-none focus-visible:ring-0 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Content</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateContent} disabled={isGeneratingContent}>
                        {isGeneratingContent ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                        Generate with AI
                    </Button>
                </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                         <TiptapEditor content={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Customize search engine appearance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl><Input placeholder="A catchy title for search engines" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl><Textarea placeholder="A concise summary for search snippets" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <Button type="button" variant="outline" onClick={handleGenerateSeo} disabled={isGeneratingSeo}>
                        {isGeneratingSeo ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                        Generate SEO with AI
                    </Button>
                </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => handleSaveClick('published')} disabled={isSubmitting}>
                  <Send className="mr-2" /> Publish
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => handleSaveClick('draft')} disabled={isSubmitting}>
                   <Save className="mr-2" /> Save Draft
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Category</FormLabel>
                      <Popover open={openCategoryCombobox} onOpenChange={setOpenCategoryCombobox}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? categories.find(
                                    (category) => category.toLowerCase() === field.value.toLowerCase()
                                  )
                                : "Select a category"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" position="popper">
                          <Command>
                            <CommandInput placeholder="Search or create..." />
                            <CommandList>
                                <CommandEmpty>
                                    <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => {
                                        const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
                                        if (input) {
                                            handleCreateCategory(input.value);
                                            setOpenCategoryCombobox(false);
                                        }
                                    }}>
                                        Create "{document.querySelector<HTMLInputElement>('[cmdk-input]')?.value}"
                                    </Button>
                                </CommandEmpty>
                                <CommandGroup>
                                {categories.map((category) => (
                                    <CommandItem
                                    value={category}
                                    key={category}
                                    onSelect={() => {
                                        form.setValue("category", category, { shouldValidate: true });
                                        setOpenCategoryCombobox(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        category.toLowerCase() === field.value.toLowerCase() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {category}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleGenerateCategory} disabled={isGeneratingCategory}>
                    {isGeneratingCategory ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                    AI Suggest Category
                </Button>
                 <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                           <Input placeholder="Press Enter to add tags" onKeyDown={handleTagKeyDown}/>
                        </FormControl>
                         <div className="flex flex-wrap gap-2 pt-2">
                            {field.value.map(tag => (
                                <Badge key={tag} variant="secondary">
                                {tag}
                                <button className="ml-1" onClick={() => removeTag(tag)}>x</button>
                                </Badge>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateKeywords} disabled={isGeneratingKeywords}>
                    {isGeneratingKeywords ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                    Suggest Tags with AI
                </Button>
                <Separator />
                 <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                      </FormControl>
                      <FormLabel className="flex items-center gap-1"><Star/> Featured Post</FormLabel>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="premium"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                      </FormControl>
                      <FormLabel>Premium Content</FormLabel>
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video relative rounded-md border bg-muted flex items-center justify-center">
                  {form.watch('imageUrl') ? (
                    <img src={PlaceHolderImages.find(i => i.id === form.watch('imageUrl'))?.url} alt="Featured" className="object-cover w-full h-full rounded-md" />
                  ) : (
                    <span className="text-muted-foreground text-sm">No image selected</span>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsMediaDialogOpen(true)}>
                  <ImageIcon className="mr-2"/>
                  Select from Media Library
                </Button>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            {post && onDelete && (
                 <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" className="w-full" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2" />
                            Delete Post
                        </Button>
                    </CardContent>
                </Card>
            )}

          </div>
        </form>
      </Form>
      {post && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the post "{post.title}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} variant="destructive">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
