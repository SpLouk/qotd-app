require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  test "should delete current user and return no content" do
    sign_in_as(@user)
    assert_difference("User.count", -1) do
      delete user_path, headers: auth_headers
    end
    assert_response :no_content
  end

  test "should not delete user if not authenticated" do
    delete user_path
    assert_response :unauthorized
  end
end
