import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeConfig, DesignStyle } from '../types.ts';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'prava-gold': {
    id: 'prava-gold',
    name: 'PRAVA Gold',
    nameAr: 'الذهبي الملكي (PRAVA)',
    accentColor: '#eab308',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    primaryClass: 'text-amber-400',
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.25)]',
    buttonClass: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-lg shadow-amber-500/20',
  },
  'tactical-emerald': {
    id: 'tactical-emerald',
    name: 'Tactical Emerald',
    nameAr: 'الزمردي التكتيكي',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    primaryClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    buttonClass: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20',
  },
  'cyber-navy': {
    id: 'cyber-navy',
    name: 'Cyber Navy',
    nameAr: 'النيلي السيبراني',
    accentColor: '#3b82f6',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    primaryClass: 'text-blue-400',
    borderClass: 'border-blue-500/30 hover:border-blue-500/60',
    glowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    buttonClass: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-blue-500/20',
  },
  'crimson-vanguard': {
    id: 'crimson-vanguard',
    name: 'Crimson Vanguard',
    nameAr: 'القرمزي العملياتي',
    accentColor: '#ef4444',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    primaryClass: 'text-red-400',
    borderClass: 'border-red-500/30 hover:border-red-500/60',
    glowClass: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]',
    buttonClass: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold shadow-lg shadow-red-500/20',
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  designStyle: DesignStyle;
  setDesignStyle: (style: DesignStyle) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES['prava-gold'],
  themeId: 'prava-gold',
  setThemeId: () => {},
  designStyle: 'modern',
  setDesignStyle: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('prava_theme') as ThemeId;
    return saved && THEMES[saved] ? saved : 'prava-gold';
  });

  const [designStyle, setDesignStyle] = useState<DesignStyle>(() => {
    const saved = localStorage.getItem('prava_design_style') as DesignStyle;
    return saved === 'classic' || saved === 'modern' || saved === 'apex' ? saved : 'apex';
  });

  useEffect(() => {
    localStorage.setItem('prava_theme', themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem('prava_design_style', designStyle);
  }, [designStyle]);

  const theme = THEMES[themeId];

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, designStyle, setDesignStyle }}>
      <div className={`app-theme-${themeId} design-${designStyle} min-h-screen transition-colors duration-300`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
