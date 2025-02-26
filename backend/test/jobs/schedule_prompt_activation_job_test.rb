require "test_helper"

class SchedulePromptActivationJobTest < ActiveJob::TestCase
  test "schedules an activation job for tomorrow between 9 AM and 5 PM EST" do
    travel_to Time.current do
      # Run the job
      SchedulePromptActivationJob.perform_now

      # Get all enqueued ActivatePromptQuestionJobs
      activation_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == ActivatePromptQuestionJob
      end

      # There should be exactly one activation job scheduled
      assert_equal 1, activation_jobs.size

      # Get the scheduled time
      job = activation_jobs.first
      scheduled_time = Time.at(job[:at])

      # Convert to EST timezone
      est_timezone = ActiveSupport::TimeZone["Eastern Time (US & Canada)"]
      scheduled_time_est = scheduled_time.in_time_zone(est_timezone)

      # Should be tomorrow
      assert_equal Date.tomorrow, scheduled_time_est.to_date

      # Should be between 9 AM and 5 PM EST
      assert scheduled_time_est.hour >= 9
      assert scheduled_time_est.hour <= 17
    end
  end
end
