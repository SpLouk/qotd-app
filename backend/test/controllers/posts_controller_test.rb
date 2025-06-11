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
    assert_response :ok

    # Verify empty response
    assert_equal [], JSON.parse(@response.body)
  end

  test "index requires authentication" do
    # Make request without auth headers
    get group_posts_path(@group)

    # Should return unauthorized
    assert_response :unauthorized
  end

  test "mentions are included in response when creating a post with a valid mention" do
    mentioned_user = users(:two)
    post_content = "Hello @#{mentioned_user.username}, check this out!"

    assert_difference [ "Post.count", "Mention.count" ] do
      post group_posts_path(@group),
           params: { post: { content: post_content, prompt_question_id: @active_prompt.id } },
           headers: auth_headers
    end

    assert_response :created
    response_data = JSON.parse(@response.body)

    # Mentions should be included in the response
    assert response_data["mentions"].is_a?(Array), "Mentions should be an array in the response"
    assert_equal 1, response_data["mentions"].size
    mention = response_data["mentions"].first
    assert_equal mentioned_user.id, mention["user_id"]
    assert mention["locations"].is_a?(Array)
    assert mention["locations"].first["start"].is_a?(Integer)
    assert mention["locations"].first["end"].is_a?(Integer)
  end

  test "flag endpoint creates a post flag and increments flags_count" do
    post = posts(:group_one_active_post)
    assert_difference [ "PostFlag.count", "post.reload.flags_count" ], 1 do
      post flag_group_post_path(@group, post), headers: auth_headers
    end
    assert_response :created
  end

  test "flag endpoint does not allow duplicate flags" do
    post = posts(:group_one_active_post)
    PostFlag.create!(user: @user, post: post)
    assert_no_difference [ "PostFlag.count", "post.reload.flags_count" ] do
      post flag_group_post_path(@group, post), headers: auth_headers
    end
    assert_response :unprocessable_entity
    assert_includes JSON.parse(@response.body)["errors"].join, "has already been taken"
  end

  test "flag endpoint returns not found for invalid post" do
    invalid_id = -1
    post flag_group_post_path(@group, invalid_id), headers: auth_headers
    assert_response :not_found
  end
end
