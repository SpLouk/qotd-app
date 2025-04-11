require "test_helper"

class PostsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @followed_user = users(:two)
    @not_followed_user = users(:three)
    @active_prompt = prompt_questions(:active_group_one)
    @group = groups(:one)

    # Make sure we're signed in
    sign_in_as(@user)
  end

  test "index returns posts from other users and current user in group for active prompt" do

    get group_posts_path(@group), headers: auth_headers
    assert_response :success
    response_data = JSON.parse(@response.body)

    # Should include posts in group
    assert_includes response_data.map { |post| post["id"] }, posts(:group_one_active_post).id

    # Should include current user's own post for active prompt
    assert_includes response_data.map { |post| post["id"] }, posts(:current_user_active_post).id

    # Should not include posts from outside of group
    assert_not_includes response_data.map { |post| post["id"] }, posts(:group_two_user_post).id

    # Should not include posts from group but different prompts
    assert_not_includes response_data.map { |post| post["id"] }, posts(:group_one_inactive_post).id

    # Verify post contains user information
    post_with_user = response_data.find { |post| post["id"] == posts(:group_one_active_post).id }
    assert_equal @followed_user.username, post_with_user["username"]
  end

  test "index returns empty array when no active prompt" do
    # Ensure no active prompt exists
    @active_prompt.update!(active: false)

    # Make the request
    get group_posts_path(@group), headers: auth_headers

    # Assert not found status
    assert_response :not_found

    # Verify empty response
    assert_empty JSON.parse(@response.body)
  end

  test "index requires authentication" do
    # Make request without auth headers
    get group_posts_path(@group)

    # Should return unauthorized
    assert_response :unauthorized
  end
end
