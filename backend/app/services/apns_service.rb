require "net-http2"
require "jwt"
class ApnsService
  APNS_PRODUCTION_URL = "https://api.push.apple.com".freeze
  ALGORITHM = "ES256".freeze
  TOKEN_EXPIRY = 50.minutes.freeze # Apple recommends < 60 minutes

  class << self
    # Notify every user device. Used for Daily Prompt Notification
    def notify(notification, device_tokens)
      raise StandardError, "APNs credentials not configured. Required credentials: key_id, team_id, key, bundle_id" unless credentials_configured?
      raise StandardError, "Notification must be an instance of Notification" unless notification.is_a?(Notification)
      raise StandardError, "No device tokens provided" if device_tokens.empty?

      # Prepare the notification payload
      payload = notification.to_payload

      # Send notifications in batches
      device_tokens.each_slice(100) do |token_batch|
        client = create_client
        token_batch.each do |token|
          begin
            client.call(:post, notification_path(token.token), body: payload.to_json, headers: request_headers)
          rescue StandardError => e
            handle_error(e, token)
          end
        end
        client.close
      end
    end

    private

    def credentials_configured?
      Rails.application.credentials.dig(:apple, :key_id).present? &&
        Rails.application.credentials.dig(:apple, :team_id).present? &&
        Rails.application.credentials.dig(:apple, :key).present? &&
        Rails.application.credentials.dig(:apple, :bundle_id).present?
    end

    def create_client
      uri = URI.parse(APNS_PRODUCTION_URL)
      NetHttp2::Client.new(uri).tap do |client|
        client.on(:error) { |exception| Rails.logger.error("APNs Error: #{exception}") }
      end
    end

    def notification_path(token)
      "/3/device/#{token}"
    end

    def request_headers
      {
        "apns-topic" => Rails.application.credentials.dig(:apple, :bundle_id),
        "authorization" => "bearer #{cached_jwt_token}",
        "apns-push-type" => "alert",
        "apns-priority" => "10",
        "content-type" => "application/json"
      }
    end

    def cached_jwt_token
      return @cached_jwt_token if @cached_jwt_token && @token_expiry && @token_expiry > Time.current
      generate_jwt_token
    end

    def generate_jwt_token
      key_id = Rails.application.credentials.dig(:apple, :key_id)
      team_id = Rails.application.credentials.dig(:apple, :team_id)
      key = OpenSSL::PKey::EC.new(Rails.application.credentials.dig(:apple, :key))

      now = Time.current.to_i
      @token_expiry = TOKEN_EXPIRY.from_now

      header = {
        kid: key_id,
        alg: ALGORITHM
      }

      claims = {
        iss: team_id,
        iat: now,
        exp: @token_expiry.to_i
      }

      @cached_jwt_token = JWT.encode(claims, key, ALGORITHM, header)
    end

    def handle_error(error, token)
      case error.message
      when /InvalidDeviceToken/, /Unregistered/, /BadDeviceToken/
        # Remove invalid tokens
        DeviceToken.find_by(token: token)&.destroy
        Rails.logger.info("Removed invalid device token: #{token}")
      else
        Rails.logger.error("APNs Error for token #{token}: #{error.message}")
      end
    end
  end
end
