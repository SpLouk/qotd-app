import { usePostsApi } from '@/api/usePostsApi';
import { useUserApi } from '@/api/useUserApi';
import { UploadPhotoPreview } from '@/components/UploadPhotoPreview';
import { createPostRequestBody } from '@/components/helpers/useCreatePost';
import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { Post } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export function PromptResponseWriter() {
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState('');
  const { activePromptQuestionQuery, invalidatePosts } = usePostsApi();
  const { data: activePrompt, isLoading } = activePromptQuestionQuery;
  const [response, setResponse] = useState('');

  const { invalidateUser } = useUserApi();
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();

  const { mutate: submitPost, isPending } = useMutation<Post, Error, any>({
    mutationKey: ['posts', groupId],
    mutationFn: (data) =>
      fetchAndParseJson(`/groups/${groupId}/posts`, {
        body: createPostRequestBody(data),
        method: 'POST',
      }),
    onSuccess: () => {
      invalidatePosts();
      invalidateUser();
    },
  });

  const noResponseContent = !response.trim() && photos.length === 0;

  async function handleSubmit() {
    if (noResponseContent || !activePrompt || isPending) {
      return;
    }
    submitPost({ photos, prompt_question_id: parseInt(activePrompt.id), content: response });
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
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
      setPhotos((prev) => [...prev, ...result.assets]);
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
      setPhotos((prev) => [...prev, ...result.assets]);
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

  if (isLoading) {
    return <ActivityIndicator color={Colors.primary} size="large" />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'column', flex: 1 }}>
          <Text style={styles.promptOverline}>Today's prompt:</Text>
          <Text style={styles.promptText}>{activePrompt?.content}</Text>
        </View>

        <Pressable
          style={({ pressed }) => pressed && { opacity: 0.7 }}
          onPress={handleSubmit}
          disabled={isPending || noResponseContent}
        >
          <Text style={[styles.headerButtonText, noResponseContent && styles.headerButtonTextDisabled]}>
            {isPending ? 'Submitting...' : 'Submit'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        {photos.length ? (
          <View>
            <UploadPhotoPreview photos={photos} onRemovePhoto={removePhoto} />
          </View>
        ) : null}
        <View>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Write your response..."
            placeholderTextColor="#999"
            value={response}
            onChangeText={setResponse}
            autoFocus
            textAlignVertical="top"
            editable={!isPending}
          />
          <Pressable
            style={({ pressed }) => [styles.addPhotoButton, pressed && { opacity: 0.7 }]}
            onPress={showImagePickerOptions}
          >
            <FontAwesome name="image" size={20} color={Colors.primary} />
          </Pressable>
        </View>
      </View>
      {error ? <Text>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    height: '100%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  headerButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    opacity: 0.5,
    color: Colors.textSecondary,
  },
  promptOverline: {
    color: Colors.textSecondary,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flexWrap: 'wrap',
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    overflow: 'scroll',
  },
  addPhotoButton: {
    backgroundColor: Colors.background,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 16,
    gap: 16,
  },
});
