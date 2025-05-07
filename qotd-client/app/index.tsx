import { usePostsApi } from '@/api/usePostsApi';
import { useUserApi } from '@/api/useUserApi';
import useAddDeviceToken from '@/app/hooks/useAddDeviceToken';
import { Feed } from '@/components/Feed';
import { GroupTitlePager } from '@/components/GroupTitlePager';
import { JoinGroupModal } from '@/components/JoinGroupModal';
import PromptDrawer from '@/components/PromptDrawer';
import Colors from '@/constants/Colors';
import { GroupContext } from '@/context/GroupContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const {
    data: posts = [],
    isFetching: isFetchingPosts,
    isLoading: isLoadingPosts,
    error: postsError,
    activePromptQuestionQuery,
    invalidatePosts,
    invalidatePrompts,
  } = usePostsApi();

  const { data: activePrompt } = activePromptQuestionQuery;

  // Find if the user has a post for the current active prompt
  const ownPost = posts?.find((p) => p.username === user?.username);

  // Handle redirecting to write page with useEffect instead of during render
  useEffect(() => {
    if (user && activePrompt && !isFetchingPosts && !ownPost) {
      router.replace('/write');
    }
  }, [user, activePrompt, isFetchingPosts, ownPost]);

  // Add user device token
  useAddDeviceToken();

  const handleRefresh = () => {
    invalidatePosts();
    invalidatePrompts();
  };

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
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Text style={styles.promptLabel}>{activePrompt ? activePrompt.content : 'No Active Prompt'}</Text>
        </View>
        <Pressable onPress={handlePlusPress} style={styles.plusButton} accessibilityLabel="Add or join group">
          <FontAwesome6 name="bars" size={24} color={Colors.primary} weight="thin" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoadingPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : !groupList || groupList.length === 0 ? (
          <View style={styles.joinGroupContainer}>
            <Text style={styles.joinGroupOverlineText}>Nothing here?</Text>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              onPress={() => setJoinGroupModalVisible(true)}
              accessibilityRole="link"
            >
              <Text style={styles.joinGroupLinkText}>Join a group to get started!</Text>
            </Pressable>
          </View>
        ) : postsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No active prompt available.</Text>
            <Text style={styles.errorSubtext}>Check back later for new prompts!</Text>
            <TouchableOpacity
              style={[styles.refreshButton, isFetchingPosts && styles.refreshButtonDisabled]}
              disabled={isFetchingPosts}
              onPress={handleRefresh}
            >
              {isFetchingPosts ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Feed />
            {!postsError && <PromptDrawer setSuccessMessage={setSuccessMessage} />}
          </>
        )}
      </View>

      <JoinGroupModal visible={joinGroupModalVisible} onClose={() => setJoinGroupModalVisible(false)} />
    </SafeAreaView>
  );
}

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
  },
  headerLeft: {
    flex: 1,
    width: '100%',
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
  joinGroupContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  joinGroupOverlineText: {
    color: Colors.text,
    fontSize: 18,
  },
  joinGroupLinkText: {
    color: Colors.primary,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
