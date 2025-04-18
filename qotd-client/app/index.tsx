import { usePostsApi } from '@/api/usePostsApi';
import { useUserApi } from '@/api/useUserApi';
import useAddDeviceToken from '@/app/hooks/useAddDeviceToken';
import { Feed } from '@/components/Feed';
import PromptDrawer from '@/components/PromptDrawer';
import Colors from '@/constants/Colors';
import { useGroup } from '@/context/GroupContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppIndex() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const { data: selectedGroup } = useGroup();
  const {
    data: posts = [],
    isFetching: isFetchingPosts,
    isLoading: isLoadingPosts,
    error: postsError,
    activePromptQuestionQuery,
    invalidatePosts,
    invalidatePrompts,
  } = usePostsApi();
  const { data: user } = useUserApi();

  const { data: activePrompt } = activePromptQuestionQuery;

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

  // Add user device token
  useAddDeviceToken();

  const handleRefresh = () => {
    invalidatePosts();
    invalidatePrompts();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {successMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}

      <Pressable style={styles.header} onPress={() => router.replace('/group')}>
        <Text style={styles.appName}>{selectedGroup?.name}</Text>
        <Text style={styles.promptLabel}>{activePrompt ? activePrompt.content : 'No Active Prompt'}</Text>
      </Pressable>

      <View style={styles.content}>
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
    flexDirection: 'column',
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
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
  },
});
