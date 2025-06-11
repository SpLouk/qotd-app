require "test_helper"

class PostFlagTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @post = posts(:group_one_active_post)
  end

  test "should create post flag and increment flags_count" do
    assert_difference('PostFlag.count', 1) do
      assert_difference('@post.reload.flags_count', 1) do
        PostFlag.create!(user: @user, post: @post)
      end
    end
  end

  test "should not allow duplicate post flag for same user and post" do
    PostFlag.create!(user: @user, post: @post)
    assert_raises ActiveRecord::RecordInvalid do
      PostFlag.create!(user: @user, post: @post)
    end
  end
end
