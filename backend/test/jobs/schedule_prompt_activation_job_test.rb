require "test_helper"

class ScheduleDailyPromptActivationsJobTest < ActiveJob::TestCase
  test "schedules activation jobs only for groups with Tuesday in their prompt_schedule" do
    # Time travel to a Tuesday (weekday 2)
    tuesday = Time.new(2025, 1, 7) # This is a Tuesday
    travel_to tuesday.beginning_of_day do
      # Create test groups with different prompt schedules
      group_with_tuesday = Group.create!(
        name: "Tuesday Group",
        description: "Group that activates on Tuesday",
        privacy_level: :open,
        prompt_schedule: "246", # Tuesday, Thursday, Saturday
        created_by: users(:one)
      )

      another_monday_group = Group.create!(
        name: "Another Monday Group",
        description: "Another group that activates on Monday",
        privacy_level: :closed,
        prompt_schedule: "17", # Monday, Sunday
        created_by: users(:two)
      )

      # Run the job
      ScheduleDailyPromptActivationsJob.perform_now

      # Get all enqueued ActivatePromptQuestionJobs
      activation_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == ActivatePromptQuestionJob
      end

      assert_equal 1, activation_jobs.size
      scheduled_time = Time.at(activation_jobs.first[:at])

      group_with_tuesday.reload
      assert_equal scheduled_time, group_with_tuesday.next_scheduled_activation
    end
  end

  test "schedules activation jobs between 9 AM and 5 PM EST on the current day" do
    # Time travel to a Monday
    monday = Time.new(2025, 1, 6) # This is a Monday
    travel_to monday.beginning_of_day do
      # Use existing fixture group that has Monday in schedule
      group = groups(:one) # Has prompt_schedule "135" which includes Monday (1)

      # Run the job
      ScheduleDailyPromptActivationsJob.perform_now

      # Get the activation job
      activation_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == ActivatePromptQuestionJob
      end

      # Get the scheduled time
      job = activation_jobs.first
      scheduled_time = Time.at(job[:at])

      # Should be today (Monday)
      assert_equal monday.to_date, scheduled_time.to_date

      # Should be between 9 AM and 5 PM EST
      assert scheduled_time.hour >= 9
      assert scheduled_time.hour <= 17
    end
  end

  test "does not schedule jobs when no groups match the current weekday" do
    # Time travel to a Sunday (weekday 0)
    sunday = Time.new(2025, 1, 5) # This is a Sunday
    travel_to sunday.beginning_of_day do
      # All fixture groups have prompt_schedule "135" (Mon, Wed, Fri)
      # So no groups should be scheduled on Sunday

      # Run the job
      ScheduleDailyPromptActivationsJob.perform_now

      # Get all enqueued ActivatePromptQuestionJobs
      activation_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == ActivatePromptQuestionJob
      end

      # Should have no activation jobs
      assert_equal 0, activation_jobs.size
    end
  end
end
