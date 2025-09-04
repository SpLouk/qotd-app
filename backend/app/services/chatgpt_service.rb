
class ChatgptService
  OPENAI_API_URL = "https://api.openai.com/v1/responses".freeze
  GPT_MODEL = "gpt-5-mini".freeze

  class << self
    def call_chatgpt_api(prompt)
      uri = URI(OPENAI_API_URL)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(uri)
      api_key = Rails.application.credentials.dig(:openai_api_key)
      request["Authorization"] = "Bearer #{api_key}"
      request["Content-Type"] = "application/json"

      request.body = {
        model: GPT_MODEL,
        input: prompt
      }.to_json

      response = http.request(request)

      if response.code == "200"
        data = JSON.parse(response.body)
        message = data["output"]&.find { |x| x["type"] == "message" }
        messageText = message&.dig("content", 0, "text")&.strip
        messageText
      else
        Rails.logger.error "ChatGPT API error: #{response.code} - #{response.body}"
        nil
      end
    end
  end
end
