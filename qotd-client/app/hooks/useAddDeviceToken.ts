import { useUserApi } from '@/api/useUserApi';
import { useFetchApi } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

async function getDeviceToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  if (Platform.OS !== 'ios') {
    throw new Error('Push notifications are only supported on iOS');
  }

  return await Notifications.getDevicePushTokenAsync();
}

export default function useAddDeviceToken() {
  const [deviceTokenAdded, setDeviceTokenAdded] = useState(false);
  const api = useFetchApi();
  const { data: user } = useUserApi();

  const addDeviceToken = useMutation({
    mutationFn: async () => {
      const token = await getDeviceToken();

      const body = JSON.stringify({ device_token: { token: token.data, platform: Platform.OS } });
      const response = await api('/device_tokens', {
        body,
        method: 'POST',
      });

      if (response.status !== 201) {
        throw new Error('Failed to register device token');
      }
    },
  });

  useEffect(() => {
    if (!deviceTokenAdded && user) {
      addDeviceToken.mutate();
      setDeviceTokenAdded(true);
    }
  }, [deviceTokenAdded, addDeviceToken, user]);
}
