class CreateInviteCodes < ActiveRecord::Migration[7.0]
  def change
    create_table :invite_codes do |t|
      t.string :code, null: false
      t.references :group, null: false, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.datetime :expires_at
      t.integer :max_uses
      t.integer :uses_count, default: 0, null: false

      t.timestamps
    end
    add_index :invite_codes, :code, unique: true
  end
end
