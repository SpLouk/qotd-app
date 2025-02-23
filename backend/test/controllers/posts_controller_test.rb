require "test_helper"

class PostsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @followed_user = users(:two)
    @not_followed_user = users(:three)
    @active_prompt = prompt_questions(:active)

    # Make sure we're signed in
    sign_in_as(@user)
  end

  test "index returns posts from followed users and current user for active prompt" do
    # Make the request
    get posts_path, headers: auth_headers

    # Assert successful response
    assert_response :success

    # Parse the response
    response_data = JSON.parse(@response.body)

    # Should include the followed user's post for active prompt
    assert_includes response_data.map { |post| post["id"] }, posts(:followed_user_active_post).id

    # Should include current user's own post for active prompt
    assert_includes response_data.map { |post| post["id"] }, posts(:current_user_active_post).id

    # Should not include posts from non-followed users
    assert_not_includes response_data.map { |post| post["id"] }, posts(:not_followed_user_post).id

    # Should not include posts from followed users but different prompts
    assert_not_includes response_data.map { |post| post["id"] }, posts(:followed_user_inactive_post).id

    # Verify post contains user information
    post_with_user = response_data.find { |post| post["id"] == posts(:followed_user_active_post).id }
    assert_equal @followed_user.username, post_with_user["username"]
  end

  test "index returns empty array when no active prompt" do
    # Ensure no active prompt exists
    @active_prompt.update!(active: false)

    # Make the request
    get posts_path, headers: auth_headers

    # Assert not found status
    assert_response :not_found

    # Verify empty response
    assert_empty JSON.parse(@response.body)
  end

  test "index requires authentication" do
    # Make request without auth headers
    get posts_path

    # Should return unauthorized
    assert_response :unauthorized
  end
end
