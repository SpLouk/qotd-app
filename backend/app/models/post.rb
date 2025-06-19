class Post < ApplicationRecord
  has_many :mentions, dependent: :destroy
  has_many :reactions, dependent: :destroy
  has_many :mentioned_users, through: :mentions, source: :user
  has_many :post_flags, dependent: :destroy
  has_many :flagged_users, through: :post_flags, source: :user
  has_many_attached :photos, service: :amazon
  has_one_attached :sound_file, service: :amazon

  belongs_to :user
  belongs_to :prompt_question, optional: true
  belongs_to :group, optional: true
  belongs_to :parent_post, class_name: "Post", optional: true
  has_many :replies, class_name: "Post", foreign_key: :parent_post_id, dependent: :destroy

  validates :content, presence: true, if: -> { photos.empty? && sound_file.nil? }
  validate :user_in_group, if: :group_id?
  validate :validate_parent_or_prompt_presence
  validate :validate_group_consistency
  validates :photos, content_type: [ :png, :jpg, :jpeg, :heic ], size: { less_than: 10.megabytes }
  validates :sound_file, size: { less_than: 10.megabytes }

scope :ordered_by_recent_activity, -> {
  left_joins(:replies)
    .select(
      "posts.*, MAX(COALESCE(replies_posts.created_at, posts.created_at)) AS ordering_timestamp"
    )
    .group("posts.id")
    .order("ordering_timestamp DESC")
}

  after_create :extract_mentions_and_notify

  def as_json
    attrs = super
    attrs[:username] = user.username
    attrs[:user_photo_url] = user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.profile_photo) : nil
    attrs[:mentions] = mentions.map do |mention|
      {
        user_id: mention.user_id,
        locations: mention.locations
      }
    end

    attrs[:reactions] = reactions.map do |reaction|
      {
        id: reaction.id,
        user_id: reaction.user_id,
        reaction: reaction.reaction
      }
    end

    # Add photo URLs to the JSON response if photos are attached
    if photos.attached?
      attrs[:photo_urls] = photos.map do |photo|
        Rails.application.routes.url_helpers.rails_blob_url(photo)
      end
    else
      attrs[:photo_urls] = []
    end

    if sound_file.attached?
      attrs[:sound_file_url] = Rails.application.routes.url_helpers.rails_blob_url(sound_file)
    else
      attrs[:sound_file_url] = nil
    end
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

  def notify_other_repliers(mentioned_users)
    # Get parent post author and all previous repliers (excluding current reply author)
    recipient_ids = parent_post.replies.pluck(:user_id)
    recipient_ids = recipient_ids.uniq - [ user_id, parent_post.user_id ] - mentioned_users.map(&:id)
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

  def notify_parent_post_author(mentioned_users)
    # return if post author has no device tokens, or they were already notified through a mention
    if !parent_post.user.device_tokens.any? || mentioned_users.map(&:id).include?(parent_post.user_id)
      return
    end

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

  def extract_mentions_and_notify
    return unless group

    # Find all mentions and their locations
    mention_matches = content.to_enum(:scan, /@([a-zA-Z0-9_]+)/).map do
      match = Regexp.last_match
      { username: match[1], start: match.begin(0), end: match.end(0) }
    end

    # Group by username
    mentions_by_username = mention_matches.group_by { |m| m[:username] }

    # Only consider group users
    group_users = group.approved_users.where(username: mentions_by_username.keys)
    group_users.each do |mentioned_user|
      locations = mentions_by_username[mentioned_user.username].map { |m| { start: m[:start], end: m[:end] } }
      next if locations.empty?
      Mention.create!(user: mentioned_user, post_id: id, locations: locations)
      if user_id != mentioned_user.id
        MentionNotifierJob.perform_later(mentioned_user.id, id)
      end
    end

    # if replying to a parent post, notify other repliers and the parent post author
    if is_reply?
      notify_other_repliers(group_users)
      notify_parent_post_author(group_users)
    end
  end
end
