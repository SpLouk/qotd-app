class SchedulePromptActivationJob < ApplicationJob
  queue_as :default

  def perform
    # Schedule next activation job for tomorrow between 9 AM and 5 PM EST
    today = Date.today

    # Convert to EST timezone (UTC-5)
    est_timezone = ActiveSupport::TimeZone["Eastern Time (US & Canada)"]

    # Set base time at 9 AM EST tomorrow
    base_time = est_timezone.local(today.year, today.month, today.day, 9, 0, 0)

    # Add random hours (0-8 hours from 9 AM to get between 9 AM and 5 PM)
    random_hours = rand(0..8)

    # Set activation time for tomorrow at the random hour
    activation_time = base_time + random_hours.hours

    # Schedule the activation job
    ActivatePromptQuestionJob.set(wait_until: activation_time).perform_later

    Group.find_each do |group|
      group.update(next_scheduled_activation: activation_time)
    end

    Rails.logger.info "Scheduled next prompt activation for #{activation_time}"
  end
end
