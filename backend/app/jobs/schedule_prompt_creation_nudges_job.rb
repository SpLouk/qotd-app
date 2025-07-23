class SchedulePromptCreationNudgesJob < ApplicationJob
  queue_as :default

  def perform
    # Find all groups that will activate tomorrow
    groups_activating_tomorrow = Group.scheduled_for_day(Date.tomorrow.wday)

    est_timezone = ActiveSupport::TimeZone["Eastern Time (US & Canada)"]
    base_time = est_timezone.local(Day.today.year, Day.today.month, Day.today.day, 9, 0, 0)

    groups_activating_tomorrow.each do |group|
      random_hours = rand(0..8)
      nudge_time = base_time + random_hours.hours

      SendPromptCreationNudgeJob.set(wait_until: nudge_time).perform_later(group)
      Rails.logger.info "Scheduled nudge for group ID=#{group.id} at #{nudge_time}"
    end
  end
end
