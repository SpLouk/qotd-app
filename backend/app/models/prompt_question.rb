class PromptQuestion < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :group
  has_many :posts, dependent: :destroy
  has_many :prompt_votes, dependent: :destroy
  has_many :voters, through: :prompt_votes, source: :user

  validates :content, presence: true

  scope :active, -> { where(active: true) }

  scope :available_for_voting, -> {
      where(activated_at: nil)
      .where(eligible_for_votes: true)
      .order(prompt_votes_count: :desc)
  }

  def user_voted?(user)
    return false unless user
    prompt_votes.exists?(user_id: user.id)
  end

  def as_json(options = {})
    json = slice(:active, :content, :created_at, :id, :group_id)

    json[:created_by_username] = created_by&.username

    if options[:include_votes]
      json[:votes_count] = prompt_votes_count
      json[:user_voted] = user_voted?(options[:current_user])
    end

    json
  end
end
