import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UploadPage from "./pages/Upload";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Classes from "./pages/Classes";
import Notes from "./pages/Notes";
import AdminDashboard from "./pages/Admin";
import "./styles/themes.css";
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import StashLogoAnimation from '@/components/StashLogoAnimation';
import SplashAnimation from '@/components/SplashAnimation';

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoading } = useAuth();
  const { isCurrentThemeDark } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Log basic app info on start
  useEffect(() => {
    console.log('StashFlow Gallery starting...');
    console.log('URL:', window.location.href);
  }, []);

  if (showSplash) {
    return <SplashAnimation isActive={true} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <StashLogoAnimation size="lg" isActive={true} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout><Index /></MainLayout>} />
      <Route path="/auth" element={<AuthLayout><Auth /></AuthLayout>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/upload" element={<MainLayout><UploadPage /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
      <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
      <Route path="/classes" element={<MainLayout><Classes /></MainLayout>} />
      <Route path="/notes" element={<MainLayout><Notes /></MainLayout>} />
      <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
