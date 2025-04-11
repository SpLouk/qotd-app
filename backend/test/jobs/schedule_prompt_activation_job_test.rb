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
      assert_equal Date.today, scheduled_time_est.to_date

      # Should be between 9 AM and 5 PM EST
      assert scheduled_time_est.hour >= 9
      assert scheduled_time_est.hour <= 17
    end
  end

  test "updates all groups with the next scheduled activation time" do
    group1 = groups(:one)
    group2 = groups(:two)

    assert_equal group1.next_scheduled_activation, nil
    assert_equal group2.next_scheduled_activation, nil

    travel_to Time.current do
      # Run the job
      SchedulePromptActivationJob.perform_now

      # Get the activation job to find the scheduled time
      activation_job = ActiveJob::Base.queue_adapter.enqueued_jobs.find { |job| job[:job] == ActivatePromptQuestionJob }
      scheduled_time = Time.at(activation_job[:at])

      # Verify each group was updated with the correct activation time
      [group1, group2].each do |group|
        group.reload
        assert_equal scheduled_time, group.next_scheduled_activation
      end
    end
  end
end
