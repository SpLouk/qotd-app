class CreateGroups < ActiveRecord::Migration[7.0]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.text :description
      t.belongs_to :created_by, null: false, foreign_key: { to_table: :users }
      t.datetime :next_scheduled_activation

      t.timestamps
    end

    add_index :groups, :name, unique: true
  end
end
