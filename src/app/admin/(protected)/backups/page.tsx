
'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Download, History, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import type { Backup, BackupStatus } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createBackup } from '@/ai/flows/create-backup';
import { downloadBackup } from '@/ai/flows/download-backup';

export default function BackupsPage() {
  const { toast } = useToast();
  
  const [backupsSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'backups'), orderBy('createdAt', 'desc'))
  );
  const backups: Backup[] = backupsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Backup)) || [];

  const [isCreating, setIsCreating] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<Backup | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load backups.' });
    }
  }, [error, toast]);


  const totalPages = Math.ceil(backups.length / itemsPerPage);
  const paginatedBackups = backups.slice(
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

  const handleCreateBackup = async () => {
    setIsCreating(true);
    toast({ title: 'Backup In Progress...', description: 'Your site data is being gathered and uploaded.' });
    try {
        await createBackup(); // Call the Genkit flow
        toast({ title: 'Backup Created', description: 'A new backup has been successfully created and stored.' });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create backup.' });
    } finally {
        setIsCreating(false);
    }
  };
  
  const handleDownload = (backup: Backup) => {
    if (backup.downloadURL) {
      window.open(backup.downloadURL, '_blank');
      toast({ title: 'Download Started', description: `Your backup file is now downloading.` });
    } else {
      toast({ variant: 'destructive', title: 'Download Not Available', description: 'The download link for this backup is missing.' });
    }
  };

  const handleRestore = async () => {
    if (!itemToRestore) return;
    toast({ title: 'Restore Initiated', description: `Restoring from backup of ${format((itemToRestore.createdAt as unknown as Timestamp).toDate(), 'PPP')}. This is a simulation and will not alter your data.` });
    setItemToRestore(null);
  };

  const handleImport = () => { toast({ title: 'Import Started', description: 'Please select a backup file to import. (Simulated)' }); };
  const handleExport = () => { toast({ title: 'Export All Started', description: 'Your blog data is being exported. (Simulated)' }); };
  
  const getStatusBadge = (status: BackupStatus) => {
    switch (status) {
      case 'Completed': return <Badge variant="secondary">Completed</Badge>;
      case 'In Progress': return <Badge><Loader2 className="mr-2 h-3 w-3 animate-spin"/>In Progress</Badge>;
      case 'Failed': return <Badge variant="destructive">Failed</Badge>;
    }
  };


  return (
    <>
    <div className="w-full space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Backups & Migration</CardTitle>
                <CardDescription>
                Create, restore, import, and export your blog data.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleImport}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                </Button>
                <Button onClick={handleCreateBackup} disabled={isCreating}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isCreating ? 'Creating...' : 'Create Backup'}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
              ) : paginatedBackups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{format((backup.createdAt as unknown as Timestamp).toDate(), 'MMMM dd, yyyy, h:mm a')}</TableCell>
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.files}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={backup.status !== 'Completed'}>
                           <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleDownload(backup)} disabled={!backup.downloadURL}>
                          <Download className="mr-2 h-4 w-4"/>
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setItemToRestore(backup)}>
                          <History className="mr-2 h-4 w-4"/>
                          Restore
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
             Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedBackups.length}</strong> of <strong>{backups.length}</strong> backups
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>
    </div>
    <AlertDialog open={!!itemToRestore} onOpenChange={(open) => !open && setItemToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to restore?</AlertDialogTitle>
            <AlertDialogDescription>
                This action will replace your current blog data with the backup from <span className="font-semibold">{itemToRestore ? format((itemToRestore.createdAt as unknown as Timestamp).toDate(), 'PPP') : ''}</span>. This is a simulation and will not alter your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Yes, Restore (Simulate)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
