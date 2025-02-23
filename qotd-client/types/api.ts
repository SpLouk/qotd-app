export interface User {
  username: string;
  profile_photo_url: string;
}

export interface PromptQuestion {
  id: string;
  content: string;
}

export interface Post {
  id: number;
  user_id: number;
  prompt_question_id: number;
  parent_post_id: number | null;
  content: string;
  created_at: string;
  username?: string;
  user_photo_url?: string;
}

export interface CreatePostRequest {
  post: {
    prompt_question_id: string;
    content: string;
  };
}
