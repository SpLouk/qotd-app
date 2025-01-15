class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :user_id
      t.string :email_address
      t.string :username

      t.timestamps
    end
    add_index :users, :email_address, unique: true
    add_index :users, :user_id, unique: true
  end
end
