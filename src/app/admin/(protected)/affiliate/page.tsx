
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { MoreHorizontal, PlusCircle, Link as LinkIcon, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import type { AffiliateLink } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const linkSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  url: z.string().url('Please enter a valid URL.'),
});
type LinkFormValues = z.infer<typeof linkSchema>;

function AffiliateLinkForm({
  link,
  onSubmit,
  onCancel,
}: {
  link?: AffiliateLink | null;
  onSubmit: (values: LinkFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: link ? { name: link.name, url: link.url } : { name: '', url: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Awesome Product" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Affiliate URL</FormLabel>
              <FormControl>
                <Input placeholder="https://product.com/?ref=yourid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{link ? 'Save Changes' : 'Add Link'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AffiliatePage() {
  const { toast } = useToast();
  const [linksSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'affiliateLinks'), orderBy('createdAt', 'desc'))
  );
  const links: AffiliateLink[] = linksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as AffiliateLink)) || [];
  
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load affiliate links.' });
    }
  }, [error, toast]);

  const totalPages = Math.ceil(links.length / itemsPerPage);
  const paginatedLinks = links.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 3) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + 1 >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }
    for (let i = startPage; i <= endPage; i++) { pageNumbers.push(i); }
    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem><PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} isActive={currentPage > 1} /></PaginationItem>
                {startPage > 1 && (<><PaginationItem><PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink></PaginationItem>{startPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}</>)}
                {pageNumbers.map(number => (<PaginationItem key={number}><PaginationLink isActive={number === currentPage} onClick={() => handlePageChange(number)}>{number}</PaginationLink></PaginationItem>))}
                {endPage < totalPages && (<><PaginationItem><PaginationEllipsis /></PaginationItem><PaginationItem><PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink></PaginationItem></>)}
                <PaginationItem><PaginationNext onClick={() => handlePageChange(currentPage + 1)} isActive={currentPage < totalPages} /></PaginationItem>
            </PaginationContent>
        </Pagination>
    );
  };
  
  const handleAdd = async (data: LinkFormValues) => {
    try {
        await addDoc(collection(db, 'affiliateLinks'), {
            ...data,
            clicks: 0,
            earnings: 0,
            createdAt: serverTimestamp(),
        });
        setFormOpen(false);
        toast({ title: 'Affiliate Link Added!' });
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not add link.' });
    }
  };
  
  const handleEdit = async (data: LinkFormValues) => {
    if (!selectedLink) return;
    try {
        await updateDoc(doc(db, 'affiliateLinks', selectedLink.id), { ...data });
        setFormOpen(false);
        setSelectedLink(null);
        toast({ title: 'Affiliate Link Updated!' });
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not update link.' });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedLink) return;
    try {
        await deleteDoc(doc(db, 'affiliateLinks', selectedLink.id));
        setDeleteOpen(false);
        toast({ title: 'Affiliate Link Removed.', variant: 'destructive' });
        setSelectedLink(null);
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not delete link.' });
    }
  };
  
  const openForm = (link: AffiliateLink | null = null) => {
    setSelectedLink(link);
    setFormOpen(true);
  };
  
  const openDeleteDialog = (link: AffiliateLink) => {
    setSelectedLink(link);
    setDeleteOpen(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Affiliate Links</CardTitle>
                <CardDescription>
                Manage your affiliate product links and track their performance.
                </CardDescription>
            </div>
            <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Link
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link Name</TableHead>
                <TableHead>Destination URL</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
              ) : paginatedLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.name}</TableCell>
                  <TableCell>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                        {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
                        <LinkIcon className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right">{link.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">${link.earnings.toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
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
                        <DropdownMenuItem onSelect={() => openForm(link)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openDeleteDialog(link)} className="text-destructive focus:text-destructive">
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
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
             Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedLinks.length}</strong> of <strong>{links.length}</strong> links
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setFormOpen(isOpen); if (!isOpen) setSelectedLink(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLink ? 'Edit Affiliate Link' : 'Add New Affiliate Link'}</DialogTitle>
          </DialogHeader>
          <AffiliateLinkForm
            link={selectedLink}
            onSubmit={selectedLink ? handleEdit : handleAdd}
            onCancel={() => { setFormOpen(false); setSelectedLink(null); }}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteOpen} onOpenChange={(isOpen) => { setDeleteOpen(isOpen); if (!isOpen) setSelectedLink(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the affiliate link for <span className="font-semibold">{selectedLink?.name}</span>.
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
