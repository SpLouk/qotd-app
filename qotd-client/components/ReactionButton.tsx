import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { Reaction } from '@/types/api';
import { useUserApi } from '@/api/useUserApi';
import { useFetchApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReactionButtonProps {
  reactions?: Reaction[];
  postId: number;
  readonly?: boolean;
  style?: any;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({ reactions = [], postId, readonly, style }) => {
  const { data: currentUser } = useUserApi();
  const fetchApi = useFetchApi();
  const queryClient = useQueryClient();

  const userReaction = reactions.find((r) => r.user_id === currentUser?.id && r.reaction === '👍');
  const [optimisticReacted, setOptimisticReacted] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const isReacted = optimisticReacted !== null ? optimisticReacted : !!userReaction;
  const reactionCount =
    optimisticCount !== null ? optimisticCount : reactions.filter((r) => r.reaction === '👍').length;

  const addReaction = useMutation({
    mutationFn: async () => {
      await fetchApi('/reactions', {
        method: 'POST',
        body: JSON.stringify({
          reaction: {
            post_id: postId,
            reaction: '👍',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onMutate: () => {
      setOptimisticReacted(true);
      setOptimisticCount(reactionCount + 1);
    },
    onSettled: () => {
      setOptimisticReacted(null);
      setOptimisticCount(null);
      queryClient.invalidateQueries();
    },
  });

  const removeReaction = useMutation({
    mutationFn: async () => {
      if (!userReaction) throw new Error('No reaction to remove');
      await fetchApi(`/reactions/${userReaction.id}`, {
        method: 'DELETE',
      });
    },
    onMutate: () => {
      setOptimisticReacted(false);
      setOptimisticCount(Math.max(0, reactionCount - 1));
    },
    onSettled: () => {
      setOptimisticReacted(null);
      setOptimisticCount(null);
      queryClient.invalidateQueries();
    },
  });

  const handlePress = () => {
    if (readonly || addReaction.isPending || removeReaction.isPending) return;
    if (isReacted) {
      removeReaction.mutate();
    } else {
      addReaction.mutate();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, isReacted && styles.buttonActive, pressed && { opacity: 0.5 }, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isReacted ? 'Remove thumbs up' : 'Add thumbs up'}
      disabled={readonly || addReaction.isPending || removeReaction.isPending}
    >
      <View style={styles.iconRow}>
        <Text style={[styles.count, isReacted && styles.countActive]}>👍 {reactionCount}</Text>
        {(addReaction.isPending || removeReaction.isPending) && (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.background,
  },
  buttonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.10)', // fallback for Colors.primaryLight
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActive: {
    color: Colors.primary,
  },
  count: {
    marginLeft: 4,
    fontSize: 15,
    color: Colors.text,
  },
  countActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
