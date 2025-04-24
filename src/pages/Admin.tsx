import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface Class {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Note {
  id: number;
  title: string;
  description: string;
  file_path: string;
  uploader_id: string;
  uploader_name: string;
  class_id: number;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState<Class[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_admin_status', {
          user_email: user.email
        });
        if (error) throw error;
        setIsAdmin(data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        switch (activeTab) {
          case 'classes':
            const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
            if (classesError) throw classesError;
            setClasses(classesData);
            break;
          case 'notes':
            const { data: notesData, error: notesError } = await supabase.from('notes').select('*');
            if (notesError) throw notesError;
            setNotes(notesData);
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        toast.error(`Failed to fetch ${activeTab}`);
      }
    };

    fetchData();
  }, [activeTab, isAdmin]);

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('Are you sure you want to delete this class? This will also delete all notes in the class.')) return;
    
    try {
      // First, get all notes in this class
      const { data: classNotes, error: notesError } = await supabase
        .from('notes')
        .select('id, file_path')
        .eq('class_id', classId);

      if (notesError) throw notesError;

      // Delete all note files from storage if there are any
      if (classNotes && classNotes.length > 0) {
        const filePaths = classNotes.map(note => note.file_path);
        const { error: storageError } = await supabase.storage
          .from('notes')
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Delete the class (this will cascade delete notes due to foreign key)
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (deleteError) throw deleteError;

      toast.success('Class deleted successfully');
      // Refresh classes list
      const { data, error: refreshError } = await supabase.from('classes').select('*');
      if (refreshError) throw refreshError;
      setClasses(data);
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      // First get the note to get its file path
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('file_path')
        .eq('id', noteId)
        .single();

      if (noteError) throw noteError;

      // Delete the file from storage first
      if (note?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('notes')
          .remove([note.file_path]);

        if (storageError) throw storageError;
      }

      // Delete the note record
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) throw deleteError;

      toast.success('Note deleted successfully');
      // Refresh notes list
      const { data, error: refreshError } = await supabase.from('notes').select('*');
      if (refreshError) throw refreshError;
      setNotes(data);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'classes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Classes
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'notes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Notes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'classes' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(cls.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notes.map((note) => (
                      <tr key={note.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{note.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{note.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(note.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 