class Session < ApplicationRecord
  belongs_to :user
  before_create :generate_token
  before_create :generate_refresh_token
  before_create :set_token_expiry

  encrypts :refresh_token, deterministic: true

  def expired?
    token_expires_at < Time.current
  end

  def refresh_token_expired?
    refresh_token_expires_at < Time.current
  end

  def refresh!(new_user_agent)
    return false if refresh_token_expired?
    return false if user_agent != new_user_agent

    generate_token
    set_token_expiry
    save!
  end

  private

  def generate_token
    self.token = SecureRandom.hex(32)
    self.token_refreshed_at = Time.current
  end

  def generate_refresh_token
    self.refresh_token = SecureRandom.hex(64)
  end

  def set_token_expiry
    self.token_expires_at = 1.hour.from_now
    self.refresh_token_expires_at = 90.days.from_now
  end
end
