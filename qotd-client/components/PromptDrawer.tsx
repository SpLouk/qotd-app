import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { CreatePromptQuestionRequest, PromptQuestion } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface PromptDrawerProps {
  setSuccessMessage: (content: string | null) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const { height } = Dimensions.get('window');
const DRAWER_HEIGHT = height * 0.85;

export default function PromptDrawer({ setSuccessMessage, isOpen = false, onClose }: PromptDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newPromptContent, setNewPromptContent] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Get the current user data from the cache
  const groupId = useGroupId();

  //error Fetch prompts to vote on
  const { data: promptQuestions, isLoading: isLoadingPrompts } = useQuery<PromptQuestion[]>({
    queryKey: ['promptQuestions', groupId],
    queryFn: () => api(`/groups/${groupId}/prompt_questions`),
    enabled: !!groupId,
  });

  const api = useFetchApiAndParseJson();

  const currentVotedPromptId = promptQuestions?.find((p) => p.user_voted)?.id;

  const { mutate: votePrompt, isPending: isVoting } = useMutation({
    mutationKey: ['votePrompt'],
    mutationFn: async (promptId: string) => {
      if (!groupId) throw new Error('No group ID available');
      return api(`/groups/${groupId}/prompt_questions/${promptId}/vote`, {
        body: JSON.stringify({}),
        method: 'POST',
      });
    },
    onSuccess: () => {
      if (selectedPromptId) {
        setSuccessMessage('Your vote was updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['promptQuestions', groupId] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
        closeModal();
      }
    },
  });

  // Create a new prompt
  const { mutate: submitPrompt, isPending: isSubmittingPrompt } = useMutation({
    mutationKey: ['createPrompt'],
    mutationFn: (data: CreatePromptQuestionRequest) => {
      if (!groupId) throw new Error('No group ID available');
      return api(`/groups/${groupId}/prompt_questions`, { body: JSON.stringify(data), method: 'POST' });
    },
    onSuccess: () => {
      setSuccessMessage('Your prompt was submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['promptQuestions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsCreatingPrompt(false);
      setNewPromptContent('');
      closeModal();
    },
  });

  const openModal = useCallback(() => {
    panY.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, panY]);

  const closeModal = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      panY.setValue(0);
      // Reset state when modal is fully closed
      setSelectedPromptId(null);
      if (!promptQuestions || promptQuestions.length === 0) {
        setIsCreatingPrompt(true);
      }
      onClose?.();
    });
  }, [fadeAnim, promptQuestions, panY, onClose]);

  // Handle opening modal when prop changes
  useEffect(() => {
    if (isOpen) {
      openModal();
    }
  }, [isOpen, openModal]);

  // Automatically switch to creating a prompt when there are no prompts available
  useEffect(() => {
    if (!isLoadingPrompts && (!promptQuestions || promptQuestions.length === 0)) {
      setIsCreatingPrompt(true);
    }
  }, [isLoadingPrompts, promptQuestions]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          closeModal();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  function handleVote() {
    if (!selectedPromptId) return;
    votePrompt(selectedPromptId);
  }

  function handleSubmitNewPrompt() {
    const truncatedContent = newPromptContent.trim().slice(0, 256);
    if (!truncatedContent) return;

    const payload: CreatePromptQuestionRequest = {
      prompt_question: {
        content: truncatedContent,
      },
    };

    submitPrompt(payload);
  }

  function toggleCreatePrompt() {
    setIsCreatingPrompt(!isCreatingPrompt);
    setNewPromptContent('');
  }

  function renderPromptItem({ item }: { item: PromptQuestion }) {
    const isSelected = selectedPromptId === item.id;
    const totalVotes = promptQuestions?.reduce((sum, prompt) => sum + (prompt.votes_count || 0), 0) || 0;
    const votePercentage = totalVotes > 0 ? (item.votes_count || 0) / totalVotes : 0;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.promptItem,
          isSelected && styles.promptItemSelected,
          pressed && styles.promptItemPressed,
        ]}
        onPress={() => setSelectedPromptId(item.id)}
        disabled={isVoting}
      >
        <View style={styles.promptContent}>
          <View>
            <Text style={[styles.promptItemText, item.user_voted && styles.promptItemTextVoted]}>
              {item.content}
              {item.user_voted ? ' ✓' : ''}
            </Text>
            {item.created_by_username && <Text style={styles.promptAuthor}>by {item.created_by_username}</Text>}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.max(votePercentage * 100, 2)}%` },
                  item.user_voted && styles.progressBarVoted,
                ]}
              />
            </View>
            <View style={styles.voteInfo}>
              <Text style={styles.voteCount}>{item.votes_count || 0}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Modal visible={isOpen} animationType="none" transparent onRequestClose={closeModal}>
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [DRAWER_HEIGHT, 0],
                  }),
                },
                {
                  translateY: panY,
                },
              ],
            },
          ]}
        >
          <View style={styles.container}>
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <TouchableOpacity onPress={closeModal}>
                <View style={styles.handle} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>{isCreatingPrompt ? 'New Prompt' : 'Vote for next prompt'}</Text>
                  <TouchableOpacity style={styles.toggleButton} onPress={toggleCreatePrompt}>
                    <Text style={styles.toggleButtonText}>
                      {isCreatingPrompt ? 'Vote on prompts' : 'Submit a prompt'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.voteContainer}>
                  {isCreatingPrompt ? (
                    <>
                      <TextInput
                        style={styles.input}
                        value={newPromptContent}
                        onChangeText={setNewPromptContent}
                        placeholder="Type your prompt here..."
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        maxLength={256}
                      />
                      <TouchableOpacity
                        style={[styles.voteButton, !newPromptContent.trim() && styles.submitButtonDisabled]}
                        onPress={handleSubmitNewPrompt}
                        disabled={!newPromptContent.trim() || isSubmittingPrompt}
                      >
                        {isSubmittingPrompt ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.submitButtonText}>Submit Prompt</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {isLoadingPrompts ? (
                        <ActivityIndicator style={styles.loading} />
                      ) : (
                        <>
                          {(promptQuestions?.length ?? 0 > 0) ? (
                            <>
                              <FlatList
                                data={promptQuestions}
                                renderItem={renderPromptItem}
                                keyExtractor={(item) => item.id}
                                style={styles.promptList}
                              />
                              <TouchableOpacity
                                style={[
                                  styles.voteButton,
                                  (!selectedPromptId || selectedPromptId === currentVotedPromptId) &&
                                    styles.voteButtonDisabled,
                                ]}
                                onPress={handleVote}
                                disabled={!selectedPromptId || isVoting || selectedPromptId === currentVotedPromptId}
                              >
                                {isVoting ? (
                                  <ActivityIndicator color="#fff" />
                                ) : (
                                  <Text style={styles.voteButtonText}>
                                    {currentVotedPromptId ? 'Change Vote' : 'Vote'}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </>
                          ) : (
                            <View style={styles.emptyStateContainer}>
                              <Text style={styles.emptyStateText}>No prompts to vote on yet.</Text>
                              <TouchableOpacity onPress={toggleCreatePrompt}>
                                <Text style={styles.toggleButtonText}>Submit a prompt for tomorrow</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}
                </View>
              </KeyboardAvoidingView>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    backgroundColor: '#fff',
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
  },
  toggleButton: {
    padding: 8,
  },
  toggleButtonText: {
    color: Colors.primary,
  },
  createPromptContainer: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    textAlignVertical: 'top',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  voteContainer: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignSelf: 'center',
  },
  promptList: {
    flex: 1,
    padding: 16,
  },
  promptItem: {
    borderWidth: 1,
    borderColor: Colors.pollBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.pollBackground,
  },
  promptItemSelected: {
    borderColor: Colors.pollSelectedBorder,
    backgroundColor: Colors.pollSelectedBackground,
    borderWidth: 2,
  },
  promptItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  promptContent: {
    flexDirection: 'column',
    gap: 12,
  },
  promptItemText: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  promptItemTextVoted: {
    fontWeight: '600',
    color: Colors.primary,
  },
  promptAuthor: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginRight: 4,
  },
  voteInfo: {
    alignItems: 'flex-end',
  },
  yourVoteText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.pollBarBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.pollBarDefault,
    borderRadius: 4,
    minWidth: 2,
  },
  progressBarVoted: {
    backgroundColor: Colors.pollBarVoted,
  },
  voteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    margin: 16,
    marginBottom: 36,
    alignItems: 'center',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
});
