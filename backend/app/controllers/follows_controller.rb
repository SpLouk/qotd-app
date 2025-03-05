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
    Current.user.followers
  end

  def following
    Current.user.following
  end

  def follow_requests
    Current.user.follows_as_followed.where(approved: false)
  end

  def following_requests
    Current.user.follows_as_following.where(approved: false)
  end
end
