import Colors from '@/constants/Colors';
import { GroupContext } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fetchApiAndParseJson = useFetchApiAndParseJson();
  const groupContext = useContext(GroupContext);
  const queryClient = useQueryClient();

  if (!groupContext) throw new Error('Must be used within GroupProvider');
  const { setSelectedGroupId } = groupContext;

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      return fetchApiAndParseJson('/groups', {
        method: 'POST',
        body: JSON.stringify({ group: { name, description, privacy_level: 'closed' } }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      setSelectedGroupId(data.group_id);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.message || 'Could not create group.');
    },
  });

  const handleCreate = () => {
    setError(null);
    createGroupMutation.mutate({ name, description });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create a Group</Text>
        <TextInput
          style={styles.input}
          placeholder="Group Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!createGroupMutation.isPending}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!createGroupMutation.isPending}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, (!name || createGroupMutation.isPending) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!name || createGroupMutation.isPending}
        >
          {createGroupMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 28,
    color: Colors.text,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    color: Colors.text,
  },
  error: {
    color: Colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
