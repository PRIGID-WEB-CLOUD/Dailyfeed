
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Inquiry } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

export default function PartnershipsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [inquiriesSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'))
  );
  const inquiries: Inquiry[] = inquiriesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry)) || [];

  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load inquiries.' });
    }
  }, [error, toast]);

  const handleRowClick = (inquiryId: string) => {
    router.push(`/admin/partnerships/${inquiryId}`);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Partnership Inquiries</CardTitle>
          <CardDescription>
            Review and manage advertising and partnership requests from potential clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
              ) : inquiries.map((inquiry) => (
                <TableRow key={inquiry.id} onClick={() => handleRowClick(inquiry.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{inquiry.companyName}</TableCell>
                  <TableCell>
                      <div className="font-medium">{inquiry.contactPerson}</div>
                      <div className="text-sm text-muted-foreground break-all">{inquiry.email}</div>
                  </TableCell>
                  <TableCell>
                      <Badge variant={inquiry.status === 'New' ? 'default' : inquiry.status === 'Rejected' ? 'destructive' : 'secondary'}>{inquiry.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
