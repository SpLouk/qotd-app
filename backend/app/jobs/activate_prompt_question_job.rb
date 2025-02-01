class ActivatePromptQuestionJob < ApplicationJob
  queue_as :default

  def perform(prompt)
    return unless prompt
    return if prompt.trigger_at > Time.current

    ActiveRecord::Base.transaction do
      # Deactivate currently active prompt
      PromptQuestion.active.update_all(active: false)

      # Activate this prompt
      prompt.update!(active: true)
    end
  end
end
