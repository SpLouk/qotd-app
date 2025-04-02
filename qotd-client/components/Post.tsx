import { deletePost, fetchPosts } from '@/api/posts';
import { fetchCurrentUser } from '@/api/user';
import { Post as PostType } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const { data: posts = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const comments = useMemo(
    () =>
      posts
        .filter((p) => p.parent_post_id === post.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [posts],
  );

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

  const navigateToPost = (shouldOpenComment = false) => {
    router.push({
      pathname: '/reply-to-post' as const,
      params: {
        id: post.id.toString(),
        ...(shouldOpenComment ? { shouldOpenComment: 'true' } : {}),
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
    <View style={styles.container}>
      <View style={styles.header}>
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
      <TouchableOpacity
        style={styles.replyButton}
        onPress={(e) => {
          navigateToPost(true);
        }}
      >
        <Text style={styles.replyButtonText}>Reply</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
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
    marginBottom: 16,
  },
  commentsContainer: {
    marginBottom: 12,
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
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  replyButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
