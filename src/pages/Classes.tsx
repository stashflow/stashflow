import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Star, Plus, ArrowLeft, FileText, Trash2, StarOff } from 'lucide-react';
import { format } from 'date-fns';
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

type Class = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  semester: string;
  year: number;
  professor: string;
  created_at: string;
  is_archived: boolean;
  note_count: number;
  is_favorited: boolean;
  favorited_by: string | null;
};

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add debug logs
  console.log('Current user:', user);
  console.log('User ID:', user?.id);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    semester: '',
    year: new Date().getFullYear(),
    professor: ''
  });
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  // Fetch classes with favorite status
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes_with_favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Class[];
    }
  });

  // Create class mutation
  const createClass = useMutation({
    mutationFn: async (classData: typeof newClass) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          ...classData,
          created_by: user?.id,
          is_archived: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateDialogOpen(false);
      setNewClass({
        name: '',
        description: '',
        semester: '',
        year: new Date().getFullYear(),
        professor: ''
      });
      toast({
        title: 'Success',
        description: 'Class created successfully'
      });
    },
    onError: (error) => {
      console.error('Error creating class:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create class',
        variant: 'destructive'
      });
    }
  });

  // Toggle favorite mutation
  const toggleFavorite = useMutation({
    mutationFn: async ({ classId, isFavorited }: { classId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        const { error } = await supabase
          .from('class_favorites')
          .delete()
          .eq('class_id', classId)
          .eq('user_id', user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('class_favorites')
          .insert({
            class_id: classId,
            user_id: user?.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive'
      });
    }
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating class with user:', user?.id);
    console.log('Class data:', { ...newClass, created_by: user?.id });
    createClass.mutate(newClass);
  };

  const handleFavoriteClick = (classId: string, isFavorited: boolean) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to favorite classes',
        variant: 'destructive'
      });
      return;
    }
    toggleFavorite.mutate({ classId, isFavorited });
  };

  const handleDelete = async () => {
    if (!classToDelete) return;

    try {
      // First, delete all associated notes
      const { data: notes } = await supabase
        .from('notes')
        .select('id, file_path')
        .eq('class_id', classToDelete.id);

      if (notes && notes.length > 0) {
        // Delete files from storage
        const filePaths = notes.map(note => note.file_path);
        const { error: storageError } = await supabase.storage
          .from('notes')
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Delete the class (this will cascade delete notes due to foreign key)
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classToDelete.id)
        .eq('created_by', user?.id); // Only delete if user is the creator

      if (deleteError) throw deleteError;

      toast({
        title: 'Success',
        description: 'Class deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive'
      });
    } finally {
      setClassToDelete(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              style={{ color: 'var(--color-text)' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Classes</h1>
          </div>
          {user && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
              </DialogTrigger>
              <DialogContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: 'var(--color-text)' }}>Create New Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name" style={{ color: 'var(--color-text)' }}>Class Name</Label>
                    <Input
                      id="name"
                      value={newClass.name}
                      onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                      required
                      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" style={{ color: 'var(--color-text)' }}>Description</Label>
                    <Textarea
                      id="description"
                      value={newClass.description}
                      onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      className="h-20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="semester" style={{ color: 'var(--color-text)' }}>Semester</Label>
                    <Input
                      id="semester"
                      value={newClass.semester}
                      onChange={(e) => setNewClass(prev => ({ ...prev, semester: e.target.value }))}
                      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year" style={{ color: 'var(--color-text)' }}>Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newClass.year}
                      onChange={(e) => setNewClass(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="professor" style={{ color: 'var(--color-text)' }}>Professor</Label>
                    <Input
                      id="professor"
                      value={newClass.professor}
                      onChange={(e) => setNewClass(prev => ({ ...prev, professor: e.target.value }))}
                      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      Create
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8" style={{ color: 'var(--color-error)' }}>
            Error loading classes. Please try again.
          </div>
        ) : classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold truncate">{cls.name}</h2>
                    <div className="flex items-center gap-2">
                      {user && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setClassToDelete(cls)}
                          style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFavoriteClick(cls.id, cls.is_favorited)}
                        style={{ color: cls.is_favorited ? 'var(--color-warning)' : 'var(--color-text)' }}
                      >
                        {cls.is_favorited ? (
                          <Star className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarOff className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm opacity-70">{cls.semester} {cls.year}</div>
                  {cls.professor && (
                    <div className="text-sm opacity-70">Prof. {cls.professor}</div>
                  )}
                </CardHeader>
                <CardContent className="py-2">
                  <p className="line-clamp-2 text-sm opacity-80">{cls.description || 'No description provided.'}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center text-sm opacity-70">
                      <FileText className="h-4 w-4 mr-1" />
                      {cls.note_count} {cls.note_count === 1 ? 'note' : 'notes'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/classes/${cls.id}`)}
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      View Class
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 rounded-lg" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
            <h3 className="text-xl font-semibold mb-2">No Classes Found</h3>
            <p className="mb-6 opacity-70">Get started by creating your first class.</p>
            {user && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!classToDelete} onOpenChange={() => setClassToDelete(null)}>
        <AlertDialogContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This action cannot be undone and will also delete all notes associated with this class.
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