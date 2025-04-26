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
        // Check if we have a code in the URL (OAuth flow)
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
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
          
          console.log('Successfully exchanged code for session');
        }
        
        // Now get the current session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        const { session } = data;
        if (!session) {
          throw new Error('No session found');
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
        
        // Wait a moment to ensure the session is properly set
        setTimeout(() => {
          // Redirect to home page
          navigate('/', { replace: true });
        }, 500);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during sign in');
        toast.error('Failed to sign in. Please try again.');
        navigate('/auth', { replace: true });
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-card p-8 rounded-md shadow-md max-w-md text-center" style={{ backgroundColor: '#141414', borderColor: '#333' }}>
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-card p-8 rounded-md shadow-md max-w-md text-center" style={{ backgroundColor: '#141414', borderColor: '#333' }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4 mx-auto" />
        <p className="text-lg font-medium" style={{ color: 'white' }}>Completing sign in...</p>
        <p className="text-sm" style={{ color: '#999' }}>Please wait while we redirect you.</p>
      </div>
    </div>
  );
} 