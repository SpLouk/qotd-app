import { approveFollow, fetchFollowerRequests, unFollowUser } from '@/api/user';
import Colors from '@/constants/Colors';
import { Follow } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

export default function FollowRequestsScreen() {
  const queryClient = useQueryClient();

  const { data: followRequests = [], isLoading } = useQuery({
    queryKey: ['follower_requests'],
    queryFn: fetchFollowerRequests,
  });

  const approveFollowMutation = useMutation({
    mutationFn: approveFollow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follower_requests'] });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: unFollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follower_requests'] });
    },
  });

  const handleApproveFollow = (userId: string) => {
    approveFollowMutation.mutate(userId);
  };

  const handleDeleteRequest = (userId: string, username: string) => {
    Alert.alert(
      'Delete Request',
      `Are you sure you want to delete the follow request from ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRequestMutation.mutate(userId),
        },
      ]
    );
  };

  const renderRequestItem = ({ item }: { item: Follow }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <Image source={{ uri: item.follower_profile_photo_url }} style={styles.profilePhoto} />
        <Text style={styles.username}>{item.follower_username}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApproveFollow(item.follower_id)}
          disabled={approveFollowMutation.variables === item.follower_id}
        >
          <Text style={styles.approveButtonText}>
            {approveFollowMutation.variables === item.follower_id ? 'Approving...' : 'Approve'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDeleteRequest(item.follower_id, item.follower_username)}
          disabled={deleteRequestMutation.variables === item.follower_id}
        >
          <Text style={styles.deleteButtonText}>
            {deleteRequestMutation.variables === item.follower_id ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Follow Requests</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : followRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending follow requests</Text>
        </View>
      ) : (
        <FlatList
          data={followRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.follower_id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  requestItem: {
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
    color: Colors.text,
    marginBottom: 2,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  approveButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
