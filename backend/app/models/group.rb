class Group < ApplicationRecord
  belongs_to :created_by, class_name: "User"

  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users
  has_many :prompt_questions, dependent: :destroy
  has_many :posts, dependent: :nullify

  validates :name, presence: true, uniqueness: true

  def approved_users
    users.merge(GroupUser.where(approved: true))
  end

  def active_prompt
    prompt_questions.active.first
  end

  def prompt_history
    prompt_questions.order(activated_at: :desc)
  end

  def set_active_prompt(prompt)
    return unless prompt.group_id == id
    prompt.activate!
  end

  private

  def only_one_active_prompt
    return unless active

    other_active = PromptQuestion.active.where.not(id: id).exists?
    errors.add(:active, "cannot have multiple active prompts") if other_active
  end
end
