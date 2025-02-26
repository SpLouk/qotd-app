# Initialize the prompt scheduling system
Rails.application.config.after_initialize do
  # Only run this in a web server process
  if defined?(Rails::Server) || Rails.const_defined?('Console')
    # Check if there's already a scheduled activation
    scheduled_jobs = Solid::Queue::ScheduledExecution.where(
      class_name: 'ActivatePromptQuestionJob'
    )
    
    # If no scheduled activation exists, schedule one
    if scheduled_jobs.none?
      Rails.logger.info "Initializing prompt question activation scheduler"
      SchedulePromptActivationJob.perform_later
    else
      Rails.logger.info "Prompt activation already scheduled"
    end
  end
end