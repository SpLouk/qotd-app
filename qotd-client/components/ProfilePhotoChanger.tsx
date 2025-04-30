import { useFetchApiAndParseJson } from '@/utils/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface ProfilePhotoChangerProps {
  initialPhotoUrl?: string;
  size?: number;
  onImageSelected?: (image: ImagePicker.ImagePickerAsset) => void;
  onError?: (error: string) => void;
  autoUpload?: boolean;
}

export function ProfilePhotoChanger({
  initialPhotoUrl,
  size = 120,
  onImageSelected,
  onError,
  autoUpload = false,
}: ProfilePhotoChangerProps) {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const queryClient = useQueryClient();
  const fetchApi = useFetchApiAndParseJson()

  const updateProfilePhotoMutation = useMutation({
    mutationFn: async (imageAsset: ImagePicker.ImagePickerAsset) => {
      const formData = new FormData();
      formData.append('user[profile_photo]', {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || 'image/jpeg',
        name: imageAsset.fileName || 'profile-photo.jpg',
      } as any);

      return fetchApi('/user', { method: 'PATCH', body: formData });
    },
    onSuccess: () => {
      // Invalidate and refetch the user query to update profile photo in UI
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      onError?.('Failed to update profile photo');
      console.error(error);
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      onError?.('Permission to access gallery was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageChange(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      onError?.('Permission to access camera was denied');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageChange(result.assets[0]);
    }
  };

  const handleImageChange = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    setImage(imageAsset);

    if (autoUpload) {
      updateProfilePhotoMutation.mutate(imageAsset);
    }

    if (onImageSelected) {
      onImageSelected(imageAsset);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose a new profile photo',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showImagePickerOptions} style={[styles.photoContainer, { width: size, height: size }]}>
        {image?.uri || initialPhotoUrl ? (
          <Image
            source={{ uri: image?.uri || initialPhotoUrl }}
            style={[styles.photo, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <FontAwesome name="user" size={size / 2} color="#666" />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={showImagePickerOptions} style={styles.button}>
        <Text style={styles.buttonText}>Edit Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  photoContainer: {
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  photo: {
    borderRadius: 9999,
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
