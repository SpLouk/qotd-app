import { useSession } from '@/context/SessionContext';
import { User } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export function useUserApi() {
  const api = useFetchApiAndParseJson();
  const queryClient = useQueryClient();
  const { clearSession } = useSession();
  const router = useRouter();
  const { isInitialized } = useSession();

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const currentUserQuery = useQuery<User, Error>({
    queryKey: ['user'],
    queryFn: () => api('/user'),
    enabled: isInitialized,
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: () => api('/session', { method: 'DELETE' }),
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
