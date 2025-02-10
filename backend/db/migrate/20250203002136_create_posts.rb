class CreatePosts < ActiveRecord::Migration[8.0]
  def change
    create_table :posts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :prompt_question, null: true, foreign_key: true
      t.references :parent_post, null: true, foreign_key: { to_table: :posts }
      t.text :content, null: false

      t.timestamps
    end
  end
end
