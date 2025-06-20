require "test_helper"

class UserTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(
      username: "alice",
      email_address: "alice@example.com"
    )
  end

  test "as_json returns basic fields without Current.user" do
    Current.session = nil
    json = @user.as_json
    assert_equal @user.id, json["id"]
    assert_equal @user.username, json["username"]
    assert_equal @user.email_address, json["email_address"]
    assert_includes json.keys, "needs_registration"
    assert_includes json.keys, "profile_photo_url"
    assert_not_includes json.keys, "voted_today"
    assert_not_includes json.keys, "groups"
  end

  test "email_address must have valid format" do
    valid_emails = [
      "user@example.com",
      "john.doe@domain.co",
      "foo123@bar.net"
    ]
    invalid_emails = [
      "plainaddress",
      "missingatsign.com",
      "missingdomain@",
      "@missinguser.com",
      "user@.com",
      "user@com",
      "user name@domain.com",
      "user@domain .com",
      "user@domain,com"
    ]

    valid_emails.each do |email|
      user = User.new(username: "validuser", email_address: email)
      user.validate
      assert_empty user.errors[:email_address], "Should accept valid email: #{email}"
    end

    invalid_emails.each do |email|
      user = User.new(username: "invaliduser", email_address: email)
      user.validate
      assert_includes user.errors[:email_address], "must be a valid email address", "Should reject invalid email: #{email}"
    end
  end

  test "as_json returns extra fields when Current.user is self" do
    sign_in_as(@user)
    Current.session = Session.create!(user: @user)
    @user.stubs(:has_voted_today?).returns(true)
    @user.stubs(:responded_to_current_prompt_within_30_minutes?).returns(false)
    @user.stubs(:has_created_prompt_today?).returns(true)
    @user.stubs(:group_users).returns([])
    json = @user.as_json
    assert_equal true, json["voted_today"], "Expected voted_today to be true, got #{json["voted_today"].inspect}"
    assert_equal false, json["eligible_to_vote_today"], "Expected eligible_to_vote_today to be false, got #{json["eligible_to_vote_today"].inspect}"
    assert_equal true, json["created_prompt_today"], "Expected created_prompt_today to be true, got #{json["created_prompt_today"].inspect}"
    assert_equal [], json["groups"]
  end

  test "as_json serializes groups with role" do
    sign_in_as(@user)
    Current.session = Session.create!(user: @user)
    group = Group.create!(name: "Test Group", description: "desc", created_by: @user)
    GroupUser.create!(user: @user, group: group, role: "admin", approved: true)
    json = @user.as_json
    groups = json["groups"] || []
    assert_equal 1, groups.length
    group_json = groups.first
    assert_equal group.id, group_json["id"]
    assert_equal group.name, group_json["name"]
    assert_equal group.description, group_json["description"]
    assert_equal "admin", group_json["current_user_role"]
  end
end
