import { fetchActivePromptQuestion, fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import { Feed } from '@/components/Feed';
import PromptDrawer from '@/components/PromptDrawer';
import { api } from '@/utils/api';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AppIndex() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
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

  const handleMenuItemPress = (route: '/search' | '/profile') => {
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
              user && (
                <TouchableOpacity style={styles.profileButton} onPress={() => setMenuVisible(true)}>
                  <Image source={{ uri: user.profile_photo_url }} style={styles.profilePhoto} />
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>

      <Modal animationType="fade" transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('/profile')}>
              <FontAwesome name="user" size={20} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('/search')}>
              <FontAwesome name="search" size={20} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
              <FontAwesome name="lightbulb-o" size={20} color="#fff" />
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
    backgroundColor: '#f0f0f0',
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
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    padding: 16,
    alignItems: 'center',
  },
  successMessageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promptContainer: {
    flex: 1,
  },
  promptLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhoto: {
    height: '100%',
    width: '100%',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 60,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
});
