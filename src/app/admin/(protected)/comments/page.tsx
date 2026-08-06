
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Trash2, ShieldX, XCircle, Loader2, Sparkles } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Comment, CommentStatus } from '@/lib/types';
import { generateCommentReply } from '@/ai/flows/generate-comment-reply';
import { Textarea } from '@/components/ui/textarea';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateCommentStatus, deleteComment } from '@/lib/comment-service';


function CommentItem({
  comment,
  onStatusChange,
  onDelete,
}: {
  comment: Comment;
  onStatusChange: (id: string, status: CommentStatus) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const avatarImage = PlaceHolderImages.find((img) => img.id === comment.avatar);

  const getBadgeVariant = (status: CommentStatus) => {
    switch (status) {
      case 'Approved':
        return 'secondary';
      case 'Spam':
      case 'Rejected':
        return 'destructive';
      case 'Pending':
      default:
        return 'outline';
    }
  };

  const handleGenerateReply = async () => {
    setIsGenerating(true);
    setShowReply(true);
    try {
      const result = await generateCommentReply({
        postTitle: comment.postTitle,
        postContent: "A mock blog post content to provide context for the AI to generate a reply.",
        originalCommentAuthor: comment.author,
        originalCommentText: comment.text,
      });
      setReplyText(result.replyText);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Reply',
        description: 'Could not generate an AI reply at this time.',
      });
      setShowReply(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostReply = () => {
    toast({
      title: 'Reply Posted!',
      description: `Your reply to ${comment.author} has been posted. (This is a mock action)`,
    });
    setShowReply(false);
    setReplyText('');
  };

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <Avatar>
        <AvatarImage src={avatarImage?.url} alt={comment.author} data-ai-hint={avatarImage?.hint} />
        <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">{comment.author}</span>
            <span className="text-sm text-muted-foreground"> commented on </span>
            <span className="font-medium text-primary">"{comment.postTitle}"</span>
          </div>
          <Badge variant={getBadgeVariant(comment.status)}>{comment.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{comment.text}</p>
        <div className="flex gap-2 pt-2 flex-wrap">
          {comment.status !== 'Approved' && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(comment.id, 'Approved')}>
              <Check className="mr-2 h-4 w-4" />Approve
            </Button>
          )}
          {comment.status !== 'Rejected' && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(comment.id, 'Rejected')}>
              <XCircle className="mr-2 h-4 w-4" />Reject
            </Button>
          )}
          {comment.status !== 'Spam' && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(comment.id, 'Spam')}>
              <ShieldX className="mr-2 h-4 w-4" />Spam
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleGenerateReply} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI Reply
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(comment.id)}>
            <Trash2 className="mr-2 h-4 w-4" />Delete
          </Button>
        </div>
        {showReply && (
          <div className="pt-4 space-y-2">
            <Textarea
              placeholder="AI is thinking..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowReply(false)}>
                Cancel
              </Button>
              <Button onClick={handlePostReply} disabled={!replyText}>
                Post Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsPage() {
  const { toast } = useToast();
  const [commentsSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'comments'), orderBy('createdAt', 'desc'))
  );
  
  const comments = commentsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Comment, 'id'>, createdAt: (doc.data().createdAt as Timestamp) } as Comment)) || [];

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error loading comments', description: error.message });
    }
  }, [error, toast]);

  const handleStatusChange = async (id: string, status: CommentStatus) => {
    try {
      await updateCommentStatus(id, status);
      toast({ title: `Comment marked as ${status}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error updating comment' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      toast({
        variant: 'destructive',
        title: 'Comment Deleted',
        description: 'The comment has been permanently removed.',
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting comment' });
    }
  };

  const filteredComments = (status: CommentStatus) => comments.filter(c => c.status === status);
  
  const renderTabContent = (status: CommentStatus) => {
    if (isLoading) {
      return <div className="text-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /></div>;
    }
    const commentsForTab = filteredComments(status);
    const emptyMessages: Record<CommentStatus, string> = {
      Approved: "No approved comments yet.",
      Spam: "Spam folder is empty.",
      Rejected: "No rejected comments.",
      Pending: "No pending comments to review.",
    };
    return (
       <div className="mt-4 space-y-4">
        {commentsForTab.length > 0 ? (
          commentsForTab.map(comment => (
            <CommentItem key={comment.id} comment={comment} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          ))
        ) : (
          <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">{emptyMessages[status]}</h3>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Moderation</CardTitle>
        <CardDescription>
          Review and moderate AI-classified comments on your posts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending <Badge variant="outline" className="ml-2">{filteredComments('Pending').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved <Badge variant="secondary" className="ml-2">{filteredComments('Approved').length}</Badge>
            </TabsTrigger>
             <TabsTrigger value="rejected">
              Rejected <Badge variant="destructive" className="ml-2">{filteredComments('Rejected').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="spam">
              Spam <Badge variant="destructive" className="ml-2">{filteredComments('Spam').length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">{renderTabContent('Pending')}</TabsContent>
          <TabsContent value="approved">{renderTabContent('Approved')}</TabsContent>
          <TabsContent value="rejected">{renderTabContent('Rejected')}</TabsContent>
          <TabsContent value="spam">{renderTabContent('Spam')}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
