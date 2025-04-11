class Session < ApplicationRecord
  belongs_to :user
  before_create :generate_token

  def token_is_stale?
    token_refreshed_at < 5.minutes.ago
  end

  def regenerate_token!
    generate_token
    save!
  end

  private
  def generate_token
    self.token = SecureRandom.hex(32)
    self.token_refreshed_at = Time.current
  end
end
