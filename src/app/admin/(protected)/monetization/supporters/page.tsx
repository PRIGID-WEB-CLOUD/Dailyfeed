
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, ShoppingBag, Link as LinkIcon, ImageIcon, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Supporter, MediaAsset } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import Image from 'next/image';
import { createFolder } from '@/lib/media-service';
import slugify from 'slugify';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ScrollArea } from '@/components/ui/scroll-area';

const supporterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  website: z.string().url('Please enter a valid URL.'),
  logoUrl: z.string().url('Please provide a valid logo URL or upload an image.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  hint: z.string().optional(),
});
type SupporterFormValues = z.infer<typeof supporterSchema>;

function SupporterForm({
  supporter,
  onSubmit,
  onCancel,
}: {
  supporter?: Supporter | null;
  onSubmit: (values: SupporterFormValues) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<SupporterFormValues>({
    resolver: zodResolver(supporterSchema),
    defaultValues: supporter || { name: '', website: '', logoUrl: '', description: '', hint: '' },
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: "Converting image..." });

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      form.setValue('logoUrl', dataUri, { shouldValidate: true });
      toast({ title: "Image Converted!", description: "The image is ready to be saved." });
      setIsUploading(false);
    };
    reader.onerror = () => {
        console.error("Error reading file");
        toast({ variant: "destructive", title: "Conversion Failed", description: "Could not read the image file." });
        setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const logoUrl = form.watch('logoUrl');

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Supporter Name</FormLabel><FormControl><Input placeholder="e.g., Tech Innovators" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="website" render={({ field }) => (
          <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input placeholder="https://techinnovators.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField control={form.control} name="logoUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>Logo URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/logo.png" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="text-sm text-center text-muted-foreground">OR</div>
        
        <FormItem>
            <FormLabel>Upload Logo</FormLabel>
            <div className="flex items-center gap-4">
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="flex-grow" disabled={isUploading}/>
                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            {logoUrl && <Image src={logoUrl} alt="logo preview" width={100} height={50} className="rounded-md object-contain mt-2 border p-2" />}
        </FormItem>


        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief description of the supporter." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="hint" render={({ field }) => (
          <FormItem><FormLabel>Logo AI Hint (optional)</FormLabel><FormControl><Input placeholder="tech logo" {...field} /></FormControl><FormDescription>One or two keywords for AI image search.</FormDescription><FormMessage /></FormItem>
        )} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isUploading}>{supporter ? 'Save Changes' : 'Add Supporter'}</Button>
        </DialogFooter>
      </form>
    </Form>
    </>
  );
}

export default function SupportersPage() {
  const { toast } = useToast();
  const [supportersSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'supporters'), orderBy('name', 'asc'))
  );
  const supporters: Supporter[] = supportersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supporter)) || [];

  const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  
  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load supporters.' });
    }
  }, [error, toast]);

  const handleAdd = async (data: SupporterFormValues) => {
    try {
        await addDoc(collection(db, 'supporters'), { ...data });
        await createFolder(`supporters/${slugify(data.name, { lower: true, strict: true })}`);
        setFormOpen(false);
        toast({ title: 'Supporter Added!'});
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not add supporter.' });
    }
  };
  
  const handleEdit = async (data: SupporterFormValues) => {
    if (!selectedSupporter) return;
    try {
        await updateDoc(doc(db, 'supporters', selectedSupporter.id), { ...data });
        setFormOpen(false);
        setSelectedSupporter(null);
        toast({ title: 'Supporter Updated!' });
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not update supporter.' });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedSupporter) return;
    try {
        await deleteDoc(doc(db, 'supporters', selectedSupporter.id));
        setDeleteOpen(false);
        toast({ title: 'Supporter Removed.', variant: 'destructive' });
        setSelectedSupporter(null);
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not delete supporter.' });
    }
  };
  
  const openForm = (supporter: Supporter | null = null) => {
    setSelectedSupporter(supporter);
    setFormOpen(true);
  };
  
  const openDeleteDialog = (supporter: Supporter) => {
    setSelectedSupporter(supporter);
    setDeleteOpen(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2"><ShoppingBag /> Supporters</CardTitle>
                <CardDescription>
                Manage the supporters and sponsors featured on your public page.
                </CardDescription>
            </div>
            <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Supporter
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
              ) : supporters.map((supporter) => (
                <TableRow key={supporter.id}>
                  <TableCell>
                    <Image src={supporter.logoUrl} alt={`${supporter.name} logo`} width={100} height={50} className="object-contain" />
                  </TableCell>
                  <TableCell className="font-medium">{supporter.name}</TableCell>
                  <TableCell>
                    <a href={supporter.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                        {supporter.website}
                        <LinkIcon className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => openForm(supporter)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openDeleteDialog(supporter)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setFormOpen(isOpen); if (!isOpen) setSelectedSupporter(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSupporter ? 'Edit Supporter' : 'Add New Supporter'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-6">
            <SupporterForm
                supporter={selectedSupporter}
                onSubmit={selectedSupporter ? handleEdit : handleAdd}
                onCancel={() => { setFormOpen(false); setSelectedSupporter(null); }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteOpen} onOpenChange={(isOpen) => { setDeleteOpen(isOpen); if (!isOpen) setSelectedSupporter(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supporter <span className="font-semibold">{selectedSupporter?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
