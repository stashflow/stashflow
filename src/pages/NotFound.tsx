import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    // If we're on GitHub Pages and the URL doesn't have a hash, redirect to hash-based route
    if (window.location.hostname.includes('github.io') && !window.location.hash) {
      const path = window.location.pathname;
      if (path === '/auth') {
        window.location.href = '/#/auth';
        return;
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Return to Home
      </button>
    </div>
  );
}
