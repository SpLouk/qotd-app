import { useActivePrompt } from '@/api/useActivePrompt';
import { useUserApi } from '@/api/useUserApi';
import useAddDeviceToken from '@/hooks/useAddDeviceToken';
import { useClearBadge } from '@/hooks/useClearBadge';
import { Feed } from '@/components/Feed';
import { PromptResponseWriter } from '@/components/PromptResponseWriter';
import Colors from '@/constants/Colors';
import { useGroup } from '@/context/GroupContext';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IntroPage } from '@/components/IntroPage';
import { EmptyGroup } from '@/components/EmptyGroup';
import { AppHeader } from '@/components/AppHeader';

export default function AppIndex() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, setSuccessMessage]);

  // Add user device token
  useAddDeviceToken();
  useClearBadge();

  return (
    <SafeAreaView style={styles.container}>
      {successMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}

      <AppHeader />
      <MainContent setSuccessMessage={setSuccessMessage} />
    </SafeAreaView>
  );
}

const MainContent = ({ setSuccessMessage }: { setSuccessMessage: (value: string | null) => void }) => {
  const { error: promptError } = useActivePrompt();

  const { data: user, isLoading: isLoadingUser } = useUserApi();
  const groupList = user?.groups;

  const { data: selectedGroup, isLoading: isLoadingGroup } = useGroup();
  const needsWritePrompt = useNeedsWritePrompt();

  if (isLoadingUser || isLoadingGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!groupList?.length) {
    return <IntroPage />;
  }

  if (promptError || (selectedGroup?.members.length ?? 3) < 2) {
    return <EmptyGroup setSuccessMessage={setSuccessMessage} />;
  }

  if (needsWritePrompt) {
    return <PromptResponseWriter />;
  }

  return <Feed setSuccessMessage={setSuccessMessage} />;
};

const useNeedsWritePrompt = () => {
  const { data: activePrompt } = useActivePrompt();

  const { data: user } = useUserApi();

  // Find if the user has a post for the current active prompt
  const ownPost = activePrompt?.posts?.find((p) => p.username === user?.username);

  return user && activePrompt && !ownPost;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    maxWidth: '100%',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    color: Colors.appTitle,
    fontWeight: '600',
  },
  promptLabel: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    padding: 12,
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
  },
});
