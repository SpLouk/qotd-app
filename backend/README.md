# Question of the Day App Backend

This is the backend service for the Question of the Day app.

## Configuration

### Push Notifications (APNs)

To enable push notifications, you need to configure Apple Push Notification service (APNs) credentials. Add the following to your Rails credentials:

```yaml
apns:
  key_id: YOUR_KEY_ID            # From Apple Developer Portal
  team_id: YOUR_TEAM_ID         # Your Apple Developer Team ID
  bundle_id: YOUR_BUNDLE_ID     # Your app's bundle identifier
  key: |
    -----BEGIN PRIVATE KEY-----
    Your APNs authentication key (p8 file contents)
    -----END PRIVATE KEY-----
```

To obtain these credentials:
1. Go to Apple Developer Portal > Certificates, Identifiers & Profiles
2. Create an APNs authentication key
3. Note down the key ID, team ID, and download the p8 file
4. Add the credentials using: `rails credentials:edit`

The app will automatically:
- Send push notifications when new prompts are activated
- Clean up invalid/unregistered device tokens
- Handle both development and production APNs environments

## System Requirements

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...
