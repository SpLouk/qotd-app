import * as Notifications from 'expo-notifications';
import { useContext, useEffect } from 'react';
import { GroupContext, useGroupId } from '@/context/GroupContext';

interface NotificationData {
  group_id?: string;
  [key: string]: any;
}

export const useNotificationHandler = () => {
  const groupContext = useContext(GroupContext);
  const currentGroupId = useGroupId();

  // Handle notifications when app is launched from a notification
  useEffect(() => {
    const checkLastNotificationResponse = async () => {
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();

      if (lastNotificationResponse) {
        const data = lastNotificationResponse.notification.request.content.data as NotificationData;

        if (data?.group_id && data.group_id !== currentGroupId) {
          groupContext?.setSelectedGroupId(data.group_id);
        }
      }
    };

    checkLastNotificationResponse();
  }, []); // Only run once on mount

  // Handle notifications when app is running and user taps notification
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;

      if (data?.group_id && data.group_id !== currentGroupId) {
        groupContext?.setSelectedGroupId(data.group_id);
      }
    });

    return () => subscription.remove();
  }, [currentGroupId, groupContext]);
};

