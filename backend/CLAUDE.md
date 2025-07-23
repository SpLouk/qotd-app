
- Follow Rails Omakase style (rubocop-rails-omakase)
- no whitespace on empty lines
- Model validations before callbacks, public methods before private
- RESTful controllers with proper error status codes
- Thorough fixtures and tests for all functionality
- Use fixtures and helpers in tests, not hardcoded values

## Prompt Scheduling System

### Architecture
- **PromptQuestion**: Main prompt model with voting, activation lifecycle
- **Group**: Has `prompt_schedule` string field (e.g. "135" = Mon/Wed/Fri, 0-indexed weekdays)
- **PromptVote**: User votes on prompts (uniqueness constraint removed)

### Key Jobs
- **ScheduleDailyPromptActivationsJob**: Runs daily at 12AM, schedules groups for activation
- **ActivatePromptQuestionJob**: Activates winning prompt (most votes) for a group

### Scheduling Logic
- Groups have `prompt_schedule` field storing weekday digits (0=Sunday, 1=Monday, etc.)
- `Group.scheduled_for_day(wday)` scope finds groups scheduled for specific weekday
- `next_scheduled_activation` stores exact datetime (9 AM - 5 PM EST, randomized)
- `Group#will_activate_tomorrow?` checks if group will activate tomorrow

### Activation Process
1. Find most voted prompt via `available_for_voting` scope
2. Deactivate current active prompt 
3. Activate winning prompt, set `activated_at`
4. Update eligibility for remaining prompts
5. Send push notifications to group members
