import { Post } from '@/types/api';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useUserApi } from '@/api/useUserApi';

type ProfileHeaderProps = Pick<Post, 'user_id' | 'username' | 'user_photo_url'>;

export const UserProfileHeader = ({ user_id, username, user_photo_url }: ProfileHeaderProps) => {
  const { data: currentUser } = useUserApi();

  const isCurrentUser = currentUser?.id === user_id;
  const handlePress = () => {
    if (isCurrentUser) {
      router.push('/profile');
    }
  };
  return (
    <Pressable onPress={handlePress} style={styles.userInfo}>
      <Image source={{ uri: user_photo_url }} style={styles.profilePhoto} />
      <Text style={styles.userName}>{username ?? 'Unknown'}</Text>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
});
