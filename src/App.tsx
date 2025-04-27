import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import { Loader2, Package } from 'lucide-react';
import StashLogoAnimation from '@/components/StashLogoAnimation';
import SplashAnimation from '@/components/SplashAnimation';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

// Custom stashing animation component
const StashTransition = ({ children }) => {
  const { isCurrentThemeDark } = useTheme();
  
  return (
    <div className="relative overflow-hidden">
      {/* The content being stashed */}
      {children}
      
      {/* The stash box outline that appears briefly */}
      <AnimatePresence>
        <motion.div
          className="absolute inset-x-0 top-0 z-40 pointer-events-none"
          initial={{ height: 0 }}
          animate={{ height: 0 }}
          exit={{ height: "100vh" }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {/* Box top edge */}
          <div className="absolute top-0 inset-x-0 h-3 bg-primary" />
          
          {/* Box left edge */}
          <div className="absolute left-0 top-0 w-3 h-full bg-primary" />
          
          {/* Box right edge */}
          <div className="absolute right-0 top-0 w-3 h-full bg-primary" />
        </motion.div>
      </AnimatePresence>
      
      {/* The lid animation that covers the content */}
      <AnimatePresence>
        <motion.div
          className={`absolute inset-0 z-50 pointer-events-none ${isCurrentThemeDark ? 'bg-black' : 'bg-white'} shadow-lg`}
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1, originY: 0 }}
          transition={{ duration: 0.15, ease: [0.19, 1.0, 0.22, 1.0] }}
        >
          {/* Stash label */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
            <Package className="text-primary mr-1" size={20} />
            <span className="text-primary font-bold">STASH</span>
          </div>
        </motion.div>
        
        {/* Box bottom - appears last */}
        <motion.div
          className="absolute bottom-0 inset-x-0 h-3 bg-primary z-40 pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 1 }}
          transition={{ duration: 0.15, delay: 0.05, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
};

const AppContent = () => {
  const { isLoading } = useAuth();
  const { isCurrentThemeDark } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Hide splash after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SplashAnimation isActive={true} />
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          <StashLogoAnimation size="lg" isActive={true} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 1, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ 
          duration: 0.15,  // Very quick animation
          ease: "easeOut"
        }}
        className="w-full"
      >
        <StashTransition>
          <Routes location={location}>
            <Route path="/" element={<MainLayout><Index /></MainLayout>} />
            <Route path="/auth" element={<AuthLayout><Auth /></AuthLayout>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/upload" element={<MainLayout><UploadPage /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/classes" element={<MainLayout><Classes /></MainLayout>} />
            <Route path="/notes" element={<MainLayout><Notes /></MainLayout>} />
            <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </StashTransition>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen bg-background"
            >
              <Toaster />
              <Sonner />
              <AppContent />
            </motion.div>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
