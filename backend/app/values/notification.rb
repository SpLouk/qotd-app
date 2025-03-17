class Notification < Data.define(:title, :subtitle, :body, :badge, :sound, :content_available, :category,
                :thread_id, :target_content_id, :interruption_level,
                :relevance_score, :custom_data)
  def initialize(title:, subtitle: nil, body: nil, badge: nil, sound: "default", content_available: false, category: "new_prompt",
               thread_id: nil, target_content_id: nil, interruption_level: "timeSensitive",
               relevance_score: 1.0, custom_data: nil)
    super(
      title: title,
      subtitle: subtitle,
      body: body,
      badge: badge,
      sound: sound,
      content_available: content_available,
      category: category,
      thread_id: thread_id,
      target_content_id: target_content_id,
      interruption_level: interruption_level,
      relevance_score: relevance_score,
      custom_data: custom_data
    )
  end

  def to_payload
    {
      aps: {
        alert: {
          title: title,
          subtitle: subtitle,
          body: body
        },
        badge: badge,
        sound: sound,
        content_available: content_available,
        category: category,
        thread_id: thread_id,
        target_content_id: target_content_id,
        interruption_level: interruption_level,
        relevance_score: relevance_score
      }.compact,
      custom_data: custom_data
    }
  end
end
