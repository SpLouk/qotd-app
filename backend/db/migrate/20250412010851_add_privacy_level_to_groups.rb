class AddPrivacyLevelToGroups < ActiveRecord::Migration[8.0]
  def change
    add_column :groups, :privacy_level, :integer, null: false, default: 0
  end
end
