import { fetchCurrentUser } from '@/api/user';
import { api } from '@/utils/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

  const token = await Notifications.getDevicePushTokenAsync();
  // Clean the token by removing any whitespace and special characters
  return token.data.replace(/[^a-zA-Z0-9]/g, '');
}

export function useAddDeviceToken() {
  const queryClient = useQueryClient();
  const [deviceTokenAdded, setDeviceTokenAdded] = useState(false);

  const addDeviceToken = useMutation({
    mutationFn: async () => {
      const token = await getDeviceToken();

      const response = await api.post('/device_tokens', { token, platform: Platform.OS });

      if (response.status !== 201) {
        throw new Error('Failed to register device token');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setDeviceTokenAdded(true);
    },
  });
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  useEffect(() => {
    if (user && !user.has_device_token && !deviceTokenAdded) {
      addDeviceToken.mutate();
    }
  }, [user, addDeviceToken, deviceTokenAdded]);
}
