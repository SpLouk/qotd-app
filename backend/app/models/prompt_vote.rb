class PromptVote < ApplicationRecord
  belongs_to :user
  belongs_to :prompt_question, counter_cache: true

  validates :user_id, uniqueness: { scope: :prompt_question_id, message: "can only vote once per prompt" }
  validate :one_vote_per_group_per_day

  private

  def one_vote_per_group_per_day
    group_id = prompt_question&.group_id
    return unless group_id && user

    if user.prompt_votes.joins(:prompt_question)
      .where("prompt_questions.group_id = ?", group_id)
      .where("prompt_votes.created_at >= ?", Time.current.beginning_of_day)
      .where.not(id: id)
      .exists?
      errors.add(:base, "can only vote once per group per day")
    end
  end
end
