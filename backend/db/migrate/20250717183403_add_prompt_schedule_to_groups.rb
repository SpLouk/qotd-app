class AddPromptScheduleToGroups < ActiveRecord::Migration[8.0]
  def change
    add_column :groups, :prompt_schedule, :string, null: false, default: '135'
  end
end
