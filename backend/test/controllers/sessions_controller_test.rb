require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user_agent = "iPhone/15.0"
    @session = @user.sessions.create!(user_agent: @user_agent, ip_address: "127.0.0.1")
  end

  test "refresh returns new token and expiry for valid refresh token" do
    post refresh_session_path, params: { refresh_token: @session.refresh_token, user_agent: @user_agent }, as: :json
    assert_response :success
    json = JSON.parse(@response.body)
    assert json["token"].present?
    assert json["token_expires_at"].present?
  end

  test "refresh returns unauthorized for invalid refresh token" do
    post refresh_session_path, params: { refresh_token: "invalidtoken", user_agent: @user_agent }, as: :json
    assert_response :unauthorized
    json = JSON.parse(@response.body)
    assert_equal "Invalid refresh token", json["error"]
  end
end
