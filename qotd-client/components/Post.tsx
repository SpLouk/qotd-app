import { useUserApi } from '@/api/useUserApi';
import { ReactionButton } from '@/components/ReactionButton';
import { UserProfileHeader } from '@/components/UserProfileHeader';
import Colors from '@/constants/Colors';
import { useGroupId } from '@/context/GroupContext';
import { Post as PostType } from '@/types/api';
import { useFetchApi } from '@/utils/api';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface PostProps {
  post: PostType;
  otherPosts: PostType[];
  readonly?: boolean;
}

export const Post: React.FC<PostProps> = ({ post, otherPosts, readonly = false }) => {
  const router = useRouter();

  const { data: currentUser } = useUserApi();
  const { deletePostMutation, flagPostMutation } = usePostsApi();

  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = React.useState<string | null>(null);

  const comments = useMemo(
    () =>
      otherPosts
        .filter((p) => p.parent_post_id === post.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [otherPosts, post.id],
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

  const handleFlagPost = (postToFlag: PostType) => {
    Alert.alert('Flag Content?', 'This post will be hidden for you and reported to Hoot', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Flag',
        style: 'destructive',
        onPress: () => flagPostMutation.mutate(postToFlag.id),
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
        <UserProfileHeader
          user_id={comment.user_id}
          username={comment.username}
          user_photo_url={comment.user_photo_url}
        />
        <View style={styles.commentActions}>
          <Text style={styles.commentDate}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
          {!readonly &&
            (isOwner(comment) ? (
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                onPress={() => handleDelete(comment)}
                accessibilityRole="button"
                accessibilityLabel="Delete comment"
                disabled={deletePostMutation.isPending}
              >
                <FontAwesome name="trash-o" size={16} color={Colors.error} />
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                onPress={() => handleFlagPost(comment)}
                accessibilityRole="button"
                accessibilityLabel="Flag comment"
              >
                <FontAwesome name="flag-o" size={16} color={Colors.error} />
              </Pressable>
            ))}
        </View>
      </View>
      {comment.photo_urls && comment.photo_urls.length > 0 && (
        <View style={styles.photoGalleryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {comment.photo_urls.map((url, idx) => (
              <Pressable
                key={url + idx}
                style={({ pressed }) => [styles.photoWrapper, pressed && { opacity: 0.7 }]}
                onPress={() => setFullscreenPhotoUrl(url)}
              >
                <Image source={{ uri: url }} style={styles.attachedPhoto} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {renderContentWithMentions(comment.content, comment.mentions)}

      <ReactionButton reactions={comment.reactions} postId={comment.id} readonly={readonly} style={{ marginTop: 8 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal
        visible={!!fullscreenPhotoUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhotoUrl(null)}
      >
        <Pressable style={styles.fullscreenOverlay} onPress={() => setFullscreenPhotoUrl(null)}>
          {fullscreenPhotoUrl && (
            <Image source={{ uri: fullscreenPhotoUrl }} style={styles.fullscreenImage} contentFit="contain" />
          )}
        </Pressable>
      </Modal>
      <View style={styles.header}>
        <UserProfileHeader user_id={post.user_id} username={post.username} user_photo_url={post.user_photo_url} />
        <View style={{ gap: 6 }}>
          <View style={styles.headerActions}>
            <Text style={styles.date}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</Text>
            {!readonly &&
              (isOwner(post) ? (
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(post)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete post"
                  disabled={deletePostMutation.isPending}
                >
                  <FontAwesome name="trash-o" size={20} color={Colors.error} />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => handleFlagPost(post)}
                  accessibilityRole="button"
                  accessibilityLabel="Flag post"
                >
                  <FontAwesome name="flag-o" size={20} color={Colors.error} />
                </Pressable>
              ))}
          </View>
          {post.off_topic && (
            <View style={styles.offTopicFlair}>
              <Text style={styles.offTopicFlairText}>Off Topic</Text>
            </View>
          )}
        </View>
      </View>
      {post.photo_urls && post.photo_urls.length > 0 && (
        <View style={styles.photoGalleryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {post.photo_urls.map((url, idx) => (
              <Pressable
                key={url + idx}
                style={({ pressed }) => [styles.photoWrapper, pressed && { opacity: 0.7 }]}
                onPress={() => setFullscreenPhotoUrl(url)}
              >
                <Image source={{ uri: url }} style={styles.attachedPhoto} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {renderContentWithMentions(post.content, post.mentions)}
      <ReactionButton reactions={post.reactions} postId={post.id} readonly={readonly} style={{ marginTop: 8 }} />
      <View style={styles.commentsContainer}>{comments.map(renderComment)}</View>
      {!readonly ? (
        <Pressable style={({ pressed }) => [styles.replyButton, pressed && { opacity: 0.7 }]} onPress={navigateToPost}>
          <Text style={styles.replyButtonText}>Reply</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  offTopicFlair: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  offTopicFlairText: {
    color: Colors.textSecondary,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '95%',
    height: '80%',
    borderRadius: 16,
  },
  photoGalleryContainer: {
    marginVertical: 4,
  },
  photoWrapper: {
    marginRight: 8,
    width: 120,
    height: 120,
  },
  attachedPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
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
    alignItems: 'flex-start',
    marginBottom: 12,
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
  responseText: {
    fontSize: 16,
    lineHeight: 24,
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
  if (!content) {
    return null;
  }
  if (!mentions || mentions.length === 0) {
    return renderTextWithLinks(content, styles.responseText);
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
      // Render normal text with links
      elements.push(...renderTextWithLinks(content.slice(lastIdx, start), styles.responseText, `text-${lastIdx}`));
    }
    // Mentions should not be links, but should be selectable
    elements.push(
      <Text style={[styles.responseText, styles.mentionText]} key={`mention-${start}`} selectable>
        {content.slice(start, end)}
      </Text>,
    );
    lastIdx = end;
  }
  if (lastIdx < content.length) {
    elements.push(...renderTextWithLinks(content.slice(lastIdx), styles.responseText, `text-${lastIdx}`));
  }
  // Wrap in a parent Text for proper inline rendering
  return (
    <Text style={styles.responseText} selectable>
      {elements}
    </Text>
  );
}

// Helper to render text with links as tappable Text
function renderTextWithLinks(text: string, style: any, keyPrefix = '') {
  if (!text) return [];
  const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  let idx = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text style={style} selectable key={`${keyPrefix}-nourl-${idx}`}>
          {text.slice(lastIndex, match.index)}
        </Text>,
      );
      idx++;
    }
    const url = match[0];
    parts.push(
      <Text
        style={[style, { color: Colors.primary, textDecorationLine: 'underline' }]}
        selectable
        key={`${keyPrefix}-url-${idx}`}
        onPress={() => Linking.openURL(url)}
        accessibilityRole="link"
      >
        {url}
      </Text>,
    );
    lastIndex = match.index + url.length;
    idx++;
  }
  if (lastIndex < text.length) {
    parts.push(
      <Text style={style} selectable key={`${keyPrefix}-nourl-end`}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }
  return parts;
}

function usePostsApi() {
  const fetchApi = useFetchApi();
  const groupId = useGroupId();
  const queryClient = useQueryClient();

  const invalidatePrompts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['promptQuestionsActivatedInfinite', groupId] });
  }, [queryClient, groupId]);

  const deletePostMutation = useMutation<Response, Error, number>({
    mutationKey: ['posts', groupId],
    mutationFn: (postId) => fetchApi(`/groups/${groupId}/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: invalidatePrompts,
  });

  const flagPostMutation = useMutation<Response, Error, number>({
    mutationKey: ['flagPost', groupId],
    mutationFn: (postId) => fetchApi(`/groups/${groupId}/posts/${postId}/flag`, { method: 'POST' }),
    onSuccess: invalidatePrompts,
  });

  return {
    // Mutations
    deletePostMutation,
    flagPostMutation,
  };
}
