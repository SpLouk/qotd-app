import { useUserApi } from '@/api/useUserApi';
import BackButton from '@/components/BackButton';
import { UserProfileHeader } from '@/components/UserProfileHeader';
import Colors from '@/constants/Colors';
import { GroupContext, useGroup } from '@/context/GroupContext';
import { User } from '@/types/api';
import { useFetchApi } from '@/utils/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isFuture } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useCallback, useContext } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupPage() {
  const { data: selectedGroup, isLoading: isLoadingGroup } = useGroup();
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [error, setError] = React.useState('');

  const { data: currentUser } = useUserApi();
  const current_user_role = currentUser?.groups?.find((group) => group.id === selectedGroup?.id)?.current_user_role;

  const onCopyCode = useCallback(
    (inviteCode: string) => async () => {
      await Clipboard.setStringAsync(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    },
    [setCopiedCode],
  );

  const { invalidateUser } = useUserApi();
  const fetchApi = useFetchApi();
  const groupContext = useContext(GroupContext);
  const queryClient = useQueryClient();
  if (!groupContext) {
    throw new Error('JoinGroupModal must be used within a GroupProvider');
  }
  const { setSelectedGroupId } = groupContext;
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      return fetchApi(`/groups/${selectedGroup?.id}/leave_group`, {
        method: 'DELETE',
      });
    },
    mutationKey: ['leave_group', selectedGroup?.id],
    onSuccess: () => {
      invalidateUser();
      setSelectedGroupId(null);
      router.replace('/');
    },
    onError: (err: any) => {
      setError(err?.message || 'Could not leave group');
    },
  });
  const removeUserFromGroup = useMutation({
    mutationFn: async (userId: number) => {
      return fetchApi(`/groups/${selectedGroup?.id}/remove_user/${userId}`, {
        method: 'DELETE',
      });
    },
    mutationKey: ['remove_user_from_group', selectedGroup?.id],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', selectedGroup?.id] });
    },
    onError: (err: any) => {
      setError(err?.message || 'Could not remove user from group');
    },
  });

  const handleRemoveUserFromGroup = (targetUser: User) => {
    const isSelf = targetUser.id === currentUser?.id;
    Alert.alert(
      isSelf ? 'Leave Group?' : 'Remove User?',
      isSelf
        ? 'Are you sure you want to leave this group?'
        : `Are you sure you want to remove ${targetUser.username} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSelf ? 'Leave' : 'Remove',
          style: 'destructive',
          onPress: () => {
            if (isSelf) {
              leaveGroupMutation.mutate();
            } else {
              removeUserFromGroup.mutate(targetUser.id);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (isLoadingGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!selectedGroup) {
    router.replace('/');
    return null;
  }

  const nextActivationText =
    selectedGroup.next_scheduled_activation && isFuture(selectedGroup.next_scheduled_activation)
      ? formatDistanceToNow(new Date(selectedGroup.next_scheduled_activation), { addSuffix: true })
      : undefined;

  return (
    <SafeAreaView style={styles.container}>
      {copiedCode && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>Copied invite code!</Text>
        </View>
      )}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View>
          <Text style={styles.groupName}>{selectedGroup.name}</Text>
          {selectedGroup.description && <Text style={styles.nextActivation}>{selectedGroup.description}</Text>}
          {nextActivationText && <Text style={styles.nextActivation}>Next prompt: {nextActivationText}</Text>}
        </View>
      </View>

      {selectedGroup.active_invite_codes && selectedGroup.active_invite_codes.length > 0 && (
        <View style={styles.sectionCentered}>
          <Text style={styles.sectionTitle}>Invite Code</Text>
          <View style={styles.inviteCodes}>
            {selectedGroup.active_invite_codes.map((code) => (
              <Pressable
                key={code}
                style={({ pressed }) => [styles.inviteCode, pressed && { opacity: 0.5 }]}
                onPress={onCopyCode(code)}
              >
                <Text style={styles.inviteCodeText}>{code}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.inviteCodeExplanation}>
            Send this code to a friend so they can join {selectedGroup.name}
          </Text>
        </View>
      )}

      {error ? <Text>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members ({selectedGroup.members.length})</Text>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={selectedGroup.members}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <UserProfileHeader user_id={item.id} username={item.username} user_photo_url={item.profile_photo_url} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingRight: 16 }}>
                {item.id === currentUser?.id && <Text style={{ color: Colors.textSecondary }}>(You)</Text>}
                {item.id === currentUser?.id || current_user_role === 'admin' ? (
                  <Pressable
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                    onPress={() => handleRemoveUserFromGroup(item)}
                  >
                    <FontAwesome6 name="user-minus" size={20} color={Colors.error} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
  },
  groupName: {
    fontSize: 24,
    color: Colors.appTitle,
    fontWeight: '600',
  },
  nextActivation: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    gap: 12,
    flex: 1,
  },
  sectionCentered: {
    gap: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.text,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inviteCodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inviteCode: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inviteCodeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  inviteCodeExplanation: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    padding: 12,
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
  },
});
