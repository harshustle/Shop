import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Themes: 'white' | 'dark' | 'yellow'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fresh_theme') || 'white';
  });

  useEffect(() => {
    localStorage.setItem('fresh_theme', theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Apply dark class for Tailwind dark: variants
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('theme-yellow');
    } else if (theme === 'yellow') {
      root.classList.remove('dark');
      root.classList.add('theme-yellow');
    } else {
      root.classList.remove('dark');
      root.classList.remove('theme-yellow');
    }
  }, [theme]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
