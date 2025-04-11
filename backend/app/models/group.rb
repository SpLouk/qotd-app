class Group < ApplicationRecord
  belongs_to :created_by, class_name: "User"

  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users
  has_many :prompt_questions, dependent: :destroy
  has_many :posts, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validate :only_one_active_prompt

  def approved_users
    users.merge(GroupUser.where(approved: true))
  end

  def active_prompt
    prompt_questions.active.first
  end

  def activate_new_prompt!
    ActiveRecord::Base.transaction do
      if active_prompt
        active_prompt.update!(
          active: false,
          deactivated_at: Time.current
        )
      end

      # Activate this prompt and record activation time
      prompt_to_activate = prompt_questions.available_for_activation.first

      return unless prompt_to_activate

      prompt_to_activate.update!(
        active: true,
        activated_at: Time.current
      )
      prompt_to_activate
    end
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
end
