import { setBadgeCountAsync } from 'expo-notifications';
import { useEffect } from 'react';

export const useClearBadge = () => {
  useEffect(() => {
    setBadgeCountAsync(0);
  }, []);
};
