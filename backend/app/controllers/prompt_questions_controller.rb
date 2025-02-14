class PromptQuestionsController < ApplicationController
  def active
    render json: PromptQuestion.active_prompt
  end
end
