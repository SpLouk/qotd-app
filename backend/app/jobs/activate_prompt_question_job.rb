class ActivatePromptQuestionJob < ApplicationJob
  queue_as :default

  def perform
    # Find the most voted prompt that's available for activation
    prompt = PromptQuestion.most_voted
    
    # If no available prompt, do nothing
    return unless prompt
    
    # Activate the prompt
    prompt.activate!
    
    # Schedule the next activation
    SchedulePromptActivationJob.perform_later
  end
end
