class PromptQuestion < ApplicationRecord
  belongs_to :created_by, class_name: "User"
  has_many :responses, dependent: :destroy

  validates :content, presence: true
  validates :trigger_at, presence: true
  validate :only_one_active_prompt

  after_create :schedule_activation

  scope :future_prompts, -> {
    where("trigger_at > ?", Time.current)
      .order(:trigger_at)
  }

  private

  def schedule_activation
    ActivatePromptQuestionJob.set(wait_until: trigger_at).perform_later(self)
  end

  def only_one_active_prompt
    return unless active

    other_active = PromptQuestion.active.where.not(id: id).exists?
    errors.add(:active, "cannot have multiple active prompts") if other_active
  end
end
