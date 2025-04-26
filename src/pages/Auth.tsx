import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogIn } from 'lucide-react';
import { Book, Upload, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast.success('Account created! Please check your email to confirm your account.');
      } else {
        await signIn('email', { email, password });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
      toast.error('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Direct Supabase OAuth call with explicit redirectTo
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      console.log('OAuth initiated:', { 
        url: data?.url ? 'Generated' : 'Missing',
        error: error?.message
      });
      
      if (error) throw error;
      
      // If we get here, the browser will be redirected by Supabase
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.');
      toast.error('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
    >
      <div className="w-full max-w-4xl flex gap-8 p-4">
        {/* Left side - Welcome message */}
        <div className="flex-1 hidden md:flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--color-text)" }}>Welcome to stash</h1>
            <p className="text-xl" style={{ color: "var(--color-text-muted)" }}>
              Your personal space for organizing and sharing notes with your classmates.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center" style={{ color: "var(--color-text-muted)" }}>
              <Book className="w-6 h-6 mr-4" />
              <span>Organize your class notes</span>
            </div>
            <div className="flex items-center" style={{ color: "var(--color-text-muted)" }}>
              <Upload className="w-6 h-6 mr-4" />
              <span>Share with your classmates</span>
            </div>
            <div className="flex items-center" style={{ color: "var(--color-text-muted)" }}>
              <Users className="w-6 h-6 mr-4" />
              <span>Join class communities</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <Card className="flex-1 max-w-md" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <CardHeader>
            <CardTitle className="text-2xl" style={{ color: "var(--color-text)" }}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription style={{ color: "var(--color-text-muted)" }}>
              {isSignUp
                ? 'Create a new account to get started'
                : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error-border)" }}>
                <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label style={{ color: "var(--color-text)" }}>Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    style={{ backgroundColor: "var(--color-input)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label style={{ color: "var(--color-text)" }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ backgroundColor: "var(--color-input)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--color-text)" }}>Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ backgroundColor: "var(--color-input)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                disabled={loading}
              >
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator style={{ backgroundColor: "var(--color-border)" }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span style={{ backgroundColor: "var(--color-card)", color: "var(--color-text-muted)" }} className="px-2">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ backgroundColor: "var(--color-input)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              style={{ color: "var(--color-text-muted)" }}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
