import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useContext, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { GroupTitlePager } from '@/components/GroupTitlePager';
import { useUserApi } from '@/api/useUserApi';
import Colors from '@/constants/Colors';
import { GroupContext } from '@/context/GroupContext';
import { JoinGroupModal } from '@/components/JoinGroupModal';

export function AppHeader() {
  const [joinGroupModalVisible, setJoinGroupModalVisible] = useState(false);
  const { data: user } = useUserApi();
  const groupList = user?.groups;
  const { setSelectedGroupId, selectedGroupId } = useContext(GroupContext)!;

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
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <GroupTitlePager
          groupList={groupList}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          router={router}
        />
      </View>
      <Pressable onPress={handlePlusPress} style={styles.menuButton} accessibilityLabel="Add or join group">
        <FontAwesome6 name="bars" size={24} color={Colors.primary} weight="thin" />
      </Pressable>

      <JoinGroupModal visible={joinGroupModalVisible} onClose={() => setJoinGroupModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
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

  menuButton: {
    padding: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
