import { Post } from '@/types/api';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Post as PostComponent } from './Post';
import { usePostsApi } from '@/api/usePostsApi';
import Colors from '@/constants/Colors';

export function Feed() {
  const { data: allPosts = [], isLoading, refetch, isRefetching, activePromptQuestionQuery } = usePostsApi();

  const posts = allPosts.filter((post: Post) => !post.parent_post_id);

  const { data: activePrompt } = activePromptQuestionQuery;

  // Only show loading state on initial load, not during refetch
  if (isLoading && !allPosts.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" size="large" />
      </View>
    );
  }

  const renderItem = ({ item: post }: { item: Post }) => {
    return (
      <View style={styles.postContainer}>
        <PostComponent post={post} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          activePrompt ? (
            <View style={styles.header}>
              <View style={{ flexDirection: 'column', flex: 1 }}>
                <Text style={styles.promptOverline}>Today's prompt:</Text>
                <Text style={styles.promptText}>{activePrompt?.content}</Text>
              </View>
            </View>
          ) : null
        }
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
    flexGrow: 1,
    paddingBottom: 72, // Add padding to account for the floating button
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
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  promptOverline: {
    color: Colors.textSecondary,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flexWrap: 'wrap',
  },
});
