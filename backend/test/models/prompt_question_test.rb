require "test_helper"

class PromptQuestionTest < ActiveSupport::TestCase
  test "user_voted_today? returns false if user voted yesterday" do
    prompt = prompt_questions(:inactive)
    user = users(:one)

    assert_not prompt.user_voted_today?(user)
  end

  test "user_voted_today? returns true if user voted today" do
    prompt = prompt_questions(:inactive)
    user = users(:one)
    PromptVote.create!({
      prompt_question: prompt,
      user: user
    })

    assert prompt.user_voted_today?(user)
  end

  test "user_voted? returns false if user has not voted" do
    prompt = prompt_questions(:unused)
    user = users(:one)

    assert_not prompt.user_voted_today?(user)
  end

  test "as_json includes vote information when requested" do
    prompt = prompt_questions(:inactive)
    user = users(:one)
    PromptVote.create!({
      prompt_question: prompt,
      user: user
    })

    json = prompt.as_json(include_votes: true, current_user: user)

    assert_equal 3, json[:votes_count]
    assert json[:user_voted]
  end
end
