import { fetchCurrentUser, logout } from '@/api/user';
import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import BackButton from '@/components/BackButton';
import Colors from '@/constants/Colors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/utils/api';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await api.clearToken();
      queryClient.clear();
      router.replace('/sign-in');
    },
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>@{user.username}</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: () => logoutMutation.mutate(),
              },
            ]);
          }}
          disabled={logoutMutation.isPending}
        >
          <Text style={styles.logoutButtonText}>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <ProfilePhotoChanger initialPhotoUrl={user.profile_photo_url} onError={setError} autoUpload size={80} />
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  profileSection: {
    padding: 16,
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: Colors.error + '10',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
});
