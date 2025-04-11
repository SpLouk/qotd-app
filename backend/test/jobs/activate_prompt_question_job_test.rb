require "test_helper"

class ActivatePromptQuestionJobTest < ActiveJob::TestCase
  test "activates the highest-voted prompt and deactivates currently active prompt" do
    # Setup - active_prompt is currently active
    active_prompt = prompt_questions(:active_group_one)
    assert active_prompt.active?

    # Highest voted prompt is inactive with 2 votes
    highest_voted = prompt_questions(:inactive)
    assert_equal 2, highest_voted.prompt_votes_count
    assert_not highest_voted.active?

    # Run the job
    assert_enqueued_with(job: SchedulePromptActivationJob) do
      ActivatePromptQuestionJob.perform_now
    end

    # Verify the old prompt is deactivated
    assert_not active_prompt.reload.active?
    assert active_prompt.deactivated_at.present?

    # Verify the highest voted prompt is activated
    assert highest_voted.reload.active?
    assert highest_voted.activated_at.present?
  end

  test "does nothing if no prompts are available for activation" do
    # Setup - make all prompts unavailable
    PromptQuestion.update_all(activated_at: Time.current)

    # Run the job
    ActivatePromptQuestionJob.perform_now

    # Active prompt should still be active
    assert prompt_questions(:active).reload.active?
  end
end
