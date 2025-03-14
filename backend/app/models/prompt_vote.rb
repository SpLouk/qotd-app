class PromptVote < ApplicationRecord
  belongs_to :user
  belongs_to :prompt_question, counter_cache: true

  validates :user_id, uniqueness: { scope: :prompt_question_id, message: "can only vote once per prompt" }
  validate :one_vote_per_day

  private

  def one_vote_per_day
    if user.prompt_votes.where("created_at >= ?", Time.current.beginning_of_day).where.not(id: id).exists?
      errors.add(:base, "can only vote once per day")
    end
  end
end
