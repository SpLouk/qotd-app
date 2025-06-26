class AddOffTopicToPosts < ActiveRecord::Migration[8.0]
  def change
    add_column :posts, :off_topic, :boolean, null: false, default: false
  end
end
