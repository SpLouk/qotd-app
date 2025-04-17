import { usePostsApi } from '@/api/usePostsApi';
import { useUserApi } from '@/api/useUserApi';
import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { CreatePostRequest, Post } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WriteResponse() {
  const { promptId, promptContent, initialResponse } = useLocalSearchParams<{
    promptId: string;
    promptContent: string;
    initialResponse: string;
  }>();
  const [response, setResponse] = useState(initialResponse || '');
  const router = useRouter();

  const { invalidatePosts } = usePostsApi();
  const { invalidateUser } = useUserApi();
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();

  const { mutate: submitPost, isPending } = useMutation<Post, Error, CreatePostRequest>({
    mutationKey: ['posts', groupId],
    mutationFn: (data) => fetchAndParseJson(`/groups/${groupId}/posts`, { body: JSON.stringify(data), method: 'POST' }),
    onSuccess: () => {
      invalidatePosts();
      invalidateUser();
      router.replace('/');
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss} style={styles.dismissKeyboard}>
          <View style={styles.header}>
            <View style={styles.promptContainer}>
              <Text style={styles.promptText}>{promptContent}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isPending || !response.trim()}
              style={[styles.headerButton, (!response.trim() || isPending) && styles.headerButtonDisabled]}
            >
              <Text
                style={[styles.headerButtonText, (!response.trim() || isPending) && styles.headerButtonTextDisabled]}
              >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
    borderBottomColor: Colors.border,
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
    color: Colors.primary,
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  promptContainer: {
    padding: 10,
    paddingLeft: 0,
    flex: 1,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
  },
});
