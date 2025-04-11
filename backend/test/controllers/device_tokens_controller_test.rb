require "test_helper"

class DeviceTokensControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:one)
    @token = "test_device_token"
    sign_in_as(@user)
  end

  test "create registers a new device token" do
    assert_difference "DeviceToken.count" do
      post device_tokens_path,
        params: { device_token: { token: @token, platform: "ios" } },
        headers: auth_headers
    end

    assert_response :ok
    assert_equal @token, @user.device_tokens.last.token
    assert_equal "ios", @user.device_tokens.last.platform
    assert_equal({ "success" => true }, JSON.parse(response.body))
  end

  test "create updates existing device token" do
    # Create initial token
    device_token = DeviceToken.create!(user: @user, token: @token, platform: "ios")

    assert_no_difference "DeviceToken.count" do
      post device_tokens_path,
        params: { device_token: { token: @token, platform: "ios" } },
        headers: auth_headers
    end

    assert_response :ok
    assert_equal @token, device_token.reload.token
    assert_equal({ "success" => true }, JSON.parse(response.body))
  end

  test "create without authentication returns unauthorized" do
    post device_tokens_path,
      params: { device_token: { token: @token } }

    assert_response :unauthorized
    assert_equal({ "error" => "Unauthorized" }, JSON.parse(response.body))
  end

  test "destroy removes device token" do
    DeviceToken.create!(user: @user, token: @token, platform: "ios")

    assert_difference "DeviceToken.count", -1 do
      delete device_tokens_path,
        params: { token: @token },
        headers: auth_headers
    end

    assert_response :ok
    assert_equal({ "success" => true }, JSON.parse(response.body))
  end

  test "destroy without authentication returns unauthorized" do
    delete device_tokens_path,
      params: { token: @token }

    assert_response :unauthorized
    assert_equal({ "error" => "Unauthorized" }, JSON.parse(response.body))
  end

  test "destroy returns not found for non-existent token" do
    delete device_tokens_path,
      params: { token: "non_existent_token" },
      headers: auth_headers

    assert_response :not_found
    assert_equal({
      "success" => false,
      "errors" => [ "Token not found" ]
    }, JSON.parse(response.body))
  end
end
