import { Post, PromptQuestion } from '@/types/api';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Post as PostComponent } from './Post';
import { usePostsApi } from '@/api/usePostsApi';
import { useInfiniteQuery } from '@tanstack/react-query';
import Colors from '@/constants/Colors';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useGroupId } from '@/context/GroupContext';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedPromptQuestion extends PromptQuestion {
  has_next_page: boolean;
}

export function Feed() {
  const { data: allPosts = [], isLoading, refetch, isRefetching, activePromptQuestionQuery } = usePostsApi();
  const posts = allPosts.filter((post: Post) => !post.parent_post_id);
  const { data: activePrompt } = activePromptQuestionQuery;
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();

  // Infinite query for archived prompts
  const {
    data: archivedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingArchived,
    error: archivedError,
  } = useInfiniteQuery<EnhancedPromptQuestion, Error>({
    queryKey: ['archivedPromptQuestions', groupId],
    queryFn: ({ pageParam }) => fetchAndParseJson(`/groups/${groupId}/prompt_questions/archived?page=${pageParam}`),
    getNextPageParam: (lastPage, allPages) => (lastPage.has_next_page ? allPages.length + 1 : null),
    initialPageParam: 1,
    enabled: !!groupId,
  });

  // Flatten archived prompts
  const archivedPrompts = archivedData?.pages.flat() ?? [];

  // Only show loading state on initial load, not during refetch
  if (isLoading && !allPosts.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" size="large" />
      </View>
    );
  }

  const renderItem = ({ item: post }: { item: Post }) => (
    <View style={styles.postContainer}>
      <PostComponent post={post} />
    </View>
  );

  // Render archived prompt + posts
  const renderArchivedPrompt = ({ item }: { item: PromptQuestion }) => (
    <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
      <View style={{ flexDirection: 'column', flex: 1, marginVertical: 16 }}>
        {item.activated_at && (
          <Text style={styles.promptOverline}>
            {formatDistanceToNow(new Date(item.activated_at), { addSuffix: true })}
          </Text>
        )}
        <Text style={styles.promptText}>{item?.content}</Text>
      </View>
      {item.posts && item.posts.length > 0 ? (
        item.posts.map((post) => (
          <View style={styles.postContainer} key={post.id}>
            <PostComponent post={post} readonly />
          </View>
        ))
      ) : (
        <Text style={styles.noArchivedPosts}>No posts for this prompt</Text>
      )}
    </View>
  );

  // Handler for infinite scroll
  const onEndReached = () => {
    console.log(hasNextPage, isFetchingNextPage);
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
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
        ListFooterComponent={
          <View>
            {isLoadingArchived && <ActivityIndicator color="#007AFF" size="small" style={{ marginVertical: 16 }} />}
            {archivedPrompts.map((prompt) => (
              <View key={prompt.id}>{renderArchivedPrompt({ item: prompt })}</View>
            ))}
            {hasNextPage && !isLoadingArchived && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator color="#007AFF" size="small" />
              </View>
            )}
            {!hasNextPage ? <Text style={{ color: Colors.text }}>You've reached the beginning of time.</Text> : null}
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
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
  noArchivedPosts: {
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
});
