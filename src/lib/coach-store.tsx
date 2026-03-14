'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CoachContextType {
  pendingMessage: string | null;
  setPendingMessage: (msg: string | null) => void;
  askCoach: (msg: string) => void;
}

const CoachContext = createContext<CoachContextType | null>(null);

export function CoachProvider({ children }: { children: ReactNode }) {
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const askCoach = useCallback((msg: string) => {
    setPendingMessage(msg);
  }, []);

  return (
    <CoachContext.Provider value={{ pendingMessage, setPendingMessage, askCoach }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach must be used within CoachProvider');
  return ctx;
}
