import { useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { User } from '@/types/api';
import { Session, useFetchApiAndParseJson } from '@/utils/api';
import { useSession } from '@/context/SessionContext';

interface CreateSessionResponse extends Session {
  user: User;
}

export const useHandleSignIn = () => {
  const api = useFetchApiAndParseJson();
  const { setSession } = useSession();

  return useCallback(async () => {
    try {
      const { identityToken } = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const res: CreateSessionResponse = await api('/session', {
        body: JSON.stringify({ identityToken }),
        method: 'POST',
      });

      const { user, ...session } = res;
      setSession(session);

      if (res.user.needs_registration) {
        router.replace('/sign-up');
      } else {
        router.replace('/');
      }
    } catch (e) {
      if ((e as any)?.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        console.log(e);
        // handle other errors
      }
    }
  }, [api, setSession]);
};
