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
    ApnsService.notify_new_prompt(prompt)
  end
end
