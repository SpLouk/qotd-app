class PostsController < ApplicationController
  before_action :set_group

  def index
    active_prompt = @group.active_prompt
    return render json: [], status: :not_found unless active_prompt

    posts = Post.where(prompt_question_id: active_prompt.id)
                .includes(:user)
                .order(created_at: :desc)

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

  private

  def set_group
    @group = Group.find(params[:group_id])
  end

  def post_params
    params.require(:post).permit(:content, :prompt_question_id, :parent_post_id)
  end
end
