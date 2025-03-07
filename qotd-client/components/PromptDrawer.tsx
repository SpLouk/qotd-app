import { voteForPrompt, fetchPromptQuestions, createPromptQuestion } from '@/api/posts';
import { PromptQuestion, CreatePromptQuestionRequest } from '@/types/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

interface PromptDrawerProps {
  onVote: (promptId: string) => void;
  onCreatePrompt: (content: string) => void;
  hasVoted: boolean;
}

const { height } = Dimensions.get('window');
const DRAWER_HEIGHT = height * 0.7;
const DRAWER_PEEK_HEIGHT = 30;
const DRAG_THRESHOLD = 50;

export default function PromptDrawer({ onVote, onCreatePrompt, hasVoted }: PromptDrawerProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newPromptContent, setNewPromptContent] = useState('');
  const [drawerPosition] = useState(new Animated.Value(DRAWER_HEIGHT));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragYRef = useRef(0);

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
        onVote(selectedPromptId);
        closeDrawer();
      }
    },
  });

  // Create a new prompt
  const { mutate: submitPrompt, isPending: isSubmittingPrompt } = useMutation({
    mutationKey: ['createPrompt'],
    mutationFn: createPromptQuestion,
    onSuccess: (data) => {
      onCreatePrompt(newPromptContent);
      setIsCreatingPrompt(false);
      setNewPromptContent('');
      closeDrawer();
    },
  });

  const openDrawer = useCallback(() => {
    setIsExpanded(true);
    Animated.spring(drawerPosition, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [drawerPosition]);

  const closeDrawer = useCallback(() => {
    setIsExpanded(false);
    Animated.spring(drawerPosition, {
      toValue: DRAWER_HEIGHT,
      useNativeDriver: true,
    }).start();
  }, [drawerPosition]);

  // Automatically switch to creating a prompt when there are no prompts available
  useEffect(() => {
    if (!isLoadingPrompts && (!promptQuestions || promptQuestions.length === 0)) {
      setIsCreatingPrompt(true);
    }
  }, [isLoadingPrompts, promptQuestions]);

  // Open/close drawer based on hasVoted prop
  useEffect(() => {
    if (hasVoted) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [hasVoted, closeDrawer, openDrawer]);

  const toggleDrawer = useCallback(() => {
    if (isExpanded) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isExpanded, openDrawer, closeDrawer]);

  // Pan responder for drag gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      dragYRef.current = drawerPosition._value;
    },
    onPanResponderMove: (_, gestureState) => {
      const newPosition = dragYRef.current + gestureState.dy;
      if (newPosition >= 0 && newPosition <= DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT) {
        drawerPosition.setValue(newPosition);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsDragging(false);
      if (gestureState.dy < -DRAG_THRESHOLD) {
        // Swiped up significantly - open drawer
        openDrawer();
      } else if (gestureState.dy > DRAG_THRESHOLD) {
        // Swiped down significantly - close drawer
        closeDrawer();
      } else if (Math.abs(gestureState.dy) < 10 && !isDragging) {
        // Small drag distance, treat as tap
        toggleDrawer();
      } else {
        // Based on current position
        if (drawerPosition._value < (DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT) / 2) {
          openDrawer();
        } else {
          closeDrawer();
        }
      }
    },
  });

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
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: drawerPosition }],
        },
      ]}
    >
      <View style={styles.handleContainer} {...panResponder.panHandlers}>
        <View style={styles.handle} />
        <Text style={styles.peekText}>{isExpanded ? 'Pull down to close' : 'Vote on prompts'}</Text>
      </View>

      <View style={styles.content}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <Text style={styles.title}>{isCreatingPrompt ? 'Submit a new prompt' : 'Vote for a future prompt'}</Text>

          {isCreatingPrompt ? (
            <View style={styles.createPromptContainer}>
              <Text style={styles.description}>Submit a question you'd like to see in the future</Text>
              <TextInput
                style={styles.promptInput}
                multiline
                placeholder="Type your question here..."
                value={newPromptContent}
                onChangeText={setNewPromptContent}
                maxLength={200}
              />
              <Text style={styles.characterCount}>{newPromptContent.length}/200</Text>
            </View>
          ) : (
            <>
              <Text style={styles.description}>Vote for a prompt you'd like to answer in the future</Text>

              {isLoadingPrompts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading prompts...</Text>
                </View>
              ) : promptQuestions && promptQuestions.length > 0 ? (
                <FlatList
                  data={promptQuestions}
                  renderItem={renderPromptItem}
                  keyExtractor={(item) => item.id}
                  style={styles.promptsList}
                  contentContainerStyle={styles.promptsListContent}
                />
              ) : (
                <View style={styles.noPromptsContainer}>
                  <Text style={styles.noPromptsText}>No prompts available for voting</Text>
                </View>
              )}
            </>
          )}

          {/* Only show toggle option if prompts are available */}
          {!isLoadingPrompts && promptQuestions && promptQuestions.length > 0 && (
            <View style={styles.togglePromptContainer}>
              <TouchableOpacity onPress={toggleCreatePrompt} disabled={isSubmittingPrompt || isVoting}>
                <Text style={styles.togglePromptText}>
                  {isCreatingPrompt ? 'Vote for existing prompts instead' : 'Submit a new prompt instead'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.submitButton,
                (isCreatingPrompt ? !newPromptContent.trim() || isSubmittingPrompt : !selectedPromptId || isVoting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={isCreatingPrompt ? handleSubmitNewPrompt : handleVote}
              disabled={
                isCreatingPrompt ? !newPromptContent.trim() || isSubmittingPrompt : !selectedPromptId || isVoting
              }
            >
              <Text style={styles.submitButtonText}>
                {isCreatingPrompt ? (isSubmittingPrompt ? 'Submitting...' : 'Submit') : isVoting ? 'Voting...' : 'Vote'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 1000,
  },
  handleContainer: {
    height: DRAWER_PEEK_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  peekText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  noPromptsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noPromptsText: {
    color: '#666',
    fontSize: 16,
  },
  promptsList: {
    flex: 1,
  },
  promptsListContent: {
    paddingVertical: 8,
  },
  promptItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  promptItemSelected: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  promptItemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  promptAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
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
    fontWeight: '500',
    marginLeft: 5,
  },
  createPromptContainer: {
    width: '100%',
    marginBottom: 20,
  },
  promptInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  togglePromptContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  togglePromptText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#99CCFF',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

