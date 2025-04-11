export interface User {
  id: string;
  username: string;
  profile_photo_url: string;
  voted_today?: boolean;
  eligible_to_vote_today?: boolean;
  created_prompt_today?: boolean;
  follow_requested?: boolean;
  follow_approved?: boolean;
  requested_following_you?: boolean;
  following_you?: boolean;
  has_device_token?: boolean;
  groups?: Group[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
}

export interface Follow {
  followed_id: string;
  follower_id: string;
  follower_profile_photo_url?: string;
  follower_username: string;
  approved: boolean;
  created_at: string;
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
