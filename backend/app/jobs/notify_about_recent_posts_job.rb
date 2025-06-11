class NotifyAboutRecentPostsJob < ApplicationJob
  queue_as :default

  def perform(prompt)
    return unless prompt.active
    group = prompt.group

    # Find root posts for this prompt that haven't been group-notified
    posts_to_notify = prompt.posts.where(parent_post: nil, notified_group_at: nil)

    if posts_to_notify.exists?
      users_who_posted = User.where(id: posts_to_notify.select(:user_id).distinct)

      group.approved_users.each do |user|
        usernames = users_who_posted.where.not(id: user.id).pluck(:username)
        next unless user.device_tokens.any? && usernames.any?

        usernames_list = case usernames.size
        when 1
          usernames.first
        when 2
          usernames.join(" and ")
        else
          [ usernames[0..-2].join(", "), usernames.last ].reject(&:empty?).join(" and ")
        end

        notification = Notification.new(
          title: "They're Hootin'!",
          body: "#{usernames_list} #{usernames.size == 1 ? 'has' : 'have'} responded to today's prompt",
          category: "recent_posters",
          thread_id: "prompt_#{prompt.id}",
          target_content_id: group.id.to_s
        )
        ApnsService.notify(notification, user.device_tokens)
      end

      posts_to_notify.update_all(notified_group_at: Time.current)
    end

    next_run = 3.hours.from_now
    if group.next_scheduled_activation.nil? || next_run < group.next_scheduled_activation
      NotifyAboutRecentPostsJob.set(wait_until: next_run).perform_later(prompt)
    end
  end
end
