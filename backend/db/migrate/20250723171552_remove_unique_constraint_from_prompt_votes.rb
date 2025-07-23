class RemoveUniqueConstraintFromPromptVotes < ActiveRecord::Migration[8.0]
  def change
    remove_index :prompt_votes, [ :user_id, :prompt_question_id ]
    add_index :prompt_votes, [ :user_id, :prompt_question_id ]
  end
end
