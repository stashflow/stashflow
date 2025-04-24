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
        // Parse the hash if it exists
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        // Check if we have a code in the URL (OAuth flow) or access_token in hash
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        if (!code && !accessToken) {
          throw new Error('No authentication code or token found');
        }

        let session;
        
        if (code) {
          console.log('Auth code detected in URL, processing OAuth callback...');
          
          // Exchange the code for a session
          const { data: authData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            throw exchangeError;
          }
          
          if (!authData.session) {
            throw new Error('No session returned from code exchange');
          }
          
          session = authData.session;
          console.log('Successfully exchanged code for session');
        } else if (accessToken) {
          // If we have an access token in the hash, set the session
          const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          session = authSession;
        }
        
        if (!session) {
          throw new Error('No session established');
        }

        console.log('Session obtained:', session.user.id);

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
            .insert([
              {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'user',
                full_name: session.user.user_metadata?.full_name || '',
                avatar_url: session.user.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString()
              }
            ]);

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
        
        // Redirect to home page using window.location to ensure a clean redirect
        window.location.href = '/';
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during sign in');
        toast.error('Failed to sign in. Please try again.');
        // Redirect to auth page on error
        window.location.href = '/auth';
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
          onClick={() => window.location.href = '/auth'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return null;
} 