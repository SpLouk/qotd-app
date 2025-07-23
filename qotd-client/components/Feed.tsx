import { Post, PromptQuestion, User } from '@/types/api';
import { ActivityIndicator, SectionList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Post as PostComponent } from './Post';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/Colors';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useGroup } from '@/context/GroupContext';
import { formatDistanceToNow } from 'date-fns';
import { PromptVotesWidget } from '@/components/PromptVotesWidget';

export interface EnhancedPromptQuestion extends PromptQuestion {
  has_next_page: boolean;
}

interface FeedProps {
  setSuccessMessage: (content: string | null) => void;
}

export function Feed({ setSuccessMessage }: FeedProps) {
  const fetchAndParseJson = useFetchApiAndParseJson();
  const queryClient = useQueryClient();
  const { data: group } = useGroup();
  const groupId = group?.id;

  // Get the current user data from the cache
  const userData = queryClient.getQueryData<User>(['user']);

  // Infinite query for archived prompts
  const {
    data: archivedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingArchived,
    error: archivedError,
    isRefetching,
    refetch,
  } = useInfiniteQuery<EnhancedPromptQuestion, Error>({
    queryKey: ['promptQuestionsActivatedInfinite', groupId],
    queryFn: ({ pageParam }) => fetchAndParseJson(`/groups/${groupId}/prompt_questions/archived?page=${pageParam}`),
    getNextPageParam: (lastPage, allPages) => (lastPage.has_next_page ? allPages.length : null),
    initialPageParam: 0,
    enabled: !!groupId,
  });

  // Flatten archived prompts
  const archivedPrompts = archivedData?.pages.flat() ?? [];

  // Only show loading state on initial load, not during refetch
  if (isLoadingArchived && !archivedData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" size="large" />
      </View>
    );
  }

  // Prepare sections for SectionList
  const sections = archivedPrompts.map((prompt: PromptQuestion) => ({
    prompt,
    title: prompt.content,
    data: prompt.posts?.filter((post: Post) => !post.parent_post_id) ?? [],
  }));

  // Render section header (prompt)
  const renderSectionHeader = ({ section }: { section: { prompt: PromptQuestion } }) => (
    <View
      style={
        section.prompt.active
          ? { marginBottom: 16 }
          : { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 16 }
      }
    >
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {section.prompt.activated_at && (
          <Text style={styles.promptOverline}>
            {formatDistanceToNow(new Date(section.prompt.activated_at), { addSuffix: true })}
          </Text>
        )}
        <Text style={styles.promptText}>{section.prompt?.content}</Text>
        {archivedError?.message && <Text style={{ color: Colors.textSecondary }}>{archivedError.message}</Text>}
      </View>
    </View>
  );

  // Render each post
  const renderItem = ({ item, section }: { item: Post; section: { prompt: PromptQuestion } }) => (
    <View style={styles.postContainer}>
      <PostComponent post={item} otherPosts={section.prompt.posts ?? []} readonly={!section.prompt.active} />
    </View>
  );

  // Handler for infinite scroll
  const onEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          group?.prompt_voting_active ? (
            <PromptVotesWidget disabled={!userData?.eligible_to_vote_today} setSuccessMessage={setSuccessMessage} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {isLoadingArchived && (
              <ActivityIndicator color={Colors.primary} size="small" style={{ marginVertical: 16 }} />
            )}
            {!hasNextPage ? <Text style={{ color: Colors.text }}>You've reached the beginning of time.</Text> : null}
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        stickySectionHeadersEnabled={false}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
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
    fontSize: 18,
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
