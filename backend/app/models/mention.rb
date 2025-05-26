class Mention < ApplicationRecord
  belongs_to :user
  belongs_to :post

  validates :user_id, presence: true
  validates :post_id, presence: true
  validates :user_id, uniqueness: { scope: :post_id }
  validates :locations, presence: true

  # locations: array of {start: <int>, end: <int>} hashes
end
