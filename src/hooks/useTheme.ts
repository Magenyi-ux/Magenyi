

import { useState, useEffect } from 'react';
import { Theme } from '../types';

export const useTheme = (): [Theme, (theme: Theme) => void] => {
  // Force the theme to always be 'light'.
  const [theme, setTheme] = useState<Theme>('light');

  // The empty setter function to satisfy the hook's return signature.
  const setAppTheme = (newTheme: Theme) => {
    // In this modified version, we don't want to allow theme changes.
    // We keep the function signature for compatibility with existing components.
    // All theme state is now handled internally and fixed to 'light'.
  };

  useEffect(() => {
    // On component mount, ensure the theme is set to light mode.
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  return [theme, setAppTheme];
};
