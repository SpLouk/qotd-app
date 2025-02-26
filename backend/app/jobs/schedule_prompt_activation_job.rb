class SchedulePromptActivationJob < ApplicationJob
  queue_as :default

  def perform
    # Schedule next activation job for tomorrow between 9 AM and 5 PM EST
    tomorrow = Date.tomorrow
    
    # Convert to EST timezone (UTC-5)
    est_timezone = ActiveSupport::TimeZone["Eastern Time (US & Canada)"]
    
    # Set base time at 9 AM EST tomorrow
    base_time = est_timezone.local(tomorrow.year, tomorrow.month, tomorrow.day, 9, 0, 0)
    
    # Add random hours (0-8 hours from 9 AM to get between 9 AM and 5 PM)
    random_hours = rand(0..8)
    
    # Set activation time for tomorrow at the random hour
    activation_time = base_time + random_hours.hours
    
    # Schedule the activation job
    ActivatePromptQuestionJob.set(wait_until: activation_time).perform_later
    
    Rails.logger.info "Scheduled next prompt activation for #{activation_time}"
  end
end
