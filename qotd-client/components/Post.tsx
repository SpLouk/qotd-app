import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Post as PostType } from '@/types/api';

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
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
});
