import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { currentTheme, setTheme, isCurrentThemeDark } = useTheme();
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    if (isCurrentThemeDark) {
      setTheme('minimalist');
    } else {
      setTheme('dark');
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isCurrentThemeDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isCurrentThemeDark ? (
        <Sun className="h-5 w-5 transition-all" />
      ) : (
        <Moon className="h-5 w-5 transition-all" />
      )}
      <span className="sr-only">
        {isCurrentThemeDark ? "Switch to light theme" : "Switch to dark theme"}
      </span>
    </Button>
  );
}; 