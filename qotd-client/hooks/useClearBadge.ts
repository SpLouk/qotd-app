import { setBadgeCountAsync } from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Based on snippet from https://reactnative.dev/docs/appstate.
 * We want to reset the notification badge whenever the app is brought to the foreground
 */
export const useClearBadge = () => {
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setBadgeCountAsync(0);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
};
