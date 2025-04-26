import { useState, useEffect } from 'react';
import { MessageSquare, Heart, User, Clock, ThumbsUp, Edit, Trash2, Reply, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentType {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  email: string;
  avatar_url: string | null;
  user_name: string;
  likes_count: number;
  replies_count: number;
  reply_to_id: string | null;
  is_reply: boolean;
  replies?: CommentType[];
}

interface NoteCommentsProps {
  noteId: string;
}

// Format date as "x time ago"
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  
  // Format as date if older than a month
  return format(date, 'MMM d, yyyy');
};

export function NoteComments({ noteId }: NoteCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentType | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userLikedComments, setUserLikedComments] = useState<Set<string>>(new Set());
  const [visibleComments, setVisibleComments] = useState(2);
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set());
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Fetch comments for this note
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('note_id', noteId)
        .is('reply_to_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setComments(data || []);
      
      // If user is logged in, fetch which comments they've liked
      if (user) {
        const { data: likedData, error: likedError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
          
        if (!likedError && likedData) {
          const likedSet = new Set(likedData.map(item => item.comment_id));
          setUserLikedComments(likedSet);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [noteId, user]);

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('note_comments')
        .insert({
          note_id: noteId,
          user_id: user.id,
          content: newComment.trim(),
          reply_to_id: replyingTo?.id || null,
          is_reply: !!replyingTo
        });

      if (error) throw error;

      toast.success(replyingTo ? 'Reply added successfully' : 'Comment added successfully');
      setNewComment('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment) return;
    
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('note_comments')
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingComment.id);

      if (error) throw error;

      toast.success('Comment updated successfully');
      setIsDialogOpen(false);
      setEditingComment(null);
      fetchComments();
    } catch (error) {
      console.error('Comment update error:', error);
      toast.error('Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('note_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted successfully');
      fetchComments();
    } catch (error) {
      console.error('Comment delete error:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('You must be logged in to like comments');
      return;
    }

    try {
      if (userLikedComments.has(commentId)) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Update local state
        setUserLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        
        // Update comment likes count in UI
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? {...comment, likes_count: Math.max(0, comment.likes_count - 1)} 
            : comment
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;
        
        // Update local state
        setUserLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.add(commentId);
          return newSet;
        });
        
        // Update comment likes count in UI
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? {...comment, likes_count: comment.likes_count + 1} 
            : comment
        ));
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to update like');
    }
  };

  const fetchReplies = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('reply_to_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Update the comments state with the replies
      setComments(prev => {
        const updatedComments = [...prev];
        const parentIndex = updatedComments.findIndex(c => c.id === commentId);
        if (parentIndex !== -1) {
          updatedComments[parentIndex] = {
            ...updatedComments[parentIndex],
            replies: data || []
          };
        }
        return updatedComments;
      });
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load replies');
    }
  };

  const toggleReplies = async (commentId: string) => {
    setShowReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
        fetchReplies(commentId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
      >
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-medium">Comments</h3>
        <span className="text-muted-foreground text-sm">
          ({comments.length})
        </span>
        <ChevronDown 
          className={`h-4 w-4 ml-auto transition-transform ${isCommentsOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isCommentsOpen && (
        <>
          {/* Add comment section */}
          {user && (
            <div className="flex gap-3 items-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  {(user.email || user.user_metadata?.full_name || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {replyingTo && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Replying to {replyingTo.user_name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none"
                  style={{ 
                    backgroundColor: 'var(--color-background)', 
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  }}
                />
                <Button 
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  size="sm"
                  className="ml-auto"
                >
                  {isSubmitting ? 'Submitting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                </Button>
              </div>
            </div>
          )}

          {!user && (
            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
              Sign in to add a comment
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-4 mt-6">
            {isLoading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </div>
                </div>
              ))
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <>
                {comments.slice(0, visibleComments).map((comment) => (
                  <div key={comment.id}>
                    <div 
                      className="p-3 rounded-lg border"
                      style={{ 
                        backgroundColor: 'var(--color-card)', 
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 items-center">
                          <Avatar className="h-7 w-7">
                            {comment.avatar_url ? (
                              <AvatarImage src={comment.avatar_url} />
                            ) : (
                              <AvatarFallback style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                                {comment.user_name[0].toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{comment.user_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(new Date(comment.created_at))}
                            </p>
                          </div>
                        </div>

                        {/* Actions dropdown for own comments */}
                        {user && comment.user_id === user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingComment(comment);
                                  setEditContent(comment.content);
                                  setIsDialogOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteComment(comment.id)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <p className="py-1 text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                        {comment.content}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeComment(comment.id)}
                            className={`text-xs flex items-center gap-1 py-1 px-2 rounded-full ${
                              userLikedComments.has(comment.id) ? 'text-primary' : ''
                            }`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${
                              userLikedComments.has(comment.id) ? 'fill-primary' : ''
                            }`} />
                            {comment.likes_count > 0 && comment.likes_count}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(comment)}
                            className="text-xs flex items-center gap-1 py-1 px-2 rounded-full"
                          >
                            <Reply className="h-3.5 w-3.5" />
                            Reply
                          </Button>
                        </div>
                        {comment.replies_count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReplies(comment.id)}
                            className="text-xs flex items-center gap-1 py-1 px-2 rounded-full"
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${
                              showReplies.has(comment.id) ? 'rotate-180' : ''
                            }`} />
                            {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Replies section */}
                    {showReplies.has(comment.id) && comment.replies && (
                      <div className="ml-8 mt-2 space-y-2">
                        {comment.replies.map((reply) => (
                          <div 
                            key={reply.id}
                            className="p-3 rounded-lg border"
                            style={{ 
                              backgroundColor: 'var(--color-card)', 
                              borderColor: 'var(--color-border)'
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2 items-center">
                                <Avatar className="h-6 w-6">
                                  {reply.avatar_url ? (
                                    <AvatarImage src={reply.avatar_url} />
                                  ) : (
                                    <AvatarFallback style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                                      {reply.user_name[0].toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{reply.user_name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatRelativeTime(new Date(reply.created_at))}
                                  </p>
                                </div>
                              </div>

                              {/* Actions dropdown for own replies */}
                              {user && reply.user_id === user.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="1" />
                                        <circle cx="12" cy="5" r="1" />
                                        <circle cx="12" cy="19" r="1" />
                                      </svg>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingComment(reply);
                                        setEditContent(reply.content);
                                        setIsDialogOpen(true);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            <p className="py-1 text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                              {reply.content}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikeComment(reply.id)}
                                className={`text-xs flex items-center gap-1 py-1 px-2 rounded-full ${
                                  userLikedComments.has(reply.id) ? 'text-primary' : ''
                                }`}
                              >
                                <ThumbsUp className={`h-3.5 w-3.5 ${
                                  userLikedComments.has(reply.id) ? 'fill-primary' : ''
                                }`} />
                                {reply.likes_count > 0 && reply.likes_count}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {comments.length > visibleComments && (
                  <Button
                    variant="outline"
                    onClick={() => setVisibleComments(prev => prev + 2)}
                    className="w-full"
                  >
                    Show More Comments
                  </Button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Edit comment dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="max-w-md" 
          style={{ 
            backgroundColor: 'var(--color-card)', 
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)'
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit your comment</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="resize-none h-32"
              style={{ 
                backgroundColor: 'var(--color-background)', 
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-gray-300"
              style={{ color: 'var(--color-text)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditComment}
              disabled={isSubmitting || !editContent.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 