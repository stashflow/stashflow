import React, { createContext, useContext, useState, useEffect } from 'react';

// Define our theme options
export const themes = {
  // Natural Pastel Study Space
  minimalist: {
    name: 'Natural Pastel Study Space',
    type: 'light',
    colors: {
      primary: '#8a9a5b',
      secondary: '#d3c0d2',
      background: '#f8f4e3',
      card: '#f0ead6',
      text: '#3a3a3a',
      accent: '#e8b4bc',
      success: '#97c1a9',
      warning: '#e6be8a',
      error: '#c97064',
      info: '#809bce',
      border: '#d8d4c2',
    }
  },
  // Dark Mode Knowledge Hub
  dark: {
    name: 'Dark Mode Knowledge Hub',
    type: 'dark',
    colors: {
      primary: '#2196f3',
      secondary: '#9c27b0',
      background: '#000000',
      card: '#141414',
      text: '#e0e0e0',
      accent: '#1de9b6',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      border: '#333333',
    }
  },
  // Synthwave Study Mode
  nightStudy: {
    name: 'Synthwave Study Mode',
    type: 'dark',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      background: '#1a0933',
      card: '#2a1155',
      text: '#f2f2f2',
      accent: '#fc8c03',
      success: '#00ff9f',
      warning: '#ffdd00',
      error: '#ff2a6d',
      info: '#00b8ff',
      border: '#4c1f8c',
    }
  },
  // Neo-Brutalism Study Platform
  neoBrutalism: {
    name: 'Neo-Brutalism Study Platform',
    type: 'light',
    colors: {
      primary: '#456990',
      secondary: '#ef767a',
      background: '#f9f4da',
      card: '#fff8e1',
      text: '#000000',
      accent: '#49dcb1',
      success: '#49beaa',
      warning: '#eeb868',
      error: '#ef767a',
      info: '#456990',
      border: '#456990',
    }
  },
  // Monochrome Focus Mode
  monochrome: {
    name: 'Monochrome Focus Mode',
    type: 'dark',
    colors: {
      primary: '#36454f',
      secondary: '#708090',
      background: '#121212',
      card: '#282828',
      text: '#e6e6e6',
      accent: '#4db6ac',
      success: '#4db6ac',
      warning: '#708090',
      error: '#36454f',
      info: '#4db6ac',
    }
  },
  // Glass Morphism Knowledge Center
  glassMorphism: {
    name: 'Glass Morphism Knowledge Center',
    type: 'dark',
    colors: {
      primary: '#6a5acd',
      secondary: '#42b883',
      background: '#1a1a2e',
      backgroundEnd: '#16213e',
      card: 'rgba(255, 255, 255, 0.08)',
      text: '#ffffff',
      accent: '#00ffff',
      success: '#42b883',
      warning: '#ff7043',
      error: '#f44336',
      info: '#00ffff',
    }
  }
};

type ThemeOption = keyof typeof themes;
type ThemeContextType = {
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  availableThemes: typeof themes;
  isCurrentThemeDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key for saving user theme preference
const THEME_STORAGE_KEY = 'stash-flow-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to get saved theme from localStorage or default to 'dark'
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme as ThemeOption) || 'dark';
  });

  // Update CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[currentTheme];
    
    // Set CSS variables based on the selected theme
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Save theme preference to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    
    // Set data-theme attribute for component libraries that use it
    document.body.setAttribute('data-theme', currentTheme);
    
    // Set light/dark mode attribute
    document.body.setAttribute('data-theme-type', theme.type);
  }, [currentTheme]);

  const setTheme = (theme: ThemeOption) => {
    setCurrentTheme(theme);
  };

  const isCurrentThemeDark = themes[currentTheme].type === 'dark';

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: themes, isCurrentThemeDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 