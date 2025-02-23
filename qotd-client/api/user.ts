import { User } from '@/types/api';
import { api } from '@/utils/api';

export const fetchCurrentUser = (): Promise<User> => api.get('/user');
