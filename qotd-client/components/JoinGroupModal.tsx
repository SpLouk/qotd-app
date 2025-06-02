import { useUserApi } from '@/api/useUserApi';
import Colors from '@/constants/Colors';
import { GroupContext } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import React, { useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface JoinGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoinGroupModal({ visible, onClose }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const fetchApiAndParseJson = useFetchApiAndParseJson();
  const groupContext = useContext(GroupContext);
  const { invalidateUser } = useUserApi();

  if (!groupContext) {
    throw new Error('JoinGroupModal must be used within a GroupProvider');
  }

  const { setSelectedGroupId } = groupContext;

  const handleClose = () => {
    setInviteCode('');
    setJoinError(null);
    onClose();
  };

  const joinGroupMutation = useMutation({
    mutationFn: async (code: string) => {
      return fetchApiAndParseJson('/groups/join_with_code', {
        method: 'POST',
        body: JSON.stringify({ invite_code: code }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      handleClose();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} onDismiss={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Join a Group</Text>
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
          <View style={styles.modalButtons}>
            <Pressable
              onPress={handleClose}
              disabled={joinGroupMutation.isPending}
              style={({ pressed }) => [{ opacity: joinGroupMutation.isPending ? 0.5 : pressed ? 0.5 : 1 }]}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                { opacity: !inviteCode || joinGroupMutation.isPending ? 0.7 : pressed ? 0.5 : 1 },
              ]}
              onPress={handleJoinGroup}
              disabled={!inviteCode || joinGroupMutation.isPending}
            >
              <Text style={styles.modalOptionText}>{joinGroupMutation.isPending ? 'Joining...' : 'Join'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'stretch',
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 32,
  },
  modalOptionText: {
    fontSize: 18,
    color: Colors.primary,
  },
  modalCancelText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
  },
});
