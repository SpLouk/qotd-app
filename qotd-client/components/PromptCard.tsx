import { api } from '@/utils/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Prompt = {
  content: string;
  id: string;
};

export function PromptCard() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const response = await api.get('/prompt_question/active');
        setPrompt(response);
      } catch (error) {
        console.error('Failed to fetch prompt:', error);
      }
    }
    fetchPrompt();
  }, []);

  function handleWriteResponse() {
    if (!prompt) return;
    
    router.push({
      pathname: '/write',
      params: {
        promptId: prompt.id,
        promptContent: prompt.content,
      }
    });
  }

  return (
    <View style={styles.content}>
      <View style={styles.noteCard}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptText}>{prompt?.content ?? 'loading'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.responseButton}
          onPress={handleWriteResponse}
        >
          <Text style={styles.responseButtonText}>Write your response</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  noteCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptHeader: {
    marginBottom: 20,
    paddingBottom: 15,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    lineHeight: 32,
  },
  responseButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  responseButtonText: {
    fontSize: 16,
    color: '#666',
  },
});
