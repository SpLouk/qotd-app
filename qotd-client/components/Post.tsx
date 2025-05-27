import { usePostsApi } from '@/api/usePostsApi';
import { useUserApi } from '@/api/useUserApi';
import { UserProfileHeader } from '@/components/UserProfileHeader';
import Colors from '@/constants/Colors';
import { Post as PostType } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PostProps {
  post: PostType;
  readonly?: boolean;
}

export const Post: React.FC<PostProps> = ({ post, readonly = false }) => {
  const router = useRouter();

  const { data: currentUser } = useUserApi();
  const { data: posts = [], isLoading: isLoadingComments, deletePostMutation } = usePostsApi();

  const comments = useMemo(
    () =>
      posts
        .filter((p) => p.parent_post_id === post.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [posts, post.id],
  );

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

  const navigateToPost = () => {
    router.push({
      pathname: '/reply-to-post',
      params: {
        id: post.id.toString(),
      },
    });
  };

  const renderComment = (comment: PostType) => (
    <View key={comment.id} style={styles.comment}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <UserProfileHeader
            user_id={comment.user_id}
            username={comment.username}
            user_photo_url={comment.user_photo_url}
          />
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.commentDate}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
          {isOwner(comment) && !readonly && (
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
      {renderContentWithMentions(comment.content, comment.mentions)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <UserProfileHeader user_id={post.user_id} username={post.username} user_photo_url={post.user_photo_url} />
        </View>
        <View style={styles.headerActions}>
          <Text style={styles.date}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</Text>
          {isOwner(post) && !readonly && (
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
      {renderContentWithMentions(post.content, post.mentions)}
      <View style={styles.commentsContainer}>
        {isLoadingComments ? (
          <ActivityIndicator style={styles.loadingIndicator} />
        ) : comments.length > 0 ? (
          comments.map(renderComment)
        ) : (
          <Text style={styles.noCommentsText}>No comments yet</Text>
        )}
      </View>
      {!readonly ? (
        <TouchableOpacity style={styles.replyButton} onPress={navigateToPost}>
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  mentionText: {
    color: Colors.primary,
  },
  container: {
    padding: 16,
    overflow: 'scroll',
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
    fontSize: 16,
  },
});

function renderContentWithMentions(
  content: string,
  mentions?: { user_id: number; locations: { start: number; end: number }[] }[],
) {
  if (!mentions || mentions.length === 0) {
    return <Text style={styles.responseText}>{content}</Text>;
  }
  // Flatten all mention locations with user_id
  const mentionSpans: { start: number; end: number; user_id: number }[] = [];
  mentions.forEach((m) => {
    m.locations.forEach((loc) => {
      mentionSpans.push({ ...loc, user_id: m.user_id });
    });
  });
  // Sort by start index
  mentionSpans.sort((a, b) => a.start - b.start);
  const elements = [];
  let lastIdx = 0;
  for (let i = 0; i < mentionSpans.length; i++) {
    const { start, end } = mentionSpans[i];
    if (lastIdx < start) {
      elements.push(
        <Text style={styles.responseText} key={`text-${lastIdx}`}>
          {content.slice(lastIdx, start)}
        </Text>,
      );
    }
    elements.push(
      <Text style={[styles.responseText, styles.mentionText]} key={`mention-${start}`}>
        {content.slice(start, end)}
      </Text>,
    );
    lastIdx = end;
  }
  if (lastIdx < content.length) {
    elements.push(
      <Text style={styles.responseText} key={`text-${lastIdx}`}>
        {content.slice(lastIdx)}
      </Text>,
    );
  }
  // Wrap in a parent Text for proper inline rendering
  return <Text style={styles.responseText}>{elements}</Text>;
}
