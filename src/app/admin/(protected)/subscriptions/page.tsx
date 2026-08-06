
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Subscription } from '@/lib/types';
import { format } from 'date-fns';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [subscriptionsSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'))
  );
  
  const subscriptions: Subscription[] = useMemo(() => {
    if (!subscriptionsSnapshot) return [];
    return subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      renewalDate: (doc.data().renewalDate as Timestamp),
      createdAt: (doc.data().createdAt as Timestamp),
    } as Subscription));
  }, [subscriptionsSnapshot]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load subscriptions.' });
    }
  }, [error, toast]);
  
  const handleRowClick = (subId: string) => {
    router.push(`/admin/subscriptions/${subId}`);
  };

  const getStatusBadge = (status: Subscription['status']) => {
    switch (status) {
      case 'Active': return <Badge variant="secondary">Active</Badge>;
      case 'Cancelled': return <Badge variant="outline">Cancelled</Badge>;
      case 'Past Due': return <Badge variant="destructive">Past Due</Badge>;
    }
  };

  const totalPages = Math.ceil(subscriptions.length / itemsPerPage);
  const paginatedSubscriptions = subscriptions.slice(
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


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Heart />
            <CardTitle>Subscriptions</CardTitle>
        </div>
        <CardDescription>
          Manage all user subscriptions for premium content access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right hidden md:table-cell">Next Renewal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
            ) : paginatedSubscriptions.map((sub) => (
              <TableRow key={sub.id} onClick={() => handleRowClick(sub.id)} className="cursor-pointer">
                <TableCell className="font-medium">{sub.email}</TableCell>
                <TableCell className="hidden sm:table-cell">{sub.plan}</TableCell>
                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                <TableCell className="text-right hidden md:table-cell">
                    {sub.status === 'Active' ? format(sub.renewalDate.toDate(), 'MMM d, yyyy') : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedSubscriptions.length}</strong> of <strong>{subscriptions.length}</strong> subscriptions
        </div>
        {renderPagination()}
      </CardFooter>
    </Card>
  );
}
