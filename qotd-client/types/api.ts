import * as ImagePicker from 'expo-image-picker';

export interface User {
  id: number;
  username: string;
  email_address?: string;
  profile_photo_url: string;
  voted_today?: boolean;
  eligible_to_vote_today?: boolean;
  groups?: Group[];
  needs_registration?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  next_scheduled_activation?: string;
  active_invite_codes?: string[];
  privacy_level?: 'secret' | 'closed' | 'open';
  members: Pick<User, 'id' | 'username' | 'profile_photo_url'>[];
  current_user_role?: 'member' | 'admin';
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
  mentions?: Mention[];
  photo_urls: string[];
  sound_file_url?: string;
}

export interface Mention {
  user_id: number;
  locations: { start: number; end: number }[];
}

export interface CreatePostRequest {
  post: {
    prompt_question_id: number;
    parent_post_id?: number;
    content: string;
    photos: ImagePicker.ImagePickerAsset[];
  };
}
