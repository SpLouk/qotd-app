class AuthCode < ApplicationRecord
  belongs_to :user

  before_create :set_expiry

  before_validation :generate_code, on: :create

  validates :code, presence: true, uniqueness: true
  validates :user, presence: true
  validate :not_expired, on: :show
  validate :not_used, on: :show

  scope :active, -> { where(used_at: nil).where("expires_at > ?", Time.current) }

  def use!
    update!(used_at: Time.current)
  end

  private

  def generate_code
    self.code = rand(100000..999999).to_s
  end

  def set_expiry
    self.expires_at ||= 20.minutes.from_now
  end

  def not_expired
    errors.add(:base, "Code has expired") if expires_at && expires_at < Time.current
  end

  def not_used
    errors.add(:base, "Code has already been used") if used_at.present?
  end
end
