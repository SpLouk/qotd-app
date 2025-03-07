class Follow < ApplicationRecord
  belongs_to :follower, class_name: "User"
  belongs_to :followed, class_name: "User"

  validates :follower_id, uniqueness: { scope: :followed_id }
  validate :not_following_self

  scope :active, -> { where(approved: true) }

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
    errors.add(:follower_id, "can't follow themselves") if follower_id == followed_id
  end
end
