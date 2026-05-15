'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type FontScale = 100 | 110 | 120;

interface FontSizeContextValue {
  scale: FontScale;
  setScale: (s: FontScale) => void;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  scale: 100,
  setScale: () => {},
});

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<FontScale>(100);

  const setScale = useCallback((s: FontScale) => {
    setScaleState(s);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
  }, [scale]);

  return (
    <FontSizeContext.Provider value={{ scale, setScale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
