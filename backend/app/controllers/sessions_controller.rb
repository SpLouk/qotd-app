class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ create refresh ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_url, alert: "Try again later." }

  def create
    if user = User.find_or_create_by_token(params[:identityToken])
      session = user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip)
      render json: {
        user: user,
        token_expires_at: session.token_expires_at,
        refresh_token: session.refresh_token,
        token: session.token
      }, status: :created
    else
      render json: { error: "Invalid credentials" }, status: :unauthorized
    end
  end

  def refresh
    session = Session.find_by(refresh_token: params.require(:refresh_token))

    if session&.refresh!(params[:user_agent])
      render json: {
        token: session.token,
        token_expires_at: session.token_expires_at
      }
    else
      render json: { error: "Invalid refresh token" }, status: :unauthorized
    end
  end

  def destroy
    Current.session.destroy
    head :no_content
  end
end
