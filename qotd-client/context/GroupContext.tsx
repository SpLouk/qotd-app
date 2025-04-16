import { Group } from '@/types/api';
import React, { createContext, useContext, useState } from 'react';

interface GroupContextType {
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return <GroupContext.Provider value={{ selectedGroup, setSelectedGroup }}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}

export function useGroupId() {
  return useGroup().selectedGroup?.id;
}
