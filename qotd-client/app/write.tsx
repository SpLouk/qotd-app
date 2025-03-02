import { createPost } from '@/api/posts';
import { CreatePostRequest } from '@/types/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function WriteResponse() {
  const { promptId, promptContent, initialResponse } = useLocalSearchParams<{
    promptId: string;
    promptContent: string;
    initialResponse: string;
  }>();
  const [response, setResponse] = useState(initialResponse || '');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const queryClient = useQueryClient();

  // Set up keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Submit the post
  const { mutate: submitPost, isPending } = useMutation({
    mutationKey: ['posts'],
    mutationFn: createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.replace({
        pathname: '/prompts',
        params: { postId: data.id.toString() },
      });
    },
  });

  function handleDoneOrSubmit() {
    if (isKeyboardVisible) {
      // If keyboard is visible, just hide it
      Keyboard.dismiss();
    } else {
      // If keyboard is already hidden, submit the post
      if (!response.trim()) {
        return;
      }

      const payload: CreatePostRequest = {
        post: { prompt_question_id: parseInt(promptId), content: response.trim() },
      };
      submitPost(payload);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          onPress={handleDoneOrSubmit}
          disabled={isPending || !response.trim()}
          style={[styles.headerButton, (!response.trim() || isPending) && styles.headerButtonDisabled]}
        >
          <Text style={[styles.headerButtonText, (!response.trim() || isPending) && styles.headerButtonTextDisabled]}>
            {isPending ? 'Submitting...' : isKeyboardVisible ? 'Done' : 'Submit'}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

