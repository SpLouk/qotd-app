require "test_helper"

class NotifyAboutRecentPostsJobTest < ActiveJob::TestCase
  test "does not notify if 1 or fewer users have posted" do
    group = groups(:one)
    # Only one user has posted for active_group_one in posts.yml
    ApnsService.expects(:notify).never
    NotifyAboutRecentPostsJob.perform_now(group)
  end

  test "notifies all group users except those who posted, with correct usernames and formatting (2 users)" do
    group = groups(:one)
    # Add a post so there are two unique users
    posts(:current_user_active_post) # user: one
    posts(:group_one_active_post)    # user: two
    prompt = prompt_questions(:active_group_one)

    expected_body = "So far: davidl and splouk have posted for '#{prompt.content}'."
    ApnsService.expects(:notify).with do |notification, device_tokens|
      notification.body == expected_body &&
        device_tokens.none? { |dt| %w[one two].include?(dt.user_id.to_s) }
    end.once
    NotifyAboutRecentPostsJob.perform_now(group)
  end
end
