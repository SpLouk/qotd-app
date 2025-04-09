class PromptQuestion < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :group
  has_many :posts, dependent: :destroy
  has_many :prompt_votes, dependent: :destroy
  has_many :voters, through: :prompt_votes, source: :user

  validates :content, presence: true
  validate :only_one_active_prompt_per_group

  scope :active, -> { where(active: true) }
  scope :available_for_activation, -> {
    where(active: false)
      .where(activated_at: nil)
      .order(prompt_votes_count: :desc)
  }

  scope :available_for_voting, -> {
    where(active: false)
      .where(activated_at: nil)
      .where(created_at: (Time.current - 2.days)..Time.current)
      .order(prompt_votes_count: :desc)
  }

  def self.active_prompt
    active.first
  end

  def self.most_voted
    available_for_activation.first
  end

  def activate!
    ActiveRecord::Base.transaction do
      # Deactivate currently active prompt in this group and record deactivation time
      currently_active = group.prompt_questions.active.first
      if currently_active
        currently_active.update!(
          active: false,
          deactivated_at: Time.current
        )
      end

      # Activate this prompt and record activation time
      update!(
        active: true,
        activated_at: Time.current
      )
    end
  end

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

  private

  def only_one_active_prompt_per_group
    return unless active
    return unless group_id

    other_active = group.prompt_questions.active.where.not(id: id).exists?
    errors.add(:active, "cannot have multiple active prompts in the same group") if other_active
  end
end
