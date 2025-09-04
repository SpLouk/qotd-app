import { Post } from '@/types/api';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useUserApi } from '@/api/useUserApi';
import { useState, useEffect } from 'react';
import Colors from '@/constants/Colors';

type ProfileHeaderProps = Pick<Post, 'user_id' | 'username' | 'user_photo_url'> & {
  showOwlFlair?: boolean;
};

export const UserProfileHeader = ({ user_id, username, user_photo_url, showOwlFlair }: ProfileHeaderProps) => {
  const { data: currentUser } = useUserApi();
  const [showTooltip, setShowTooltip] = useState(false);

  const isCurrentUser = currentUser?.id === user_id;
  const handlePress = () => {
    if (isCurrentUser) {
      router.push('/profile');
    }
  };

  const handleOwlPress = () => {
    setShowTooltip(true);
  };

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.userInfo}>
        <Image source={{ uri: user_photo_url }} style={styles.profilePhoto} />
        <Text style={styles.userName}>{username ?? 'Unknown'}</Text>
      </Pressable>
      {showOwlFlair && (
        <View style={styles.owlWrapper}>
          <Pressable onPress={handleOwlPress}>
            <Text style={styles.owlIcon}>🦉</Text>
          </Pressable>
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>This post was made within 1/2 hour of the prompt drop</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userName: {
    fontSize: 16,
  },
  owlWrapper: {
    position: 'relative',
  },
  owlIcon: {
    fontSize: 16,
  },
  tooltip: {
    zIndex: 1,
    position: 'absolute',
    top: 24,
    left: -90,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 200,
  },
  tooltipText: {
    color: Colors.background,
    fontSize: 12,
    textAlign: 'center',
  },
});
