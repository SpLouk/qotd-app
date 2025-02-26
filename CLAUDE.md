# QOTD App Development Guide

## Project Commands

### Client (React Native/Expo)
- Build: `cd qotd-client && npm start` (or `npm run ios`, `npm run android`, `npm run web`)
- Test: `cd qotd-client && npm test` (Jest with watch mode)
- Lint: `cd qotd-client && npm run lint`
- Reset project: `cd qotd-client && npm run reset-project`

### Backend (Rails)
- Server: `cd backend && bin/rails server`
- Tests: `cd backend && bin/rails test` (single test: `bin/rails test TEST=test/models/user_test.rb:10`)
- Lint: `cd backend && bin/rubocop`
- Security scan: `cd backend && bin/brakeman`

## Code Style Guidelines

### Frontend
- TypeScript with proper interfaces/types for all components and API data
- React functional components with hooks, use React.FC<Props> pattern
- Import order: external libraries, then local imports with @/ prefix
- Error handling: catch errors in API calls, show appropriate UI feedback
- Style with StyleSheet.create(), follow existing naming conventions

### Backend
- Follow Rails Omakase style (rubocop-rails-omakase)
- Model validations before callbacks, public methods before private
- RESTful controllers with proper error status codes
- Thorough fixtures and tests for all functionality
- Use fixtures and helpers in tests, not hardcoded values