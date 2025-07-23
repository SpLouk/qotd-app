import { useActivePrompt } from '@/api/useActivePrompt';
import type { ScrollView as ScrollViewType } from 'react-native';
import BackButton from '@/components/BackButton';
import { createPostRequestBody } from '@/components/helpers/useCreatePost';
import { Post } from '@/components/Post';
import { UploadPhotoPreview } from '@/components/UploadPhotoPreview';
import Colors from '@/constants/Colors';
import { useGroup, useGroupId } from '@/context/GroupContext';
import { CreatePostRequest } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState('');

  function removePhoto(idx: number) {
    setPhotos((prev: ImagePicker.ImagePickerAsset[]) => prev.filter((_, i) => i !== idx));
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access gallery was denied');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      setPhotos((prev: ImagePicker.ImagePickerAsset[]) => [...prev, ...result.assets]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access camera was denied');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      setPhotos((prev: ImagePicker.ImagePickerAsset[]) => [...prev, ...result.assets]);
    }
  }

  function showImagePickerOptions() {
    Alert.alert(
      'Add Photo',
      'Choose a photo source',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  }
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reply, setReply] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const queryClient = useQueryClient();
  const api = useFetchApiAndParseJson();

  const groupId = useGroupId();
  const { data: selectedGroup } = useGroup();

  const { data: activePrompt, isLoading } = useActivePrompt();

  const post = activePrompt?.posts?.find((post) => post.id === Number.parseInt(id));

  // Submission logic: multipart if photos, JSON if not
  const addReplyMutation = useMutation({
    mutationFn: (data: CreatePostRequest['post']) =>
      api(`/groups/${groupId}/posts`, {
        body: createPostRequestBody(data),
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promptQuestionsActivatedInfinite', groupId] });
      setReply('');
      setPhotos([]);
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

  // Handle text input changes to detect @ symbol
  useEffect(() => {
    // Check if we should show the mentions popup
    if (cursorPosition > 0) {
      const textBeforeCursor = reply.substring(0, cursorPosition);
      const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtSymbolIndex !== -1 && !textBeforeCursor.substring(lastAtSymbolIndex).includes(' ')) {
        setShowMentions(true);
        setMentionQuery(textBeforeCursor.substring(lastAtSymbolIndex + 1));
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [reply, cursorPosition]);

  if (isLoading || !post || !activePrompt?.posts) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const noReplyContent = !reply.trim() && photos.length === 0;
  const handleSubmitReply = () => {
    if (noReplyContent) return;
    addReplyMutation.mutate({
      content: reply,
      photos,
      parent_post_id: Number.parseInt(id),
      prompt_question_id: post.prompt_question_id,
    });
  };
  // Handle selection of a username from the popup
  const handleSelectUsername = (username: string) => {
    const textBeforeCursor = reply.substring(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbolIndex !== -1) {
      // Replace the partial mention with the full username
      const newText = reply.substring(0, lastAtSymbolIndex + 1) + username + ' ' + reply.substring(cursorPosition);

      setReply(newText);
      setCursorPosition(lastAtSymbolIndex + username.length + 2); // +2 for @ and space
    }

    setShowMentions(false);
  };

  // Filter members based on mention query
  const filteredMembers =
    selectedGroup?.members.filter((member) =>
      mentionQuery ? member.username.toLowerCase().includes(mentionQuery.toLowerCase()) : true,
    ) || [];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <BackButton />
            <Pressable
              style={({ pressed }) => [
                styles.replyButton,
                noReplyContent && styles.disabledButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleSubmitReply}
              disabled={noReplyContent || addReplyMutation.isPending}
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
          <Post post={post} otherPosts={activePrompt.posts} readonly />
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.photoPreviewContainer}>
            <UploadPhotoPreview photos={photos} onRemovePhoto={removePhoto} />
          </View>
          <View style={styles.inputContainerInner}>
            <TextInput
              style={styles.replyInput}
              value={reply}
              onChangeText={setReply}
              onSelectionChange={(event) => setCursorPosition(event.nativeEvent.selection.start)}
              placeholder="Write your reply..."
              placeholderTextColor="#666"
              multiline
              autoFocus
              editable={!addReplyMutation.isPending}
            />
            <Pressable
              style={({ pressed }) => [styles.addPhotoButton, pressed && { opacity: 0.7 }]}
              onPress={showImagePickerOptions}
            >
              <FontAwesome name="image" size={20} color={Colors.primary} />
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {showMentions && filteredMembers.length > 0 && (
            <View style={styles.mentionsContainer}>
              <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.mentionItem, pressed && { backgroundColor: Colors.border }]}
                    onPress={() => handleSelectUsername(item.username)}
                  >
                    <Text style={styles.mentionUsername}>@{item.username}</Text>
                  </Pressable>
                )}
                keyboardShouldPersistTaps="handled"
                style={styles.mentionsList}
              />
            </View>
          )}
        </View>
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
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    paddingBottom: 8,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  inputContainerInner: {
    justifyContent: 'center',
  },
  photoPreviewContainer: {
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  error: {
    color: Colors.error,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  replyInput: {
    padding: 8,
    paddingRight: 48, // Space for floating button
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  mentionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  mentionsList: {
    maxHeight: 200,
  },
  mentionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mentionUsername: {
    fontSize: 16,
    color: Colors.primary,
  },
  addPhotoButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    backgroundColor: Colors.background,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
