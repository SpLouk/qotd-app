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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [error, setError] = useState('');

  const { data: user, invalidateUser, logoutMutation, deleteUser } = useUserApi();
  const fetchApiAndParseJson = useFetchApiAndParseJson();

  const [email, setEmailAddress] = useState(user?.email_address ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
    setDeleteInput('');
    setDeleteError('');
  };

  const confirmDelete = () => {
    setDeleteError('');
    deleteUser.mutate(undefined, {
      onError: (e: any) => {
        setDeleteError(e?.message || 'Failed to delete account.');
      },
    });
  };

  const isDeleteEnabled = deleteInput.trim() === user?.username;

  const closeDeleteDialog = () => {
    setShowDeleteConfirm(false);
    setDeleteInput('');
    setDeleteError('');
  };

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
      {/* Delete Account Section */}
      <Pressable
        style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </Pressable>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteDialog}
        hardwareAccelerated
        statusBarTranslucent
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalBox}>
            <Text style={styles.deleteModalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.deleteModalText}>
              This action is <Text style={{ fontWeight: 'bold', color: Colors.error }}>permanent</Text> and cannot be
              undone. To confirm, type your username below:
            </Text>
            <Text style={styles.deleteModalUsername}>{user.username}</Text>
            <TextInput
              style={styles.deleteModalInput}
              placeholder="Type your username to confirm"
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deleteUser.isPending}
            />
            {deleteError ? <Text style={styles.deleteModalError}>{deleteError}</Text> : null}
            <View style={styles.deleteModalActions}>
              <Pressable
                style={({ pressed }) => [styles.deleteModalCancel, pressed && { opacity: 0.7 }]}
                onPress={closeDeleteDialog}
                disabled={deleteUser.isPending}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteModalConfirm,
                  (!isDeleteEnabled || deleteUser.isPending) && styles.deleteModalConfirmDisabled,
                  pressed && isDeleteEnabled && !deleteUser.isPending && { opacity: 0.7 },
                ]}
                onPress={confirmDelete}
                disabled={!isDeleteEnabled || deleteUser.isPending}
              >
                {deleteUser.isPending ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  deleteButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 16,
  },
  deleteModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deleteModalBox: {
    width: 320,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  deleteModalText: {
    color: Colors.text,
    textAlign: 'center',
  },
  deleteModalUsername: {
    color: Colors.text,
    textAlign: 'center',
  },
  deleteModalInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
    color: Colors.text,
    backgroundColor: Colors.background,
    textAlign: 'center',
  },
  deleteModalError: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    gap: 12,
  },
  deleteModalCancel: {
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: 15,
  },
  deleteModalConfirm: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteModalConfirmDisabled: {
    backgroundColor: Colors.error + '60',
  },
  deleteModalConfirmText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 15,
  },
});
