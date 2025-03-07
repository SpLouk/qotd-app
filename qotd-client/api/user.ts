import { Follow, User } from '@/types/api';
import { api } from '@/utils/api';

export const fetchCurrentUser = (): Promise<User> => api.get('/user');

export const searchUsers = (query: string): Promise<User[]> => api.get(`/users/search?q=${encodeURIComponent(query)}`);

export const followUser = (userId: string): Promise<void> => api.post(`/users/${userId}/follow`, {});

export const unFollowUser = (userId: string): Promise<void> => api.delete(`/users/${userId}/follow`);

export const approveFollow = (userId: string): Promise<void> => api.put(`/users/${userId}/follow/approve`, {});

export const fetchFollowing = (): Promise<User[]> => api.get(`/following`);

export const fetchFollowers = (): Promise<User[]> => api.get(`/followers`);

export const fetchFollowerRequests = (): Promise<Follow[]> => api.get(`/follow_requests`);
