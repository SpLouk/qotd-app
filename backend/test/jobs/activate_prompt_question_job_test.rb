require "test_helper"

class ActivatePromptQuestionJobTest < ActiveJob::TestCase
  test "activates the highest-voted prompt and deactivates currently active prompt for each group" do
    # Group One Setup
    active_prompt_g1 = prompt_questions(:active_group_one)
    assert active_prompt_g1.active?
    highest_voted_g1 = prompt_questions(:inactive)  # Has 2 votes
    assert_equal 2, highest_voted_g1.prompt_votes_count
    assert_not highest_voted_g1.active?

    # Group Two Setup
    active_prompt_g2 = prompt_questions(:active_group_two)
    assert active_prompt_g2.active?

    ActivatePromptQuestionJob.perform_now

    # Verify Group One changes
    assert_not active_prompt_g1.reload.active?, "Old prompt in group one should be deactivated"
    assert active_prompt_g1.deactivated_at.present?
    assert highest_voted_g1.reload.active?, "Highest voted prompt in group one should be activated"
    assert highest_voted_g1.activated_at.present?

    # Verify Group Two remains unchanged since it has no available prompts
    assert active_prompt_g2.reload.active?, "Group two's active prompt should remain active"
    assert_nil active_prompt_g2.deactivated_at
  end

  test "does nothing if no prompts are available for activation" do
    # Setup - make all prompts unavailable
    PromptQuestion.update_all(activated_at: Time.current)

    # Get initial state
    active_g1 = prompt_questions(:active_group_one)
    active_g2 = prompt_questions(:active_group_two)

    ActivatePromptQuestionJob.perform_now

    # Verify nothing changed
    assert active_g1.reload.active?
    assert active_g2.reload.active?
  end

  test "sends notifications to users in the correct group" do
    # Setup device tokens for users in group one
    token_1 = device_tokens(:ios_token)  # User one
    token_2 = device_tokens(:another_ios_token)  # User two
    token_3 = device_tokens(:device_token_3)  # User three

    # Verify users are in correct groups
    assert_equal groups(:one), token_1.user.groups.first
    assert_equal groups(:one), token_2.user.groups.first
    assert_equal groups(:two), token_3.user.groups.first

    # Create a mock client that verifies notifications are sent to all tokens
    mock_client = mock("client")
    mock_client.expects(:call).with(:post, "/3/device/#{token_1.token}", anything, anything).once
    mock_client.expects(:call).with(:post, "/3/device/#{token_2.token}", anything, anything).once
    mock_client.expects(:close)

    # Mock the create_client method to return our mock client
    ApnsService.stubs(:create_client).returns(mock_client)

    ActivatePromptQuestionJob.perform_now
  end
end
