class NotifyAboutRecentPostsJob < ApplicationJob
  queue_as :default

  def perform(group)
    prompt = group.active_prompt
    return unless prompt

    # Find up to 3 unique users who have posted for this prompt
    users_who_posted = prompt.posts.includes(:user).map(&:user).uniq.first(3)
    return if users_who_posted.size <= 1

    usernames = users_who_posted.map(&:username)

    # Format the usernames list with 'and' before the last name
    usernames_list = case usernames.size
    when 2
      usernames.join(' and ')
    else
      [usernames[0..-2].join(', '), usernames.last].reject(&:empty?).join(' and ')
    end

    # Exclude device tokens belonging to users in the notification
    excluded_user_ids = users_who_posted.map(&:id)
    device_tokens = DeviceToken.includes(:user)
                               .where(user: group.users)
                               .where.not(user_id: excluded_user_ids)
                               .to_a

    notification = Notification.new(
      title: "Hoots are rolling in",
      body: "So far: #{usernames_list} have posted for '#{prompt.content}'.",
      category: "recent_posters",
      thread_id: "prompt_#{prompt.id}",
      target_content_id: prompt.id.to_s
    )
    ApnsService.notify(notification, device_tokens) if device_tokens.any?
  end
end
