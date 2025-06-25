class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :post

  validates :reaction, uniqueness: { scope: [ :user_id, :post_id ], message: "This reaction already exists" }

  after_create :notify_post_author
private

def notify_post_author
  # Do not notify if user is reacting to their own post
  return if post.user_id == user_id
  return unless post.user.device_tokens.any?

  notification = Notification.new(
    title: "#{user.username} reacted to your post",
    body: nil,
    badge: 1,
    category: "reaction",
    thread_id: "post_#{post.id}",
    target_content_id: post.id.to_s,
    custom_data: {
      reactor_id: user.id,
      reactor_username: user.username,
      reactor_profile_photo_url: user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.profile_photo) : nil,
      post_id: post.id,
      reaction_id: id,
      reaction: reaction
    }
  )

  ApnsService.notify(notification, post.user.device_tokens)
end

end
