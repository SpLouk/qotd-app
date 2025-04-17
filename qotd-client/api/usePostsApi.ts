import { CreatePostRequest, Post, PromptQuestion } from '@/types/api';
import { useCallback } from 'react';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useGroupId } from '@/context/GroupContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePostsApi() {
  const api = useFetchApiAndParseJson();
  const groupId = useGroupId();
  const queryClient = useQueryClient();

  const invalidatePosts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['posts', groupId] });
  }, [queryClient, groupId]);

  const invalidatePrompts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['promptQuestion', groupId] });
    queryClient.invalidateQueries({ queryKey: ['promptQuestions', groupId] });
  }, [queryClient, groupId]);

  const postsQuery = useQuery<Post[], Error>({
    queryKey: ['posts', groupId],
    queryFn: () => api(`/groups/${groupId}/posts`),
    enabled: !!groupId,
  });

  const activePromptQuestionQuery = useQuery<PromptQuestion, Error>({
    queryKey: ['promptQuestion', groupId],
    queryFn: () => api(`/groups/${groupId}/prompt_questions/active`),
    enabled: !!groupId,
  });

  const createPostMutation = useMutation<Post, Error, CreatePostRequest>({
    mutationFn: (data) => api(`/groups/${groupId}/posts`, { body: JSON.stringify(data), method: 'POST' }),
    onSuccess: invalidatePosts,
  });

  const deletePostMutation = useMutation<void, Error, number>({
    mutationFn: (postId) => api(`/groups/${groupId}/posts/${postId}`, { method: 'DELETE' }),
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
