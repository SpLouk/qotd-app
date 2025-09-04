import Colors from '@/constants/Colors';
import { CreatePromptQuestionRequest } from '@/types/api';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroupId } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';

interface Props {
  disabled?: boolean;
  setSuccessMessage: (content: string | null) => void;
}

export const WritePromptWidget = ({ disabled, setSuccessMessage }: Props) => {
  const [newPromptContent, setNewPromptContent] = useState('');
  const queryClient = useQueryClient();
  const groupId = useGroupId();
  const fetchAndParseJson = useFetchApiAndParseJson();

  const { mutate: fetchSuggestion, isPending: isFetchingSuggestion } = useMutation({
    mutationKey: ['suggestPrompt'],
    mutationFn: async () => {
      if (!groupId) throw new Error('No group ID available');
      const params = new URLSearchParams();
      if (newPromptContent.trim()) {
        params.append('partial_prompt', newPromptContent.trim());
      }
      return fetchAndParseJson(`/groups/${groupId}/prompt_questions/suggest?${params}`);
    },
    onSuccess: (data: { suggested_prompt: string }) => {
      setNewPromptContent(data.suggested_prompt);
    },
  });

  const { mutate: submitPrompt, isPending: isSubmittingPrompt } = useMutation({
    mutationKey: ['createPrompt'],
    mutationFn: (data: CreatePromptQuestionRequest) => {
      if (!groupId) throw new Error('No group ID available');
      return fetchAndParseJson(`/groups/${groupId}/prompt_questions`, {
        body: JSON.stringify(data),
        method: 'POST',
      });
    },
    onSuccess: () => {
      setSuccessMessage('Your prompt was submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['promptQuestions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setNewPromptContent('');
    },
  });
  function handleSubmitPrompt() {
    const truncatedContent = newPromptContent.trim().slice(0, 256);
    if (!truncatedContent) return;

    const payload: CreatePromptQuestionRequest = {
      prompt_question: {
        content: truncatedContent,
      },
    };

    submitPrompt(payload);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>No prompts yet, submit a prompt:</Text>
      <TextInput
        style={styles.input}
        value={newPromptContent}
        onChangeText={setNewPromptContent}
        placeholder="Type your prompt here..."
        placeholderTextColor={Colors.textSecondary}
        multiline
        maxLength={256}
        editable={!disabled && !isSubmittingPrompt}
      />
      <View style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          onPress={() => fetchSuggestion()}
          disabled={disabled || isFetchingSuggestion}
        >
          {isFetchingSuggestion ? <ActivityIndicator /> : <Text style={styles.suggestButtonText}>slop it up</Text>}
        </Pressable>
        <Text>or</Text>
        <Pressable
          style={({ pressed }) => [
            pressed && { opacity: 0.6 },
            styles.submitButton,
            (!newPromptContent.trim() || disabled || isSubmittingPrompt) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitPrompt}
          disabled={!newPromptContent.trim() || disabled || isSubmittingPrompt}
        >
          {isSubmittingPrompt ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
    fontSize: 14,
    color: Colors.text,
  },
  suggestButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
