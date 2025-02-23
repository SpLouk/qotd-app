import { createPost } from '@/api/posts';
import { CreatePostRequest } from '@/types/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function WriteResponse() {
  const { promptId, promptContent, initialResponse } = useLocalSearchParams<{
    promptId: string;
    promptContent: string;
    initialResponse: string;
  }>();
  const [response, setResponse] = useState(initialResponse || '');

  const { mutate: submitPost, isPending } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      router.push('/');
    },
  });

  function handleSubmit() {
    Keyboard.dismiss();
    if (!response.trim()) {
      return;
    }

    const payload: CreatePostRequest = {
      post: { prompt_question_id: parseInt(promptId), content: response.trim() },
    };
    submitPost(payload);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isPending || !response.trim()}
          style={[styles.headerButton, (!response.trim() || isPending) && styles.headerButtonDisabled]}
        >
          <Text style={[styles.headerButtonText, (!response.trim() || isPending) && styles.headerButtonTextDisabled]}>
            {isPending ? 'Submitting...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>{promptContent}</Text>
      </View>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Start writing..."
        value={response}
        onChangeText={setResponse}
        autoFocus
        textAlignVertical="top"
        editable={!isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: '#999',
  },
  promptContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    fontSize: 17,
    lineHeight: 24,
    color: '#000',
  },
});
