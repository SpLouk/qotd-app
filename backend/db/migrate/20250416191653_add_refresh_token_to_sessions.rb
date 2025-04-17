class AddRefreshTokenToSessions < ActiveRecord::Migration[8.0]
  def change
    add_column :sessions, :refresh_token, :string, null: false
    add_column :sessions, :token_expires_at, :datetime, null: false
    add_column :sessions, :refresh_token_expires_at, :datetime, null: false

    add_index :sessions, :refresh_token, unique: true
  end
end
