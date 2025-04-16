import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useGroup } from '@/context/GroupContext';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { Group } from '@/types/api';

interface GroupSelectorProps {
  groups: Group[];
}

export default function GroupSelector({ groups }: GroupSelectorProps) {
  const [visible, setVisible] = React.useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const { selectedGroup, setSelectedGroup } = useGroup();

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
      tension: 45,
      friction: 7,
    }).start();
  }, [visible, heightAnim]);

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setVisible(false);
  };

  if (!groups?.length) return null;

  const currentGroup = selectedGroup ?? groups[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.trigger}>
        <Text style={styles.triggerText}>{currentGroup?.name}</Text>
        <FontAwesome name={visible ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.appTitle} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.dropdown,
          {
            maxHeight: heightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200],
            }),
            opacity: heightAnim,
            transform: [
              {
                translateY: heightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {[...groups, { id: 8, name: 'foo' }].map((group) => (
          <TouchableOpacity key={group.id} style={styles.menuItem} onPress={() => handleSelectGroup(group)}>
            <Text style={[styles.menuItemText, currentGroup?.id === group.id && styles.selectedItemText]}>
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  triggerText: {
    fontSize: 24,
    color: Colors.appTitle,
    fontWeight: '600',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  selectedItemText: {
    color: Colors.appTitle,
    fontWeight: '600',
  },
});
