import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-9xl font-bold" style={{ color: 'var(--color-primary)' }}>404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-lg" style={{ color: 'var(--color-text)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-4" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
