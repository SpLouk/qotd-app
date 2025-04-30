class AuthCodesController < ApplicationController
  allow_unauthenticated_access only: %i[ create verify show ]

  def create
    user = User.find_or_create_by!(email_address: params.require(:email_address).downcase)
    auth_code = user.auth_codes.create!
    AuthCodeMailer.sign_in(user, auth_code).deliver_later
    head :created
  end

  def show
    auth_code = AuthCode.active.find_by!(code: params[:code])
    auth_code.use!
    session = auth_code.user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip)
    render json: {
      user: auth_code.user,
      token_expires_at: session.token_expires_at,
      refresh_token: session.refresh_token,
      token: session.token
    }, status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Invalid or expired authentication code" }, status: :unauthorized
  end

  def verify
    auth_code = AuthCode.active.find_by!(code: params[:code], user: User.find_by!(email_address: params.require(:email_address).downcase))
    auth_code.use!
    session = auth_code.user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip)
    render json: {
      user: auth_code.user,
      token_expires_at: session.token_expires_at,
      refresh_token: session.refresh_token,
      token: session.token
    }, status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Invalid or expired authentication code" }, status: :unauthorized
  end
end
