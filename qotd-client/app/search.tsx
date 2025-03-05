import { followUser, searchUsers, unFollowUser } from '@/api/user';
import { User } from '@/types/api';
import { api } from '@/utils/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fetch search results
  const { data: users = [], isLoading: isSearching } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: followUser,
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['following_requests'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: unFollowUser,
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['following_requests'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
    },
  });

  const handleFollowAction = (userId: string, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  const getFollowStatus = (user: User) => {
    if (user.follow_requested) return 'requested';

    // Check if we're following them
    if (user.follow_approved) return 'following';

    // Check if they're following us
    if (user.following_you) return 'follower';

    return 'none';
  };

  const getFollowButtonStyle = (user: User, isLoading: boolean) => {
    if (isLoading) return styles.followButtonLoading;
    const status = getFollowStatus(user);
    switch (status) {
      case 'following':
        return styles.followingButton;
      case 'requested':
        return styles.followRequestedButton;
      default:
        return styles.followButton;
    }
  };

  const getFollowButtonText = (user: User, isLoading: boolean) => {
    if (isLoading) return 'Loading...';
    const status = getFollowStatus(user);
    switch (status) {
      case 'following':
        return 'Following';
      case 'requested':
        return 'Requested';
      case 'follower':
        return 'Follow Back';
      default:
        return 'Follow';
    }
  };

  const getFollowButtonTextStyle = (user: User) => {
    const status = getFollowStatus(user);
    if (status === 'following' || status === 'requested') {
      return styles.followingButtonText;
    }
    return styles.followButtonText;
  };

  const renderUser = ({ item }: { item: User }) => {
    const isLoading = followMutation.variables === item.id || unfollowMutation.variables === item.id;
    const status = getFollowStatus(item);
    const canUnfollow = status === 'following';

    return (
      <TouchableOpacity style={styles.userItem}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: item.profile_photo_url,
              headers: {
                Authorization: `Bearer ${api.getToken()}`,
              },
            }}
            style={styles.profilePhoto}
          />
          <View>
            <Text style={styles.username}>{item.username}</Text>
            {status === 'follower' && <Text style={styles.followsYouText}>Follows you</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.followButton, getFollowButtonStyle(item, isLoading)]}
          onPress={() => handleFollowAction(item.id, canUnfollow)}
          disabled={isLoading || status === 'requested'}
        >
          <Text style={[styles.followButtonText, getFollowButtonTextStyle(item)]}>
            {getFollowButtonText(item, isLoading)}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholderTextColor="#ddd"
        placeholder="Search users..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isSearching ? (
        <Text style={styles.loadingText}>Searching...</Text>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.username}
          ListEmptyComponent={
            debouncedQuery ? (
              <Text style={styles.emptyText}>No users found</Text>
            ) : (
              <Text style={styles.emptyText}>Start typing to search for users</Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
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
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
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
