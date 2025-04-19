import Colors from '@/constants/Colors';
import type { Group } from '@/types/api';
import { Router } from 'expo-router';
import React, { forwardRef, Ref } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

interface GroupPagerProps {
  groupList?: Group[];
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
  router: Router;
}

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export const GroupTitlePager = forwardRef<unknown, GroupPagerProps>(function GroupPager(
  { groupList, selectedGroupId, setSelectedGroupId, router },
  ref,
) {
  if (!groupList?.length) {
    return (
      <View style={styles.pagerView}>
        <Text style={styles.groupName}>Hoot</Text>
      </View>
    );
  }

  return (
    <AnimatedPagerView
      ref={ref as Ref<any>}
      style={styles.pagerView}
      onPageSelected={(e) => {
        const index = e.nativeEvent.position;
        const group = groupList[index];
        if (group && group.id !== selectedGroupId) {
          setSelectedGroupId(group.id);
        }
      }}
      testID="group-pager-view"
    >
      {groupList.map((item) => (
        <View key={item.id} collapsable={false}>
          <Pressable
            onPress={() => {
              if (selectedGroupId === item.id) {
                router.push('/group');
              } else {
                setSelectedGroupId(item.id);
              }
            }}
          >
            <Text style={styles.groupName}>{item.name}</Text>
          </Pressable>
        </View>
      ))}
    </AnimatedPagerView>
  );
});

const styles = StyleSheet.create({
  pagerView: {
    height: 32,
    width: '100%',
  },
  groupName: {
    fontSize: 24,
    color: Colors.appTitle,
    fontWeight: '600',
  },
});
