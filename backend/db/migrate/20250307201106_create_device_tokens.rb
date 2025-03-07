class CreateDeviceTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :device_tokens do |t|
      t.string :token, null: false
      t.string :platform, null: false
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :device_tokens, [:user_id, :token], unique: true
    add_index :device_tokens, :token
  end
end
