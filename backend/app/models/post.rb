class Post < ApplicationRecord
  belongs_to :user
  belongs_to :prompt_question, optional: true
  belongs_to :parent_post, class_name: "Post", optional: true
  has_many :replies, class_name: "Post", foreign_key: :parent_post_id, dependent: :destroy

  validates :content, presence: true

  def as_json
    attrs = super
    attrs[:username] = user.username
    attrs[:user_photo_url] = user.profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.profile_photo) : nil
    attrs
  end
end
