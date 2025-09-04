class Group < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true

  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users
  has_many :prompt_questions, dependent: :destroy
  has_many :posts, dependent: :nullify
  has_many :invite_codes, dependent: :destroy

  enum :privacy_level, [ :secret, :closed, :open ]

  validates :name, presence: true, uniqueness: true
  validates :privacy_level, presence: true
  validate :only_one_active_prompt

  after_create :create_default_invite_code

  scope :scheduled_for_day, ->(day) {
    day_str = day.to_s
    where("prompt_schedule LIKE ?", "%#{day_str}%")
  }

  def approved_users
    users.merge(GroupUser.where(approved: true))
  end

  def active_prompt
    prompt_questions.active.first
  end

  def activate_new_prompt!
    ActiveRecord::Base.transaction do
      prompts = prompt_questions.available_for_voting.to_a
      winning_prompt, *runner_up_prompts = prompts.first(4)
      runner_up_ids = runner_up_prompts.map(&:id)

      return unless winning_prompt

      if active_prompt
        active_prompt.update!(
          active: false,
          deactivated_at: Time.current,
          eligible_for_votes: false
        )
      end

      prompt_questions.where.not(id: runner_up_ids).update_all(eligible_for_votes: false)
      prompt_questions.where(id: runner_up_ids).update_all(eligible_for_votes: true)

      winning_prompt.update!(
        active: true,
        activated_at: Time.current
      )
      winning_prompt
    end
  end

  def prompt_recently_activated?
    return false unless active_prompt
    active_prompt.activated_at > 6.hours.ago
  end

  def as_json
    attrs = slice(:id, :name, :description, :privacy_level, :created_at, :created_by_id, :next_scheduled_activation)
    attrs[:members] = approved_users.as_json
    attrs[:active_invite_codes] = invite_codes.active.map(&:code)
    attrs[:prompt_voting_active] = !prompt_recently_activated?
    attrs[:followup_posts_allowed] = !prompt_recently_activated?
    attrs
  end

  def add_user(user, role = :member)
    new_group_user = group_users.build(user: user, role: role, approved: true)
    new_group_user.save!
  end

  private

  def only_one_active_prompt
    return if prompt_questions.empty?

    active_count = prompt_questions.count { |q| q.active? || (q.active_changed? && q.active) }
    errors.add(:base, "Group can only have one active prompt at a time") if active_count > 1
  end

  def create_default_invite_code
    invite_codes.create!(created_by: created_by)
  end
end
