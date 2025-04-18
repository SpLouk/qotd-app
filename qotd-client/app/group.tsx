import Colors from '@/constants/Colors';
import { useGroup } from '@/context/GroupContext';
import { formatDistanceToNow, isFuture } from 'date-fns';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserProfileHeader } from '@/components/UserProfileHeader';

export default function GroupPage() {
  const { data: selectedGroup, isLoading: isLoadingGroup } = useGroup();
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (isLoadingGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!selectedGroup) {
    router.replace('/');
    return null;
  }

  const nextActivationText =
    selectedGroup.next_scheduled_activation && isFuture(selectedGroup.next_scheduled_activation)
      ? formatDistanceToNow(new Date(selectedGroup.next_scheduled_activation), { addSuffix: true })
      : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {copiedCode && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>Copied invite code!</Text>
        </View>
      )}
      <Pressable style={styles.header} onPress={() => router.replace('/')}>
        <Text style={styles.groupName}>{selectedGroup.name}</Text>
        {selectedGroup.description && <Text style={styles.nextActivation}>{selectedGroup.description}</Text>}
        {nextActivationText && <Text style={styles.nextActivation}>Next prompt: {nextActivationText}</Text>}
      </Pressable>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({selectedGroup.members.length})</Text>
          <FlatList
            data={selectedGroup.members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.memberItem}>
                <UserProfileHeader user_id={item.id} username={item.username} user_photo_url={item.profile_photo_url} />
              </View>
            )}
          />
        </View>

        {selectedGroup.active_invite_codes && selectedGroup.active_invite_codes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <View style={styles.inviteCodes}>
              {selectedGroup.active_invite_codes.map((code) => (
                <Pressable
                  key={code}
                  style={styles.inviteCode}
                  onPress={async () => {
                    await Clipboard.setStringAsync(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 1200);
                  }}
                >
                  <Text style={styles.inviteCodeText}>{code}</Text>
                </Pressable>
              ))}
            </View>
            <Text>Send this code to a friend so they can join {selectedGroup.name}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    maxWidth: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
  },
  groupName: {
    fontSize: 24,
    color: Colors.appTitle,
    fontWeight: '600',
  },
  nextActivation: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.text,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inviteCodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inviteCode: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inviteCodeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    padding: 12,
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
  },
});
