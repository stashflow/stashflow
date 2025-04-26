import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NoteRatingProps {
  noteId: string;
  avgRating: number;
  ratingCount: number;
  onRatingUpdate: () => void;
}

export function NoteRating({ noteId, avgRating, ratingCount, onRatingUpdate }: NoteRatingProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string | null>(null);

  // Fetch user's existing rating if they have one
  useEffect(() => {
    if (user) {
      const fetchUserRating = async () => {
        const { data, error } = await supabase
          .from('note_ratings')
          .select('rating, comment')
          .eq('note_id', noteId)
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setUserRating(data.rating);
          setUserComment(data.comment);
          setSelectedRating(data.rating);
          setComment(data.comment || '');
        }
      };

      fetchUserRating();
    }
  }, [noteId, user]);

  const handleRatingSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to rate notes');
      return;
    }

    if (selectedRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user has already rated this note
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('note_ratings')
          .update({
            rating: selectedRating,
            comment: comment || null
          })
          .eq('note_id', noteId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new rating
        const { error } = await supabase
          .from('note_ratings')
          .insert({
            note_id: noteId,
            user_id: user.id,
            rating: selectedRating,
            comment: comment || null
          });

        if (error) throw error;
      }

      toast.success('Rating submitted successfully');
      setUserRating(selectedRating);
      setUserComment(comment);
      setIsDialogOpen(false);
      onRatingUpdate();
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get color based on rating
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#22c55e'; // Green for excellent
    if (rating >= 3.5) return '#3b82f6'; // Blue for good
    if (rating >= 2.5) return '#f59e0b'; // Yellow for average
    if (rating >= 1.5) return '#f97316'; // Orange for below average
    return '#ef4444'; // Red for poor
  };

  const ratingColor = getRatingColor(avgRating);

  return (
    <div className="space-y-2">
      {/* Rating Display */}
      <div 
        className="flex items-center justify-between px-3 py-2 rounded-md" 
        style={{ 
          backgroundColor: `${ratingColor}20`, // Translucent background
          borderLeft: `3px solid ${ratingColor}`
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= avgRating 
                    ? 'fill-current text-current' 
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                style={{ color: star <= avgRating ? ratingColor : undefined }}
              />
            ))}
          </div>
          <span className="font-medium text-sm ml-1" style={{ color: ratingColor }}>
            {avgRating > 0 ? avgRating.toFixed(1) : 'Unrated'}
          </span>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <MessageSquare size={14} className="mr-1" />
          {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Rate button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="w-full text-xs gap-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5"
      >
        {userRating ? (
          <>
            <Star className="h-4 w-4 fill-primary text-primary" />
            Edit your rating
          </>
        ) : (
          <>
            <Star className="h-4 w-4" />
            Rate this note
          </>
        )}
      </Button>

      {/* Rating dialog */}
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
            <DialogTitle className="text-center">Rate this note</DialogTitle>
            <DialogDescription className="text-center">
              Your feedback helps others find quality notes
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Star rating selector */}
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-all hover:scale-110 ${
                    star <= selectedRating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                  onClick={() => setSelectedRating(star)}
                />
              ))}
            </div>

            {/* Selected rating text */}
            {selectedRating > 0 && (
              <div className="text-center text-sm font-medium" style={{ color: getRatingColor(selectedRating) }}>
                {selectedRating === 5 && "Excellent! Extremely helpful note"}
                {selectedRating === 4 && "Very good note"}
                {selectedRating === 3 && "Good, useful note"}
                {selectedRating === 2 && "Below average note"}
                {selectedRating === 1 && "Poor quality note"}
              </div>
            )}

            {/* Comment area */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add a comment (optional)</label>
              <Textarea
                placeholder="Share details of your experience with this note..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none h-24"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
              />
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-primary/5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    {(user.email || user.user_metadata?.full_name || 'A')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">Your review will be posted publicly</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-gray-300"
              style={{ color: 'var(--color-text)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRatingSubmit}
              disabled={isSubmitting || selectedRating === 0}
              className="transition-all"
              style={{ 
                backgroundColor: selectedRating ? getRatingColor(selectedRating) : 'var(--color-primary)', 
                color: 'white',
                opacity: selectedRating === 0 ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 