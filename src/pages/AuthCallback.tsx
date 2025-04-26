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
        console.log('Starting auth callback...');
        console.log('Current URL:', window.location.href);
        
        // First try to get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          // If no session, try to get it from the URL
          const { data: { session: urlSession }, error: urlError } = await supabase.auth.getSession();
          
          if (urlError) {
            console.error('URL session error:', urlError);
            throw urlError;
          }

          if (!urlSession) {
            throw new Error('No session found');
          }
        }

        const currentSession = session || urlSession;
        console.log('Session obtained:', currentSession?.user.id);

        // Get the user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          // If no profile exists, create one
          const { error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: currentSession.user.id,
                username: currentSession.user.email?.split('@')[0] || 'user',
                full_name: currentSession.user.user_metadata?.full_name || '',
                avatar_url: currentSession.user.user_metadata?.avatar_url || null,
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