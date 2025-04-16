import { GroupProvider } from '@/context/GroupContext';
import { QueryProvider } from '@/providers/query';
import { focusManager } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));

    return () => subscription.remove();
  }, []);

  return (
    <GroupProvider>
      <QueryProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#fff' },
            }}
          />
        </SafeAreaProvider>
      </QueryProvider>
    </GroupProvider>
  );
}
