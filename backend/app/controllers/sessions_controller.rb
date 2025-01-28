class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_url, alert: "Try again later." }

  def create
    begin
      user = User.find_or_create_by_token(params[:identityToken])
      session = user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip)
      response.set_header("Authorization", "Bearer #{session.token}")
      render json: { token: session.token }, status: :created
    rescue ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_entity
    rescue StandardError => e
      Rails.logger.error("Session creation failed: #{e.message}")
      render json: { error: "Authentication failed" }, status: :unauthorized
    end
  end

  def destroy
    Current.session.destroy
    head :no_content
  end
end
