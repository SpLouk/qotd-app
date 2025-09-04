import { PromptResponseWriter } from '@/components/PromptResponseWriter';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function WriteAdditionalPost() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <PromptResponseWriter offTopicDefault onSubmit={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

