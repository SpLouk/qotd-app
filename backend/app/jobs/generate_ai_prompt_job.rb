class GenerateAiPromptJob < ApplicationJob
  queue_as :default

  def perform(group)
    # Get a random sample from the top half of prompts by replies
    popular_prompts = group.prompt_questions.top_half_by_replies.sample(3)

    # Build context for ChatGPT
    prompt_examples = popular_prompts.map(&:content).join("\n- ")

    system_message = "You are helping generate engaging question prompts for a social app where friends answer daily questions. Generate ONE creative, thought-provoking question that would spark interesting conversations."

    user_message = if prompt_examples.present?
      "Here are some popular questions from this group:\n- #{prompt_examples}\n\nGenerate a similar style question that would be engaging for this group. Keep it under 256 characters and make it conversational."
    else
      "Generate an engaging, thought-provoking question for friends to answer and discuss. Keep it under 256 characters and make it conversational."
    end

    begin
      response = call_chatgpt_api(system_message, user_message)

      if response && response.length <= 256
        group.prompt_questions.create!(
          content: response,
          created_by: nil, # AI-generated, no user
          eligible_for_votes: true
        )

        Rails.logger.info "Generated AI prompt for group ID=#{group.id}: #{response}"
      else
        Rails.logger.warn "ChatGPT response too long or empty for group ID=#{group.id}"
      end
    rescue => e
      Rails.logger.error "Failed to generate AI prompt for group ID=#{group.id}: #{e.message}"
    end
  end

  private

  def call_chatgpt_api(system_message, user_message)
    uri = URI("https://api.openai.com/v1/chat/completions")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri)
    api_key = Rails.application.credentials.dig(:openai_api_key)
    Rails.logger.error "api_key: #{api_key}"
    request["Authorization"] = "Bearer #{api_key}"
    request["Content-Type"] = "application/json"

    request.body = {
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: system_message },
        { role: "user", content: user_message }
      ],
      max_tokens: 100,
      temperature: 0.8
    }.to_json

    response = http.request(request)

    if response.code == "200"
      data = JSON.parse(response.body)
      content = data.dig("choices", 0, "message", "content")
      content&.strip
    else
      Rails.logger.error "ChatGPT API error: #{response.code} - #{response.body}"
      nil
    end
  end
end
