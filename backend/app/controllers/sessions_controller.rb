class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_url, alert: "Try again later." }

  def new
  end

  def create
    if user = User.authenticate_by(params.permit(:email_address, :password))
      session = user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip)
      render json: { token: session.token }, status: :created
    else
      render json: { error: "Invalid credentials" }, status: :unauthorized
    end
  end

  def destroy
    Current.session.destroy
    head :no_content
  end
end
