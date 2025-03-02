import { voteForPrompt, fetchPromptQuestions, createPromptQuestion } from '@/api/posts';
import { PromptQuestion, CreatePromptQuestionRequest } from '@/types/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  FlatList, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function PromptVoting() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newPromptContent, setNewPromptContent] = useState('');
  
  // Fetch prompts to vote on
  const { 
    data: promptQuestions, 
    isLoading: isLoadingPrompts, 
    refetch: refetchPrompts
  } = useQuery({
    queryKey: ['promptQuestions'],
    queryFn: () => fetchPromptQuestions(5),
  });
  
  // Vote for a prompt
  const { mutate: votePrompt, isPending: isVoting } = useMutation({
    mutationKey: ['votePrompt'],
    mutationFn: voteForPrompt,
    onSuccess: () => {
      // Use replace instead of push to prevent going back
      router.replace('/');
    },
  });
  
  // Create a new prompt
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { mutate: submitPrompt, isPending: isSubmittingPrompt } = useMutation({
    mutationKey: ['createPrompt'],
    mutationFn: createPromptQuestion,
    onSuccess: () => {
      setIsCreatingPrompt(false);
      setNewPromptContent('');
      setShowSuccessMessage(true);
      
      // Redirect to index after showing success message and prevent going back
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    },
  });
  
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
  
  function skipVoting() {
    router.replace('/');
  }
  
  function handleSubmitNewPrompt() {
    if (!newPromptContent.trim()) return;
    
    const payload: CreatePromptQuestionRequest = {
      prompt_question: {
        content: newPromptContent.trim()
      }
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
        {item.created_by_username && (
          <Text style={styles.promptAuthor}>by {item.created_by_username}</Text>
        )}
        <View style={styles.promptVotes}>
          <Text style={styles.promptVotesText}>
            {item.prompt_votes_count || 0} votes
          </Text>
          {item.user_voted && (
            <Text style={styles.userVotedText}>(You voted)</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successMessageText}>
            Your prompt was submitted successfully!
          </Text>
        </View>
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={skipVoting}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>
          {isCreatingPrompt ? 'Submit a new prompt' : 'Vote for a future prompt'}
        </Text>
        
        {isCreatingPrompt ? (
          <View style={styles.createPromptContainer}>
            <Text style={styles.description}>
              Submit a question you'd like to see in the future
            </Text>
            <TextInput
              style={styles.promptInput}
              multiline
              placeholder="Type your question here..."
              value={newPromptContent}
              onChangeText={setNewPromptContent}
              autoFocus
              maxLength={200}
            />
            <Text style={styles.characterCount}>
              {newPromptContent.length}/200
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Vote for a prompt you'd like to answer in the future
            </Text>
            
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
              (isCreatingPrompt ? 
                (!newPromptContent.trim() || isSubmittingPrompt) : 
                (!selectedPromptId || isVoting)) && styles.submitButtonDisabled
            ]}
            onPress={isCreatingPrompt ? handleSubmitNewPrompt : handleVote}
            disabled={isCreatingPrompt ? 
              (!newPromptContent.trim() || isSubmittingPrompt) : 
              (!selectedPromptId || isVoting)
            }
          >
            <Text style={styles.submitButtonText}>
              {isCreatingPrompt ? 
                (isSubmittingPrompt ? 'Submitting...' : 'Submit') : 
                (isVoting ? 'Voting...' : 'Vote')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  successMessage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  successMessageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
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