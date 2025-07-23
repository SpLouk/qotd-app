class PromptQuestion < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :group
  has_many :posts, dependent: :destroy
  has_many :prompt_votes, dependent: :destroy
  has_many :voters, through: :prompt_votes, source: :user

  validates :content, presence: true, length: { maximum: 256 }

  scope :active, -> { where(active: true) }

  scope :available_for_voting, -> {
      where(activated_at: nil)
      .where(eligible_for_votes: true)
      .order(prompt_votes_count: :desc)
  }

  scope :top_half_by_replies, -> {
    # Get all questions with their post counts
    questions_with_counts = left_joins(:posts)
                           .group(:id)
                           .select("prompt_questions.*, COUNT(posts.id) as posts_count")
                           .order("COUNT(posts.id) DESC")

    # Calculate the half threshold (top 50%)
    total_count = count
    return [] if total_count == 0
    # Return the top half
    questions_with_counts.limit((total_count / 2).ceil)
  }

  def user_voted_today?(user)
    return false unless user
    prompt_votes.where(created_at: Date.current.all_day).exists?(user_id: user.id)
  end

  def as_json(options = {})
    json = slice(:active, :content, :created_at, :id, :group_id, :activated_at)

    json[:created_by_username] = created_by&.username

    if options[:include_votes]
      json[:votes_count] = prompt_votes_count
      json[:user_voted] = user_voted_today?(options[:current_user])
    end

    if options[:include_posts]
      json[:posts] = posts.ordered_by_recent_activity.map { |p| p.as_json }
    end

    json
  end
end
