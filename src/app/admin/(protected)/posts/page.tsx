
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, Star, Eye, Copy } from 'lucide-react';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext
} from '@/components/ui/pagination';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Post } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PostsPage() {
  const { toast } = useToast();
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  
  const [postsSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'posts'), orderBy('publishedAt', 'desc'))
  );

  const posts: Post[] = useMemo(() => {
    if (!postsSnapshot) return [];
    return postsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            publishedAt: (data.publishedAt as Timestamp)?.toDate(),
        } as unknown as Post;
    });
  }, [postsSnapshot]);

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading posts',
        description: error.message,
      });
    }
  }, [error, toast]);

  const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      toast({
        variant: 'destructive',
        title: 'Post Deleted',
        description: 'The post has been successfully deleted.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error Deleting Post',
        description: 'There was a problem deleting the post.',
      });
    } finally {
      setPostToDelete(null);
    }
  };
  
  const handleDuplicatePost = async (postId: string) => {
    const postToDuplicate = posts.find(p => p.id === postId);
    if (!postToDuplicate) {
      toast({ variant: 'destructive', title: 'Error', description: 'Post not found.' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, publishedAt, ...postData } = postToDuplicate;

    try {
      await addDoc(collection(db, 'posts'), {
        ...postData,
        title: `${postToDuplicate.title} (Copy)`,
        slug: `${postToDuplicate.slug}-copy-${Date.now()}`,
        status: 'Draft',
        publishedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Post Duplicated',
        description: `A draft copy of "${postToDuplicate.title}" has been created.`,
      });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not duplicate post.' });
    }
  };


  const postForDialog = postToDelete ? posts.find(p => p.id === postToDelete) : null;
  
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
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
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} isActive={currentPage > 1} />
                </PaginationItem>
                {startPage > 1 && (
                    <>
                        <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                        </PaginationItem>
                        {startPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    </>
                )}
                {pageNumbers.map(number => (
                    <PaginationItem key={number}>
                        <PaginationLink isActive={number === currentPage} onClick={() => handlePageChange(number)}>
                            {number}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                 {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                        <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                        </PaginationItem>
                    </>
                )}
                <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} isActive={currentPage < totalPages} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>
            Manage your blog posts. You can create, edit, and delete posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Post ID</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">
                  Published At
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                     <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedPosts.length > 0 ? paginatedPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={post.title}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={getImage(post.imageUrl)?.url || ''}
                      width="64"
                      data-ai-hint={post.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                       {post.featured && (
                        <Star className="h-4 w-4 text-primary" fill="currentColor" />
                      )}
                      <span>{post.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      post.status === 'published'
                        ? 'secondary'
                        : post.status === 'draft'
                        ? 'outline'
                        : 'default'
                    }>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-muted-foreground">{post.id}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post.authorName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post.category}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post.publishedAt ? format(new Date(post.publishedAt), 'MMMM dd, yyyy') : 'N/A'}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/posts/${post.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleDuplicatePost(post.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                         {post.status === 'published' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View Public Post
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPostToDelete(post.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No posts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
             Showing <strong>{(currentPage - 1) * postsPerPage + 1}-{(currentPage - 1) * postsPerPage + paginatedPosts.length}</strong> of <strong>{posts.length}</strong> posts
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>
      
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post titled "{postForDialog?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
