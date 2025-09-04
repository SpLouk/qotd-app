class GroupsController < ApplicationController
  before_action :set_group, only: [ :show, :update, :destroy, :join, :approve_request, :leave_group, :remove_user ]
  before_action :authorize_admin!, only: [ :approve_request, :update, :destroy, :remove_user ]
  before_action :authorize_member!, only: [ :show, :leave_group ]

  def index
    @groups = Group.where(privacy_level: [ :closed, :open ])
                  .or(Group.where(id: Current.user&.group_ids || []))

    if params[:query].present?
      sanitized_query = params[:query].strip.downcase
      @groups = @groups.where("LOWER(name) LIKE ?", "%#{sanitized_query}%")
    end

    render json: @groups
  end

  def show
    render json: @group
  end

  def create
    @group = Group.new(group_params)
    @group.created_by = Current.user

    if @group.save
      # Make the creator an admin of the group
      @group.add_user(Current.user, :admin)
      render json: @group, status: :created
    else
      render json: { errors: @group.errors }, status: :unprocessable_content
    end
  end

  def update
    if @group.update(group_params)
      render json: @group
    else
      render json: { errors: @group.errors }, status: :unprocessable_content
    end
  end

  def destroy
    @group.destroy
    head :no_content
  end

  # POST /groups/:id/join
  def join
    # Check if user is already a member
    existing_membership = @group.group_users.find_by(user: Current.user)
    if existing_membership
      render json: { error: "Already a member or request pending" }, status: :unprocessable_content
      return
    end

    # Create group membership with appropriate approval status
    approved = @group.open? # Auto-approve for public groups
    @group_user = @group.group_users.build(
      user: Current.user,
      role: :member,
      approved: approved
    )

    if @group_user.save
      render json: @group_user, status: :created
    else
      render json: { errors: @group_user.errors }, status: :unprocessable_content
    end
  end

  # POST /groups/join_with_code
  def join_with_invite_code
    invite_code = InviteCode.find_by!(code: params[:invite_code])
    @group = invite_code.group

    existing_membership = @group.group_users.find_by(user: Current.user)
    if existing_membership
      render json: existing_membership
      return
    end

    unless invite_code.valid_for_use?
      render json: { error: "Invite code is expired or maxed out" }, status: :unprocessable_content
      return
    end

    @group_user = @group.group_users.build(
      user: Current.user,
      role: :member,
      approved: true
    )

    ActiveRecord::Base.transaction do
      @group_user.save!
      invite_code.use!
    end

    render json: @group_user, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: @group_user.errors.full_messages }, status: :unprocessable_content
  end

  def leave_group
    group_user = @group.group_users.find_by(user: Current.user)
    unless group_user
      render json: { error: "Not a member of this group" }, status: :unprocessable_content
      return
    end
    group_user.destroy
    head :no_content
  end

  def remove_user
    group_user = @group.group_users.find_by(user_id: params[:user_id])
    unless group_user
      render json: { error: "User is not a member of this group" }, status: :unprocessable_content
      return
    end
    group_user.destroy
    head :no_content
  end

  # POST /groups/:id/approve_request
  def approve_request
    @group_user = @group.group_users.find_by!(user_id: params[:user_id])

    if @group_user.update(approved: true)
      render json: @group_user
    else
      render json: { errors: @group_user.errors }, status: :unprocessable_content
    end
  end

  private

  def set_group
    @group = Group.find(params[:id])
  end

  def group_params
    params.require(:group).permit(:name, :description, :privacy_level)
  end

  def authorize_admin!
    unless @group.group_users.admin.exists?(user: Current.user)
      render json: { error: "Not authorized" }, status: :forbidden
    end
  end
  def authorize_member!
    unless @group.group_users.member.exists?(user: Current.user) || @group.group_users.admin.exists?(user: Current.user)
      render json: { error: "Not authorized" }, status: :forbidden
    end
  end
end
