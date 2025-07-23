# QOTD Client - Claude Development Notes

## Architecture Overview

This is a React Native app for a "Question of the Day" social platform where users answer daily prompts and vote on future prompts.

### Key Components Structure

- **app/index.tsx** - Main app entry point with conditional rendering based on user state
- **components/Feed.tsx** - Main feed showing archived prompts and posts
- **components/PromptDrawer.tsx** - Modal for voting on and creating prompts
- **components/PollWidget.tsx** - Facebook Messenger-style poll widget showing vote counts
- **components/Post.tsx** - Individual post component
- **components/PromptResponseWriter.tsx** - Component for answering active prompts

### Data Flow & State Management

- Uses **React Query** (@tanstack/react-query) for API state management and caching
- **GroupContext** provides current group ID throughout the app
- User eligibility for voting is determined by `userData.eligible_to_vote_today` (must answer today's prompt within 30 minutes)

### API Structure

**Base URL Pattern**: `/groups/{groupId}/...`

**Key Endpoints**:
- `GET /groups/{groupId}/prompt_questions` - Get prompts available for voting
- `POST /groups/{groupId}/prompt_questions/{promptId}/vote` - Vote for a prompt
- `POST /groups/{groupId}/prompt_questions` - Create new prompt
- `GET /groups/{groupId}/prompt_questions/archived?page={page}` - Get archived prompts with posts (paginated)

**Key Data Types**:
```typescript
interface PromptQuestion {
  id: string;
  active?: boolean;
  content: string;
  votes_count?: number;
  user_voted?: boolean;
  created_by_username?: string;
  posts?: Post[];
  activated_at?: string;
}

interface User {
  id: number;
  username: string;
  voted_today?: boolean;
  eligible_to_vote_today?: boolean;
  // ... other fields
}
```

### UI Patterns & Conventions

1. **Always use Pressable instead of TouchableOpacity** for better performance and consistency
2. **Colors are centralized** in `constants/Colors.ts` with semantic naming
3. **Poll-specific colors** added for the new poll UI:
   - `pollBackground`, `pollBorder`, `pollSelectedBorder`
   - `pollBarDefault`, `pollBarVoted`, `pollBarBackground`

### Component Communication Patterns

- **Modal Management**: Components that need modals accept `isOpen` and `onClose` props rather than managing internal visibility state
- **Success Messages**: Pass `setSuccessMessage` prop down to components that need to show success feedback
- **Self-contained Components**: Poll widget manages its own PromptDrawer modal rather than relying on parent coordination

### Recent Implementation: Facebook Messenger-style Polls

Implemented a poll system that mimics Facebook Messenger polls:

1. **PollWidget** in Feed shows current vote counts as horizontal bars
2. Tapping the widget opens **PromptDrawer** in poll mode
3. PromptDrawer displays each prompt with:
   - Vote count and percentage
   - Horizontal progress bars showing vote distribution
   - Visual indication of user's current vote
   - Poll-like styling with rounded corners and proper spacing

### Development Notes

- Feed component renders archived prompts with infinite scroll pagination
- User must answer today's prompt within 30 minutes to be eligible for voting on tomorrow's prompt
- Prompts have a 256 character limit
- The app handles different states: loading, no groups, empty groups, needs to write prompt, main feed

### Testing Commands

*Note: Test commands not yet determined - check package.json or ask user for specific test/lint commands to run*