require "test_helper"

class GroupTest < ActiveSupport::TestCase
  test "activate_new_prompt! makes a prompt active and deactivates other prompts" do
    # Setup
    group = groups(:one)
    active_prompt = prompt_questions(:active_group_one)
    inactive_prompt = prompt_questions(:inactive)

    # Execute
    group.activate_new_prompt!

    # Assert
    assert inactive_prompt.reload.active?
    assert inactive_prompt.activated_at.present?
    assert_not active_prompt.reload.active?
    assert active_prompt.deactivated_at.present?
  end

  test "validates only one active prompt per group" do
    group = groups(:one)

    # Try to activate another prompt while one is already active
    group.prompt_questions.build(
      content: "Test prompt",
      active: true
    )

    assert_not group.valid?
    assert_includes group.errors.full_messages, "Group can only have one active prompt at a time"
  end

  test "active_prompt returns the currently active prompt" do
    group = groups(:one)
    active_prompt = prompt_questions(:active_group_one)

    assert_equal active_prompt, group.active_prompt
  end

  test "activate_new_prompt! returns nil when no available prompts" do
    group = groups(:one)
    # Deactivate all prompts first
    group.prompt_questions.update_all(active: false)

    # Make sure there are no available prompts
    group.prompt_questions.available_for_voting.destroy_all

    result = group.activate_new_prompt!
    assert_equal nil, result
  end

  test "group requires a name" do
    group = Group.new(created_by: users(:one))
    assert_not group.valid?
    assert_includes group.errors.full_messages, "Name can't be blank"
  end

  test "group name must be unique" do
    existing_group = groups(:one)
    new_group = Group.new(
      name: existing_group.name,
      created_by: users(:one)
    )

    assert_not new_group.valid?
    assert_includes new_group.errors.full_messages, "Name has already been taken"
  end

  test "as_json includes correct attributes and approved members" do
    group = groups(:one)
    json = group.as_json

    # Test basic attributes
    assert_equal group.id, json[:id]
    assert_equal group.name, json[:name]
    assert_equal group.description, json[:description]
    assert_equal group.privacy_level, json[:privacy_level]
    assert_equal group.created_at, json[:created_at]
    assert_equal group.created_by_id, json[:created_by_id]
    assert_equal group.next_scheduled_activation, json[:next_scheduled_activation]

    # Test members serialization
    members_json = json[:members]
    assert_kind_of Array, members_json

    group.approved_users.each_with_index do |user, index|
      member = members_json[index]
      assert_equal user.id, member[:id]
      assert_equal user.username, member[:username]
      assert_equal user.profile_photo_url, member[:profile_photo_url]
      assert_nil member[:email], "should not include sensitive user data"
    end
  end
end
