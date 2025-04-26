import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import StashAnimation from './StashAnimation';

type Note = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  uploader_name: string;
  created_at: string;
  updated_at: string;
  class_id: string;
  class_name: string;
};

const NotesGallery = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      console.log('Fetching notes...');
      console.log('Supabase client:', supabase);
      
      const { data, error } = await supabase
        .from('notes_with_classes')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST200') {
          toast({
            title: 'Database Error',
            description: 'The database tables might not be set up correctly. Please contact support.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load notes. Please try again later.',
            variant: 'destructive',
          });
        }
        return;
      }

      console.log('Fetched notes:', data);
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (note: Note) => {
    try {
      const { data, error } = await supabase.storage
        .from('notes')
        .download(note.file_path);

      if (error) throw error;

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = note.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success animation
      const successAnimation = document.createElement('div');
      successAnimation.className = 'min-h-screen flex flex-col items-center justify-center p-8 fixed inset-0 z-50';
      successAnimation.style.backgroundColor = 'var(--color-background)';
      successAnimation.style.color = 'var(--color-text)';
      successAnimation.innerHTML = `
        <div class="max-w-2xl w-full space-y-8">
          <div class="relative w-32 h-32">
            <div class="absolute inset-0" style="opacity: 0.3;">
              <div class="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 blur-xl"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center" style="opacity: 1; transform: none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload" style="color: white;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" x2="12" y1="3" y2="15"></line>
              </svg>
            </div>
          </div>
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-bold">Download Successful!</h2>
            <p class="text-slate-400">Your note has been downloaded successfully</p>
          </div>
        </div>
      `;
      document.body.appendChild(successAnimation);

      // Remove animation after 4 seconds (increased from 2)
      setTimeout(() => {
        successAnimation.remove();
      }, 2000);

      toast({
        title: 'Success',
        description: 'Note downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading note:', error);
      toast({
        title: 'Error',
        description: 'Failed to download note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <StashAnimation type="loading" size="lg" isActive={true} />
        <p className="mt-4 text-slate-400">Loading your notes...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg mb-4">No notes found</p>
        <p className="text-slate-500 text-sm">
          Be the first to share your notes with the community!
        </p>
        <Link to="/upload" className="mt-4 inline-block">
          <Button variant="outline" className="border-purple-500 bg-purple-600/80 text-white hover:bg-purple-700">
            Upload Notes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {notes.map(note => (
        <Card 
          key={note.id} 
          className="bg-slate-800 border-slate-600 hover:border-blue-500 transition-all duration-300 transform hover:scale-102 hover:shadow-lg hover:shadow-blue-500/20 overflow-hidden"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-medium py-1 px-2 bg-blue-900/50 text-blue-300 rounded-full">
                  {note.class_name || 'Unknown Class'}
                </span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mt-2 leading-tight text-white">
              {note.title}
            </h3>
            {note.description && (
              <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                {note.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-sm text-slate-400">
              Uploaded by <span className="text-slate-300">{note.uploader_name}</span>
            </div>
            <div className="text-xs text-slate-500">
              {format(new Date(note.created_at), 'MMM d, yyyy')}
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-slate-600 text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-500 group"
              onClick={() => handleDownload(note)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default NotesGallery;
