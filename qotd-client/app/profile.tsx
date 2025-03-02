import { fetchCurrentUser } from '@/api/user';
import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });
  const [error, setError] = useState('');

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <ProfilePhotoChanger initialPhotoUrl={user.profile_photo_url} onError={setError} autoUpload />
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
