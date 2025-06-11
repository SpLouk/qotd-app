class CreatePostFlags < ActiveRecord::Migration[8.0]
  def change
    create_table :post_flags do |t|
      t.references :user, null: false, foreign_key: true
      t.references :post, null: false, foreign_key: true
      t.timestamps
    end
    add_index :post_flags, [:user_id, :post_id], unique: true
    add_column :posts, :flags_count, :integer, default: 0, null: false
  end
end
