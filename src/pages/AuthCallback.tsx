import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setProcessing(true);
        console.log('OAuth redirect handler');
        
        // Get the full URL
        const fullUrl = window.location.href;
        console.log('Full redirect URL:', fullUrl);
        
        // Check for hash parameters
        const hash = window.location.hash.substring(1);
        console.log('Hash string:', hash);
        
        // Parse hash parameters
        const hashParams = new URLSearchParams(hash);
        const params = {
          access_token: hashParams.get('access_token'),
          refresh_token: hashParams.get('refresh_token'),
          token_type: hashParams.get('token_type')
        };
        console.log('Found hash parameters:', params);
        
        // Check for search parameters
        const searchParams = new URLSearchParams(window.location.search);
        const search = {
          code: searchParams.get('code'),
          state: searchParams.get('state'),
          error: searchParams.get('error'),
          error_description: searchParams.get('error_description')
        };
        console.log('Search params:', search);
        
        // Check if we have tokens in the hash
        if (params.access_token && params.refresh_token) {
          console.log('Found tokens in hash, redirecting to main app...');
          navigate('/');
          return;
        }
        
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
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during sign in');
        toast.error('Failed to sign in. Please try again.');
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
} 