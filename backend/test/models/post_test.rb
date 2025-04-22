require "test_helper"

class PostTest < ActiveSupport::TestCase
  test "notify_other_repliers notifies all previous repliers except current and parent author" do
    # Setup users and posts
    parent = posts(:group_one_active_post) # user: two
    replier1 = users(:one)
    replier2 = users(:four)
    current_replier = users(:five)
    group = groups(:one)
    prompt = prompt_questions(:active_group_one)

    # Create device tokens for repliers - we need these for the notification to be sent
    DeviceToken.create!(user: replier1, token: "token1", platform: "ios")
    DeviceToken.create!(user: replier2, token: "token2", platform: "ios")

    # Create replies to parent post
    Post.create!(user: replier1, parent_post: parent, group: group, prompt_question: prompt, content: "Reply 1")
    Post.create!(user: replier2, parent_post: parent, group: group, prompt_question: prompt, content: "Reply 2")

    # Should notify replier1 and replier2 (not current_replier or parent author)
    expected_recipient_ids = [ replier1.id, replier2.id ]
    expected_tokens = DeviceToken.where(user_id: expected_recipient_ids).to_a
    expected_title = "#{current_replier.username} also responded to #{parent.user.username}'s post"

    # Set up expectations for both callbacks
    # 1. For notify_other_repliers
    repliers_notification = nil
    repliers_tokens = nil


    # Set up expectation to be called twice (once for each callback)
    ApnsService.expects(:notify).twice.with do |notification, device_tokens|
      # Determine which callback is being triggered based on the notification title
      if notification.title.include?("also responded")
        # This is notify_other_repliers
        repliers_notification = notification
        repliers_tokens = device_tokens
      end
      true # Return true to match any call
    end

    # Now, current_replier replies
    Post.create!(user: current_replier, parent_post: parent, group: group, prompt_question: prompt, content: "Reply 3")

    # Add assertions to verify the notification was sent correctly
    assert_equal 3, parent.replies.count

    # Verify notify_other_repliers was called with correct parameters
    assert_not_nil repliers_notification, "Notification to repliers should not be nil"
    assert_not_nil repliers_tokens, "Device tokens for repliers should not be nil"

    if repliers_notification && repliers_tokens
      assert_equal expected_title, repliers_notification.title
      assert_equal "Reply 3", repliers_notification.body
      assert_equal expected_tokens.sort_by(&:id), repliers_tokens.sort_by(&:id)
    end
  end

  test "notify_other_repliers does nothing if no previous repliers" do
    parent = posts(:group_one_active_post) # user: two
    current_replier = users(:four)
    group = groups(:one)
    prompt = prompt_questions(:active_group_one)

    # Create the post object but don't save it yet
    reply = Post.new(user: current_replier, parent_post: parent, group: group, prompt_question: prompt, content: "Only reply")

    # Setup the expectation before calling the method
    ApnsService.expects(:notify).never

    # Call the method directly instead of relying on callbacks
    reply.send(:notify_other_repliers)

    # Add an assertion to verify the method behaves as expected
    assert_nil reply.id, "Reply should not be saved to the database"
  end
end
