class DropFollows < ActiveRecord::Migration[8.0]
  def change
    drop_table :follows
  end
end
