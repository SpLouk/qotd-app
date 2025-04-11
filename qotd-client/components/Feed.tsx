import { fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import Colors from '@/constants/Colors';
import { Post } from '@/types/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Post as PostComponent } from './Post';

export function Feed() {
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const groupId = user?.groups?.[0]?.id;

  const {
    data: allPosts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Post[]>({
    queryKey: ['posts', groupId],
    queryFn: () => (groupId ? fetchPosts(groupId) : Promise.reject('No group ID available')),
    enabled: !!groupId,
  });

  const posts = allPosts.filter((post: Post) => !post.parent_post_id);
  const isOnlyOwnPost = posts.every((post: Post) => post.username === user?.username);

  // Only show loading state on initial load, not during refetch
  if (isLoading && !allPosts.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" size="large" />
      </View>
    );
  }

  const renderItem = ({ item: post }: { item: Post }) => {
    return <PostComponent post={post} />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(post) => post.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        ListFooterComponent={
          isOnlyOwnPost ? (
            <Pressable style={styles.findFriendsContainer} onPress={() => router.push('/search')}>
              <Text style={styles.findFriendsText}>Looking empty here?</Text>
              <Text style={styles.findFriendsLink}>Search for friends →</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 100, // Add padding to account for the floating button
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  findFriendsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  findFriendsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  findFriendsLink: {
    fontSize: 16,
    color: Colors.tint,
  },
});
