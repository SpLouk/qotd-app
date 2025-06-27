import { useUserApi } from '@/api/useUserApi';
import { GroupContext, GroupProvider } from '@/context/GroupContext';
import { SessionProvider } from '@/context/SessionContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { QueryProvider } from '@/providers/query';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Network from 'expo-network';

function AppContent() {
  // Handle app state changes for react-query
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => subscription.remove();
  }, []);

  onlineManager.setEventListener((setOnline) => {
    const eventSubscription = Network.addNetworkStateListener((state) => {
      setOnline(!!state.isConnected);
    });
    return eventSubscription.remove;
  });

  // Manage session globally
  useSessionManager();

  const { data: user } = useUserApi();
  const groupContext = useContext(GroupContext);
  const firstGroup = user?.groups?.[0];
  const router = useRouter();

  useEffect(() => {
    if (user?.needs_registration) {
      router.replace('/sign-up');
    }
  }, [user?.needs_registration, router]);

  useEffect(() => {
    if (firstGroup && groupContext && !groupContext.selectedGroupId) {
      groupContext?.setSelectedGroupId(firstGroup.id);
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
      <QueryProvider>
        <GroupProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </GroupProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
