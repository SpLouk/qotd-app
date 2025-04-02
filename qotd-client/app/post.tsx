import { fetchPosts } from '@/api/posts';
import BackButton from '@/components/BackButton';
import { Post } from '@/components/Post';
import Colors from '@/constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';

export default function PostPage() {
  const { id, shouldOpenComment } = useLocalSearchParams<{ id: string; shouldOpenComment?: string }>();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const post = posts.find((post) => post.id === Number.parseInt(id));

  if (isLoading || !post) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />;
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>

      <Post post={post} isFullPage initiallyOpenComment={shouldOpenComment === 'true'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
