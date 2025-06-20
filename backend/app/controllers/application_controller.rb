class ApplicationController < ActionController::API
  include Authentication

  # Allow unauthenticated access to Mission Control Jobs engine
  skip_before_action :require_authentication, if: -> { request.path.start_with?("/jobs") }
end
