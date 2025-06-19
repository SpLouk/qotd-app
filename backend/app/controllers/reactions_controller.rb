class ReactionsController < ApplicationController
  def create
    reaction = Current.user.reactions.new(reaction_params)
    if reaction.save
      head :created
    else
      render json: { error: reaction.errors.full_messages.join(", ") }, status: :unprocessable_entity
    end
  end

  def destroy
    reaction = Current.user.reactions.find(params[:id])
    if reaction
      reaction.destroy
      head :no_content
    else
      render json: { error: "Reaction not found" }, status: :not_found
    end
  end

  private

  def reaction_params
    params.require(:reaction).permit(:post_id, :reaction)
  end
end
