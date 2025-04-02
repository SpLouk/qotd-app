import { CreatePostRequest, CreatePromptQuestionRequest, Post, PromptQuestion } from '@/types/api';
import { api } from '@/utils/api';

export const fetchPosts = (): Promise<Post[]> => api.get('/posts');

export const fetchActivePromptQuestion = (): Promise<PromptQuestion> => api.get('/prompt_questions/active');

export const fetchPromptQuestions = (limit: number = 5): Promise<PromptQuestion[]> =>
  api.get(`/prompt_questions?limit=${limit}`);

export const fetchPost = (postId: string): Promise<Post> => api.get(`/posts/${postId}`);

export const createPost = (data: CreatePostRequest): Promise<Post> => api.post('/posts', data);

export const deletePost = (postId: number): Promise<void> => api.delete(`/posts/${postId}`);

export const createComment = (postId: number, data: CreatePostRequest): Promise<Post> =>
  api.post(`/posts/${postId}/comments`, data);

export const createPromptQuestion = (data: CreatePromptQuestionRequest): Promise<PromptQuestion> =>
  api.post('/prompt_questions', data);

export const voteForPrompt = (promptId: string): Promise<PromptQuestion> =>
  api.post(`/prompt_questions/${promptId}/vote`, {});

export const unvoteForPrompt = (promptId: string): Promise<PromptQuestion> =>
  api.delete(`/prompt_questions/${promptId}/unvote`);
