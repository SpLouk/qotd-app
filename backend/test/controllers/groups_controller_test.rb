require "test_helper"

class GroupsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @admin_user = users(:two)
    @open_group = groups(:open)
    @closed_group = groups(:closed)
    @private_group = groups(:secret)

    # Make sure we're signed in
    sign_in_as(@user)
  end

  test "index returns open and closed groups plus member groups" do
    # Add user to private group
    @private_group.add_user(@user, :member)

    get groups_path, headers: auth_headers
    assert_response :success
    response_data = JSON.parse(@response.body)

    # Should include open and closed groups
    assert_includes response_data.map { |group| group["id"] }, @open_group.id
    assert_includes response_data.map { |group| group["id"] }, @closed_group.id

    # Should include private group where user is member
    assert_includes response_data.map { |group| group["id"] }, @private_group.id

    # Should exclude private group where user is not a member
    assert_not_includes response_data.map { |group| group["id"] }, groups(:secret_two).id
  end

  test "index filters groups by search query" do
    @searchable_group = groups(:public_searchable)

    get groups_path, params: { query: "searchable" }, headers: auth_headers
    assert_response :success
    response_data = JSON.parse(@response.body)

    assert_includes response_data.map { |group| group["id"] }, @searchable_group.id
    assert_equal 1, response_data.length
  end

  test "create group makes creator an admin" do
    group_params = {
      name: "New Test Group",
      description: "Test Description",
      privacy_level: "open"
    }

    assert_difference("Group.count") do
      post groups_path,
           params: { group: group_params },
           headers: auth_headers
    end

    assert_response :created
    new_group = Group.last
    assert_equal "New Test Group", new_group.name
    assert_equal @user, new_group.created_by

    # Verify creator is admin
    admin_membership = new_group.group_users.find_by(user: @user)
    assert_equal "admin", admin_membership.role
  end

  test "create returns errors for invalid group" do
    post groups_path,
         params: { group: { name: "", privacy_level: "open" } },
         headers: auth_headers

    assert_response :unprocessable_content
    assert_includes JSON.parse(@response.body)["errors"].keys, "name"
  end

  test "join open group auto-approves membership" do
    post join_group_path(@open_group), headers: auth_headers
    assert_response :created

    membership = @open_group.group_users.find_by(user: @user)
    assert membership.approved?
  end

  test "join closed group creates pending membership" do
    post join_group_path(@closed_group), headers: auth_headers
    assert_response :created

    membership = @closed_group.group_users.find_by(user: @user)
    assert_not membership.approved?
  end

  test "cannot join group twice" do
    # First join
    post join_group_path(@open_group), headers: auth_headers
    assert_response :created

    # Try to join again
    post join_group_path(@open_group), headers: auth_headers
    assert_response :unprocessable_content
  end

  test "admin can approve membership request" do
    # Create pending membership
    pending_user = users(:three)
    @closed_group.group_users.create!(
      user: pending_user,
      role: :member,
      approved: false
    )

    # Sign in as admin
    sign_in_as(@admin_user)
    @closed_group.add_user(@admin_user, :admin)

    post approve_request_group_path(@closed_group, user_id: pending_user.id),
         headers: auth_headers
    assert_response :success

    membership = @closed_group.group_users.find_by(user: pending_user)
    assert membership.approved?
  end

  test "non-admin cannot approve membership request" do
    pending_user = users(:three)
    @closed_group.group_users.create!(
      user: pending_user,
      role: :member,
      approved: false
    )

    post approve_request_group_path(@closed_group, user_id: pending_user.id),
         headers: auth_headers
    assert_response :forbidden
  end

  test "non-member cannot access show endpoint" do
    # Use a group where the user is NOT a member
    non_member = users(:three)
    sign_in_as(non_member)

    get group_path(@private_group), headers: auth_headers
    assert_response :forbidden
  end

  test "requires authentication" do
    get groups_path
    assert_response :unauthorized
  end
end
