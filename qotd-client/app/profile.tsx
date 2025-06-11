import { useUserApi } from '@/api/useUserApi';
import BackButton from '@/components/BackButton';
import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import Colors from '@/constants/Colors';
import { User } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [error, setError] = useState('');

  const { data: user, invalidateUser, logoutMutation } = useUserApi();
  const fetchApiAndParseJson = useFetchApiAndParseJson();

  const [email, setEmailAddress] = useState(user?.email_address ?? '');

  const handleUpdateEmail = () => {
    setError('');
    updateUser({ user: { email_address: email.trim().toLowerCase() } });
  };

  const { mutate: updateUser, isPending: isUpdatingEmail } = useMutation({
    mutationFn: (user: { user: Partial<User> }) =>
      fetchApiAndParseJson('/user', { method: 'PATCH', body: JSON.stringify(user) }),
    onSuccess: async () => {
      invalidateUser();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmailAddress}
          placeholder="email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
          onPress={handleUpdateEmail}
          disabled={isUpdatingEmail}
        >
          {isUpdatingEmail ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.buttonText}>Update email</Text>
          )}
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Text style={styles.eulaNotice}>
        By using Hoot, you agree to be bound by our{' '}
        <Pressable
          onPress={() => Linking.openURL('https://hoot.loukidelis.ca/eula.html')}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          accessibilityRole="link"
          accessibilityLabel="License Agreement"
        >
          <Text style={styles.eulaLinkText}>License Agreement</Text>
        </Pressable>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  button: {
    width: 260,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
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
    gap: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
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
  input: {
    width: '100%',
    maxWidth: 300,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colors.text,
  },
  eulaNotice: {
    marginTop: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    alignSelf: 'center',
    lineHeight: 28,
  },
  eulaLinkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
