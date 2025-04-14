# Project Kanban Board

## 📋 To Do

- **[HIGH]** Fix series creation RLS policy violation (#1)
  - Resolve Row-Level Security issues preventing admins from creating series
  - Update service role key handling in API routes
  - Apply RLS policies to the series table
  - Add proper logging to debug environment variable issues

## 🔄 In Progress

- None currently

## ✅ Done

- Create API routes for series management
- Implement server-side handling for admin operations
- Add documentation for series management functionality
- **[NEW]** Integrate PostHog Analytics (#2)
  - Add PostHog JavaScript client
  - Create analytics provider component
  - Implement user identification
  - Track page views and key user actions
  - Set up persistent super properties for user segmentation 