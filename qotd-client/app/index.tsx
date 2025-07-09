import { useActivePrompt } from '@/api/useActivePrompt';
import { useUserApi } from '@/api/useUserApi';
import useAddDeviceToken from '@/hooks/useAddDeviceToken';
import { useClearBadge } from '@/hooks/useClearBadge';
import { Feed } from '@/components/Feed';
import { GroupTitlePager } from '@/components/GroupTitlePager';
import { JoinGroupModal } from '@/components/JoinGroupModal';
import PromptDrawer from '@/components/PromptDrawer';
import { PromptResponseWriter } from '@/components/PromptResponseWriter';
import Colors from '@/constants/Colors';
import { GroupContext, useGroup } from '@/context/GroupContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IntroPage } from '@/components/IntroPage';
import { EmptyGroup } from '@/components/EmptyGroup';

export default function AppIndex() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const [joinGroupModalVisible, setJoinGroupModalVisible] = useState(false);

  const { data: user } = useUserApi();
  const groupList = user?.groups;
  const { setSelectedGroupId, selectedGroupId } = useContext(GroupContext)!;

  // Add user device token
  useAddDeviceToken();
  useClearBadge();

  const handlePlusPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Join a Group', 'Create a Group', 'Profile'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setJoinGroupModalVisible(true);
          else if (buttonIndex === 2) router.push('/create-group');
          else if (buttonIndex === 3) router.push('/profile');
        },
      );
    } else {
      Alert.alert('Group Options', undefined, [
        { text: 'Join a Group', onPress: () => setJoinGroupModalVisible(true) },
        { text: 'Create a Group', onPress: () => router.push('/create-group') },
        { text: 'Profile', onPress: () => router.push('/profile') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {successMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <GroupTitlePager
            groupList={groupList}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            router={router}
          />
        </View>
        <Pressable onPress={handlePlusPress} style={styles.plusButton} accessibilityLabel="Add or join group">
          <FontAwesome6 name="bars" size={24} color={Colors.primary} weight="thin" />
        </Pressable>
      </View>

      <MainContent setSuccessMessage={setSuccessMessage} setJoinGroupModalVisible={setJoinGroupModalVisible} />

      <JoinGroupModal visible={joinGroupModalVisible} onClose={() => setJoinGroupModalVisible(false)} />
    </SafeAreaView>
  );
}

const MainContent = ({
  setSuccessMessage,
}: {
  setJoinGroupModalVisible: (value: boolean) => void;
  setSuccessMessage: (value: string | null) => void;
}) => {
  const { isLoading: isLoadingPrompt, error: promptError } = useActivePrompt();

  const { data: user, isLoading: isLoadingUser } = useUserApi();
  const groupList = user?.groups;

  const { data: selectedGroup, isLoading: isLoadingGroup } = useGroup();
  const needsWritePrompt = useNeedsWritePrompt();

  if (isLoadingUser || isLoadingGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!groupList?.length) {
    return <IntroPage />;
  }

  if (promptError || (selectedGroup?.members.length ?? 3) < 2) {
    return (
      <>
        <EmptyGroup setSuccessMessage={setSuccessMessage} />
        <PromptDrawer setSuccessMessage={setSuccessMessage} />
      </>
    );
  }

  if (needsWritePrompt) {
    return <PromptResponseWriter />;
  }

  return (
    <>
      <Feed />
      <PromptDrawer setSuccessMessage={setSuccessMessage} />
    </>
  );
};

const useNeedsWritePrompt = () => {
  const { data: activePrompt } = useActivePrompt();

  const { data: user } = useUserApi();

  // Find if the user has a post for the current active prompt
  const ownPost = activePrompt?.posts?.find((p) => p.username === user?.username);

  return user && activePrompt && !ownPost;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    maxWidth: '100%',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    color: Colors.appTitle,
    fontWeight: '600',
  },
  promptLabel: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    padding: 12,
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
  },
  plusButton: {
    padding: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
