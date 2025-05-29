import * as ImagePicker from 'expo-image-picker';
import { CreatePostRequest } from '@/types/api';

export const createPostRequestBody = ({
  prompt_question_id,
  parent_post_id,
  content,
  photos,
}: CreatePostRequest['post']): BodyInit => {
  if (photos.length > 0) {
    const formData = new FormData();
    if (parent_post_id) {
      formData.append('post[parent_post_id]', parent_post_id?.toString());
    }
    formData.append('post[content]', content.trim());
    formData.append('post[prompt_question_id]', String(prompt_question_id ?? 0));
    photos.forEach((photo: ImagePicker.ImagePickerAsset, idx: number) => {
      formData.append('post[photos][]', {
        uri: photo.uri,
        type: photo.mimeType || 'image/jpeg',
        name: photo.fileName || `photo-${idx + 1}.jpg`,
      } as any);
    });
    return formData;
  } else {
    const body = {
      post: {
        content: content.trim(),
        parent_post_id,
        prompt_question_id,
      },
    };
    return JSON.stringify(body);
  }
};
