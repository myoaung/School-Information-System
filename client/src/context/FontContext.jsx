import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FontContext = createContext(null);

const FONT_SIZES = {
  sm: { label: 'Small', rootPx: 14 },
  md: { label: 'Default', rootPx: 16 },
  lg: { label: 'Large', rootPx: 18 },
};

export function FontProvider({ children }) {
  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem('fontSize') || 'md';
  });

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    const px = FONT_SIZES[fontSize]?.rootPx ?? 16;
    document.documentElement.style.fontSize = `${px}px`;
  }, [fontSize]);

  const setFontSize = useCallback((size) => {
    if (FONT_SIZES[size]) setFontSizeState(size);
  }, []);

  const cycleFontSize = useCallback(() => {
    const order = ['sm', 'md', 'lg'];
    const idx = order.indexOf(fontSize);
    setFontSizeState(order[(idx + 1) % order.length]);
  }, [fontSize]);

  const value = { fontSize, setFontSize, cycleFontSize, FONT_SIZES };

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
