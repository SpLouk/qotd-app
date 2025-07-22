class RenameUserIdToAppleUidOnUsers < ActiveRecord::Migration[8.0]
  def change
    rename_column :users, :user_id, :apple_uid
    add_index :users, :apple_uid, unique: true
  end
end
