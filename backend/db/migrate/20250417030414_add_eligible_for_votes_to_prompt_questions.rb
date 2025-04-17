class AddEligibleForVotesToPromptQuestions < ActiveRecord::Migration[7.0]
  def change
    add_column :prompt_questions, :eligible_for_votes, :boolean, default: false, null: false
  end
end
