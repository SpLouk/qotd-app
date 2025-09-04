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

  def user_can_reply_again?(user)
    return false unless user && active
    user_post = posts.where(user: user).order(:created_at).first
    return false unless user_post
    user_post.is_fast_reply_to_prompt?
  end

  def self.generate_ai_suggestion(user, partial_prompt = "")
    popular_prompts = user.prompt_questions.top_half_by_replies.sample(3)
    prompt_examples = popular_prompts.map(&:content).join("\n- ")

    system_message = "You are helping complete and improve question prompts for a social app where close friends answer daily questions. Generate ONE creative, thought-provoking question that would spark interesting conversations. Avoid anything corny or trite."

    user_message = if partial_prompt.present?
      if prompt_examples.present?
        "The user has started typing: '#{partial_prompt}', complete their input.\n\nHere are some popular past prompts created by this user:\n- #{prompt_examples}\n\nTry to use this user's voice. Keep it to one single sentence and under 256 characters. No two-part questions."
      else
        "The user has started typing: '#{partial_prompt}', complete their input.\n\nComplete or improve their question to be engaging and thought-provoking. Keep it to one single short sentence and under 256 characters. No two-part questions."
      end
    else
      if prompt_examples.present?
        "Here are some past prompts created by this user:\n- #{prompt_examples}\n\nTry to use this user's voice. Keep it to one single sentence and under 256 characters. No two-part questions."
      else
        "Generate an engaging, thought-provoking question for friends to answer and discuss. Keep it to one single short sentence and under 256 characters. No two-part questions."
      end
    end

    ChatgptService.call_chatgpt_api(system_message + "\n\n" + user_message)
  end

  def as_json(options = {})
    json = slice(:active, :content, :created_at, :id, :group_id, :activated_at)

    json[:created_by_username] = created_by&.username

    if options[:include_votes]
      json[:votes_count] = prompt_votes_count
      json[:user_voted] = user_voted_today?(options[:current_user])
      json[:user_voted_today] = user_voted_today?(options[:current_user])
    end

    if options[:include_posts]
      json[:posts] = posts.ordered_by_recent_activity.map { |p| p.as_json }

      if Current.user
        json[:user_can_reply_again] = user_can_reply_again?(Current.user)
      end
    end

    json
  end
end
