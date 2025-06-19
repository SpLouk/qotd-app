require "test_helper"

class ReactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @post = posts(:group_one_active_post)
    sign_in_as(@user)
  end

  test "should create reaction" do
    assert_difference "Reaction.count", 1 do
      post reactions_path, params: { reaction: { post_id: @post.id, reaction: "👍" } }, headers: auth_headers
    end
    assert_response :created
  end

  test "should not allow duplicate reaction" do
    Reaction.create!(user: @user, post: @post, reaction: "👍")
    assert_no_difference "Reaction.count" do
      post reactions_path, params: { reaction: { post_id: @post.id, reaction: "👍" } }, headers: auth_headers
    end
    assert_response :unprocessable_entity
    assert_includes JSON.parse(@response.body)["error"], "This reaction already exists"
  end

  test "should not create reaction for invalid post" do
    assert_no_difference "Reaction.count" do
      post reactions_path, params: { reaction: { post_id: -1, reaction: "👍" } }, headers: auth_headers
    end
    assert_response :unprocessable_entity
  end

  test "should destroy reaction" do
    reaction = Reaction.create!(user: @user, post: @post, reaction: "👍")
    assert_difference "Reaction.count", -1 do
      delete reaction_path(reaction), headers: auth_headers
    end
    assert_response :no_content
  end

  test "should return not found when destroying nonexistent reaction" do
    assert_no_difference "Reaction.count" do
      delete reaction_path(-1), headers: auth_headers
    end
    assert_response :not_found
  end

  test "reaction appears in post as_json" do
    Reaction.create!(user: @user, post: @post, reaction: "👍")
    get group_posts_path(@post.group), headers: auth_headers
    assert_response :success
    posts_json = JSON.parse(@response.body)
    post_json = posts_json.find { |p| p["id"] == @post.id }
    assert post_json["reactions"].is_a?(Array)
    assert_includes post_json["reactions"].map { |r| r["reaction"] }, "👍"
    assert_includes post_json["reactions"].map { |r| r["user_id"] }, @user.id
  end

  test "requires authentication" do
    sign_out(@user)
    post reactions_path, params: { reaction: { post_id: @post.id, reaction: "👍" } }
    assert_response :unauthorized
  end
end
