class CreateMentions < ActiveRecord::Migration[8.0]
  def change
    create_table :mentions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :post, null: false, foreign_key: true
      t.json :locations, null: false, default: []

      t.timestamps
    end
    add_index :mentions, [ :user_id, :post_id ], unique: true
  end
end
