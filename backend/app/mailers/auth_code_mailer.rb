class AuthCodeMailer < ApplicationMailer
  def sign_in(user, auth_code)
    @user = user
    @auth_code = auth_code
    mail(to: @user.email_address, subject: "Your authentication code")
  end
end
