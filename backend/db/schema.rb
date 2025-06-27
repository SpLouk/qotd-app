# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_06_27_185000) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "auth_codes", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "code", null: false
    t.datetime "expires_at", null: false
    t.datetime "used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_auth_codes_on_code", unique: true
    t.index ["user_id"], name: "index_auth_codes_on_user_id"
  end

  create_table "device_tokens", force: :cascade do |t|
    t.string "token", null: false
    t.string "platform", null: false
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_device_tokens_on_token"
    t.index ["user_id", "token"], name: "index_device_tokens_on_user_id_and_token", unique: true
    t.index ["user_id"], name: "index_device_tokens_on_user_id"
  end

  create_table "group_users", force: :cascade do |t|
    t.integer "group_id", null: false
    t.integer "user_id", null: false
    t.integer "role", default: 0, null: false
    t.boolean "approved", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["group_id", "user_id"], name: "index_group_users_on_group_id_and_user_id", unique: true
    t.index ["group_id"], name: "index_group_users_on_group_id"
    t.index ["user_id"], name: "index_group_users_on_user_id"
  end

  create_table "groups", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.integer "created_by_id"
    t.datetime "next_scheduled_activation"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "privacy_level", default: 0, null: false
    t.index ["created_by_id"], name: "index_groups_on_created_by_id"
    t.index ["name"], name: "index_groups_on_name", unique: true
  end

  create_table "invite_codes", force: :cascade do |t|
    t.string "code", null: false
    t.integer "group_id", null: false
    t.integer "created_by_id"
    t.datetime "expires_at"
    t.integer "max_uses"
    t.integer "uses_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_invite_codes_on_code", unique: true
    t.index ["created_by_id"], name: "index_invite_codes_on_created_by_id"
    t.index ["group_id"], name: "index_invite_codes_on_group_id"
  end

  create_table "mentions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "post_id", null: false
    t.json "locations", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id"], name: "index_mentions_on_post_id"
    t.index ["user_id", "post_id"], name: "index_mentions_on_user_id_and_post_id", unique: true
    t.index ["user_id"], name: "index_mentions_on_user_id"
  end

  create_table "post_flags", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "post_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id"], name: "index_post_flags_on_post_id"
    t.index ["user_id", "post_id"], name: "index_post_flags_on_user_id_and_post_id", unique: true
    t.index ["user_id"], name: "index_post_flags_on_user_id"
  end

  create_table "posts", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "prompt_question_id"
    t.integer "parent_post_id"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "group_id"
    t.integer "flags_count", default: 0, null: false
    t.datetime "notified_group_at"
    t.boolean "off_topic", default: false, null: false
    t.index ["group_id"], name: "index_posts_on_group_id"
    t.index ["parent_post_id"], name: "index_posts_on_parent_post_id"
    t.index ["prompt_question_id"], name: "index_posts_on_prompt_question_id"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "prompt_questions", force: :cascade do |t|
    t.text "content"
    t.boolean "active", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "created_by_id"
    t.integer "prompt_votes_count", default: 0
    t.datetime "activated_at"
    t.datetime "deactivated_at"
    t.integer "group_id"
    t.boolean "eligible_for_votes", default: false, null: false
    t.index ["created_by_id"], name: "index_prompt_questions_on_created_by_id"
    t.index ["group_id", "active"], name: "index_prompt_questions_on_group_id_and_active", where: "active = true"
    t.index ["group_id"], name: "index_prompt_questions_on_group_id"
    t.index ["prompt_votes_count"], name: "index_prompt_questions_on_prompt_votes_count"
  end

  create_table "prompt_votes", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "prompt_question_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["prompt_question_id"], name: "index_prompt_votes_on_prompt_question_id"
    t.index ["user_id", "prompt_question_id"], name: "index_prompt_votes_on_user_id_and_prompt_question_id", unique: true
    t.index ["user_id"], name: "index_prompt_votes_on_user_id"
  end

  create_table "reactions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "post_id", null: false
    t.text "reaction", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "deleted", default: false, null: false
    t.index ["post_id"], name: "index_reactions_on_post_id"
    t.index ["user_id", "post_id", "reaction", "deleted"], name: "index_reactions_on_user_post_reaction_deleted"
    t.index ["user_id", "post_id", "reaction"], name: "index_reactions_on_user_id_and_post_id_and_reaction", unique: true
    t.index ["user_id"], name: "index_reactions_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.string "token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "token_refreshed_at"
    t.string "refresh_token", null: false
    t.datetime "token_expires_at", null: false
    t.datetime "refresh_token_expires_at", null: false
    t.index ["refresh_token"], name: "index_sessions_on_refresh_token", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "user_id"
    t.string "email_address"
    t.string "username"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
    t.index ["user_id"], name: "index_users_on_user_id", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true, where: "username IS NOT NULL"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "auth_codes", "users"
  add_foreign_key "device_tokens", "users"
  add_foreign_key "group_users", "groups"
  add_foreign_key "group_users", "users"
  add_foreign_key "groups", "users", column: "created_by_id"
  add_foreign_key "invite_codes", "groups"
  add_foreign_key "invite_codes", "users", column: "created_by_id"
  add_foreign_key "mentions", "posts"
  add_foreign_key "mentions", "users"
  add_foreign_key "post_flags", "posts"
  add_foreign_key "post_flags", "users"
  add_foreign_key "posts", "groups"
  add_foreign_key "posts", "posts", column: "parent_post_id"
  add_foreign_key "posts", "prompt_questions"
  add_foreign_key "posts", "users"
  add_foreign_key "prompt_questions", "groups"
  add_foreign_key "prompt_questions", "users", column: "created_by_id"
  add_foreign_key "prompt_votes", "prompt_questions"
  add_foreign_key "prompt_votes", "users"
  add_foreign_key "reactions", "posts"
  add_foreign_key "reactions", "users"
  add_foreign_key "sessions", "users"
end
