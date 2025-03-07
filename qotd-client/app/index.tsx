import { fetchActivePromptQuestion, fetchPosts } from '@/api/posts';
import { fetchCurrentUser, fetchFollowerRequests } from '@/api/user';
import { Feed } from '@/components/Feed';
import PromptDrawer from '@/components/PromptDrawer';
import RadialMenu from '@/components/RadialMenu';
import { api } from '@/utils/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AppIndex() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const { data: followRequests = [] } = useQuery({
    queryKey: ['follower_requests'],
    queryFn: fetchFollowerRequests,
  });

  const { data: posts = [], isFetching: isFetchingPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const { data: activePrompt } = useQuery({
    queryKey: ['promptQuestion'],
    queryFn: fetchActivePromptQuestion,
  });

  // Find if the user has a post for the current active prompt
  const ownPost = posts?.find((p) => p.username === user?.username);

  // Check if user has already voted on a prompt (start as true to keep drawer closed initially)
  const [hasVotedOrCreatedPrompt, setOpenPromptVoter] = useState(true);

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

  const handleVote = (promptId: string) => {
    setSuccessMessage('Your vote was submitted successfully!');
    setOpenPromptVoter(true);

    // Hide the success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['promptQuestions'] });
  };

  const handleCreatePrompt = (content: string) => {
    setSuccessMessage('Your prompt was submitted successfully!');
    setOpenPromptVoter(true);

    // Hide the success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['promptQuestions'] });
  };

  if (!api.getToken() || (!isLoadingUser && !user)) {
    return <Redirect href="/sign-in" />;
  }

  const handleMenuItemPress = (route: '/search' | '/profile' | '/follow-requests') => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {successMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.header}>
        {activePrompt && (
          <View style={styles.headerContent}>
            <View style={styles.promptContainer}>
              <Text style={styles.promptLabel}>Hoot</Text>
            </View>
            {isLoadingUser ? (
              <View style={styles.profileButton}>
                <ActivityIndicator color="#AFF" size="small" />
              </View>
            ) : (
              user && <RadialMenu />
            )}
          </View>
        )}
      </View>

      {/* Prompt Drawer */}
      <PromptDrawer onVote={handleVote} onCreatePrompt={handleCreatePrompt} hasVoted={hasVotedOrCreatedPrompt} />

      <View style={styles.content}>
        {isFetchingPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#007AFF" size="large" />
          </View>
        ) : (
          <>
            <Feed />
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => setOpenPromptVoter(false)} // Reopen drawer by setting hasVoted to false
              disabled={hasVotedOrCreatedPrompt}
            >
              <Text style={styles.promptButtonText}>Vote on prompts</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 16,
    zIndex: 1000,
  },
  successMessageText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  promptButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  promptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
