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
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        
        // First try to get the session directly
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('Found existing session:', {
            userId: existingSession.user.id,
            email: existingSession.user.email,
            metadata: existingSession.user.user_metadata
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

            console.log('Created new user profile');
          } else {
            console.log('Found existing profile');
          }

          // Show success message
          toast.success('Successfully signed in!');
          
          // Clear any hash from the URL to prevent redirect loops
          window.location.hash = '';
          
          // Redirect to home page
          window.location.href = window.location.origin;
          return;
        }
        
        // If no session exists, try to parse the hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Auth callback received:', { 
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          hashParams: Object.fromEntries(hashParams.entries())
        });

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens:', { accessToken, refreshToken });
          throw new Error('No authentication tokens found in URL');
        }

        // Set the session using the tokens
        console.log('Attempting to set session...');
        const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (setSessionError) {
          console.error('Session error:', setSessionError);
          throw setSessionError;
        }

        if (!session) {
          console.error('No session established');
          throw new Error('Failed to establish session');
        }

        console.log('Session established:', {
          userId: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
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

          console.log('Created new user profile');
        } else {
          console.log('Found existing profile');
        }

        // Show success message
        toast.success('Successfully signed in!');
        
        // Clear any hash from the URL to prevent redirect loops
        window.location.hash = '';
        
        // Redirect to home page
        window.location.href = window.location.origin;
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during sign in');
        toast.error('Failed to sign in. Please try again.');
        // Redirect to auth page on error
        window.location.href = window.location.origin + '/#/auth';
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [location]);

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
          onClick={() => window.location.href = window.location.origin + '#/auth'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return null;
} 