import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { CreatePromptQuestionRequest, PromptQuestion, User } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
}

const { height } = Dimensions.get('window');
const DRAWER_HEIGHT = height * 0.85;

export default function PromptDrawer({ setSuccessMessage }: PromptDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Get the current user data from the cache
  const userData = queryClient.getQueryData<User>(['user']);
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
    setIsVisible(true);
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
      setIsVisible(false);
      panY.setValue(0);
      // Reset state when modal is fully closed
      setSelectedPromptId(null);
      if (!promptQuestions || promptQuestions.length === 0) {
        setIsCreatingPrompt(true);
      }
    });
  }, [fadeAnim, promptQuestions, panY]);

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
        return gestureState.dy > 0;
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

    return (
      <TouchableOpacity
        style={[styles.promptItem, isSelected && styles.promptItemSelected]}
        onPress={() => setSelectedPromptId(item.id)}
        disabled={isVoting}
      >
        <Text style={styles.promptItemText}>{item.content}</Text>
        {item.created_by_username && <Text style={styles.promptAuthor}>by {item.created_by_username}</Text>}
        <View style={styles.promptVotes}>
          <Text style={styles.promptVotesText}>{item.votes_count || 0} votes</Text>
          {item.user_voted && <Text style={styles.userVotedText}>Your vote</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  const handlePromptPress = useCallback(() => {
    if (!userData?.eligible_to_vote_today) {
      Alert.alert('Cannot Vote', "You need to answer today's prompt within 30 minutes to vote for tomorrow's prompt");
    } else {
      openModal();
    }
  }, [userData?.eligible_to_vote_today, openModal]);

  return (
    <>
      <TouchableOpacity
        style={[styles.promptButton, !userData?.eligible_to_vote_today && styles.promptButtonDisabled]}
        onPress={handlePromptPress}
      >
        <Text style={styles.promptButtonText}>Vote for next prompt</Text>
      </TouchableOpacity>
      <Modal visible={isVisible} animationType="none" transparent onRequestClose={closeModal}>
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
            {...panResponder.panHandlers}
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
              <TouchableOpacity style={styles.handleContainer} onPress={closeModal}>
                <View style={styles.handle} />
              </TouchableOpacity>

              <View style={styles.content}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={styles.keyboardAvoidingView}
                >
                  <View style={styles.header}>
                    <Text style={styles.title}>
                      {isCreatingPrompt ? 'Submit a new prompt' : 'Vote for next prompt'}
                    </Text>
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
    </>
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
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
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
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  promptItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F8FF',
  },
  promptItemText: {
    fontSize: 16,
    marginBottom: 8,
  },
  promptAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  promptVotes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptVotesText: {
    fontSize: 12,
    color: '#666',
  },
  userVotedText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 8,
  },
  voteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    margin: 36,
    alignItems: 'center',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  promptButton: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  promptButtonDisabled: {
    opacity: 0.5,
  },
  promptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submittedPromptContainer: {
    padding: 16,
  },
  submittedPromptLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  submittedPrompt: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  submittedPromptText: {
    fontSize: 16,
    color: '#333',
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
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
