class ActivatePromptQuestionJob < ApplicationJob
  queue_as :default

  def perform
    # Find the most voted prompt that's available for activation
    prompt = PromptQuestion.most_voted

    # If no available prompt, do nothing
    return unless prompt

    # Activate the prompt
    prompt.activate!

    # Send push notifications to all users
    device_tokens = DeviceToken.all

    notification = Notification.new(
      title: "It's time to hoot!",
      body: "A new question has been posted.",
      category: "new_prompt",
      thread_id: "prompt_#{prompt.id}",
      target_content_id: prompt.id.to_s
    )
    ApnsService.notify(notification, device_tokens)
  end
end
