import { fetchCurrentUser } from '@/api/user';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface AppHeaderProps {
  title?: string;
  showProfileButton?: boolean;
  rightButton?: React.ReactNode;
}

export function AppHeader({ title = 'Hoot', showProfileButton = true, rightButton }: AppHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  const handleMenuItemPress = (route: '/search' | '/profile') => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
          </View>

          {rightButton && <View>{rightButton}</View>}

          {showProfileButton &&
            (isLoadingUser ? (
              <View style={styles.profileButton}>
                <ActivityIndicator color="#AFF" size="small" />
              </View>
            ) : (
              user && (
                <TouchableOpacity style={styles.profileButton} onPress={() => setMenuVisible(true)}>
                  <Image source={{ uri: user.profile_photo_url }} style={styles.profilePhoto} />
                </TouchableOpacity>
              )
            ))}
        </View>
      </View>

      <Modal animationType="fade" transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('/profile')}>
              <FontAwesome name="user" size={20} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress('/search')}>
              <FontAwesome name="search" size={20} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhoto: {
    height: '100%',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 60,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
});

