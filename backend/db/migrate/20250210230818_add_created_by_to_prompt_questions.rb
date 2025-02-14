class AddCreatedByToPromptQuestions < ActiveRecord::Migration[8.0]
  def change
    add_reference :prompt_questions, :created_by, null: true, foreign_key: { to_table: :users }
  end
end
