
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Folder, PlusCircle, Trash2, UploadCloud, X, ImageIcon, Video, Music, MoreHorizontal, Play, Download as DownloadIcon, Loader2, ChevronRight, Home, Plus, FolderPlus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MediaAsset, MediaType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addMediaAsset, deleteMediaAsset, createFolder } from '@/lib/media-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';

const getFileType = (file: File): MediaType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image'; // default
};

const TypeIcon = ({ type, className }: { type: MediaType; className?: string }) => {
  const Icon = type === 'video' ? Video : type === 'audio' ? Music : type === 'folder' ? Folder : ImageIcon;
  return <Icon className={cn('h-5 w-5', className)} />;
};

interface MediaPageProps {
  isPickerMode?: boolean;
  onMediaSelect?: (media: MediaAsset) => void;
}

export default function MediaPage({ isPickerMode = false, onMediaSelect }: MediaPageProps) {
  const { toast } = useToast();
  
  const [mediaSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'media'), orderBy('createdAt', 'desc'))
  );

  const mediaItems: MediaAsset[] = useMemo(() => {
    if (!mediaSnapshot) return [];
    return mediaSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp),
    } as MediaAsset));
  }, [mediaSnapshot]);

  const [currentPath, setCurrentPath] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  useEffect(() => {
    if(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load media assets.' });
    }
  }, [error, toast]);

  const { currentFolderItems, folderNames } = useMemo(() => {
    const filteredItems = mediaItems.filter(item => {
        const itemFolderPath = item.folderPath || '';
        return itemFolderPath === currentPath;
    });
    
    const folders = new Set<string>();
    mediaItems.forEach(item => {
      if (item.folderPath && item.folderPath.startsWith(currentPath) && item.folderPath !== currentPath) {
        const subPath = item.folderPath.substring(currentPath ? currentPath.length + 1 : 0);
        const folderName = subPath.split('/')[0];
        if (folderName) folders.add(folderName);
      }
    });

    return { currentFolderItems: filteredItems, folderNames: Array.from(folders) };
  }, [mediaItems, currentPath]);

  const displayItems = [
    ...folderNames.map(name => ({ id: `folder-${name}`, description: name, type: 'folder' as MediaType, url: '', hint:'' })),
    ...currentFolderItems,
  ].sort((a,b) => (a.type === 'folder' && b.type !== 'folder') ? -1 : (b.type === 'folder' && a.type !== 'folder') ? 1 : 0);


  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const paginatedMediaItems = displayItems.slice(
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
    onDrop: (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
    },
  });

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
        await deleteMediaAsset(itemToDelete);
        toast({ title: 'Media Deleted', description: 'The asset has been removed.' });
    } catch(e) {
        toast({ title: 'Error', description: 'Could not delete media asset.', variant: 'destructive' });
    } finally {
        setItemToDelete(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    const uploadPromises = files.map(file => addMediaAsset(file, currentPath));

    try {
        await Promise.all(uploadPromises);
        toast({ title: `${files.length} file(s) uploaded successfully!` });
    } catch (e) {
        console.error(e);
        toast({ title: 'Upload Failed', description: 'Could not save one or more assets.', variant: 'destructive' });
    } finally {
        setIsUploading(false);
        setIsUploadDialogOpen(false);
        setFiles([]);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) {
      toast({ variant: 'destructive', title: 'Folder name is required.' });
      return;
    }
    const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    try {
        await createFolder(fullPath);
        toast({ title: 'Folder Created', description: `Folder "${newFolderName}" has been created.` });
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Could not create folder.', variant: 'destructive' });
    } finally {
        setIsFolderDialogOpen(false);
        setNewFolderName('');
    }
  };
  
  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };
  
  const handleAction = (action: 'play' | 'download', item: MediaAsset) => {
    if (action === 'download') {
        window.open(item.url, '_blank');
    } else {
        toast({ title: 'Action Triggered (Demo)', description: `Playing "${item.description}"` });
    }
  };

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setCurrentPage(1);
  };
  
  const handleBreadcrumbClick = (index: number) => {
    const newPath = currentPath.split('/').slice(0, index + 1).join('/');
    setCurrentPath(newPath);
    setCurrentPage(1);
  };

  const breadcrumbs = currentPath.split('/').filter(p => p);
  const itemForDialog = itemToDelete ? mediaItems.find(item => item.id === itemToDelete) : null;
  
  const handleItemClick = (item: MediaAsset) => {
    if (isPickerMode) {
      if (item.type !== 'folder') {
        onMediaSelect?.(item);
      } else {
        handleNavigate(item.description);
      }
    } else {
      if (item.type === 'folder') {
        handleNavigate(item.description);
      }
    }
  };


  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>Manage your images, videos, and audio assets.</CardDescription>
               <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <button onClick={() => setCurrentPath('')} className="hover:text-primary"><Home className="h-4 w-4"/></button>
                    <ChevronRight className="h-4 w-4" />
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <button onClick={() => handleBreadcrumbClick(index)} className="hover:text-primary">{crumb}</button>
                             {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
             {!isPickerMode && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsFolderDialogOpen(true)}>
                        <FolderPlus className="mr-2 h-4 w-4"/>
                        New Folder
                    </Button>
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Upload Media
                    </Button>
                </div>
             )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                    <Loader2 className="animate-spin h-12 w-12 text-primary" />
                </div>
            ) : displayItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paginatedMediaItems.map((item) => (
                  <Card key={item.id} className="group overflow-hidden relative">
                    <button onClick={() => handleItemClick(item)} className={cn("w-full text-left", item.type !== 'folder' && isPickerMode ? "cursor-pointer" : "cursor-default", item.type === 'folder' && "cursor-pointer")}>
                        <div className="aspect-square relative bg-muted flex items-center justify-center">
                        {item.type === 'folder' ? (
                            <Folder className="w-16 h-16 text-muted-foreground" />
                        ) : item.type === 'image' ? (
                            <Image src={item.url} alt={item.description} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" data-ai-hint={item.hint} />
                        ) : item.type === 'video' ? (
                            <video src={item.url} controls className="w-full h-full object-cover" />
                        ) : (
                             <div className="flex flex-col items-center gap-2"><Music className="w-16 h-16 text-muted-foreground" /><audio src={item.url} controls className="w-full max-w-[200px]" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                    {item.type !== 'folder' && !isPickerMode && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">More actions</span></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {['video', 'audio'].includes(item.type) && (<DropdownMenuItem onClick={() => handleAction('play', item as MediaAsset)}><Play className="mr-2 h-4 w-4" />Play</DropdownMenuItem>)}
                            <DropdownMenuItem onClick={() => handleAction('download', item as MediaAsset)}><DownloadIcon className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                    )}
                    <CardFooter className="p-2 bg-card/80 backdrop-blur-sm absolute bottom-0 w-full flex items-center justify-between">
                      <p className="text-xs text-card-foreground truncate">{item.description}</p>
                      <TypeIcon type={item.type as MediaType} className="text-card-foreground flex-shrink-0" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-muted rounded-lg p-12 min-h-[400px]">
                  <ImageIcon className="text-muted-foreground size-16 mb-4"/>
                  <h3 className="text-xl font-semibold">This folder is empty</h3>
                  <p className="text-muted-foreground">Start by uploading your first media asset or creating a new folder.</p>
              </div>
            )}
          </CardContent>
           <CardFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedMediaItems.length}</strong> of <strong>{displayItems.length}</strong> assets
            </div>
            {renderPagination()}
            </CardFooter>
        </Card>
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Upload Media</DialogTitle><DialogDescription>Drag and drop files here or click to select files. They will be added to the current folder: <span className="font-mono text-foreground bg-muted p-1 rounded-sm">/{currentPath}</span></DialogDescription></DialogHeader>
          <div {...getRootProps()} className={`mt-4 flex justify-center rounded-lg border-2 border-dashed border-muted-foreground px-6 py-10 transition-colors ${isDragActive ? 'bg-accent' : ''}`}>
            <input {...getInputProps()} />
            <div className="text-center"><UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">{isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select files'}</p><p className="text-xs text-muted-foreground/80">Images, Video, and Audio up to 50MB</p></div>
          </div>
          {files.length > 0 && (<div className="mt-4 space-y-2"><h4 className="font-medium">Selected files:</h4><ul className="space-y-1">{files.map(file => (<li key={file.name} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"><span className="truncate">{file.name}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.name)}><X className="h-4 w-4"/></Button></li>))}</ul></div>)}
          <DialogFooter><Button variant="outline" onClick={() => { setIsUploadDialogOpen(false); setFiles([])}}>Cancel</Button><Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>{isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Upload {files.length > 0 ? `${files.length} File(s)` : ''}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                    Enter a name for your new folder inside: <span className="font-mono text-foreground bg-muted p-1 rounded-sm">/{currentPath}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Blog Banners"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateFolder}>Create Folder</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the media file "{itemForDialog?.description}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
