class MakeGroupCreatedByNullable < ActiveRecord::Migration[8.0]
  def change
    change_column_null :groups, :created_by_id, true
  end
end
