require "test_helper"

class PromptQuestionTest < ActiveSupport::TestCase
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
