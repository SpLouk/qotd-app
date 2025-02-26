require "test_helper"

class PromptQuestionTest < ActiveSupport::TestCase
  test "most_voted returns the prompt with the most votes" do
    # The inactive prompt has 2 votes, should be first
    assert_equal prompt_questions(:inactive), PromptQuestion.most_voted
  end

  test "activate! makes a prompt active and deactivates other prompts" do
    # Setup
    active_prompt = prompt_questions(:active)
    inactive_prompt = prompt_questions(:inactive)

    # Execute
    inactive_prompt.activate!

    # Assert
    assert inactive_prompt.reload.active?
    assert inactive_prompt.activated_at.present?
    assert_not active_prompt.reload.active?
    assert active_prompt.deactivated_at.present?
  end

  test "user_voted? returns true if user has voted" do
    prompt = prompt_questions(:inactive)
    user = users(:one)

    assert prompt.user_voted?(user)
  end

  test "user_voted? returns false if user has not voted" do
    prompt = prompt_questions(:unused)
    user = users(:one)

    assert_not prompt.user_voted?(user)
  end

  test "as_json includes vote information when requested" do
    prompt = prompt_questions(:inactive)
    user = users(:one)

    json = prompt.as_json(include_votes: true, current_user: user)

    assert_equal 2, json[:votes_count]
    assert json[:user_voted]
  end
end
