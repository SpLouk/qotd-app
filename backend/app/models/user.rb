require "net/http"
require "json"
require "base64"
require "jwt"

class User < ApplicationRecord
  has_one_attached :profile_photo

  has_many :sessions, dependent: :destroy
  has_many :follows_as_follower, class_name: "follow", foreign_key: :follower_id
  has_many :follows_as_followed, class_name: "follow", foreign_key: :followed_id

  # get all users this user is actively following
  has_many :following, -> { active }, through: :follows_as_follower, source: :followed

  # get all users actively following this user
  has_many :followers, -> { active }, through: :follows_as_followed, source: :follower

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  normalizes :username, with: ->(u) { u&.strip&.downcase }

  validates :username, uniqueness: { case_sensitive: false }, allow_nil: true
  validates :profile_photo, content_type: [ :png, :jpg, :jpeg, :heic ], size: { less_than: 5.megabytes }

  def needs_registration
    username.nil? || profile_photo.nil?
  end

  def as_json
    attrs = slice(:username, :needs_registration)
    attrs[:profile_photo_url] = profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(profile_photo) : nil
    attrs
  end

  def self.find_or_create_by_token(token)
    raise ArgumentError, "Token is required" if token.blank?

    begin
      result = User.verify_apple_jwt(token)
      uid = result["sub"]

      User.transaction do
        user = User.find_or_create_by(user_id: uid)
        # Limit sessions per user
        user.sessions.order(created_at: :desc).offset(5).destroy_all
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

  def self.search_by_username(query)
    User.where("username LIKE ?", "%#{query}%")
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
        aud: Rails.application.credentials.dig(:apple, :client_id),
        verify_exp: true
      }
    ).first
  end
end
