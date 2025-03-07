import { followUser, unFollowUser } from '@/api/user';
import { User } from '@/types/api';
import { api } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserItemProps {
  user: User;
}

const SearchUserItem: React.FC<UserItemProps> = ({ user }) => {
  const queryClient = useQueryClient();

  const { mutate: mutateFollowUser, isPending: isFollowPending } = useMutation({
    mutationFn: followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
    },
  });

  const { mutate: mutateUnfollowUser, isPending: isUnfollowPending } = useMutation({
    mutationFn: unFollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
    },
  });

  const isLoading = isFollowPending || isUnfollowPending;
  const followStatus = useMemo(() => {
    if (user.follow_approved) return 'following';

    if (user.follow_requested) return 'requested';

    if (user.following_you) return 'follower';

    return 'none';
  }, [user]);

  const handleFollowAction = (userId: string) => {
    if ( followStatus === 'requested') {
      mutateUnfollowUser(userId);
    } else {
      mutateFollowUser(userId);
    }
  };

  const followButtonText = useMemo(() => {
    switch (followStatus) {
      case 'following':
        return 'Following';
      case 'requested':
        return 'Requested';
      case 'follower':
        return 'Follow Back';
      default:
        return 'Follow';
    }
  }, [followStatus]);

  const followButtonStyle = useMemo(() => {
    if (isLoading) return styles.followButtonLoading;
    switch (followStatus) {
      case 'following':
        return styles.followingButton;
      case 'requested':
        return styles.followRequestedButton;
      default:
        return styles.followButton;
    }
  }, [followStatus, isLoading]);

  const followButtonTextStyle = useMemo(() => {
    if (followStatus === 'following' || followStatus === 'requested') {
      return styles.followingButtonText;
    }
    return styles.followButtonText;
  }, [followStatus]);

  return (
    <TouchableOpacity style={styles.userItem}>
      <View style={styles.userInfo}>
        <Image
          source={{
            uri: user.profile_photo_url,
            headers: {
              Authorization: `Bearer ${api.getToken()}`,
            },
          }}
          style={styles.profilePhoto}
        />
        <View>
          <Text style={styles.username}>{user.username}</Text>
          {followStatus === 'follower' && <Text style={styles.followsYouText}>Follows you</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.followButton, followButtonStyle]}
        onPress={() => handleFollowAction(user.id)}
        disabled={isLoading || followStatus === 'following'}
      >
        <Text style={[styles.followButtonText, followButtonTextStyle]}>{followButtonText}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  followsYouText: {
    fontSize: 12,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followRequestedButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#666',
  },
  followButtonLoading: {
    backgroundColor: '#99CCFF',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#007AFF',
  },
});

export default SearchUserItem;
