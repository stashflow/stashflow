import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
=======
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD

  useEffect(() => {
    const handleCallback = async () => {
      try {
=======
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Handle the auth response
    const handleAuthResponse = async () => {
      try {
        setProcessing(true);
        console.log('Auth callback component mounted');
        console.log('Current URL:', window.location.href);
        
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
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
          
<<<<<<< HEAD
=======
          // Get or create user profile
          await handleUserProfile(session);
          
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
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
            
<<<<<<< HEAD
=======
            // Get or create user profile
            await handleUserProfile(refreshedSession);
            
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
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
<<<<<<< HEAD
      }
    };

    handleCallback();
  }, [navigate]);

=======
      } finally {
        setProcessing(false);
      }
    };

    async function handleUserProfile(session) {
      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        // If no profile exists, create one
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            full_name: session.user.user_metadata?.full_name || '',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Profile creation error:', createError);
          throw createError;
        }
      }
    }

    handleAuthResponse();
  }, [navigate]);

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Completing sign in...</span>
      </div>
    );
  }

>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
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

<<<<<<< HEAD
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Completing sign in...</span>
    </div>
  );
=======
  return null;
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
} 