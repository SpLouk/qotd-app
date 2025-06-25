class MentionNotifierJob < ApplicationJob
  queue_as :default

  def perform(user_id, post_id)
    user = User.find_by(id: user_id)
    post = Post.find_by(id: post_id)
    return unless user && post
    return if user.device_tokens.empty?

    notification = Notification.new(
      title: "You were mentioned in a post",
      body: post.content.truncate(100),
      badge: 1,
      category: "mention",
      thread_id: "post_#{post.id}",
      target_content_id: post.id.to_s,
      custom_data: {
        mentioner_id: post.user.id,
        mentioner_username: post.user.username,
        mentioner_profile_photo_url: post.user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(post.user.profile_photo) : nil,
        post_id: post.id,
        post_content: post.content
      }
    )
    ApnsService.notify(notification, user.device_tokens)
  end
end
