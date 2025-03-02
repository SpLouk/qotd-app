class PromptQuestion < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true
  has_many :posts, dependent: :destroy
  has_many :prompt_votes, dependent: :destroy
  has_many :voters, through: :prompt_votes, source: :user

  validates :content, presence: true
  validate :only_one_active_prompt

  scope :active, -> { where(active: true) }
  scope :available_for_activation, -> {
    where(active: false)
      .where(activated_at: nil)
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
      # Deactivate currently active prompt and record deactivation time
      currently_active = PromptQuestion.active.first
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
    json = super(options)

    if options[:include_votes]
      json[:votes_count] = prompt_votes_count
      json[:user_voted] = user_voted?(options[:current_user])
    end

    json
  end

  private

  def only_one_active_prompt
    return unless active

    other_active = PromptQuestion.active.where.not(id: id).exists?
    errors.add(:active, "cannot have multiple active prompts") if other_active
  end
end
