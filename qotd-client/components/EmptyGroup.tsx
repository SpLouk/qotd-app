import { useActivePrompt } from '@/api/useActivePrompt';
import { useGroup } from '@/context/GroupContext';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { View, Pressable, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

export const EmptyGroup = ({ setSuccessMessage }: { setSuccessMessage: (value: string | null) => void }) => {
  const { data: selectedGroup } = useGroup();
  const queryClient = useQueryClient();
  const { isFetching: isFetchingPrompt } = useActivePrompt();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['promptQuestionsActivatedInfinite', selectedGroup?.id] });
  };
  const onCopyCode = (inviteCode: string) => async () => {
    await Clipboard.setStringAsync(inviteCode);
    setSuccessMessage('Copied invite code!');
  };
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isFetchingPrompt} onRefresh={handleRefresh} />}
    >
      <Text style={styles.errorText}>There's nothing here yet.</Text>
      <Text style={styles.subtext}>Invite some friends to this group by sending them the invite code:</Text>
      <View style={styles.inviteCodes}>
        {selectedGroup?.active_invite_codes?.map((code) => (
          <Pressable
            key={code}
            style={({ pressed }) => [styles.inviteCode, pressed && { opacity: 0.5 }]}
            onPress={onCopyCode(code)}
          >
            <Text style={styles.inviteCodeText}>{code}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.subtext]}>and add some prompts for your friends below</Text>
      <FontAwesome name="long-arrow-down" size={24} color={Colors.textSecondary} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  inviteCode: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inviteCodeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  inviteCodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
