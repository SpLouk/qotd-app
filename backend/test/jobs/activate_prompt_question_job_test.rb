require "test_helper"

class ActivatePromptQuestionJobTest < ActiveJob::TestCase
  test "activates a prompt and deactivates currently active prompts" do
    # Create an active prompt
    active_prompt = prompt_questions(:active)

    # Create a new prompt ready to be activated
    new_prompt = prompt_questions(:future)
    new_prompt.update!(trigger_at: 1.hour.ago)

    # Run the job
    ActivatePromptQuestionJob.perform_now(new_prompt)

    # Verify the old prompt is deactivated
    assert_not active_prompt.reload.active
    # Verify the new prompt is activated
    assert new_prompt.reload.active
  end

  test "does not activate a prompt if trigger time is in the future" do
    future_prompt = prompt_questions(:active)
    future_prompt.update!(trigger_at: 1.hour.from_now, active: false)

    ActivatePromptQuestionJob.perform_now(future_prompt)

    assert_not future_prompt.reload.active
  end

  test "handles nil prompt gracefully" do
    assert_nothing_raised do
      ActivatePromptQuestionJob.perform_now(nil)
    end
  end
end
