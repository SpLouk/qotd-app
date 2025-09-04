class ReactionsController < ApplicationController
  def create
    attrs = reaction_params.to_h.symbolize_keys
    attrs[:user_id] = Current.user.id
    reaction = Reaction.find_or_reactivate_by(attrs)
    if reaction.save
      head :created
    else
      render json: { error: reaction.errors.full_messages.join(", ") }, status: :unprocessable_content
    end
  end

  def destroy
    reaction = Current.user.reactions.find(params[:id])
    if reaction
      reaction.update(deleted: true)
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
