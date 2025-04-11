require "test_helper"

class PromptQuestionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @group = groups(:one)
    @user = users(:one)

    sign_in_as(@user)
  end

  test "should get index with available prompts for voting" do
    get group_prompt_questions_url(@group), headers: auth_headers
    assert_response :success

    json_response = JSON.parse(@response.body)
    assert_instance_of Array, json_response

    # Should only include inactive prompts (available for voting)
    json_response.each do |prompt|
      assert_not prompt["active"], "Index should only return inactive prompts"
    end

    # Should include prompts with their vote counts
    assert json_response.all? { |prompt| prompt.key?("votes_count") }

    # Should only include prompts from the requested group
    group_prompt_ids = @group.prompt_questions.pluck(:id)
    assert json_response.all? { |prompt| group_prompt_ids.include?(prompt["id"]) }
  end

  test "should not include active prompts in index" do
    get group_prompt_questions_url(@group), headers: auth_headers
    assert_response :success

    json_response = JSON.parse(@response.body)
    active_prompt_ids = PromptQuestion.where(active: true).pluck(:id)

    json_response.each do |prompt|
      assert_not active_prompt_ids.include?(prompt["id"]), 
        "Index should not include active prompts"
    end
  end

  test "should include vote information in response" do
    get group_prompt_questions_url(@group), headers: auth_headers
    assert_response :success

    json_response = JSON.parse(@response.body)
    prompt_with_votes = json_response.find { |p| p["votes_count"] > 0 }

    assert_not_nil prompt_with_votes, "Should include at least one prompt with votes"
    assert prompt_with_votes.key?("user_voted"), 
      "Response should include user_voted attribute"
  end
end
