class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :post

  validates :reaction, uniqueness: { scope: [ :user_id, :post_id ], message: "This reaction already exists" }
end
