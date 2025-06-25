import { EnhancedPromptQuestion } from '@/components/Feed';
import { useGroupId } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useActivePrompt = () => {
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();
  const { data: infinitePromptData, ...rest } = useInfiniteQuery<EnhancedPromptQuestion, Error>({
    queryKey: ['promptQuestionsActivatedInfinite', groupId],
    queryFn: ({ pageParam }) => fetchAndParseJson(`/groups/${groupId}/prompt_questions/archived?page=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.has_next_page ? allPages.length : null),
    enabled: !!groupId,
  });
  const firstPrompt = infinitePromptData?.pages.flat()[0];
  const data = firstPrompt?.active ? firstPrompt : undefined;
  return {
    data,
    ...rest,
  };
};
