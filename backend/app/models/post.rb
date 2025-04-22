class Post < ApplicationRecord
  belongs_to :user
  belongs_to :prompt_question, optional: true
  belongs_to :group, optional: true
  belongs_to :parent_post, class_name: "Post", optional: true
  has_many :replies, class_name: "Post", foreign_key: :parent_post_id, dependent: :destroy

  validates :content, presence: true
  validate :user_in_group, if: :group_id?
  validate :validate_parent_or_prompt_presence
  validate :validate_group_consistency

  after_create :notify_parent_post_author, if: :is_reply?
  after_create :notify_other_repliers, if: :is_reply?

  def as_json
    attrs = super
    attrs[:username] = user.username
    attrs[:user_photo_url] = user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.profile_photo) : nil
    attrs
  end

  private

  def is_reply?
    parent_post.present?
  end

  def user_in_group
    return if group.approved_users.exists?(id: user_id)
    errors.add(:group, "user must be an approved member of the group")
  end

  def notify_other_repliers
    # Get parent post author and all previous repliers (excluding current reply author)
    recipient_ids = parent_post.replies.pluck(:user_id)
    recipient_ids = recipient_ids.uniq - [ user_id, parent_post.user_id ]
    return if recipient_ids.empty?

    device_tokens = DeviceToken.where(user_id: recipient_ids)
    return if device_tokens.empty?

    notification = Notification.new(
      title: "#{user.username} also responded to #{parent_post.user.username}'s post",
      body: content,
      category: "post_response",
      thread_id: "post_#{parent_post.id}",
      target_content_id: parent_post.id.to_s,
      custom_data: {
        responder_id: user.id,
        responder_username: user.username,
        responder_profile_photo_url: user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.profile_photo) : nil,
        post_id: parent_post.id,
        response_id: id,
        response_content: content
      }
    )

    ApnsService.notify(notification, device_tokens)
  end

  def notify_parent_post_author
    return unless parent_post.user.device_tokens.any?

    notification = Notification.new(
      title: "#{user.username} responded to your post",
      body: content,
      category: "post_response",
      thread_id: "post_#{parent_post.id}",
      target_content_id: parent_post.id.to_s,
      custom_data: {
        responder_id: user.id,
        responder_username: user.username,
        responder_profile_photo_url: user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.profile_photo) : nil,
        post_id: parent_post.id,
        response_id: id,
        response_content: content
      }
    )

    ApnsService.notify(notification, parent_post.user.device_tokens)
  end

  def validate_parent_or_prompt_presence
    return if parent_post.present? || prompt_question.present?
    errors.add(:base, "must have either a parent post or prompt question")
  end

  def validate_group_consistency
    return unless group_id?

    if parent_post.present?
      errors.add(:group, "must match parent post's group") if group_id != parent_post.group_id
    elsif prompt_question.present?
      errors.add(:group, "must match prompt question's group") if group_id != prompt_question.group_id
    end
  end
end
