import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, User, Trash2, ArrowLeft, Calendar, School, Star } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import StashAnimation from '@/components/StashAnimation';
import { format } from 'date-fns';
import { NoteRating } from '@/components/NoteRating';
import { NoteComments } from '@/components/NoteComments';
import { NotePreview } from '@/components/NotePreview';
import { NotesFilter, FilterOptions } from '@/components/NotesFilter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  uploader_name: string;
  created_at: string;
  class_name: string;
  file_type: string;
  avg_rating: number;
  rating_count: number;
  professor: string | null;
  semester: string | null;
  school: string | null;
}

export default function Notes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    class_id: null,
    professor: null,
    semester: null,
    school: null,
    file_type: null,
    min_rating: null
  });

  // Fetch notes with ratings and apply filters
  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ['notes', filters],
    queryFn: async () => {
      let query = supabase
        .from('notes_with_ratings')
        .select(`*`);

      // Apply filters
      if (filters.search) {
        // Use search function for smart search with typo tolerance
        const { data, error } = await supabase.rpc('search_notes', {
          search_term: filters.search
        });
        
        if (error) throw error;
        return data;
      }

      // Apply additional filters
      if (filters.class_id) {
        query = query.eq('class_id', filters.class_id);
      }
      
      if (filters.professor) {
        query = query.eq('professor', filters.professor);
      }
      
      if (filters.semester) {
        query = query.eq('semester', filters.semester);
      }
      
      if (filters.school) {
        query = query.eq('school', filters.school);
      }
      
      if (filters.file_type) {
        query = query.eq('file_type', filters.file_type);
      }
      
      if (filters.min_rating) {
        query = query.gte('avg_rating', filters.min_rating);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleDownload = async (note: Note) => {
    if (!user) {
      toast.error('You must be logged in to download notes');
      return;
    }

    setIsDownloading(note.id);
    try {
      const { data, error } = await supabase.storage
        .from('notes')
        .download(note.file_path);

      if (error) throw error;

      // Create a URL for the blob
      const url = window.URL.createObjectURL(data);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = note.title;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Note downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download note');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      // Delete the file from storage first
      const { error: storageError } = await supabase.storage
        .from('notes')
        .remove([noteToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete the note record
      const { error: dbError } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteToDelete.id)
        .eq('uploader_id', user?.id); // Only delete if user is the uploader

      if (dbError) throw dbError;

      toast.success('Note deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete note');
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleRatingUpdate = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <StashAnimation type="loading" size="lg" isActive={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">All Notes</h1>
        </div>
        
        {/* Search and filters */}
        <div className="mb-8">
          <NotesFilter onFilterChange={handleFilterChange} activeFilters={filters} />
        </div>
        
        {notes && notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              {filters.search || Object.values(filters).some(v => v !== null && v !== '')
                ? 'Try adjusting your filters to find more notes'
                : 'Be the first to upload notes for your classes!'}
            </p>
            {(filters.search || Object.values(filters).some(v => v !== null && v !== '')) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setFilters({
                  search: '',
                  class_id: null,
                  professor: null,
                  semester: null,
                  school: null,
                  file_type: null,
                  min_rating: null
                })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes?.map((note) => (
              <Card key={note.id} style={{ backgroundColor: 'var(--color-card)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <FileText className="h-5 w-5" />
                    {note.title}
                    {note.file_type && (
                      <span className="text-xs uppercase bg-primary/10 rounded px-2 py-0.5 ml-auto">
                        {note.file_type}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--color-text)' }}>
                    {note.class_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {note.description && (
                      <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                        {note.description}
                      </p>
                    )}
                    
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                        <User className="h-3.5 w-3.5" />
                        {note.uploader_name}
                      </div>
                      <div className="flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(note.created_at), 'MMM d, yyyy')}
                      </div>
                      {note.professor && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                          <User className="h-3.5 w-3.5" />
                          {note.professor}
                        </div>
                      )}
                      {note.semester && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                          <Calendar className="h-3.5 w-3.5" />
                          {note.semester}
                        </div>
                      )}
                      {note.school && (
                        <div className="flex items-center gap-1 col-span-2" style={{ color: 'var(--color-text)' }}>
                          <School className="h-3.5 w-3.5" />
                          {note.school}
                        </div>
                      )}
                    </div>
                    
                    {/* Ratings */}
                    <NoteRating 
                      noteId={note.id} 
                      avgRating={note.avg_rating} 
                      ratingCount={note.rating_count}
                      onRatingUpdate={handleRatingUpdate}
                    />

                    {/* Comments */}
                    <NoteComments noteId={note.id} />
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <NotePreview 
                          noteId={note.id}
                          filePath={note.file_path}
                          fileType={note.file_type || 'unknown'}
                          title={note.title}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {profile?.is_admin && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setNoteToDelete(note)}
                            style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDownload(note)}
                          disabled={isDownloading === note.id}
                          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                        >
                          {isDownloading === note.id ? (
                            <div className="flex items-center gap-2">
                              <StashAnimation type="download" size="sm" isActive={true} />
                              <span>Downloading...</span>
                            </div>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: 'var(--color-text)' }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 