import { createPost, deletePost, fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import BackButton from '@/components/BackButton';
import Colors from '@/constants/Colors';
import { Post as PostType } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PostPage() {
  const { id, shouldOpenComment } = useLocalSearchParams<{ id: string; shouldOpenComment?: string }>();
  const [comment, setComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(shouldOpenComment === 'true');
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const post = posts.find((post) => post.id === Number.parseInt(id));

  const comments = useMemo(
    () =>
      posts
        .filter((p) => p.parent_post_id === Number.parseInt(id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [posts, id],
  );

  const addCommentMutation = useMutation({
    mutationKey: ['posts'],
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setComment('');
      setIsCommenting(false);
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
    },
  });

  const deletePostMutation = useMutation({
    mutationKey: ['posts'],
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('Failed to delete post:', error);
    },
  });

  const handleAddComment = () => {
    if (!comment.trim() || !post) return;
    addCommentMutation.mutate({
      post: {
        content: comment,
        parent_post_id: post.id,
        prompt_question_id: post.prompt_question_id,
      },
    });
  };

  const handleDelete = (postToDelete: PostType) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePostMutation.mutate(postToDelete.id),
      },
    ]);
  };

  const isOwner = (item: PostType) => currentUser?.username === item.username;

  const renderComment = (comment: PostType) => (
    <View key={comment.id} style={styles.comment}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          {comment.user_photo_url ? (
            <Image source={{ uri: comment.user_photo_url }} style={styles.commentProfilePhoto} />
          ) : null}
          <Text style={styles.commentUserName}>{comment.username ?? 'Anonymous'}</Text>
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.commentDate}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
          {isOwner(comment) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(comment)}
              disabled={deletePostMutation.isPending}
            >
              <FontAwesome name="trash-o" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.commentText}>{comment.content}</Text>
    </View>
  );

  if (isLoadingPosts || !post) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              {post.user_photo_url ? <Image source={{ uri: post.user_photo_url }} style={styles.profilePhoto} /> : null}
              <Text style={styles.userName}>{post.username ?? 'Anonymous'}</Text>
            </View>
            <View style={styles.headerActions}>
              <Text style={styles.date}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</Text>
              {isOwner(post) && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(post)}
                  disabled={deletePostMutation.isPending}
                >
                  <FontAwesome name="trash-o" size={16} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.responseText}>{post.content}</Text>

          <View style={styles.commentsContainer}>
            {comments.length > 0 ? (
              comments.map(renderComment)
            ) : (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            )}
          </View>

          {!isCommenting ? (
            <TouchableOpacity style={styles.addCommentButton} onPress={() => setIsCommenting(true)}>
              <Text style={styles.addCommentText}>Write a comment...</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.commentForm}>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Write a comment..."
                placeholderTextColor="#666"
                multiline
                autoFocus
                editable={!addCommentMutation.isPending}
              />
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsCommenting(false);
                    setComment('');
                  }}
                  disabled={addCommentMutation.isPending}
                >
                  <Text style={[styles.cancelButtonText, addCommentMutation.isPending && styles.disabledText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, addCommentMutation.isPending && styles.disabledButton]}
                  onPress={handleAddComment}
                  disabled={addCommentMutation.isPending || !comment.trim()}
                >
                  {addCommentMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  postContainer: {
    flex: 1,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  commentsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    marginTop: 16,
    paddingTop: 16,
  },
  comment: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentProfilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  addCommentButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  addCommentText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  commentForm: {
    gap: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    alignItems: 'center',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#007AFF80',
  },
  disabledText: {
    opacity: 0.5,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
