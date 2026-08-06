

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import type { User } from '@/lib/types';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useState } from 'react';
import { sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AccountSettings() {
    const { toast } = useToast();
    const { user, logout } = usePublicSubscription();
    const router = useRouter();

    if (!user) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    // In a real app, this would come from user settings in the DB
    const [isSubscribed, setIsSubscribed] = useState(true);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);


    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { name });
            toast({
                title: "Settings Saved",
                description: "Your profile information has been updated.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update your settings.' });
        }
    }
    
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match.' });
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            
            toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update password. Please check your current password.' });
        }
    }
    
    const handleDeleteAccount = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
             toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
             return;
        }
        
        setIsDeleting(true);

        try {
            const credential = EmailAuthProvider.credential(currentUser.email!, deletePassword);
            await reauthenticateWithCredential(currentUser, credential);

            // 1. Delete user document from Firestore
            await deleteDoc(doc(db, 'users', currentUser.uid));
            
            // 2. Delete user from Firebase Auth
            await deleteFirebaseUser(currentUser);
            
            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
            
            // Log out and redirect
            await logout();
            router.push('/');

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Please check your password and try again.' });
            setIsDeleting(false);
        }
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your profile, email, and password settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSettingsSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                        <Button type="submit">Save Changes</Button>
                    </form>

                    <Separator />

                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="newsletter" className="text-base font-medium">Newsletter Subscription</Label>
                            <p className="text-sm text-muted-foreground">Receive updates and new posts by email.</p>
                        </div>
                            <Switch 
                            id="newsletter" 
                            checked={isSubscribed}
                            onCheckedChange={setIsSubscribed}
                            />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="font-medium">Password</h4>
                        {!isChangingPassword ? (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Change your password.</p>
                                <Button variant="outline" onClick={() => setIsChangingPassword(true)}>Change Password</Button>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordUpdate} className="p-4 border rounded-lg space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                                    <Button type="submit">Update Password</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <Card className="border-destructive mt-6">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/> Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Delete Account</h4>
                            <p className="text-sm text-muted-foreground">Permanently delete your account and all of your data.</p>
                        </div>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete My Account</Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account, posts, comments, and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="delete-password">Please enter your password to confirm.</Label>
                        <Input
                            id="delete-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting || !deletePassword} className="bg-destructive hover:bg-destructive/90">
                           {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                           Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </>
    );
}
