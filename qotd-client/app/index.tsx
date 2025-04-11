import { fetchActivePromptQuestion, fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import useAddDeviceToken from '@/app/hooks/useAddDeviceToken';
import { Feed } from '@/components/Feed';
import PromptDrawer from '@/components/PromptDrawer';
import RadialMenu from '@/components/RadialMenu';
import Colors from '@/constants/Colors';
import { api } from '@/utils/api';
import { focusManager, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppIndex() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const groupId = user?.groups?.[0]?.id;

  const {
    data: posts = [],
    isFetching: isFetchingPosts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery({
    queryKey: ['posts', groupId],
    queryFn: () => (groupId ? fetchPosts(groupId) : Promise.reject('No group ID available')),
    enabled: !!groupId,
  });

  const { data: activePrompt } = useQuery({
    queryKey: ['promptQuestion', groupId],
    queryFn: () => (groupId ? fetchActivePromptQuestion(groupId) : Promise.reject('No group ID available')),
    enabled: !!groupId,
  });

  useAddDeviceToken();

  // Find if the user has a post for the current active prompt
  const ownPost = posts?.find((p) => p.username === user?.username);

  // Handle redirecting to write page with useEffect instead of during render
  useEffect(() => {
    if (user && activePrompt && !isFetchingPosts && !ownPost) {
      router.replace({
        pathname: '/write',
        params: {
          promptId: activePrompt.id,
          promptContent: activePrompt.content,
        },
      });
    }
  }, [user, activePrompt, isFetchingPosts, ownPost]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['posts', groupId] });
    queryClient.invalidateQueries({ queryKey: ['promptQuestion', groupId] });
  };

  if (api.hasToken() === false || (!isLoadingUser && !user)) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {successMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>{user?.groups?.[0]?.name ?? 'Hoot'}</Text>
          <Text style={styles.promptLabel}>{activePrompt ? activePrompt.content : 'No Active Prompt'}</Text>
        </View>
        {isLoadingUser ? (
          <View>
            <ActivityIndicator color={Colors.primary} size="small" />
          </View>
        ) : (
          user && <RadialMenu />
        )}
      </View>

      <View style={styles.content}>
        {!groupId && (
          <SafeAreaView style={styles.errorContainer}>
            <Text style={styles.errorText}>You need to be a member of a group to access this app.</Text>
          </SafeAreaView>
        )}
        {isLoadingPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : postsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No active prompt available.</Text>
            <Text style={styles.errorSubtext}>Check back later for new prompts!</Text>
            <TouchableOpacity
              style={[styles.refreshButton, isFetchingPosts && styles.refreshButtonDisabled]}
              disabled={isFetchingPosts}
              onPress={handleRefresh}
            >
              {isFetchingPosts ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Feed />
            {!postsError && <PromptDrawer setSuccessMessage={setSuccessMessage} />}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    padding: 12,
    zIndex: 1000,
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
  },
});
