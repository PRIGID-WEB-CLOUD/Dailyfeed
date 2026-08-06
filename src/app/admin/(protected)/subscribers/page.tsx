
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Users, PlusCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import type { Subscriber } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addSubscriber } from '@/lib/subscriber-service';


export default function SubscribersPage() {
  const { toast } = useToast();
  
  const [subscribersSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'))
  );
  
  const subscribers: Subscriber[] = useMemo(() => {
    if (!subscribersSnapshot) return [];
    return subscribersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      subscribedAt: (doc.data().subscribedAt as Timestamp),
    }))
  }, [subscribersSnapshot]);

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load subscribers.' });
    }
  }, [error, toast]);


  const totalPages = Math.ceil(subscribers.length / itemsPerPage);
  const paginatedSubscribers = subscribers.slice(
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

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubscriberEmail || !/^\S+@\S+\.\S+$/.test(newSubscriberEmail)) {
       toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
       return;
    }
    
    try {
        await addSubscriber(newSubscriberEmail);
        toast({ title: 'Subscriber Added', description: `${newSubscriberEmail} has been added to your list.` });
        setNewSubscriberEmail('');
        setAddDialogOpen(false);
    } catch(err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscribers</CardTitle>
            <CardDescription>
              Manage your newsletter subscribers and campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subscribers.length}</div>
                  <p className="text-xs text-muted-foreground">The current number of subscribers.</p>
                </CardContent>
              </Card>
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Newsletter Open Rate</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">48.2%</div>
                  <p className="text-xs text-muted-foreground">Average across all campaigns</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Subscriber Management</CardTitle>
               <CardDescription>
                View and manage your subscriber list.
              </CardDescription>
            </div>
             <div className="flex gap-4">
              <Button variant="outline">Import</Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subscriber
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Subscription Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
                ) : paginatedSubscribers.length > 0 ? paginatedSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {format(subscriber.subscribedAt.toDate(), 'MMMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                      No subscribers yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter className="flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedSubscribers.length}</strong> of <strong>{subscribers.length}</strong> subscribers.
            </div>
            {renderPagination()}
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
            <form onSubmit={handleAddSubscriber}>
            <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
                <DialogDescription>
                Enter the email address of the new subscriber.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="email" className="sr-only">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="subscriber@example.com"
                value={newSubscriberEmail}
                onChange={(e) => setNewSubscriberEmail(e.target.value)}
                required
                />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Subscriber</Button>
            </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
