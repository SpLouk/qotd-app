class PromptQuestionsController < ApplicationController
  before_action :set_group
  before_action :set_prompt_question, only: [ :vote, :unvote ]

  def index
    # Get prompts a user can vote for (those not already active)
    @prompt_questions = @group.prompt_questions.available_for_voting()
    render json: @prompt_questions.as_json(include_votes: true, current_user: Current.user)
  end

  def active
    render json: @group.active_prompt
  end

  def create
    @prompt_question = @group.prompt_questions.build(prompt_question_params)
    @prompt_question.created_by = Current.user
    @prompt_question.eligible_for_votes = true

    if @prompt_question.save
      render json: @prompt_question, status: :created
    else
      render json: { errors: @prompt_question.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def vote
    # Create a vote for the current user on this prompt
    vote = @prompt_question.prompt_votes.build(user: Current.user)

    if vote.save
      render json: @prompt_question.as_json(include_votes: true, current_user: Current.user)
    else
      render json: { errors: vote.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def unvote
    # Remove the vote if it exists
    vote = @prompt_question.prompt_votes.find_by(user_id: Current.user.id)

    if vote
      vote.destroy
      render json: @prompt_question.as_json(include_votes: true, current_user: Current.user)
    else
      render json: { error: "Vote not found" }, status: :not_found
    end
  end

  private

  def set_group
    @group = Group.find(params[:group_id])
  end

  def set_prompt_question
    @prompt_question = @group.prompt_questions.find(params[:id])
  end

  def prompt_question_params
    params.require(:prompt_question).permit(:content)
  end
end
