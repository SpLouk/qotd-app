import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/utils/api';
import { useState } from 'react';
import { fetchCurrentUser } from '@/api/user';
import { useQuery } from '@tanstack/react-query';

export default function ProfileScreen() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });
  const router = useRouter();
  const [error, setError] = useState('');

  if (!user) {
    return null;
  }

  const handleImageSelected = async (image: ImagePicker.ImagePickerAsset) => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'profile-photo.jpg',
      } as any);

      await api.patch('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (err) {
      setError('Failed to update profile photo');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <ProfilePhotoChanger
          initialPhotoUrl={user.profile_photo_url}
          onImageSelected={handleImageSelected}
          onError={setError}
        />
        <Text style={styles.name}>{user.username}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  error: {
    color: '#ff3b30',
    marginTop: 8,
  },
});
