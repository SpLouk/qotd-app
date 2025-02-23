import { createPost, fetchPosts } from '@/api/posts';
import { Post as PostType } from '@/types/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
  const [comment, setComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const { data: posts = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const comments = posts.filter((p) => p.parent_post_id === post.id);

  const addCommentMutation = useMutation({
    mutationKey: ['posts'],
    mutationFn: createPost,
    onSuccess: () => {
      setComment('');
      setIsCommenting(false);
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
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

  const renderComment = (comment: PostType) => (
    <View key={comment.id} style={styles.comment}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          {comment.user_photo_url ? (
            <Image source={{ uri: comment.user_photo_url }} style={styles.commentProfilePhoto} />
          ) : null}
          <Text style={styles.commentUserName}>{comment.username ?? 'Anonymous'}</Text>
        </View>
        <Text style={styles.commentDate}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</Text>
      </View>
      <Text style={styles.commentText}>{comment.content}</Text>
    </View>
  );

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {post.user_photo_url ? <Image source={{ uri: post.user_photo_url }} style={styles.profilePhoto} /> : null}
          <Text style={styles.userName}>{post.username ?? 'Anonymous'}</Text>
        </View>
        <Text style={styles.date}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</Text>
      </View>
      <Text style={styles.responseText}>{post.content}</Text>

      <View style={styles.commentSection}>
        {!isCommenting ? (
          <TouchableOpacity style={styles.addCommentButton} onPress={() => setIsCommenting(true)}>
            <Text style={styles.addCommentButtonText}>Add a comment</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.commentForm}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Write a comment..."
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
                <Text style={[styles.cancelButtonText, addCommentMutation.isPending && styles.disabledText]}>
                  Cancel
                </Text>
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

        <View style={styles.commentsContainer}>
          {isLoadingComments ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : comments.length > 0 ? (
            comments.map(renderComment)
          ) : (
            <Text style={styles.noCommentsText}>No comments yet</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 24,
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
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  commentSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  addCommentButton: {
    padding: 8,
  },
  addCommentButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  commentForm: {
    gap: 12,
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
    marginTop: 16,
  },
  comment: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    marginTop: 12,
  },
  noCommentsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
