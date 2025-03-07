class DeviceTokensController < ApplicationController
  # Rate limit both create and destroy actions
  rate_limit to: 10, within: 5.minutes, with: -> { render json: { error: "Rate limit exceeded" }, status: :too_many_requests }, track_by: -> { Current.user.id }

  def create
    token = params.require(:device_token).permit(:token)

    # Find or create the device token
    device_token = Current.user.device_tokens.find_or_initialize_by(
      token: token[:token],
      platform: "ios"
    )

    if device_token.save
      render json: { success: true }, status: :ok
    else
      render json: {
        success: false,
        errors: device_token.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def destroy
    token = params.require(:token)
    device_token = Current.user.device_tokens.find_by(token: token)

    if device_token&.destroy
      render json: { success: true }, status: :ok
    else
      render json: {
        success: false,
        errors: [ "Token not found" ]
      }, status: :not_found
    end
  end
end
