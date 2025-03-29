import { fetchCurrentUser, fetchFollowerRequests } from '@/api/user';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RadialMenu() {
  const [visible, setVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const { data: followRequests = [] } = useQuery({
    queryKey: ['follower_requests'],
    queryFn: fetchFollowerRequests,
  });

  // Update animation when visibility changes
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 45,
      friction: 7,
    }).start();
  }, [visible, scaleAnim]);

  const handleMenuItemPress = (route: '/search' | '/profile' | '/follow-requests') => {
    setVisible(false);
    router.push(route);
  };

  const menuItems: IMenuItem[] = [
    {
      icon: 'search',
      label: 'Find friends',
      onPress: () => handleMenuItemPress('/search'),
    },
    {
      icon: 'user',
      label: 'Profile',
      onPress: () => handleMenuItemPress('/profile'),
    },
    {
      icon: 'user-plus',
      label: 'Requests',
      onPress: () => handleMenuItemPress('/follow-requests'),
      badge: followRequests.length,
    },
  ] as const;

  if (!user) return null;

  return (
    <View style={styles.menuWrapper}>
      <TouchableOpacity style={styles.profileButton} onPress={() => setVisible(!visible)}>
        {user.profile_photo_url ? (
          <Image source={{ uri: user.profile_photo_url }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <FontAwesome name="question" size={18} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      {visible && (
        <>
          <Pressable style={styles.menuOverlay} onPress={() => setVisible(false)} />
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              return (
                <Animated.View
                  key={item.label}
                  style={[
                    styles.menuRay,
                    {
                      transform: [
                        {
                          rotate: scaleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['30deg', `${0 - 30 * index}deg`],
                          }),
                        },
                        {
                          translateX: scaleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -180],
                          }),
                        },
                        { scale: scaleAnim },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity style={styles.menuContent} onPress={item.onPress}>
                    <View style={styles.menuItemWithBadge}>
                      <FontAwesome name={item.icon as any} size={24} color="#333" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menuWrapper: {
    position: 'relative',
    zIndex: 999,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 1001,
  },
  menuContainer: {
    position: 'absolute',
    right: 50,
    width: 'auto',
    height: 'auto',
  },
  menuRay: {
    position: 'absolute',
    width: 160,
    height: 50,
    borderRadius: 50,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1003,
  },
  menuContent: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuItemWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

interface IMenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
}
