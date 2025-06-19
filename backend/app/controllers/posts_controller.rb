class PostsController < ApplicationController
  before_action :set_group

  def index
    active_prompt = @group.active_prompt
    return render json: [] unless active_prompt

    posts = Post.where(prompt_question_id: active_prompt.id)
                .includes(:user)
                .where.not(id: Current.user.flagged_posts.select(:id))
                .ordered_by_recent_activity

    render json: posts
  end

  def create
    trimmed_params = post_params
    trimmed_params[:content] = trimmed_params[:content]&.strip
    @post = Current.user.posts.build(trimmed_params)
    @post.group = @group

    if @post.save
      render json: @post, status: :created
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @post = Current.user.posts.find_by(id: params[:id])
    if @post
      @post.destroy
      head :no_content
    else
      render status: :not_found
    end
  end

  # POST /groups/:group_id/posts/:id/flag
  def flag
    post = @group.posts.find_by(id: params[:id])
    return render status: :not_found unless post

    post_flag = PostFlag.new(user: Current.user, post: post)
    if post_flag.save
      head :created
    else
      render json: { errors: post_flag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_group
    @group = Group.find(params[:group_id])
  end

  def post_params
    params.require(:post).permit(:content, :prompt_question_id, :parent_post_id, photos: [])
  end
end
