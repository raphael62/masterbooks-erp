import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const THEMES = {
  purple: {
    id: 'purple',
    name: 'Purple',
    primary: '#6D28D9',
    primaryLight: '#7C3AED',
    primaryDark: '#5B21B6',
    ring: '#6D28D9',
    swatchColors: ['#6D28D9', '#7C3AED', '#8B5CF6'],
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    primary: '#1D4ED8',
    primaryLight: '#2563EB',
    primaryDark: '#1E40AF',
    ring: '#1D4ED8',
    swatchColors: ['#1D4ED8', '#2563EB', '#3B82F6'],
  },
  green: {
    id: 'green',
    name: 'Green',
    primary: '#15803D',
    primaryLight: '#16A34A',
    primaryDark: '#166534',
    ring: '#15803D',
    swatchColors: ['#15803D', '#16A34A', '#22C55E'],
  },
  red: {
    id: 'red',
    name: 'Red',
    primary: '#B91C1C',
    primaryLight: '#DC2626',
    primaryDark: '#991B1B',
    ring: '#B91C1C',
    swatchColors: ['#B91C1C', '#DC2626', '#EF4444'],
  },
  orange: {
    id: 'orange',
    name: 'Orange',
    primary: '#C2410C',
    primaryLight: '#EA580C',
    primaryDark: '#9A3412',
    ring: '#C2410C',
    swatchColors: ['#C2410C', '#EA580C', '#F97316'],
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    primary: '#0F766E',
    primaryLight: '#0D9488',
    primaryDark: '#115E59',
    ring: '#0F766E',
    swatchColors: ['#0F766E', '#0D9488', '#14B8A6'],
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    primary: '#3730A3',
    primaryLight: '#4338CA',
    primaryDark: '#312E81',
    ring: '#3730A3',
    swatchColors: ['#3730A3', '#4338CA', '#6366F1'],
  },
  pink: {
    id: 'pink',
    name: 'Pink',
    primary: '#BE185D',
    primaryLight: '#DB2777',
    primaryDark: '#9D174D',
    ring: '#BE185D',
    swatchColors: ['#BE185D', '#DB2777', '#EC4899'],
  },
};

const DEFAULT_THEME_ID = 'purple';

const applyThemeToCSSVars = (theme) => {
  if (!theme) return;
  const root = document.documentElement;
  root.style?.setProperty('--color-primary', theme?.primary);
  root.style?.setProperty('--color-ring', theme?.ring);
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentThemeId, setCurrentThemeId] = useState(DEFAULT_THEME_ID);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentTheme = THEMES?.[currentThemeId] || THEMES?.[DEFAULT_THEME_ID];

  // Load theme and dark mode preference from Supabase or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      // Try localStorage first for instant load
      const cachedTheme = localStorage.getItem('masterbooks_theme');
      const cachedDarkMode = localStorage.getItem('masterbooks_darkmode') === 'true';
      
      if (cachedTheme && THEMES?.[cachedTheme]) {
        setCurrentThemeId(cachedTheme);
        applyThemeToCSSVars(THEMES?.[cachedTheme]);
      } else {
        applyThemeToCSSVars(THEMES?.[DEFAULT_THEME_ID]);
      }

      // Apply dark mode preference
      setDarkMode(cachedDarkMode);
      applyDarkMode(cachedDarkMode);

      // If user is logged in, fetch from Supabase
      if (user?.id) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            ?.from('user_preferences')
            ?.select('theme_id, dark_mode')
            ?.eq('user_id', user?.id)
            ?.single();

          if (!error && data) {
            if (data?.theme_id && THEMES?.[data?.theme_id]) {
              setCurrentThemeId(data?.theme_id);
              applyThemeToCSSVars(THEMES?.[data?.theme_id]);
              localStorage.setItem('masterbooks_theme', data?.theme_id);
            }
            const isDarkMode = data?.dark_mode === true;
            setDarkMode(isDarkMode);
            applyDarkMode(isDarkMode);
            localStorage.setItem('masterbooks_darkmode', isDarkMode ? 'true' : 'false');
          }
        } catch (err) {
          console.error('Failed to load theme preference:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTheme();
  }, [user?.id]);

  const applyTheme = useCallback((themeId) => {
    if (!THEMES?.[themeId]) return;
    setCurrentThemeId(themeId);
    applyThemeToCSSVars(THEMES?.[themeId]);
  }, []);

  const applyDarkMode = useCallback((isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const saveTheme = useCallback(async (themeId) => {
    if (!THEMES?.[themeId]) return { error: 'Invalid theme' };

    applyTheme(themeId);
    localStorage.setItem('masterbooks_theme', themeId);

    if (!user?.id) return { error: null };

    setSaving(true);
    try {
      const { error } = await supabase?.from('user_preferences')?.upsert(
          { user_id: user?.id, theme_id: themeId, updated_at: new Date()?.toISOString() },
          { onConflict: 'user_id' }
        );
      return { error };
    } catch (err) {
      return { error: err };
    } finally {
      setSaving(false);
    }
  }, [user?.id, applyTheme]);

  const toggleDarkMode = useCallback(async (isDark) => {
    setDarkMode(isDark);
    applyDarkMode(isDark);
    localStorage.setItem('masterbooks_darkmode', isDark ? 'true' : 'false');

    if (!user?.id) return { error: null };

    setSaving(true);
    try {
      const { error } = await supabase?.from('user_preferences')?.upsert(
          { user_id: user?.id, dark_mode: isDark, updated_at: new Date()?.toISOString() },
          { onConflict: 'user_id' }
        );
      return { error };
    } catch (err) {
      return { error: err };
    } finally {
      setSaving(false);
    }
  }, [user?.id, applyDarkMode]);

  const resetTheme = useCallback(async () => {
    return saveTheme(DEFAULT_THEME_ID);
  }, [saveTheme]);

  const value = {
    currentThemeId,
    currentTheme,
    themes: THEMES,
    darkMode,
    loading,
    saving,
    applyTheme,
    saveTheme,
    toggleDarkMode,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
