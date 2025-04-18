import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useSession } from '@/context/SessionContext';
import { useFetchApiAndParseJson } from '@/utils/api';

export function useSessionManager() {
  const router = useRouter();
  const { session, isInitialized, setSession } = useSession();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const api = useFetchApiAndParseJson();

  const refreshSession = useCallback(async () => {
    if (!session) {
      return;
    }
    try {
      const newSession = await api('/session/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: session.refresh_token,
        }),
      });

      await setSession({ ...session, ...newSession });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If refresh fails, redirect to sign-in
      router.replace('/sign-in');
    }
  }, [api, router, session, setSession]);

  useEffect(() => {
    const checkAndManageSession = async () => {
      // If no session exists, redirect to sign-in
      if (!session && isInitialized) {
        router.replace('/sign-in');
        return;
      }

      // Wait for session initialization
      if (!isInitialized || !session) {
        return;
      }

      // Calculate time until session expiry
      const now = new Date().getTime();
      const expiryTime = new Date(session.token_expires_at).getTime();
      const timeUntilExpiry = expiryTime - now;

      // If session is expired, try to refresh
      if (timeUntilExpiry <= 0) {
        refreshSession();
        return;
      }

      // Set timeout to refresh session just before expiry
      // Refresh 30 seconds before expiry to ensure smooth transition
      const refreshTime = Math.max(0, timeUntilExpiry - 30000);

      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(refreshSession, refreshTime);
    };

    // Initial check
    checkAndManageSession();

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [router, session, isInitialized, setSession, refreshSession]);
}
