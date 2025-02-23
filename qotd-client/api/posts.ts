import { CreatePostRequest, Post, PromptQuestion } from '@/types/api';
import { api } from '@/utils/api';

export const fetchPosts = (): Promise<Post[]> => api.get('/posts');

export const fetchActivePromptQuestion = (): Promise<PromptQuestion> => api.get('/prompt_question/active');

export const createPost = (data: CreatePostRequest): Promise<Post> => api.post('/posts', data);

export const createComment = (postId: number, data: CreatePostRequest): Promise<Post> => 
  api.post(`/posts/${postId}/comments`, data);
