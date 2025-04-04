class FollowsController < ApplicationController
  def create
    user_to_follow = User.find(params[:user_id])
    follow = Current.user.follows_as_follower.create!(followed: user_to_follow)
    render json: follow, status: :created
  end

  def destroy
    follow = Current.user.follows_as_follower.find_by!(followed_id: params[:user_id])
    follow.destroy
    head :no_content
  end

  def approve
    follow = Current.user.follows_as_followed.find_by!(follower_id: params[:user_id])
    follow.approve_follow!
    render json: follow
  end

  def followers
    render json: Current.user.followers
  end

  def following
    render json: Current.user.following
  end

  def follow_requests
    render json: Current.user.follows_as_followed.where(
      "approved = false OR updated_at > ?",
      1.day.ago
    )
  end

  def following_requests
    render json: Current.user.follows_as_follower
  end
end
