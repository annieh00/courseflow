import React, { createContext, useState, useContext, ReactNode } from 'react';

export const lightTheme = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  primary: '#C8102E',
  border: '#E5E5EA',
  danger: '#FF3B30',
};

export const darkTheme = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  primary: '#FFC72C',
  border: '#38383A',
  danger: '#FF453A',
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof lightTheme;
};

// Create context with undefined to enforce hook usage
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to consume context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
