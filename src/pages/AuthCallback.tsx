import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback component mounted');
        console.log('Current URL:', window.location.href);
        console.log('Search:', window.location.search);
        
        // First try to get the session directly
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('Found existing session:', {
            userId: existingSession.user.id,
            email: existingSession.user.email
          });
          
          // Get the user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', existingSession.user.id)
            .single();

          if (profileError) {
            // If no profile exists, create one
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: existingSession.user.id,
                username: existingSession.user.email?.split('@')[0] || 'user',
                full_name: existingSession.user.user_metadata?.full_name || '',
                avatar_url: existingSession.user.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString()
              });

            if (createError) {
              console.error('Profile creation error:', createError);
              throw createError;
            }
          }

          // Show success message
          toast.success('Successfully signed in!');
          
          // Redirect to home page
          navigate('/');
          return;
        }

        // Parse the search parameters for the code
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        console.log('Auth callback received:', { 
          code: code ? 'present' : 'missing'
        });

        if (!code) {
          console.error('Missing code in URL');
          throw new Error('No authentication code found in URL');
        }

        // Exchange the code for a session
        console.log('Attempting to exchange code for session...');
        const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          throw exchangeError;
        }

        if (!session) {
          console.error('No session established');
          throw new Error('Failed to establish session');
        }

        console.log('Session established:', {
          userId: session.user.id,
          email: session.user.email
        });

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

        // Show success message
        toast.success('Successfully signed in!');
        
        // Redirect to home page
        navigate('/');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during sign in');
        toast.error('Failed to sign in. Please try again.');
        // Redirect to auth page on error
        navigate('/auth');
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Completing sign in...</span>
      </div>
    );
  }

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

  return null;
} 