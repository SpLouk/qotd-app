import { Group } from '@/types/api';
import { useFetchApiAndParseJson } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useState } from 'react';

interface GroupContextType {
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  return <GroupContext.Provider value={{ selectedGroupId, setSelectedGroupId }}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  const fetchApiAndParseJson = useFetchApiAndParseJson();

  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  const { selectedGroupId } = context;

  return useQuery<Group, Error>({
    queryKey: ['group'],
    queryFn: () => fetchApiAndParseJson(`/groups/${selectedGroupId}`),
    enabled: !!selectedGroupId, // Only enable when groupId is provided
  });
}

export function useGroupId() {
  return useGroup().data?.id;
}
