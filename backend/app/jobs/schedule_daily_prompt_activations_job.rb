class ScheduleDailyPromptActivationsJob < ApplicationJob
  queue_as :default

  def perform
    # Schedule next activation job for tomorrow between 9 AM and 5 PM EST
    today = Date.today
    est_timezone = ActiveSupport::TimeZone["Eastern Time (US & Canada)"]
    base_time = est_timezone.local(today.year, today.month, today.day, 9, 0, 0)

    Group.scheduled_for_day(today.wday).each do |group|
      random_hours = rand(0..8)
      activation_time = base_time + random_hours.hours
      group.update(next_scheduled_activation: activation_time)
      ActivatePromptQuestionJob.set(wait_until: activation_time).perform_later(group)
      Rails.logger.info "Scheduled group ID=#{group.id} next prompt activation for #{activation_time}"
    end
  end
end
