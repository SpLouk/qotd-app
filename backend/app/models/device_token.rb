class DeviceToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: { scope: :user_id }
  validates :platform, presence: true, inclusion: { in: [ "ios" ] }

  before_save :clean_token

  private

  def clean_token
    self.token = token.strip if token.present?
  end
end
