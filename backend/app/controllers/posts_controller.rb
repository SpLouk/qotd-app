class PostsController < ApplicationController
  def index
    active_prompt = PromptQuestion.active_prompt
    return render json: [], status: :not_found unless active_prompt

    user_ids = [ Current.user.following.pluck(:followed_id), Current.user.id ].flatten
    posts = Post.where(user_id: user_ids)
                .where(prompt_question_id: active_prompt.id)
                .includes(:user)
                .order(created_at: :desc)

    render json: posts
  end

  def create
    @post = Current.user.posts.build(post_params)

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

  def post_params
    params.require(:post).permit(:content, :prompt_question_id, :parent_post_id)
  end
end
