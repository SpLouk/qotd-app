import Colors from '@/constants/Colors';
import { PromptQuestion } from '@/types/api';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PromptDrawer from './PromptDrawer';
import { useQuery } from '@tanstack/react-query';
import { useGroupId } from '@/context/GroupContext';
import { useFetchApiAndParseJson } from '@/utils/api';

interface PollWidgetProps {
  disabled?: boolean;
  setSuccessMessage: (content: string | null) => void;
}

export function PollWidget({ disabled, setSuccessMessage }: PollWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAndParseJson = useFetchApiAndParseJson();
  const groupId = useGroupId();
  const { data: promptQuestions } = useQuery<PromptQuestion[]>({
    queryKey: ['promptQuestions', groupId],
    queryFn: () => fetchAndParseJson(`/groups/${groupId}/prompt_questions`),
    enabled: !!groupId,
  });
  if (!promptQuestions) {
    return null;
  }

  const totalVotes = promptQuestions.reduce((sum, prompt) => sum + (prompt.votes_count || 0), 0);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          disabled && styles.containerDisabled,
          pressed && styles.containerPressed,
        ]}
        onPress={() => setIsModalOpen(true)}
        disabled={disabled}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vote for tomorrow's prompt</Text>
        </View>

        <View>
          {promptQuestions.slice(0, 3).map((prompt) => {
            const votePercentage = totalVotes > 0 ? (prompt.votes_count || 0) / totalVotes : 0;
            const isUserVoted = prompt.user_voted;

            return (
              <View key={prompt.id} style={styles.promptOption}>
                <View style={styles.promptTextContainer}>
                  <Text style={styles.promptText} numberOfLines={2}>
                    {prompt.content}
                  </Text>
                  <View style={styles.voteInfo}>
                    <Text style={styles.voteCount}>{prompt.votes_count || 0}</Text>
                    {isUserVoted && <Text style={styles.yourVoteText}>Your vote</Text>}
                  </View>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${Math.max(votePercentage * 100, 2)}%` },
                      isUserVoted && styles.barVoted,
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Pressable>

      <PromptDrawer setSuccessMessage={setSuccessMessage} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  containerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  promptOption: {
    marginBottom: 12,
  },
  promptTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  promptText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  voteInfo: {
    alignItems: 'flex-end',
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  yourVoteText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.pollBarBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.pollBarDefault,
    borderRadius: 3,
    minWidth: 2,
  },
  barVoted: {
    backgroundColor: Colors.pollBarVoted,
  },
});
