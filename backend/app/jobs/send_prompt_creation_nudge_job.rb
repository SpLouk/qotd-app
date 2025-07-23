class SendPromptCreationNudgeJob < ApplicationJob
  queue_as :default

  def perform(group)
    # Send push notifications to users in this group reminding them to vote on prompts
    device_tokens = DeviceToken.includes(:user)
      .where(user: group.approved_users)
      .to_a

    notification = Notification.new(
      title: "It's time to vote!",
      body: "A new question goes live tomorrow in #{group.name}. Vote for the best prompt now!",
      category: "vote_reminder",
      thread_id: "vote_reminder_#{group.id}",
      target_content_id: group.id.to_s,
      custom_data: {
        group_id: parent_post.group_id
      }
    )
    ApnsService.notify(notification, device_tokens) if device_tokens.any?
  end
end

