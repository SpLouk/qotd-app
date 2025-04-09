class CreateGroupUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :group_users do |t|
      t.belongs_to :group, null: false, foreign_key: true
      t.belongs_to :user, null: false, foreign_key: true
      t.integer :role, default: 0, null: false
      t.boolean :approved, default: false

      t.timestamps
    end

    add_index :group_users, [ :group_id, :user_id ], unique: true
  end
end
