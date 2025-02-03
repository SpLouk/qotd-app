Rails.application.routes.draw do
  resources :prompt_questions

  # Routes for other users
  resources :users do
    resource :follow, only: [ :create, :destroy ] do
      put :approve, on: :collection
    end
  end

  # Routes for the current user
  resource :user, only: [ :show, :update ]

  # Get lists of followers/following for the current user
  get "follows", to: "follows#index"

  resource :session
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
