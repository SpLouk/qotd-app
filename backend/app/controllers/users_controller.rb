class UsersController < ApplicationController
  # GET /user
  def show
    render json: Current.user
  end

  # PATCH/PUT /user
  def update
    if Current.user.update(user_params)
      render json: Current.user
    else
      render json: { errors: Current.user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /users/search?q=query
  def search
    users = User.search_by_username(params[:q])
    render json: users
  end

  private

  def user_params
    params.require(:user).permit(:username, :profile_photo)
  end
end
