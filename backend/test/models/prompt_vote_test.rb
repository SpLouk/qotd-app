require "test_helper"

class PromptVoteTest < ActiveSupport::TestCase
  test "user can vote for a prompt" do
    # Setup
    user = users(:three)
    prompt = prompt_questions(:unused)

    # Create new vote
    vote = PromptVote.new(user: user, prompt_question: prompt)

    # Assert vote can be saved
    assert vote.save
    assert_equal 1, prompt.reload.prompt_votes_count
  end

  test "user cannot vote for the same prompt twice in one day" do
    # Setup - user already has a vote
    user = users(:one)
    prompt = prompt_questions(:inactive)
    PromptVote.create!({
      prompt_question: prompt,
      user: user
    })

    # Try to create another vote
    vote = PromptVote.new(user: user, prompt_question: prompt)

    # Assert vote fails validation
    assert_not vote.save
    assert_includes vote.errors[:base], "can only vote once per group per day"
  end

  test "counter cache updates on vote creation and deletion" do
    # Setup
    user = users(:three)
    prompt = prompt_questions(:unused)
    initial_count = prompt.prompt_votes_count

    # Create vote
    vote = PromptVote.create!(user: user, prompt_question: prompt)
    assert_equal initial_count + 1, prompt.reload.prompt_votes_count

    # Destroy vote
    vote.destroy
    assert_equal initial_count, prompt.reload.prompt_votes_count
  end

  test "user cannot vote twice in one day for the same group" do
    # Setup - user already has a vote
    user = users(:one)

    # create vote within group 1
    existing_vote = prompt_votes(:user_one_vote)
    existing_vote.update!(created_at: Time.now)

    # try to create another vote for a different prompt
    prompt = prompt_questions(:inactive_with_votes)
    vote = PromptVote.new(user: user, prompt_question: prompt)
    assert_not vote.save
    assert_includes vote.errors[:base], "can only vote once per group per day"
  end

  test "user can vote twice in one day for different groups" do
    # Setup - user already has a vote
    user = users(:one)

    # create vote within group 1
    existing_vote = prompt_votes(:user_one_vote)
    existing_vote.update!(created_at: Time.now)

    # try to create another vote for a different prompt
    prompt = prompt_questions(:active_group_two)
    vote = PromptVote.new(user: user, prompt_question: prompt)
    assert vote.save
  end
end
