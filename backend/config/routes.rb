Rails.application.routes.draw do
  resources :device_tokens, only: [ :create ] do
    delete :destroy, on: :collection
  end

  resources :groups do
    member do
      post :join
      post :approve_request
      delete :leave_group
      delete 'remove_user/:user_id', action: :remove_user
    end
    resources :prompt_questions, only: [ :index, :create ] do
      member do
        post :vote
        delete :unvote
      end
      get :active, on: :collection
    end

    resources :posts, only: [ :create, :destroy, :index ] do
      post :flag, on: :member
    end
  end

  # Join group via invite code (no group id required)
  post "groups/join_with_code", to: "groups#join_with_invite_code"

  # Routes for other users
  resources :users do
    resource :follow, only: [ :create, :destroy ] do
      put :approve, on: :collection
    end
    get :search, on: :collection
  end

  # Routes for the current user
  resource :user, only: [ :show, :update ]

  # Get lists of followers/following for the current user
  get "followers", to: "follows#followers"
  get "following", to: "follows#following"
  get "follow_requests", to: "follows#follow_requests"
  get "following_requests", to: "follows#following_requests"

  resource :session do
    post :refresh, on: :collection
  end

  resource :auth_codes, only: [ :create ] do
    collection do
      post :verify
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
