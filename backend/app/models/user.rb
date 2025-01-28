require "net/http"
require "json"
require "base64"
require "jwt"

class User < ApplicationRecord
  has_many :sessions, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  def needs_registration
    # username.nil?
  end

  def self.find_or_create_by_token(token)
    raise ArgumentError, "Token is required" if token.blank?

    begin
      result = User.verify_apple_jwt(token)
      uid = result["sub"]

      User.transaction do
        user = User.find_or_create_by(user_id: uid)
        # Limit active sessions per user
        user.sessions.active.order(created_at: :desc).offset(5).destroy_all
        user
      end
    rescue JWT::ExpiredSignature
      raise "Token has expired"
    rescue JWT::InvalidIssuerError
      raise "Invalid token issuer"
    rescue JWT::InvalidAudError
      raise "Invalid token audience"
    rescue JWT::DecodeError
      raise "Invalid token"
    end
  end

  private

  def self.verify_apple_jwt(token)
    # Cache Apple's public keys to avoid hitting their API too frequently
    apple_keys = Rails.cache.fetch("apple_public_keys", expires_in: 24.hours) do
      uri = URI("https://appleid.apple.com/auth/keys")
      response = Net::HTTP.get(uri)
      JSON.parse(response)["keys"]
    end

    # The token header includes the key id (kid) used to sign it
    token_headers = JWT.decode(token, nil, false)[1]
    kid = token_headers["kid"]

    # Find the matching public key
    public_key_data = apple_keys.find { |k| k["kid"] == kid }
    raise JWT::DecodeError, "No matching key found" unless public_key_data

    # Create a public key object from the key data
    public_key = JWT::JWK.import(public_key_data).public_key

    # Verify and decode the token
    JWT.decode(
      token,
      public_key,
      true,
      {
        algorithm: "RS256",
        verify_iss: true,
        iss: "https://appleid.apple.com",
        verify_aud: true,
        aud: Rails.application.credentials.apple.client_id,
        verify_exp: true
      }
    ).first
  end
end
