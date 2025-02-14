module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    after_action :refresh_session
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private
    def require_authentication
      resume_session || render_unauthorized
    end
    def resume_session
      token = request.headers["Authorization"]&.split(" ")&.last
      Current.session = Session.find_by(token: token)
    end
    def refresh_session
      if Current.session && Current.session.token_is_stale?
        Current.session.regenerate_token!
        response.set_header("Authorization", "Bearer #{Current.session.token}")
      end
    end
    def render_unauthorized
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
    def authenticated?
      resume_session
    end
end
