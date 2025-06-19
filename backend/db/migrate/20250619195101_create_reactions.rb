class CreateReactions < ActiveRecord::Migration[8.0]
  def change
    create_table :reactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :post, null: false, foreign_key: true
      t.text :reaction, null: false

      t.timestamps
    end
    add_index :reactions, [:user_id, :post_id, :reaction], unique: true
  end
end
