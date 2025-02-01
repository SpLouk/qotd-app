class CreatePromptQuestions < ActiveRecord::Migration[8.0]
  def change
    create_table :prompt_questions do |t|
      t.timestamp :trigger_at
      t.text :content
      t.boolean :active, default: false

      t.timestamps
    end
  end
end
