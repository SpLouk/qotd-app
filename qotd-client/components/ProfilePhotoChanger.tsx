import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ProfilePhotoChangerProps {
  initialPhotoUrl?: string;
  size?: number;
  onImageSelected: (image: ImagePicker.ImagePickerAsset) => void;
  onError?: (error: string) => void;
}

export function ProfilePhotoChanger({
  initialPhotoUrl,
  size = 120,
  onImageSelected,
  onError,
}: ProfilePhotoChangerProps) {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      onError?.('Permission to access gallery was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      onImageSelected(result.assets[0]);
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
      setImage(result.assets[0]);
      onImageSelected(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={[styles.photoContainer, { width: size, height: size }]}>
        {(image?.uri || initialPhotoUrl) ? (
          <Image
            source={{ uri: image?.uri || initialPhotoUrl }}
            style={[styles.photo, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <FontAwesome name="user" size={size / 2} color="#666" />
          </View>
        )}
        <View style={styles.editOverlay}>
          <FontAwesome name="camera" size={size / 4} color="#fff" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.button}>
          <FontAwesome name="image" size={16} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Choose Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto} style={styles.button}>
          <FontAwesome name="camera" size={16} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
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
  },
  photo: {
    borderRadius: 9999,
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '33%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
