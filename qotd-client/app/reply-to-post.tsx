import { usePostsApi } from '@/api/usePostsApi';
import BackButton from '@/components/BackButton';
import { Post } from '@/components/Post';
import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ReplyToPostPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reply, setReply] = useState('');
  const queryClient = useQueryClient();
  const api = useFetchApiAndParseJson();

  const groupId = useGroupId();

  const { data: posts = [], isLoading: isLoadingPosts } = usePostsApi();

  const post = posts.find((post) => post.id === Number.parseInt(id));

  const body = {
    post: {
      content: reply.trim(),
      parent_post_id: Number.parseInt(id),
      prompt_question_id: post?.prompt_question_id ?? 0,
    },
  };
  const addReplyMutation = useMutation({
    mutationFn: () => api(`/groups/${groupId}/posts`, { body: JSON.stringify(body), method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', groupId] });
      setReply('');
      router.back();
    },
  });

  const scrollViewRef = useRef<ScrollViewType | null>(null);
  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => keyboardListener.remove();
  }, [scrollViewRef]);

  if (isLoadingPosts || !post) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleSubmitReply = () => {
    if (reply.trim()) {
      addReplyMutation.mutate();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <BackButton />
            <Pressable
              style={({ pressed }) => [
                styles.replyButton,
                !reply.trim() && styles.disabledButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleSubmitReply}
              disabled={!reply.trim() || addReplyMutation.isPending}
            >
              {addReplyMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.replyButtonText}>Reply</Text>
              )}
            </Pressable>
          </View>
        </View>

        <ScrollView ref={scrollViewRef}>
          <Post post={post} readonly />
        </ScrollView>

        <TextInput
          style={styles.replyInput}
          value={reply}
          onChangeText={setReply}
          placeholder="Write your reply..."
          placeholderTextColor="#666"
          multiline
          autoFocus
          editable={!addReplyMutation.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  replyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  postPreview: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
  },
  replyInput: {
    padding: 16,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
