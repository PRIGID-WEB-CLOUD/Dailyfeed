

'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { likeComment } from '@/lib/comment-service';
import { useToast } from '@/hooks/use-toast';
import { usePublicSubscription } from '@/hooks/use-public-subscription';

export interface CommentWithReplies {
    id: string;
    author: string;
    text: string;
    avatar: string;
    createdAt: Timestamp;
    likes: number;
    replies: CommentWithReplies[];
}

interface CommentProps {
  comment: CommentWithReplies;
  onAddReply: (parentId: string, replyText: string, authorName?: string) => void;
  isReply?: boolean;
}

export function Comment({ comment, onAddReply, isReply = false }: CommentProps) {
    const { toast } = useToast();
    const { user } = usePublicSubscription();
    const [likes, setLikes] = useState(comment.likes || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [guestName, setGuestName] = useState('');

    useEffect(() => {
        const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
        setHasLiked(likedComments.includes(comment.id));
    }, [comment.id]);


    const handleLike = async () => {
        if (hasLiked) {
            toast({ title: "You've already liked this comment."});
            return;
        }

        const newLikesCount = likes + 1;
        setHasLiked(true);
        setLikes(newLikesCount);

        const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
        likedComments.push(comment.id);
        localStorage.setItem('likedComments', JSON.stringify(likedComments));

        try {
            await likeComment(comment.id, true);
        } catch (error) {
            console.error("Failed to update like status:", error);
            // Revert optimistic update on failure
            setHasLiked(false);
            setLikes(likes);
            const updatedLikedComments = likedComments.filter((id: string) => id !== comment.id);
            localStorage.setItem('likedComments', JSON.stringify(updatedLikedComments));
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update like status.',
            });
        }
    };

    const handleSubmitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            onAddReply(comment.id, replyText, user ? undefined : guestName);
            setReplyText('');
            setIsReplying(false);
        }
    };

    const avatarImage = PlaceHolderImages.find(p => p.id === comment.avatar);

    return (
        <div className={cn("flex items-start gap-4", isReply && "ml-4 md:ml-6 pl-4 md:pl-6 border-l-2")}>
            <Avatar className="h-10 w-10">
                {avatarImage && <AvatarImage src={avatarImage.url} alt={comment.author} data-ai-hint={avatarImage.hint}/>}
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                        </p>
                    </div>
                    <p className="text-foreground/80 mt-2">{comment.text}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 px-2">
                    <button onClick={handleLike} className={cn("flex items-center gap-1 hover:text-primary transition-colors", hasLiked && "text-red-500 hover:text-red-600")}>
                        <Heart className={cn("h-3 w-3 transition-transform", hasLiked && "fill-current scale-110")} />
                        <span>{likes > 0 ? likes : 'Like'}</span>
                    </button>
                    <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <MessageSquare className="h-3 w-3" />
                        Reply
                    </button>
                </div>

                {isReplying && (
                    <form onSubmit={handleSubmitReply} className="mt-4 flex flex-col gap-4">
                        {!user && (
                            <input 
                                type="text"
                                placeholder="Your Name (required)"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                                required
                            />
                        )}
                        <div className="flex gap-4">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Replying to ${comment.author}...`}
                                rows={2}
                                className="bg-background"
                            />
                            <div className="flex flex-col gap-2">
                                <Button type="submit" size="sm">Reply</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                            </div>
                        </div>
                    </form>
                )}
                
                {comment.replies.length > 0 && (
                    <div className="space-y-6 mt-6">
                        {comment.replies.map(reply => (
                            <Comment key={reply.id} comment={reply} onAddReply={onAddReply} isReply />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
