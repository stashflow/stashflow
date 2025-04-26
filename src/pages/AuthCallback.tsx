import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          console.log('Session found:', {
            userId: session.user.id,
            email: session.user.email
          });
          
          // Show success message
          toast.success('Successfully signed in!');
          
          // Redirect to home page
          navigate('/');
        } else {
          // If we don't have a session yet, let Supabase try to process any auth data in the URL
          const { error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            throw authError;
          }
          
          // Check again for session
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          
          if (refreshedSession) {
            console.log('Session established:', {
              userId: refreshedSession.user.id,
              email: refreshedSession.user.email
            });
            
            // Show success message
            toast.success('Successfully signed in!');
            
            // Redirect to home page
            navigate('/');
          } else {
            // No session found
            throw new Error('No authentication session found. Please try signing in again.');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during sign in');
        toast.error('Failed to sign in. Please try again.');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => navigate('/auth')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Completing sign in...</span>
    </div>
  );
} 