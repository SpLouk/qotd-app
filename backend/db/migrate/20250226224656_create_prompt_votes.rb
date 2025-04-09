class CreatePromptVotes < ActiveRecord::Migration[8.0]
  def change
    create_table :prompt_votes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :prompt_question, null: false, foreign_key: true
      t.timestamps
    end

    # Ensure a user can only vote for a specific prompt once
    add_index :prompt_votes, [ :user_id, :prompt_question_id ], unique: true

    # Add a counter cache column to prompt_questions to track votes
    add_column :prompt_questions, :prompt_votes_count, :integer, default: 0

    # Remove trigger_at as it's no longer needed
    remove_column :prompt_questions, :trigger_at

    # Add timestamps to track activation history
    add_column :prompt_questions, :activated_at, :datetime
    add_column :prompt_questions, :deactivated_at, :datetime

    # Add index for efficient finding of most voted prompts
    add_index :prompt_questions, :prompt_votes_count
  end
end
