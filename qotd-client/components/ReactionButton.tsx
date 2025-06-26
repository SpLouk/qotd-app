import { useActivePrompt } from '@/api/useActivePrompt';
import { useUserApi } from '@/api/useUserApi';
import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { Reaction } from '@/types/api';
import { useFetchApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

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
  const groupId = useGroupId();

  const userReaction = reactions.find((r) => r.user_id === currentUser?.id && r.reaction === '👍');
  const [optimisticReacted, setOptimisticReacted] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['promptQuestionsActivatedInfinite', groupId] });
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['promptQuestionsActivatedInfinite', groupId] });
    },
  });

  const { isFetching: isActivePromptFetching, fetchStatus: activePromptFetchStatus } = useActivePrompt();

  useEffect(() => {
    if (activePromptFetchStatus === 'idle') {
      setOptimisticReacted(null);
    }
  }, [activePromptFetchStatus]);

  const shouldShowOptimisticReacted =
    optimisticReacted !== null && (isActivePromptFetching || addReaction.isPending || removeReaction.isPending);

  const isReacted = shouldShowOptimisticReacted ? optimisticReacted : !!userReaction;
  const _reactionCount = reactions.filter((r) => r.reaction === '👍').length;
  const reactionCount = shouldShowOptimisticReacted
    ? optimisticReacted === true
      ? _reactionCount + 1
      : _reactionCount - 1
    : _reactionCount;

  const handlePress = () => {
    if (readonly || addReaction.isPending || removeReaction.isPending) return;
    if (isReacted) {
      removeReaction.mutate();
    } else {
      addReaction.mutate();
    }
  };

  const thumbReactions = reactions.filter((r) => r.reaction === '👍');
  const avatarsToShow = useMemo(() => {
    if (isReacted) {
      return [
        { id: -1, user_photo_url: currentUser?.profile_photo_url, username: currentUser?.username },
        thumbReactions.find((reaction) => reaction.user_id !== currentUser?.id),
      ].filter((item) => !!item);
    } else {
      return thumbReactions.slice(0, 2);
    }
  }, [currentUser, thumbReactions, isReacted]);

  if (readonly && !reactionCount) {
    return null;
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, isReacted && styles.buttonActive, pressed && { opacity: 0.5 }, style]}
        onPress={handlePress}
        onLongPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={isReacted ? 'Remove thumbs up' : 'Add thumbs up'}
        disabled={readonly || addReaction.isPending || removeReaction.isPending}
      >
        <Text style={styles.count}>👍</Text>
        <View style={{ flexDirection: 'row' }}>
          {avatarsToShow.map((r, idx) => (
            <Image
              key={r.id}
              source={{ uri: r.user_photo_url }}
              style={[styles.avatar, { marginLeft: idx * -10 }]}
              accessibilityLabel={`${r.username}'s avatar`}
            />
          ))}
        </View>
        {reactionCount ? <Text style={[styles.count, isReacted && styles.countActive]}> {reactionCount}</Text> : null}
      </Pressable>
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <FlatList
              data={thumbReactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.modalItem}>
                  <Image source={{ uri: item.user_photo_url }} style={styles.modalAvatar} />
                  <Text style={styles.modalUsername}>{item.username}</Text>
                </View>
              )}
              style={styles.modalList}
            />
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)} accessibilityRole="button">
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    gap: 4,
  },
  buttonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.border,
    position: 'relative',
  },
  count: {
    fontSize: 15,
    color: Colors.text,
  },
  countActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.text,
  },
  modalList: {
    width: '100%',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  modalUsername: {
    fontSize: 16,
    color: Colors.text,
  },
  closeButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
