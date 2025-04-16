class AddGracePeriodToSessions < ActiveRecord::Migration[8.0]
  def change
    add_column :sessions, :previous_token, :string
    add_column :sessions, :previous_token_expires_at, :datetime
  end
end
