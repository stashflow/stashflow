import { createContext, useContext, useEffect, useState } from 'react';
<<<<<<< HEAD
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
=======
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
<<<<<<< HEAD
  signIn: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<void>;
=======
  signIn: (provider: 'google' | 'email', credentials?: { email: string; password: string }) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { username?: string; full_name?: string; avatar_url?: string }) => Promise<void>;
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

<<<<<<< HEAD
  const signIn = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(true);
      
=======
  const signIn = async (provider: 'google' | 'email', credentials?: { email: string; password: string }) => {
    try {
      if (provider === 'google') {
        console.log('Starting Google OAuth sign-in');
        
        // Get the redirectUrl from Supabase client to ensure consistency
        // This is set in src/integrations/supabase/client.ts
        const isGitHubPages = window.location.hostname.includes('github.io');
        const redirectUrl = isGitHubPages 
          ? `${window.location.origin}/auth_callback.html`
          : `${window.location.origin}/#/auth/callback`;
        
        console.log('Auth redirect URL:', redirectUrl);
        
        // Initiate OAuth sign-in
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          },
        });
        
        console.log('OAuth sign-in initiated:', { 
          url: data?.url ? 'Generated' : 'Missing',
          provider: 'google',
          redirectTo: redirectUrl
        });
        
        if (error) {
          console.error('OAuth initiation error:', error);
          throw error;
        }
        
        // Browser will redirect to Google
        return;
      } else if (provider === 'email' && credentials) {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (error) throw error;
      } else {
        throw new Error('Invalid authentication method');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please check your credentials.');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
      // Get the redirectUrl from Supabase client to ensure consistency
      const isGitHubPages = window.location.hostname.includes('github.io');
      const redirectUrl = isGitHubPages 
        ? `${window.location.origin}/auth_callback.html`
        : `${window.location.origin}/#/auth/callback`;
      
<<<<<<< HEAD
      console.log('Auth redirect URL:', redirectUrl);
      
      // Initiate OAuth sign-in
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('OAuth initiation error:', error);
        throw error;
      }
      
      // Browser will redirect to provider
      return;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
=======
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      toast.success('Account created! Please check your email to confirm your account.');
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('Failed to create account. Please try again.');
      throw error;
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
      throw error;
    }
  };

<<<<<<< HEAD
=======
  const updateProfile = async (updates: { username?: string; full_name?: string; avatar_url?: string }) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    }
  };

>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
  const value = {
    user,
    session,
    isLoading,
    signIn,
<<<<<<< HEAD
    signOut
=======
    signUp,
    signOut,
    updateProfile,
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
