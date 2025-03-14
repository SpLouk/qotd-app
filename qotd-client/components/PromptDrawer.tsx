import { createPromptQuestion, fetchPromptQuestions, voteForPrompt } from '@/api/posts';
import { CreatePromptQuestionRequest, PromptQuestion } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { rgbaColor } from 'react-native-reanimated/lib/typescript/Colors';

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

  // Fetch prompts to vote on
  const { data: promptQuestions, isLoading: isLoadingPrompts } = useQuery({
    queryKey: ['promptQuestions'],
    queryFn: () => fetchPromptQuestions(5),
  });

  // Vote for a prompt
  const { mutate: votePrompt, isPending: isVoting } = useMutation({
    mutationKey: ['votePrompt'],
    mutationFn: voteForPrompt,
    onSuccess: () => {
      if (selectedPromptId) {
        setSuccessMessage('Your vote was submitted successfully!');
        queryClient.invalidateQueries({ queryKey: ['promptQuestions'] });
        closeModal();
      }
    },
  });

  // Create a new prompt
  const { mutate: submitPrompt, isPending: isSubmittingPrompt } = useMutation({
    mutationKey: ['createPrompt'],
    mutationFn: createPromptQuestion,
    onSuccess: () => {
      setSuccessMessage('Your prompt was submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['promptQuestions'] });
      setIsCreatingPrompt(false);
      setNewPromptContent('');
      closeModal();
    },
  });

  const openModal = useCallback(() => {
    setIsVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Automatically switch to creating a prompt when there are no prompts available
  useEffect(() => {
    if (!isLoadingPrompts && (!promptQuestions || promptQuestions.length === 0)) {
      setIsCreatingPrompt(true);
    }
  }, [isLoadingPrompts, promptQuestions]);

  function handleVote() {
    if (!selectedPromptId) return;
    votePrompt(selectedPromptId);
  }

  function handleSubmitNewPrompt() {
    if (!newPromptContent.trim()) return;

    const payload: CreatePromptQuestionRequest = {
      prompt_question: {
        content: newPromptContent.trim(),
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
          <Text style={styles.promptVotesText}>{item.prompt_votes_count || 0} votes</Text>
          {item.user_voted && <Text style={styles.userVotedText}>(You voted)</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.promptButton} onPress={openModal}>
        <Text style={styles.promptButtonText}>Vote on prompts</Text>
      </TouchableOpacity>
      <Modal visible={isVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.container}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.content}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>{isCreatingPrompt ? 'Submit a new prompt' : 'Vote on prompts'}</Text>
                  <TouchableOpacity style={styles.toggleButton} onPress={toggleCreatePrompt}>
                    <Text style={styles.toggleButtonText}>{isCreatingPrompt ? 'Vote instead' : 'Submit instead'}</Text>
                  </TouchableOpacity>
                </View>

                {isCreatingPrompt ? (
                  <View style={styles.createPromptContainer}>
                    <TextInput
                      style={styles.input}
                      value={newPromptContent}
                      onChangeText={setNewPromptContent}
                      placeholder="Type your prompt here..."
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.submitButton, !newPromptContent.trim() && styles.submitButtonDisabled]}
                      onPress={handleSubmitNewPrompt}
                      disabled={!newPromptContent.trim() || isSubmittingPrompt}
                    >
                      {isSubmittingPrompt ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>Submit Prompt</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.voteContainer}>
                    {isLoadingPrompts ? (
                      <ActivityIndicator style={styles.loading} />
                    ) : (
                      <>
                        <FlatList
                          data={promptQuestions}
                          renderItem={renderPromptItem}
                          keyExtractor={(item) => item.id}
                          style={styles.promptList}
                        />
                        <TouchableOpacity
                          style={[styles.voteButton, !selectedPromptId && styles.voteButtonDisabled]}
                          onPress={handleVote}
                          disabled={!selectedPromptId || isVoting}
                        >
                          {isVoting ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.voteButtonText}>Vote</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </KeyboardAvoidingView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
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
    color: '#007AFF',
  },
  createPromptContainer: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
    borderColor: '#007AFF',
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
    color: '#007AFF',
    marginLeft: 8,
  },
  voteButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
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
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  promptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
