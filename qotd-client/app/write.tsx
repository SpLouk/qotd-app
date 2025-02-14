import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/utils/api';

export default function WriteResponse() {
  const { promptId, promptContent, initialResponse } = useLocalSearchParams<{
    promptId: string;
    promptContent: string;
    initialResponse: string;
  }>();
  const [response, setResponse] = useState(initialResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!response.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await api.post('/api/responses', {
        promptId,
        content: response.trim(),
      });
      
      router.back();
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isSubmitting || !response.trim()}
          style={[styles.headerButton, (!response.trim() || isSubmitting) && styles.headerButtonDisabled]}
        >
          <Text style={[styles.headerButtonText, (!response.trim() || isSubmitting) && styles.headerButtonTextDisabled]}>
            {isSubmitting ? 'Submitting...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>{promptContent}</Text>
      </View>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Write your response here..."
        value={response}
        onChangeText={setResponse}
        autoFocus
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: '#999',
  },
  promptContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  promptText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    lineHeight: 32,
  },
  input: {
    flex: 1,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
  },
});
