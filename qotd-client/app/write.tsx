import { usePostsApi } from '@/api/usePostsApi';
import { useUserApi } from '@/api/useUserApi';
import Colors from '@/constants/Colors';
import { useGroup, useGroupId } from '@/context/GroupContext';
import { CreatePostRequest, Post } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { UploadPhotoPreview } from '@/components/UploadPhotoPreview';

export default function WriteResponse() {
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState('');
  const { activePromptQuestionQuery, invalidatePosts } = usePostsApi();
  const { data: activePrompt, isLoading } = activePromptQuestionQuery;
  const [response, setResponse] = useState('');
  const router = useRouter();

  const { invalidateUser } = useUserApi();
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();
  const { data: group } = useGroup();

  const { mutate: submitPost, isPending } = useMutation<Post, Error, any>({
    mutationKey: ['posts', groupId],
    mutationFn: (data) => {
      // If FormData, send as multipart, else JSON
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      return fetchAndParseJson(`/groups/${groupId}/posts`, {
        body: isFormData ? data : JSON.stringify(data),
        method: 'POST',
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      invalidatePosts();
      invalidateUser();
      router.replace('/');
    },
  });

  const noResponseContent = !response.trim() && photos.length === 0;

  async function handleSubmit() {
    if (noResponseContent || !activePrompt || isPending) {
      return;
    }
    if (photos.length > 0) {
      // Send as multipart/form-data
      const formData = new FormData();
      formData.append('post[prompt_question_id]', String(activePrompt.id));
      formData.append('post[content]', response.trim());
      photos.forEach((photo: ImagePicker.ImagePickerAsset, idx: number) => {
        formData.append('post[photos][]', {
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          name: photo.fileName || `photo-${idx + 1}.jpg`,
        } as any);
      });
      submitPost(formData as any); // mutationFn will handle FormData
    } else {
      // Send as JSON
      const payload: CreatePostRequest = {
        post: { prompt_question_id: parseInt(activePrompt.id), content: response.trim() },
      };
      submitPost(payload);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="large" />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.header}>
            <View style={styles.promptContainer}>
              <Text style={styles.groupName}>{group?.name}</Text>
              <Text style={styles.promptText}>{activePrompt?.content}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isPending || noResponseContent}
              style={[styles.headerButton, noResponseContent && styles.headerButtonDisabled]}
            >
              <Text style={[styles.headerButtonText, noResponseContent && styles.headerButtonTextDisabled]}>
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
          <View style={styles.photoContainer}>
            <UploadPhotoPreview photos={photos} onRemovePhoto={removePhoto} />
            <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }} onPress={showImagePickerOptions}>
              <FontAwesome name="image" size={20} color={Colors.primary} />
            </Pressable>
            {error ? <Text>{error}</Text> : null}
          </View>
        </KeyboardAvoidingView>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  groupName: {
    fontSize: 16,
    color: Colors.appTitle,
    fontWeight: '600',
  },
  promptText: {
    fontSize: 24,
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
  photoContainer: {
    borderColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 16,
  },
});
