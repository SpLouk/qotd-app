import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import Colors from '@/constants/Colors';
import { api } from '@/utils/api';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const handleImageSelected = (selectedImage: ImagePicker.ImagePickerAsset) => {
    setImage(selectedImage);
  };

  const handleSubmit = async () => {
    try {
      if (!username.trim()) {
        setError('Username is required');
        return;
      }

      if (!image) {
        setError('Please add a profile photo');
        return;
      }

      // Create form data for multipart request
      const formData = new FormData();
      formData.append('user[username]', username);
      formData.append('user[profile_photo]', {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: image.fileName || 'profile-photo.jpg',
      } as any);

      await api.patch('/user', formData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.replace('/');
    } catch (e: any) {
      if (e.message.includes('422')) {
        setError('This username is already taken');
      } else {
        setError('Something went wrong. Please try again.');
        console.error(e);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Your Profile</Text>

          <ProfilePhotoChanger onImageSelected={handleImageSelected} onError={setError} size={120} />

          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (!username.trim() || !image) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!username.trim() || !image}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.text,
  },
  input: {
    width: '100%',
    maxWidth: 300,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 16,
    fontSize: 16,
    color: Colors.text,
  },
  error: {
    color: Colors.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.primary + '80',
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
