import { createPost } from '@/api/posts';
import { CreatePostRequest } from '@/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WriteResponse() {
  const { promptId, promptContent, initialResponse } = useLocalSearchParams<{
    promptId: string;
    promptContent: string;
    initialResponse: string;
  }>();
  const [response, setResponse] = useState(initialResponse || '');
  const queryClient = useQueryClient();

  // Submit the post
  const { mutate: submitPost, isPending } = useMutation({
    mutationKey: ['posts'],
    mutationFn: createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.replace({
        pathname: '/',
        params: { postId: data.id.toString() },
      });
    },
  });

  function handleSubmit() {
    if (!response.trim()) {
      return;
    }

    const payload: CreatePostRequest = {
      post: { prompt_question_id: parseInt(promptId), content: response.trim() },
    };
    submitPost(payload);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss} style={styles.dismissKeyboard}>
        <View style={styles.header}>
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>{promptContent}</Text>
          </View>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending || !response.trim()}
            style={[styles.headerButton, (!response.trim() || isPending) && styles.headerButtonDisabled]}
          >
            <Text style={[styles.headerButtonText, (!response.trim() || isPending) && styles.headerButtonTextDisabled]}>
              {isPending ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Start writing..."
          placeholderTextColor="#999"
          value={response}
          onChangeText={setResponse}
          autoFocus
          textAlignVertical="top"
          editable={!isPending}
        />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dismissKeyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerSpacer: {
    flex: 1,
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
    padding: 10,
    paddingLeft: 0,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    fontSize: 17,
    lineHeight: 24,
    color: '#000',
  },
});
