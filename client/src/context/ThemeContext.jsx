import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // The storefront and admin now share one FreshCart visual system.
  const [theme] = useState('white');

  useEffect(() => {
    localStorage.setItem('fresh_theme', 'white');
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const themeColors = {
      white: '#F8FAFC',
      dark: '#0B0D14',
      yellow: '#FFFDF0',
    };
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);

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

  const toggleTheme = () => {};

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
