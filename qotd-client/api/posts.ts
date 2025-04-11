import { CreatePostRequest, CreatePromptQuestionRequest, Post, PromptQuestion } from '@/types/api';
import { api } from '@/utils/api';

export const fetchPosts = (groupId: string): Promise<Post[]> => 
  api.get(`/groups/${groupId}/posts`);

export const fetchActivePromptQuestion = (groupId: string): Promise<PromptQuestion> => 
  api.get(`/groups/${groupId}/prompt_questions/active`);

export const fetchPromptQuestions = (groupId: string): Promise<PromptQuestion[]> => 
  api.get(`/groups/${groupId}/prompt_questions`);

export const fetchPost = (groupId: string, postId: string): Promise<Post> => 
  api.get(`/groups/${groupId}/posts/${postId}`);

export const createPost = (groupId: string, data: CreatePostRequest): Promise<Post> => 
  api.post(`/groups/${groupId}/posts`, data);

export const deletePost = (groupId: string, postId: number): Promise<void> => 
  api.delete(`/groups/${groupId}/posts/${postId}`);

export const createComment = (groupId: string, postId: number, data: CreatePostRequest): Promise<Post> =>
  api.post(`/groups/${groupId}/posts/${postId}/comments`, data);

export const createPromptQuestion = (groupId: string, data: CreatePromptQuestionRequest): Promise<PromptQuestion> =>
  api.post(`/groups/${groupId}/prompt_questions`, data);

export const voteForPrompt = (groupId: string, promptId: string): Promise<PromptQuestion> =>
  api.post(`/groups/${groupId}/prompt_questions/${promptId}/vote`, {});

export const unvoteForPrompt = (groupId: string, promptId: string): Promise<PromptQuestion> =>
  api.delete(`/groups/${groupId}/prompt_questions/${promptId}/unvote`);
