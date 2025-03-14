import { createPost, deletePost, fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import { Post as PostType } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Image,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
  const [comment, setComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const { data: posts = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const comments = posts.filter((p) => p.parent_post_id === post.id);

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
    if (!comment.trim()) return;
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
      style={styles.postContainer}
    >
      <View style={styles.postContent}>
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
          {isLoadingComments ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : comments.length > 0 ? (
            comments.map(renderComment)
          ) : (
            <Text style={styles.noCommentsText}>No comments yet</Text>
          )}
        </View>

        {!isCommenting ? (
          <TouchableOpacity style={styles.addCommentButton} onPress={() => setIsCommenting(true)}>
            <Text style={{ color: '#007AFF' }}>Reply</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.commentForm}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Write a comment..."
              placeholderTextColor="#ddd"
              multiline
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
                <Text style={[styles.cancelButtonText, addCommentMutation.isPending && styles.disabledText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, addCommentMutation.isPending && styles.disabledButton]}
                onPress={handleAddComment}
                disabled={addCommentMutation.isPending}
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
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 24,
    flex: 1,
  },
  postContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
  addCommentButton: {
    marginTop: 8,
  },
  commentForm: {
    gap: 12,
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
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
  commentsContainer: {
    marginBottom: 8,
  },
  comment: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentProfilePhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
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
  loadingIndicator: {
    marginVertical: 16,
  },
  noCommentsText: {
    marginVertical: 16,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
