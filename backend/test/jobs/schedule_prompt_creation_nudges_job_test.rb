require "test_helper"

class SchedulePromptCreationNudgesJobTest < ActiveJob::TestCase
  setup do
    # Clear the job queue before each test
    ActiveJob::Base.queue_adapter.enqueued_jobs.clear
  end

  test "schedules nudge jobs for groups activating tomorrow" do
    # Time travel to Monday so tomorrow is Tuesday (weekday 2)
    monday = Time.new(2025, 1, 6)
    travel_to monday.beginning_of_day do
      # Create a group that activates on Tuesday
      tuesday_group = Group.create!(
        name: "Tuesday Group",
        description: "Group that activates on Tuesday",
        privacy_level: :open,
        prompt_schedule: "2", # Tuesday only
        created_by: users(:one)
      )

      # Run the job
      SchedulePromptCreationNudgesJob.perform_now

      # Check that SendPromptCreationNudgeJob was scheduled
      nudge_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == SendPromptCreationNudgeJob
      end

      assert_equal 1, nudge_jobs.size

      # Verify the job is scheduled for the group
      # Arguments are serialized as GlobalID, check the gid contains the group ID
      nudge_group_gid = nudge_jobs.first[:args].first["_aj_globalid"]
      assert_includes nudge_group_gid, tuesday_group.id.to_s

      # Verify scheduling time is today between 9 AM and 5 PM EST
      nudge_time = Time.at(nudge_jobs.first[:at])

      assert_equal monday.to_date, nudge_time.to_date
      assert nudge_time.hour >= 9
      assert nudge_time.hour <= 17
    end
  end

  test "schedules nudge jobs for multiple groups activating tomorrow" do
    # Time travel to Thursday so tomorrow is Friday (weekday 5)
    thursday = Time.new(2025, 1, 9)
    travel_to thursday.beginning_of_day do
      # Create multiple groups that activate on Friday
      friday_group_1 = Group.create!(
        name: "Friday Group 1",
        description: "First Friday group",
        privacy_level: :open,
        prompt_schedule: "5", # Friday only
        created_by: users(:one)
      )

      friday_group_2 = Group.create!(
        name: "Friday Group 2",
        description: "Second Friday group",
        privacy_level: :closed,
        prompt_schedule: "25", # Tuesday and Friday
        created_by: users(:two)
      )

      # Run the job
      SchedulePromptCreationNudgesJob.perform_now

      # Check scheduled nudge jobs
      nudge_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == SendPromptCreationNudgeJob
      end

      # Should have jobs for our created groups plus any fixture groups that activate on Friday
      expected_total = Group.scheduled_for_day(5).count
      assert_equal expected_total, nudge_jobs.size

      # Verify our specific groups are included in the scheduled jobs
      # Arguments are serialized as GlobalID, extract IDs from gid strings
      nudge_group_gids = nudge_jobs.map { |job| job[:args].first["_aj_globalid"] }

      # Should contain references to our created groups
      friday_1_in_nudge = nudge_group_gids.any? { |gid| gid.include?(friday_group_1.id.to_s) }
      friday_2_in_nudge = nudge_group_gids.any? { |gid| gid.include?(friday_group_2.id.to_s) }

      assert friday_1_in_nudge, "Friday group 1 should be scheduled for nudge"
      assert friday_2_in_nudge, "Friday group 2 should be scheduled for nudge"
    end
  end

  test "does not schedule jobs when no groups activate tomorrow" do
    # Time travel to Thursday so tomorrow is Friday (weekday 5)
    # But only create groups that don't activate on Friday
    thursday = Time.new(2025, 1, 9)
    travel_to thursday.beginning_of_day do
      # Create groups that don't activate on Friday
      Group.create!(
        name: "Monday Only Group",
        description: "Only activates on Monday",
        privacy_level: :open,
        prompt_schedule: "1", # Monday only
        created_by: users(:one)
      )

      Group.create!(
        name: "Tuesday Only Group",
        description: "Only activates on Tuesday",
        privacy_level: :closed,
        prompt_schedule: "2", # Tuesday only
        created_by: users(:two)
      )

      # Run the job
      SchedulePromptCreationNudgesJob.perform_now

      # Check that only fixture groups were scheduled (they have "135" schedule which includes Friday)
      nudge_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == SendPromptCreationNudgeJob
      end

      # Should only have jobs for fixture groups that activate on Friday (5)
      expected_count = Group.where("prompt_schedule LIKE '%5%'").count
      assert_equal expected_count, nudge_jobs.size
    end
  end

  test "schedules jobs at random times between 9 AM and 5 PM EST" do
    # Time travel to Saturday so tomorrow is Sunday (weekday 0)
    saturday = Time.new(2025, 1, 4)
    travel_to saturday.beginning_of_day do
      # Create multiple groups that activate on Sunday
      5.times do |i|
        Group.create!(
          name: "Sunday Group #{i + 1}",
          description: "Sunday group #{i + 1}",
          privacy_level: :open,
          prompt_schedule: "0", # Sunday only
          created_by: users(:one)
        )
      end

      # Run the job
      SchedulePromptCreationNudgesJob.perform_now

      # Get all scheduled nudge times
      nudge_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == SendPromptCreationNudgeJob
      end

      scheduled_times = nudge_jobs.map { |job| Time.at(job[:at]) }

      # Verify all times are on Saturday (today) between 9 AM and 5 PM EST
      scheduled_times.each do |time|
        assert_equal saturday.to_date, time.to_date
        assert time.hour >= 9
        assert time.hour <= 17
      end

      # Verify times are different (randomized)
      # With 5 groups and 9 possible hours, there's a high probability of different times
      unique_times = scheduled_times.uniq
      assert unique_times.size > 1, "Expected different random times, got: #{scheduled_times.map(&:hour)}"
    end
  end

  test "uses existing fixture groups that activate tomorrow" do
    # Time travel to Sunday so tomorrow is Monday (weekday 1)
    # Fixture groups have prompt_schedule "135" (Mon, Wed, Fri)
    sunday = Time.new(2025, 1, 5)
    travel_to sunday.beginning_of_day do
      # Run the job
      SchedulePromptCreationNudgesJob.perform_now

      # All fixture groups should be scheduled since they have Monday in their schedule
      nudge_jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select do |job|
        job[:job] == SendPromptCreationNudgeJob
      end

      # Should have nudge jobs for all fixture groups
      expected_group_count = Group.scheduled_for_day(1).count
      assert expected_group_count > 0, "Expected at least one group to be scheduled"
      assert_equal expected_group_count, nudge_jobs.size
    end
  end
end
