import { useSession } from '@/context/SessionContext';
import { User } from '@/types/api';
import { useFetchApi, useFetchApiAndParseJson } from '@/utils/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export function useUserApi() {
  const fetchApiAndParseJson = useFetchApiAndParseJson();
  const fetchApi = useFetchApi();
  const queryClient = useQueryClient();
  const { clearSession } = useSession();
  const router = useRouter();
  const { isInitialized, session } = useSession();
  const isSessionActive = !!session && new Date(session.token_expires_at).valueOf() > Date.now();

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const currentUserQuery = useQuery<User, Error>({
    queryKey: ['user'],
    queryFn: () => fetchApiAndParseJson('/user'),
    enabled: isInitialized && isSessionActive,
  });

  const logoutMutation = useMutation({
    mutationFn: () => fetchApi('/session', { method: 'DELETE' }),
    onSuccess: async () => {
      invalidateUser();
      await clearSession();
      queryClient.clear();
      router.replace('/sign-in');
    },
  });

  return {
    ...currentUserQuery,
    logoutMutation,
    invalidateUser,
  };
}
