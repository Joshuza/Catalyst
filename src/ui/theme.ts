import { useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';
const themeKey = 'nexus.theme';

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(themeKey);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    apply();
    media.addEventListener('change', apply);
    try {
      localStorage.setItem(themeKey, theme);
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return { theme, setTheme, storageWarning };
}
