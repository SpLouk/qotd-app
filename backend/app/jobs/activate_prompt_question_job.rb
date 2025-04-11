class ActivatePromptQuestionJob < ApplicationJob
  queue_as :default

  def perform
    # Activate prompts for each group
    Group.find_each do |group|
      # Find the most voted prompt that's available for activation in this group
      prompt = group.prompt_questions.available_for_activation.first

      # Skip if no available prompt for this group
      next unless prompt

      # Activate the prompt
      prompt.activate!

      # Send push notifications to users in this group
      device_tokens = DeviceToken.includes(:user)
                               .where(user: group.users)
                               .to_a

      notification = Notification.new(
        title: "It's time to hoot!",
        body: "A new question has been posted in #{group.name}.",
        category: "new_prompt",
        thread_id: "prompt_#{prompt.id}",
        target_content_id: prompt.id.to_s
      )
      ApnsService.notify(notification, device_tokens) if device_tokens.any?
    end
  end
end
