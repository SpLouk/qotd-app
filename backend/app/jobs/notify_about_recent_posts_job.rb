class NotifyAboutRecentPostsJob < ApplicationJob
  queue_as :default

  def perform
    # TODO: consider enqueueing a sub-job per prompt for better scalability.
    PromptQuestion.active.find_each(batch_size: 100) do |prompt|
      process_prompt(prompt)
    end
  end

  private

  def process_prompt(prompt)
    group = prompt.group
    posts_to_notify = prompt.posts.where(parent_post: nil, notified_group_at: nil)

    return unless posts_to_notify.exists?

    users_who_posted = User.where(id: posts_to_notify.select(:user_id).distinct)
    all_off_topic = posts_to_notify.all? { |post| post.off_topic }

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

      body = "#{usernames_list} #{usernames.size == 1 ? 'has' : 'have'} responded to today's prompt"
      if all_off_topic
        body ="#{usernames_list} #{usernames.size == 1 ? 'has' : 'have'} posted"
      end

      notification = Notification.new(
        title: "They're Hootin'!",
        body: body,
        category: "recent_posters",
        thread_id: "prompt_#{prompt.id}",
        target_content_id: group.id.to_s
      )
      ApnsService.notify(notification, user.device_tokens)
    end
    posts_to_notify.update_all(notified_group_at: Time.current)
  end
end
