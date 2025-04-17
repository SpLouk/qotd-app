import { GroupContext, GroupProvider } from '@/context/GroupContext';
import { SessionProvider } from '@/context/SessionContext';
import { QueryProvider } from '@/providers/query';
import { focusManager } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useUserApi } from '@/api/useUserApi';

function AppContent() {
  // Handle app state changes for react-query
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => subscription.remove();
  }, []);

  // Manage session globally
  useSessionManager();

  const { data: user } = useUserApi();
  const groupContext = useContext(GroupContext);
  const firstGroup = user?.groups?.[0];

  useEffect(() => {
    if (firstGroup) {
      groupContext?.setSelectedGroup(firstGroup);
    }
  }, [firstGroup, groupContext]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <GroupProvider>
        <QueryProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </QueryProvider>
      </GroupProvider>
    </SessionProvider>
  );
}
