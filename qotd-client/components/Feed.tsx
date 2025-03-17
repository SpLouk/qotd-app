import { fetchPosts } from '@/api/posts';
import { Post } from '@/types/api';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Post as PostComponent } from './Post';

export function Feed() {
  const {
    data: allPosts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const posts = allPosts.filter((post: Post) => !post.parent_post_id);

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
});
