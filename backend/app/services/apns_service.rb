require "net-http2"
require "jwt"

class ApnsService
  APNS_DEVELOPMENT_URL = "https://api.sandbox.push.apple.com".freeze
  APNS_PRODUCTION_URL = "https://api.push.apple.com".freeze
  ALGORITHM = "ES256".freeze
  
  class << self
    def notify_new_prompt(prompt)
      return unless credentials_configured?

      # Get all unique device tokens
      device_tokens = DeviceToken.where(platform: "ios").pluck(:token)
      return if device_tokens.empty?

      # Prepare the notification payload
      payload = {
        aps: {
          alert: {
            title: "New Question of the Day",
            body: prompt.content
          },
          sound: "default"
        },
        prompt_id: prompt.id
      }

      # Send notifications in batches
      device_tokens.each_slice(100) do |token_batch|
        client = create_client
        token_batch.each do |token|
          begin
            client.post(notification_path(token), payload.to_json, request_headers)
          rescue Net::HTTP2::Error => e
            handle_error(e, token)
          end
        end
        client.close
      end
    end

    private

    def credentials_configured?
      Rails.application.credentials.dig(:apns, :key_id).present? &&
        Rails.application.credentials.dig(:apns, :team_id).present? &&
        Rails.application.credentials.dig(:apns, :key).present? &&
        Rails.application.credentials.dig(:apns, :bundle_id).present?
    end

    def create_client
      uri = URI.parse(base_url)
      Net::HTTP2::Client.new(uri).tap do |client|
        client.on(:error) { |exception| Rails.logger.error("APNs Error: #{exception}") }
      end
    end

    def notification_path(token)
      "/3/device/#{token}"
    end

    def base_url
      Rails.env.production? ? APNS_PRODUCTION_URL : APNS_DEVELOPMENT_URL
    end

    def request_headers
      {
        "apns-topic" => Rails.application.credentials.dig(:apns, :bundle_id),
        "authorization" => "bearer #{jwt_token}",
        "apns-push-type" => "alert",
        "apns-priority" => "10",
        "content-type" => "application/json"
      }
    end

    def jwt_token
      key_id = Rails.application.credentials.dig(:apns, :key_id)
      team_id = Rails.application.credentials.dig(:apns, :team_id)
      key = OpenSSL::PKey::EC.new(Rails.application.credentials.dig(:apns, :key))

      header = {
        kid: key_id,
        alg: ALGORITHM
      }

      claims = {
        iss: team_id,
        iat: Time.now.to_i
      }

      JWT.encode(claims, key, ALGORITHM, header)
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
