class InviteCode < ApplicationRecord
  belongs_to :group
  belongs_to :created_by, class_name: "User", optional: true

  validates :code, presence: true, uniqueness: true
  validates :group, presence: true

  before_validation :generate_code, on: :create

  scope :active, -> {
    where("expires_at IS NULL OR expires_at > ?", Time.current)
      .where("max_uses IS NULL OR uses_count < max_uses")
  }

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def maxed_out?
    max_uses.present? && uses_count >= max_uses
  end

  def valid_for_use?
    !expired? && !maxed_out?
  end

  def use!
    increment!(:uses_count)
  end

  private

  def generate_code
    # 6-letter, uppercase only, no ambiguous chars
    chars = ("A".."Z").to_a
    self.code ||= Array.new(6) { chars.sample }.join
  end
end
