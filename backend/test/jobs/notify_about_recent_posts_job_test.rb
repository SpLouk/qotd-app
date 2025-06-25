require "test_helper"

class NotifyAboutRecentPostsJobTest < ActiveJob::TestCase
  setup do
    @group = groups(:one)
    @prompt = prompt_questions(:active_group_one)
    @user1 = users(:one)
    @user2 = users(:two)
    @user3 = users(:four)
    @device_token1 = device_tokens(:ios_token)
    @device_token2 = device_tokens(:another_ios_token)
    @device_token3 = device_tokens(:device_token_3)
    # Ensure posts are clean before each test
    Post.update_all(notified_group_at: nil)
  end

  test "does not notify if zero users have posted" do
    # Only one user has posted
    Post.delete_all
    ApnsService.expects(:notify).never
    assert_no_enqueued_jobs only: NotifyAboutRecentPostsJob
    NotifyAboutRecentPostsJob.perform_now
  end

  test "notifies only users with device tokens and at least one other poster, with correct personalized bodies" do
    # Setup: user1 and user2 have posted, user3 has not
    post_ids = [ posts(:current_user_active_post).id, posts(:group_one_active_post).id ]
    Post.where.not(id: post_ids).delete_all
    users = [ @user1, @user2, @user3 ]

    # According to the job logic:
    # - Each user gets a notification only if (1) they have device tokens AND (2) at least one other user posted
    # - The notification body is:
    #   - For user1: only user2 posted, so "splouk has responded to today's prompt"
    #   - For user2: only user1 posted, so "davidl has responded to today's prompt"
    #   - For user3: both user1 and user2 posted, so "davidl and splouk have responded to today's prompt"
    expected_bodies = {
      @user1.id => "splouk has responded to today's prompt",
      @user2.id => "davidl has responded to today's prompt",
      @user3.id => "splouk and davidl have responded to today's prompt"
    }

    # Collect all notify calls
    notifications_sent = []
    ApnsService.stubs(:notify).with { |notification, tokens| notifications_sent << [ notification, tokens ]; true }

    NotifyAboutRecentPostsJob.perform_now

    # Build expected notifications
    expected_notifications = users.map do |user|
      [ expected_bodies[user.id], user.device_tokens.map(&:token).to_set ]
    end.compact

    actual_notifications = notifications_sent.map { |notification, tokens| [ notification.body, tokens.map(&:token).to_set ] }
    expected_notifications.each do |expected|
      assert_includes actual_notifications, expected, "Expected notification with body '#{expected[0]}' and tokens #{expected[1].to_a}"
    end
    assert_equal expected_notifications.size, actual_notifications.size, "Expected only the correct notifications to be sent"
  end

  test "marks posts as notified after notification" do
    post = posts(:current_user_active_post)
    post.update!(notified_group_at: nil)
    ApnsService.stubs(:notify)
    NotifyAboutRecentPostsJob.perform_now
    assert post.reload.notified_group_at.present?
  end
end
