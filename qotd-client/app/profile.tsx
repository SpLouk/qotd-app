import { fetchCurrentUser, fetchFollowers, fetchFollowing, unFollowUser } from '@/api/user';
import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import { User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabType = 'following' | 'followers' | 'requests';

interface UserListItemProps {
  user: User;
}

function UserListItem({ user }: UserListItemProps) {
  const queryClient = useQueryClient();

  const unfollowMutation = useMutation({
    mutationFn: unFollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const handleUnfollow = () => {
    Alert.alert('Unfollow User', `Are you sure you want to unfollow ${user.username}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: () => unfollowMutation.mutate(user.id),
      },
    ]);
  };

  return (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Image source={{ uri: user.profile_photo_url }} style={styles.profilePhoto} />
        <Text style={styles.username}>{user.username}</Text>
      </View>
      {user.follow_requested ? (
        <TouchableOpacity
          style={[styles.button, styles.unfollowButton]}
          onPress={handleUnfollow}
          disabled={unfollowMutation.variables === user.id}
        >
          <Text style={styles.unfollowButtonText}>
            {unfollowMutation.variables === user.id ? 'Unfollowing...' : 'Unfollow'}
          </Text>
        </TouchableOpacity>
      ) : (
        user.follow_approved && <Text style={styles.mutualText}>Following</Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('following');
  const [error, setError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: fetchFollowing,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: fetchFollowers,
  });

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <ProfilePhotoChanger initialPhotoUrl={user.profile_photo_url} onError={setError} autoUpload size={80} />
        <Text style={styles.name}>{user.username}</Text>
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statItem, activeTab === 'following' && styles.activeStatItem]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={styles.statCount}>{following.length ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statItem, activeTab === 'followers' && styles.activeStatItem]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={styles.statCount}>{followers.length ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'following' ? following : followers}
        renderItem={({ item }) => <UserListItem user={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileSection: {
    padding: 16,
    paddingHorizontal: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeStatItem: {
    backgroundColor: '#f0f0f0',
  },
  statCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
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
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  unfollowButtonText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '600',
  },
  mutualText: {
    fontSize: 14,
    color: '#34c759',
    fontWeight: '600',
  },
});
