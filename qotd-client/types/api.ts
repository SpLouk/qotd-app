export interface User {
  username: string;
  profile_photo_url: string;
}

export interface PromptQuestion {
  id: string;
  content: string;
  prompt_votes_count?: number;
  user_voted?: boolean;
  created_by_username?: string;
}

export interface CreatePromptQuestionRequest {
  prompt_question: {
    content: string;
  };
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
    prompt_question_id: number;
    parent_post_id?: number;
    content: string;
  };
}
