class CreateAuthCodes < ActiveRecord::Migration[8.0]
  def change
    create_table :auth_codes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :code, null: false
      t.datetime :expires_at, null: false
      t.datetime :used_at
      t.timestamps
    end
    add_index :auth_codes, :code, unique: true
  end
end
