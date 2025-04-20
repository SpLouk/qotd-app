import BackButton from '@/components/BackButton';
import { UserProfileHeader } from '@/components/UserProfileHeader';
import Colors from '@/constants/Colors';
import { useGroup } from '@/context/GroupContext';
import { formatDistanceToNow, isFuture } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View>
          <Text style={styles.groupName}>{selectedGroup.name}</Text>
          {selectedGroup.description && <Text style={styles.nextActivation}>{selectedGroup.description}</Text>}
          {nextActivationText && <Text style={styles.nextActivation}>Next prompt: {nextActivationText}</Text>}
        </View>
      </View>

      {selectedGroup.active_invite_codes && selectedGroup.active_invite_codes.length > 0 && (
        <View style={styles.sectionCentered}>
          <Text style={styles.sectionTitle}>Invite Code</Text>
          <View style={styles.inviteCodes}>
            {selectedGroup.active_invite_codes.map((code) => (
              <Pressable
                key={code}
                style={({ pressed }) => [styles.inviteCode, pressed && { opacity: 0.5 }]}
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
          <Text style={styles.inviteCodeExplanation}>
            Send this code to a friend so they can join {selectedGroup.name}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members ({selectedGroup.members.length})</Text>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={selectedGroup.members}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <UserProfileHeader user_id={item.id} username={item.username} user_photo_url={item.profile_photo_url} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  section: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionCentered: {
    gap: 12,
    alignItems: 'center',
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
  inviteCodeExplanation: {
    textAlign: 'center',
    color: Colors.textSecondary,
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
