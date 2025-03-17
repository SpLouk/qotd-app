class Follow < ApplicationRecord
  belongs_to :follower, class_name: "User"
  belongs_to :followed, class_name: "User"

  validates :follower_id, uniqueness: { scope: :followed_id }
  validate :not_following_self

  scope :active, -> { where(approved: true) }

  after_create :notify_followed_user
  after_update :notify_follower_if_approved, if: :saved_change_to_approved?

  def as_json
    attrs = slice(:followed_id, :follower_id, :approved, :created_at)

    attrs[:follower_profile_photo_url] = follower.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(follower.profile_photo) : nil
    attrs[:follower_username] = follower.username
    attrs
  end

  def approve_follow!
    unless Current.user.id == followed.id
      errors.add(approved, "Only followed user can approve a follow request")
      return
    end
    update!(approved: true)
  end

  private

  def not_following_self
    if follower_id == followed_id
      errors.add(:follower_id, "can't follow yourself")
    end
  end

  def notify_followed_user
    return unless followed.device_tokens.any?

    notification = Notification.new(
      title: "New Follower",
      body: "#{follower.username} started following you",
      category: "new_follower",
      thread_id: "follow_#{follower.id}",
      target_content_id: follower.id.to_s,
      custom_data: {
          follower_id: follower.id,
          follower_username: follower.username,
        follower_profile_photo_url: follower.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(follower.profile_photo) : nil
      }
    )

    ApnsService.notify(notification, followed.device_tokens)
  end

  def notify_follower_if_approved
    return unless approved?

    notification = Notification.new(
      title: "Follow Request Approved",
      body: "#{followed.username} approved your follow request",
      category: "follow_approved",
      thread_id: "follow_#{followed.id}",
      target_content_id: followed.id.to_s,
      custom_data: {
        followed_id: followed.id,
        followed_username: followed.username,
        followed_profile_photo_url: followed.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(followed.profile_photo) : nil
      }
    )

    ApnsService.notify(notification, follower.device_tokens)
  end
end
