Rails.application.routes.draw do
  resources :prompt_questions, only: [ :index, :create ] do
    member do
      post :vote
      delete :unvote
    end
    get :active, on: :collection
  end

  resources :posts, only: [ :create, :destroy, :index ]

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

  resource :session
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
