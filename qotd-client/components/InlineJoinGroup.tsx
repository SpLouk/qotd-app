import Colors from '@/constants/Colors';
import { GroupContext } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import React, { useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface InlineJoinGroupProps {
  title?: string;
  onSuccess: (groupId: string) => void;
  onCancel?: () => void;
}

export function InlineJoinGroup({ title, onSuccess, onCancel }: InlineJoinGroupProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const fetchApiAndParseJson = useFetchApiAndParseJson();
  const groupContext = useContext(GroupContext);

  if (!groupContext) {
    throw new Error('JoinGroupModal must be used within a GroupProvider');
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
      setInviteCode('');
      setJoinError(null);
      setSelectedGroupId(data.group_id);
      onSuccess(data.group_id);
    },
    onError: (err: any) => {
      setJoinError(err?.message || 'Could not join group.');
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? 'Join a Group'}</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter invite code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!joinGroupMutation.isPending}
      />
      {joinError && <Text style={styles.errorText}>{joinError}</Text>}
      <View style={styles.buttonRow}>
        {onCancel && (
          <Pressable
            onPress={onCancel}
            disabled={joinGroupMutation.isPending}
            style={({ pressed }) => [{ opacity: joinGroupMutation.isPending ? 0.5 : pressed ? 0.5 : 1 }]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            {
              opacity: !inviteCode || joinGroupMutation.isPending ? 0.7 : pressed ? 0.5 : 1,
            },
          ]}
          onPress={() => {
            setJoinError(null);
            joinGroupMutation.mutate(inviteCode);
          }}
          disabled={!inviteCode || joinGroupMutation.isPending}
        >
          <Text style={styles.joinButtonText}>{joinGroupMutation.isPending ? 'Joining...' : 'Join'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#fafafa',
    width: '100%',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
  joinButtonText: {
    color: Colors.primary,
    fontSize: 18,
  },
  errorText: {
    color: Colors.error || 'red',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 32,
  },
});
