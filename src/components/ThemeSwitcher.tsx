import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

export const ThemeSwitcher = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Theme</h2>
      <p className="text-sm text-muted-foreground">Select your preferred theme for the application.</p>
      
      <RadioGroup 
        value={currentTheme} 
        onValueChange={(value) => setTheme(value as keyof typeof availableThemes)}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2"
      >
        {Object.entries(availableThemes).map(([key, theme]) => (
          <div key={key} className="space-y-2">
            <RadioGroupItem 
              value={key} 
              id={`theme-${key}`} 
              className="peer sr-only" 
            />
            <Label
              htmlFor={`theme-${key}`}
              className="flex flex-col gap-2 rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{theme.name}</span>
                <div className="flex items-center gap-2">
                  {theme.type === 'dark' ? (
                    <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {currentTheme === key && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {Object.values(theme.colors).slice(0, 5).map((color, i) => (
                  <div 
                    key={i}
                    className="h-5 w-full rounded-sm" 
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="h-16 overflow-hidden rounded-md border" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
                <div className="p-2">
                  <div className="h-2 w-8 rounded-full mb-1" style={{ backgroundColor: theme.colors.primary }}></div>
                  <div className="h-1 w-full rounded-full mb-1" style={{ backgroundColor: theme.colors.text, opacity: 0.2 }}></div>
                  <div className="h-1 w-10 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                </div>
                <div className="h-8 border-t" style={{ backgroundColor: theme.colors.card }}></div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}; 