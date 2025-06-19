import { useGroupId } from '@/context/GroupContext';
import { PromptQuestion } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

export const useActivePrompt = () => {
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();
  const { data: _prompt, ...rest } = useQuery<PromptQuestion, Error>({
    queryKey: ['promptQuestionsActivated', groupId],
    queryFn: () => fetchAndParseJson(`/groups/${groupId}/prompt_questions/archived`),
    enabled: !!groupId,
  });
  const data = _prompt?.active ? _prompt : undefined;
  return {
    data,
    ...rest,
  };
};
