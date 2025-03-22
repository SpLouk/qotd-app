import { fetchCurrentUser, fetchFollowers, fetchFollowing, unFollowUser } from '@/api/user';
import { ProfilePhotoChanger } from '@/components/ProfilePhotoChanger';
import BackButton from '@/components/BackButton';
import Colors from '@/constants/Colors';
import { User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>@{user.username}</Text>
      </View>

      <View style={styles.profileSection}>
        <ProfilePhotoChanger initialPhotoUrl={user.profile_photo_url} onError={setError} autoUpload size={80} />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  profileSection: {
    padding: 16,
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: Colors.error + '10',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeStatItem: {
    backgroundColor: Colors.border,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    borderBottomColor: Colors.border,
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
    color: Colors.text,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  unfollowButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  mutualText: {
    fontSize: 14,
    color: Colors.primary,
  },
});
