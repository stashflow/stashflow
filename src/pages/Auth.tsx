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
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope } from "react-icons/fa";
import { signInWithGoogle } from "@/integrations/supabase/client";
<<<<<<< HEAD
import { Github } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, isLoading } = useAuth();
=======

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
=======
  const [isLoading, setIsLoading] = useState(false);
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7

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

<<<<<<< HEAD
  const handleGitHubSignIn = () => signIn('github');
  const handleGoogleSignIn = () => signIn('google');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to StashFlow</CardTitle>
          <CardDescription>
            Sign in to access your notes and collaborate with classmates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            {isLoading ? 'Loading...' : 'Sign in with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Github className="mr-2 h-5 w-5" />
            {isLoading ? 'Loading...' : 'Sign in with GitHub'}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
=======
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google sign-in...');
      await signInWithGoogle();
      // The OAuth redirect will happen automatically
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
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
              disabled={isLoading}
              style={{ backgroundColor: "var(--color-input)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
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
>>>>>>> 0a65a24826f34e0bd214347a0d3247e8c86c32b7
    </div>
  );
}
