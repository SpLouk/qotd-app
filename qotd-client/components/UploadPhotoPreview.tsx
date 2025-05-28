import { FontAwesome } from '@expo/vector-icons';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';

interface IProps {
  photos: ImagePicker.ImagePickerAsset[];
  onRemovePhoto: (index: number) => void;
}

export const UploadPhotoPreview = ({ photos, onRemovePhoto }: IProps) => {
  return photos.length ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
      {photos.map((photo, idx) => (
        <View key={photo.uri} style={styles.photoPreviewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          <Pressable style={styles.removePhotoButton} onPress={() => onRemovePhoto(idx)}>
            <FontAwesome name="close" size={12} color={Colors.border} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  ) : null;
};

const styles = StyleSheet.create({
  scrollContainer: {
    borderRadius: 8,
  },
  photoPreviewContainer: {
    marginRight: 10,
    position: 'relative',
  },
  photoPreview: {
    width: 128,
    height: 128,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    borderColor: Colors.border,
    borderWidth: 1,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
