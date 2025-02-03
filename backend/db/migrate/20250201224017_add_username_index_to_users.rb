class AddUsernameIndexToUsers < ActiveRecord::Migration[8.0]
  def change
    add_index :users, :username, unique: true, where: "username IS NOT NULL"
  end
end
