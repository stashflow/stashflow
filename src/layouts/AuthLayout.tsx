import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { isCurrentThemeDark } = useTheme();
  
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      {children}
    </div>
  );
};

export default AuthLayout; 