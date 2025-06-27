import { useActivePrompt } from '@/api/useActivePrompt';
import { useUserApi } from '@/api/useUserApi';
import { UploadPhotoPreview } from '@/components/UploadPhotoPreview';
import { createPostRequestBody } from '@/components/helpers/useCreatePost';
import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { Post } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from 'react-native';

export function PromptResponseWriter() {
  const [offTopic, setOffTopic] = useState(false);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  const { invalidateUser } = useUserApi();
  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();

  const { data: activePrompt, isLoading } = useActivePrompt();

  // Helper to show off-topic button only if not off-topic
  const showOffTopicButton = !offTopic && !!activePrompt;

  const { mutate: submitPost, isPending } = useMutation<Post, Error, any>({
    mutationKey: ['posts', groupId],
    mutationFn: (data) =>
      fetchAndParseJson(`/groups/${groupId}/posts`, {
        body: createPostRequestBody(data),
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promptQuestionsActivatedInfinite', groupId] });
      invalidateUser();
    },
  });

  const noResponseContent = !response.trim() && photos.length === 0;

  async function handleSubmit() {
    if (noResponseContent || !activePrompt || isPending) {
      return;
    }
    submitPost({
      photos,
      prompt_question_id: parseInt(activePrompt.id),
      content: response,
      off_topic: !!offTopic,
    });
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
  const isKeyboardVisible = useIsKeyboardVisible();

  if (isLoading) {
    return <ActivityIndicator color={Colors.primary} size="large" />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'column', flex: 1 }}>
          {activePrompt?.activated_at && (
            <Text style={styles.promptOverline}>
              {formatDistanceToNow(new Date(activePrompt.activated_at), { addSuffix: true })}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setOffTopic((prev) => !prev)}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Text style={[styles.promptText, offTopic && styles.strikethrough]}>{activePrompt?.content}</Text>
          </Pressable>
          {showOffTopicButton && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setOffTopic(true)}
              style={({ pressed }) => [styles.offTopicButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.offTopicButtonText}>Boring prompt?</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [{ marginTop: 18 }, pressed && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isPending || noResponseContent}
        >
          <Text style={[styles.headerButtonText, noResponseContent && styles.headerButtonTextDisabled]}>
            {isPending ? 'Submitting...' : 'Submit'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          multiline
          placeholder={offTopic ? 'Write anything, or post a selfie...' : 'Write your response...'}
          placeholderTextColor="#999"
          value={response}
          autoFocus
          onChangeText={setResponse}
          editable={!isPending}
        />
      </ScrollView>
      {photos.length ? (
        <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
          <UploadPhotoPreview photos={photos} onRemovePhoto={removePhoto} />
        </View>
      ) : null}
      <View style={[styles.photoButtonRow, isKeyboardVisible && { marginBottom: '30%' }]}>
        <Pressable
          accessibilityRole="button"
          onPress={takePhoto}
          style={({ pressed }) => [styles.photoButton, pressed && { opacity: 0.7 }]}
        >
          <FontAwesome name="camera" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={pickImage}
          style={({ pressed }) => [styles.photoButton, pressed && { opacity: 0.7 }]}
        >
          <FontAwesome name="image" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={{ flex: 1 }}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={Keyboard.dismiss}
          style={({ pressed }) => [styles.photoButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  photoButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  photoButton: {
    paddingHorizontal: 12,
  },
  doneButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  offTopicButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  offTopicButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  headerButtonText: {
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flexWrap: 'wrap',
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  inputContainer: {
    paddingHorizontal: 16,
  },
});

const useIsKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleKeyboardShow = () => {
    setIsKeyboardVisible(true);
  };

  const handleKeyboardHide = () => {
    setIsKeyboardVisible(false);
  };
  return isKeyboardVisible;
};
