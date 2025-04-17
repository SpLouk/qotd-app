require "test_helper"

class SessionTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
  end

  test "can create a session" do
    session = @user.sessions.create!(
      user_agent: "Test Browser",
      ip_address: "127.0.0.1"
    )

    assert session.persisted?
    assert_not_nil session.token
    assert_not_nil session.refresh_token
    assert_not_nil session.token_expires_at
    assert_not_nil session.refresh_token_expires_at
    assert_equal @user, session.user
  end

  test "refresh updates token but not refresh token" do
    session = @user.sessions.create!(
      user_agent: "Test Browser",
      ip_address: "127.0.0.1"
    )

    original_token = session.token
    original_refresh_token = session.refresh_token
    original_token_expires = session.token_expires_at

    assert session.refresh!("Test Browser")

    assert_not_equal original_token, session.token
    assert_equal original_refresh_token, session.refresh_token
    assert_not_equal original_token_expires, session.token_expires_at
  end

  test "refresh fails with wrong user agent" do
    session = @user.sessions.create!(
      user_agent: "Test Browser",
      ip_address: "127.0.0.1"
    )

    assert_not session.refresh!("Different Browser")
  end

  test "refresh fails when refresh token is expired" do
    session = @user.sessions.create!(
      user_agent: "Test Browser",
      ip_address: "127.0.0.1"
    )

    session.update!(refresh_token_expires_at: 1.day.ago)
    assert_not session.refresh!("Test Browser")
  end
end
