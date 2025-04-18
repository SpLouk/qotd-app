export interface User {
  id: number;
  username: string;
  profile_photo_url: string;
  voted_today?: boolean;
  eligible_to_vote_today?: boolean;
  created_prompt_today?: boolean;
  groups?: Group[];
  needs_registration?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: Pick<User, 'id' | 'username' | 'profile_photo_url'>[];
}

export interface PromptQuestion {
  id: string;
  active?: boolean;
  content: string;
  votes_count?: number;
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
