class PromptQuestion < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :group
  has_many :posts, dependent: :destroy
  has_many :prompt_votes, dependent: :destroy
  has_many :voters, through: :prompt_votes, source: :user

  validates :content, presence: true

  scope :active, -> { where(active: true) }
  scope :available_for_activation, -> {
    where(active: false)
      .where(activated_at: nil)
      .order(prompt_votes_count: :desc)
  }

  scope :available_for_voting, ->(group) {
    next_activation = group.next_scheduled_activation || Time.current
    where(active: false)
      .where(activated_at: nil)
      .where(group_id: group.id)
      .where(created_at: (next_activation - 2.days)..Time.current)
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
