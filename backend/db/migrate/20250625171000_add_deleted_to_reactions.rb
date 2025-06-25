class AddDeletedToReactions < ActiveRecord::Migration[8.0]
  def change
    add_column :reactions, :deleted, :boolean, null: false, default: false
    add_index :reactions, [ :user_id, :post_id, :reaction, :deleted ], name: 'index_reactions_on_user_post_reaction_deleted'
  end
end
