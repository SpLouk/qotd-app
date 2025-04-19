import Colors from '@/constants/Colors';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface InlineJoinGroupProps {
  onSuccess: (groupId: string) => void;
}

export function InlineJoinGroup({ onSuccess }: InlineJoinGroupProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const fetchApiAndParseJson = useFetchApiAndParseJson();

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
      onSuccess(data.group_id);
    },
    onError: (err: any) => {
      setJoinError(err?.message || 'Could not join group.');
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group to Get Started</Text>
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
      <Pressable
        style={({ pressed }) => [
          styles.joinButton,
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
        <Text style={styles.joinButtonText}>
          {joinGroupMutation.isPending ? 'Joining...' : 'Join'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    color: Colors.text,
    backgroundColor: '#fafafa',
    width: 220,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error || 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
});
