class Session < ApplicationRecord
  belongs_to :user

  def regenerate_token!
    generate_token
    save!
  end

  private
  def generate_token
    self.token = SecureRandom.hex(32)
  end
end
