import { fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import { PromptCard } from '@/components/PromptCard';
import { Feed } from '@/components/Feed'; // Assuming Feed component is defined in this file
import { api } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AppIndex() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const ownPost = posts?.find((p) => p.username === user?.username);

  if (!api.getToken()) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {isLoadingUser ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#007AFF" />
          </View>
        ) : (
          user && (
            <>
              <View style={styles.userInfo}>
                <Image source={{ uri: user.profile_photo_url, width: 40, height: 40 }} style={styles.profilePhoto} />
                <Text style={styles.username}>{user.username}</Text>
              </View>
              <TouchableOpacity style={styles.findFriendsButton} onPress={() => router.push('/search')}>
                <Text style={styles.findFriendsText}>Find Friends</Text>
              </TouchableOpacity>
            </>
          )
        )}
      </View>

      {isLoadingPosts ? (
        <View style={styles.contentLoadingContainer}>
          <ActivityIndicator color="#007AFF" size="large" />
        </View>
      ) : ownPost ? (
        <Feed />
      ) : (
        <PromptCard />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 72,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePhoto: {
    borderRadius: 20,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  findFriendsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  findFriendsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  noteCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptHeader: {
    marginBottom: 20,
    paddingBottom: 15,
  },
  promptLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    lineHeight: 32,
  },
  responseSection: {
    flex: 1,
  },
  responseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  responseInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
