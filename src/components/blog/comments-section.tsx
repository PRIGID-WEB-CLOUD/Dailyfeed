

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { MessageSquare, Heart, Loader2, Mic, StopCircle } from 'lucide-react';
import type { Post, Comment as CommentType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Comment, type CommentWithReplies } from './comment';
import { Card, CardContent } from '@/components/ui/card';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import Link from 'next/link';
import { speechToText } from '@/ai/flows/speech-to-text';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addComment } from '@/lib/comment-service';


const commentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty.'),
  guestName: z.string().optional(),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentsSectionProps {
    post: Post;
    handleLike: () => void;
    likes: number;
    hasLiked: boolean;
}

export function CommentsSection({ post, handleLike, likes, hasLiked }: CommentsSectionProps) {
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: isSubscriptionLoading } = usePublicSubscription();
    
    const [commentsSnapshot, isLoading, error] = useCollection(
        query(collection(db, 'comments'), where('postId', '==', post.id), where('status', '==', 'Approved'), orderBy('createdAt', 'asc'))
    );
    
    const comments: CommentWithReplies[] = useMemo(() => {
        if (!commentsSnapshot) return [];
        
        const allComments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<CommentType, 'id'>),
            replies: [],
        } as unknown as CommentWithReplies));
        
        const commentMap = new Map<string, CommentWithReplies>();
        const rootComments: CommentWithReplies[] = [];

        allComments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        allComments.forEach(comment => {
            if (comment.parentId && commentMap.has(comment.parentId)) {
                commentMap.get(comment.parentId)!.replies.push(commentMap.get(comment.id)!);
            } else {
                rootComments.push(commentMap.get(comment.id)!);
            }
        });
        
        return rootComments;

    }, [commentsSnapshot]);


    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if(error) {
            toast({ variant: 'destructive', title: 'Error loading comments', description: error.message });
        }
    }, [error, toast]);


    const form = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: { comment: '', guestName: '' },
    });
    
    const onSubmit = async (data: CommentFormValues) => {
        const authorName = user ? user.name : data.guestName;
        if (!authorName) {
            form.setError('guestName', { message: 'Please enter your name to post a comment.' });
            return;
        }

        try {
            await addComment(post.id, {
                author: authorName,
                authorId: user ? user.id : 'guest',
                avatar: user ? user.avatar : 'avatar3', // A default guest avatar
                text: data.comment,
            });
            form.reset();
            toast({
                title: 'Comment Submitted!',
                description: 'Your comment is awaiting moderation.',
            });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your comment.' });
        }
    };
    
    const handleAddReply = async (parentId: string, replyText: string, guestName?: string) => {
        const authorName = user ? user.name : guestName;
        if (!authorName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name is required to post a reply.' });
            return;
        }

        try {
            await addComment(post.id, {
                author: authorName,
                authorId: user ? user.id : 'guest',
                avatar: user ? user.avatar : 'avatar3',
                text: replyText,
            }, parentId);
            toast({
                title: 'Reply Submitted!',
                description: 'Your reply is awaiting moderation.',
            });
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your reply.' });
        }
    };
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = handleStopRecording;
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access the microphone.'});
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsTranscribing(true);
        }
    };
    
    const handleStopRecording = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
                const result = await speechToText({ audio: base64Audio });
                const currentText = form.getValues('comment');
                form.setValue('comment', currentText ? `${currentText} ${result.transcription}` : result.transcription);
            } catch (error) {
                console.error("Transcription failed:", error);
                toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not convert speech to text.'});
            } finally {
                setIsTranscribing(false);
            }
        };
    };

    const isLoadingState = isLoading || isSubscriptionLoading;

    const renderCommentForm = () => {
      if (isLoadingState) {
        return (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        );
      }
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isAuthenticated && (
                <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter your name to comment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                   <FormLabel>Your Comment</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Join the discussion or use the mic to talk..."
                        rows={4}
                        {...field}
                        className="bg-background pr-12"
                      />
                      <div className="absolute top-3 right-3">
                         {isRecording ? (
                              <Button type="button" size="icon" variant="destructive" onClick={stopRecording}>
                                  <StopCircle />
                              </Button>
                          ) : (
                              <Button type="button" size="icon" variant="outline" onClick={startRecording} disabled={isTranscribing}>
                                  {isTranscribing ? <Loader2 className="animate-spin" /> : <Mic />}
                              </Button>
                          )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Post Comment</Button>
            </div>
          </form>
        </Form>
      );
    };

    return (
        <div className="mt-12 pt-8 border-t">
            <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                    <MessageSquare className="h-7 w-7" />
                    <span>{commentsSnapshot?.docs.length || 0} Comments</span>
                 </h3>
                 <button onClick={handleLike} className={cn("flex items-center gap-2 text-muted-foreground font-medium text-lg", hasLiked && "text-red-500")}>
                    <Heart className={cn("h-7 w-7 transition-transform", hasLiked && "fill-current")} />
                    <span>{likes}</span>
                </button>
            </div>
            
            <Card className="mb-12 bg-muted/20 border-none shadow-none">
                <CardContent className="p-6">
                    {renderCommentForm()}
                </CardContent>
            </Card>

            <div className="space-y-8">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    </div>
                ) : comments.map((comment) => (
                    <Comment key={comment.id} comment={comment} onAddReply={handleAddReply} />
                ))}
            </div>
        </div>
    );
}
