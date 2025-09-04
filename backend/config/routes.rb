Rails.application.routes.draw do
  resources :reactions, only: [ :create, :destroy ]
  resources :device_tokens, only: [ :create ] do
    delete :destroy, on: :collection
  end

  resources :groups do
    member do
      post :join
      post :approve_request
      delete :leave_group
      delete "remove_user/:user_id", action: :remove_user
    end
    resources :prompt_questions, only: [ :index, :create ] do
      member do
        post :vote
        delete :unvote
      end
      get :active, on: :collection
      get :archived, on: :collection
      get :suggest, on: :collection
    end

    resources :posts, only: [ :create, :destroy, :index ] do
      post :flag, on: :member
    end
  end

  # Join group via invite code (no group id required)
  post "groups/join_with_code", to: "groups#join_with_invite_code"

  # Routes for the current user
  resource :user, only: [ :show, :update, :destroy ]

  # Routes for other users
  resources :users do
    get :search, on: :collection
  end

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

  mount MissionControl::Jobs::Engine, at: "/jobs"
  # Defines the root path route ("/")
  # root "posts#index"
end
