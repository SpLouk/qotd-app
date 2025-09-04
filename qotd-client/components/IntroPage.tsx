import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useContext, useState } from 'react';
import { useUserApi } from '@/api/useUserApi';
import { useFetchApiAndParseJson } from '@/utils/api';
import { GroupContext } from '@/context/GroupContext';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';

export const IntroPage = () => {
  const [joinError, setJoinError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const fetchApiAndParseJson = useFetchApiAndParseJson();
  const { invalidateUser } = useUserApi();
  const groupContext = useContext(GroupContext);
  const router = useRouter();
  
  if (!groupContext) {
    throw new Error('IntroPage must be used within a GroupProvider');
  }
  
  const { setSelectedGroupId } = groupContext;
  const joinGroupMutation = useMutation({
    mutationFn: async (code: string) => {
      return fetchApiAndParseJson('/groups/join_with_code', {
        method: 'POST',
        body: JSON.stringify({ invite_code: code }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      invalidateUser();
      setSelectedGroupId(data.group_id);
    },
    onError: (err: any) => {
      setJoinError(err?.message || 'Could not join group.');
    },
  });
  const handleJoinGroup = () => {
    setJoinError(null);
    joinGroupMutation.mutate(inviteCode);
  };
  return (
    <View style={styles.joinGroupContainer}>
      <Text style={styles.overline}>Welcome to Hoot!</Text>
      <Text>If you've been given a group invite code by a friend, enter it here:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: '24' }}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!joinGroupMutation.isPending}
        />
        <Pressable
          style={({ pressed }) => [{ opacity: !inviteCode || joinGroupMutation.isPending ? 0.7 : pressed ? 0.5 : 1 }]}
          onPress={handleJoinGroup}
          disabled={!inviteCode || joinGroupMutation.isPending}
        >
          <Text style={styles.modalOptionText}>{joinGroupMutation.isPending ? 'Joining...' : 'Join'}</Text>
        </Pressable>
      </View>
      <Text>Or, create a new group and invite your friends!</Text>
      <Pressable
        style={({ pressed }) => [
          { opacity: pressed ? 0.5 : 1 },
          { borderWidth: 1, padding: 12, borderRadius: 8, borderColor: Colors.primary },
        ]}
        onPress={() => router.push('/create-group')}
      >
        <Text style={styles.modalOptionText}>Create Group</Text>
      </Pressable>
      {joinError && <Text style={styles.errorText}>{joinError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  overline: {
    fontSize: 32,
    color: Colors.appTitle,
    fontWeight: '600',
    marginBottom: 32,
  },
  joinGroupContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    padding: '15%',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  modalOptionText: {
    fontSize: 18,
    color: Colors.primary,
  },
});
