class AddGroupToPromptQuestionsAndPosts < ActiveRecord::Migration[8.0]
  def change
    add_reference :posts, :group, foreign_key: true
    add_reference :prompt_questions, :group, foreign_key: true

    add_index :prompt_questions, [ :group_id, :active ], where: "active = true"
  end
end
