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

  test "user_can_reply_again? returns false if prompt is not active" do
    prompt = prompt_questions(:inactive)
    user = users(:one)

    assert_not prompt.user_can_reply_again?(user)
  end

  test "user_can_reply_again? returns false if user has no posts" do
    prompt = prompt_questions(:active_group_one)
    user = users(:one)

    assert_not prompt.user_can_reply_again?(user)
  end

  test "user_can_reply_again? returns true if user replied within 30 minutes" do
    prompt = prompt_questions(:active_group_one)
    prompt.update!(activated_at: 1.hour.ago)
    user = users(:one)

    Post.create!(
      user: user,
      prompt_question: prompt,
      group: prompt.group,
      content: "Test reply",
      created_at: prompt.activated_at + 15.minutes
    )

    assert prompt.user_can_reply_again?(user)
  end

  test "user_can_reply_again? returns false if user replied after 30 minutes" do
    prompt = prompt_questions(:active_group_one)
    prompt.update!(activated_at: 2.hours.ago)
    user = users(:one)

    Post.create!(
      user: user,
      prompt_question: prompt,
      group: prompt.group,
      content: "Test reply",
      created_at: prompt.activated_at + 45.minutes
    )

    assert_not prompt.user_can_reply_again?(user)
  end

  test "user_can_reply_again? uses oldest post when user has multiple replies" do
    prompt = prompt_questions(:active_group_one)
    prompt.update!(activated_at: 2.hours.ago)
    user = users(:one)

    # Create first post within 30 minutes (should make user_can_reply_again? true)
    Post.create!(
      user: user,
      prompt_question: prompt,
      group: prompt.group,
      content: "First reply",
      created_at: prompt.activated_at + 15.minutes
    )

    # Create second post after 30 minutes
    Post.create!(
      user: user,
      prompt_question: prompt,
      group: prompt.group,
      content: "Second reply",
      created_at: prompt.activated_at + 45.minutes
    )

    assert prompt.user_can_reply_again?(user)
  end
end
