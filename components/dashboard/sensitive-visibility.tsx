"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface SensitiveVisibilityValue {
  hidden: boolean;
  toggle: () => void;
}

const SensitiveVisibilityContext = createContext<SensitiveVisibilityValue>({
  hidden: false,
  toggle: () => {},
});

export function SensitiveVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const toggle = useCallback(() => setHidden((v) => !v), []);

  return (
    <SensitiveVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </SensitiveVisibilityContext.Provider>
  );
}

export function useSensitiveVisibility() {
  return useContext(SensitiveVisibilityContext);
}
