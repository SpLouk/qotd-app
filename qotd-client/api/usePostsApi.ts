import { CreatePostRequest, Post, PromptQuestion } from '@/types/api';
import { useCallback } from 'react';
import { useFetchApi, useFetchApiAndParseJson } from '@/utils/api';
import { useGroupId } from '@/context/GroupContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePostsApi() {
  const fetchAndParseJson = useFetchApiAndParseJson();
  const fetchApi = useFetchApi();
  const groupId = useGroupId();
  const queryClient = useQueryClient();

  const invalidatePosts = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['posts', groupId] }),
    [groupId, queryClient],
  );

  const invalidatePrompts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['promptQuestion', groupId] });
    queryClient.invalidateQueries({ queryKey: ['promptQuestions', groupId] });
  }, [queryClient, groupId]);

  const postsQuery = useQuery<Post[], Error>({
    queryKey: ['posts', groupId],
    queryFn: () => fetchAndParseJson(`/groups/${groupId}/posts`),
    enabled: !!groupId,
  });

  const activePromptQuestionQuery = useQuery<PromptQuestion, Error>({
    queryKey: ['promptQuestion', groupId],
    queryFn: () => fetchAndParseJson(`/groups/${groupId}/prompt_questions/active`),
    enabled: !!groupId,
  });

  const createPostMutation = useMutation<Post, Error, CreatePostRequest>({
    mutationKey: ['posts', groupId],
    mutationFn: (data) => fetchAndParseJson(`/groups/${groupId}/posts`, { body: JSON.stringify(data), method: 'POST' }),
    onSuccess: invalidatePosts,
  });

  const deletePostMutation = useMutation<Response, Error, number>({
    mutationKey: ['posts', groupId],
    mutationFn: (postId) => fetchApi(`/groups/${groupId}/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: invalidatePosts,
  });

  return {
    // Queries
    ...postsQuery,
    activePromptQuestionQuery,

    // Mutations
    createPostMutation,
    deletePostMutation,

    // Cache invalidation helpers
    invalidatePosts,
    invalidatePrompts,
  };
}
