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
    follow.update!(approved: true)
    render json: follow
  end

  def index
    follows = case params[:type]
    when "followers"
      Current.user.followers
    when "following"
      Current.user.following
    else
      render json: { error: "Invalid type parameter" }, status: :unprocessable_entity
      return
    end

    render json: follows
  end
end
