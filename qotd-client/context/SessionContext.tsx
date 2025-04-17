import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Session } from '@/utils/api';

const TOKEN_KEY = 'session';

interface SessionContextType {
  session: Session | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => Promise<void>;
  clearSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setSession = useCallback(async (newSession: Session | null) => {
    setSessionState(newSession);
    if (newSession) {
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(newSession));
      } catch (error) {
        console.error('Failed to store session:', error);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (error) {
        console.error('Failed to clear session:', error);
      }
    }
  }, []);

  const clearSession = useCallback(async () => {
    await setSession(null);
  }, [setSession]);

  // Initialize session from storage
  useEffect(() => {
    async function initializeSession() {
      try {
        const storedSession = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedSession) {
          setSessionState(JSON.parse(storedSession));
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    initializeSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, isInitialized, setSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
