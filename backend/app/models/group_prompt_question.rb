class GroupPromptQuestion < ApplicationRecord
  belongs_to :group
  belongs_to :prompt_question

  validates :prompt_question_id, uniqueness: { scope: :group_id }
  validate :only_one_active_per_group

  scope :active, -> { where(active: true) }
  scope :by_activation_date, -> { order(activated_at: :desc) }

  def activate!
    return false if active?
    return false if activated_at?

    transaction do
      group.group_prompt_questions.active.each do |gpq|
        gpq.update!(
          active: false,
          deactivated_at: Time.current
        )
      end

      update!(
        active: true,
        activated_at: Time.current
      )

      notify_users
    end

    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  def deactivate!
    return false unless active?

    update!(
      active: false,
      deactivated_at: Time.current
    )

    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  private

  def only_one_active_per_group
    return unless active?

    other_active = group.group_prompt_questions
      .active
      .where.not(id: id)
      .exists?

    if other_active
      errors.add(:active, "cannot have multiple active prompts in the same group")
    end
  end

  def notify_users
    return unless active?

    group.approved_users.joins(:device_tokens).find_each do |user|
      notification = Notification.new(
        title: "New Group Question",
        body: prompt_question.content,
        category: "new_group_prompt",
        thread_id: "group_prompt_#{id}",
        target_content_id: id.to_s,
        custom_data: {
          group_id: group_id,
          group_name: group.name
        }
      )

      ApnsService.send_notification(notification, user.device_tokens.pluck(:token))
    end
  end
end
