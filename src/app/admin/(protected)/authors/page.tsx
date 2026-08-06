
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
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { User, Role } from '@/lib/types';
import { AuthorForm } from '@/components/authors/author-form';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createUser } from '@/ai/flows/create-user';
import { MOCK_ROLES } from '@/lib/mock-data';

export default function AuthorsPage() {
  const { toast } = useToast();
  
  const [usersSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  );
  
  const allUsers: User[] = usersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)) || [];
  
  const authorRoles = ['Admin', 'Editor', 'Author'];
  const authors = useMemo(() => 
    allUsers.filter(user => 
      user.roles && user.roles.some(role => authorRoles.includes(role.name))
    ), 
  [allUsers]);

  const roles: Role[] = MOCK_ROLES;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error loading users', description: error.message });
    }
  }, [error, toast]);

  const totalPages = Math.ceil(authors.length / itemsPerPage);
  const paginatedUsers = authors.slice(
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

  const handleInvite = async (data: {name: string, email: string, role_id: string}) => {
    const selectedRole = roles.find(r => r.id === data.role_id);
    if (!selectedRole) {
      toast({ variant: 'destructive', title: 'Invalid Role' });
      return;
    }
    try {
      // The createUser flow is a placeholder in this app.
      // In a real app, it would use Firebase Auth to create a user.
      const result = await createUser({ name: data.name, email: data.email, role: selectedRole.name });
      setInviteDialogOpen(false);
      toast({ title: 'Invitation Sent!', description: result.message });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error sending invitation', description: e.message });
    }
  };

  const handleEdit = async (data: {name: string, email: string, role_id: string}) => {
    if (!selectedUser) return;
    const selectedRole = roles.find(r => r.id === data.role_id);
    if (!selectedRole) {
      toast({ variant: 'destructive', title: 'Invalid Role' });
      return;
    }
    
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await setDoc(userRef, { 
        name: data.name,
        email: data.email,
        roles: [selectedRole] 
      }, { merge: true });

      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({ title: 'Author Updated', description: `${data.name}'s information has been updated.` });
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Error updating user', description: e.message });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedUser) return;
    const deletedUserName = selectedUser.name;
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setDeleteDialogOpen(false);
      toast({ variant: 'destructive', title: 'Author Removed', description: `${deletedUserName} has been removed.` });
      setSelectedUser(null);
    } catch (e: any) {
       toast({ variant: 'destructive', title: 'Error removing user', description: e.message });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };
  
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle>Author Management</CardTitle>
                <CardDescription>
                Manage users with authoring roles and invite new authors.
                </CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Author
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></TableCell></TableRow>
              ) : paginatedUsers.map((user) => {
                const avatarImage = PlaceHolderImages.find((img) => img.id === user.avatar);
                const userRoleName = user.roles && user.roles.length > 0 ? user.roles[0].name : 'N/A';
                return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarImage?.url} alt={user.name} data-ai-hint={avatarImage?.hint} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={userRoleName === 'Admin' ? 'default' : 'secondary'}>{userRoleName}</Badge>
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
                        <DropdownMenuItem onSelect={() => openEditDialog(user)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openDeleteDialog(user)} className="text-destructive focus:text-destructive">
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
             Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedUsers.length}</strong> of <strong>{authors.length}</strong> users
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>

      <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Author</DialogTitle>
            <DialogDescription>
              Enter the details of the new author. They will receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>
          <AuthorForm
            roles={roles}
            onSubmit={handleInvite}
            onCancel={() => setInviteDialogOpen(false)}
            submitButtonText="Send Invitation"
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setEditDialogOpen(isOpen); if (!isOpen) setSelectedUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Author</DialogTitle>
            <DialogDescription>Update the author's details below.</DialogDescription>
          </DialogHeader>
          <AuthorForm
            user={selectedUser}
            roles={roles}
            onSubmit={handleEdit}
            onCancel={() => { setEditDialogOpen(false); setSelectedUser(null); }}
            submitButtonText="Save Changes"
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { setDeleteDialogOpen(isOpen); if (!isOpen) setSelectedUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove <span className="font-semibold">{selectedUser?.name}</span> as an author.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
