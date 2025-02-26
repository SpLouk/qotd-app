class PromptVote < ApplicationRecord
  belongs_to :user
  belongs_to :prompt_question, counter_cache: true
  
  validates :user_id, uniqueness: { scope: :prompt_question_id, message: "can only vote once per prompt" }
end
