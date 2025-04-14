# FintechToronto.com

A community website for fintech enthusiasts in Toronto. This application uses Next.js as the frontend framework, with Supabase for database and authentication, and Sanity CMS for content management.

## Architecture

This project uses a hybrid architecture that leverages the strengths of both Supabase and Sanity CMS:

- **Supabase**: Handles authentication, user data, and structured content metadata
- **Sanity CMS**: Manages rich content with a powerful editing interface
- **Next.js**: Server-side rendering and routing
- **TailwindCSS**: Styling with shadcn/ui components

## Integration Workflow

The integration between Supabase and Sanity works as follows:

1. **Content Creation**:
   - Users draft articles in the custom editor within the dashboard
   - Content is initially stored in Supabase with a "draft" status

2. **Content Submission**:
   - Users submit their drafts for review
   - Supabase status is updated to "submitted"

3. **Content Review**:
   - Admins review submissions in the admin panel
   - They can approve or reject content

4. **Content Publication**:
   - When approved, content is automatically synced to Sanity CMS
   - The content is now available via both Supabase and Sanity
   - Sanity Studio can be used for further content editing and management

5. **Content Display**:
   - Public-facing content is fetched from Sanity using GROQ queries
   - Dynamic/personalized content utilizes Supabase data

## Admin Panel Features

- **Dashboard**: Overview of key metrics
- **Submissions**: Review and approve user-submitted content
- **Users**: Manage user accounts and permissions
- **Series**: Organize articles into curated collections
- **Tags**: Manage content categorization
- **Settings**: Configure site settings
- **Sanity Studio**: Direct link to Sanity Studio for content management

## Development Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/fintechtoronto.git
   cd fintechtoronto
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables by copying `.env.example` to `.env.local` and filling in the values:
   ```
   cp .env.example .env.local
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Visit `http://localhost:3000` to see the application

6. Access Sanity Studio at `http://localhost:3000/studio`

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for client operations
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for admin operations
- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Your Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET`: Your Sanity dataset (usually "production")
- `SANITY_API_TOKEN`: Sanity API token with write permission (for syncing content)

## Verifying Sanity Token Permissions

To verify that your Sanity token has the correct permissions:

1. Run the verification script:
   ```bash
   node scripts/verify-sanity-token.js
   ```

2. The script checks if the token can:
   - Create and delete documents (write permission)
   - Fetch documents (read permission)

3. If you see permission errors, verify that:
   - Your token has both read and write permissions in the Sanity dashboard
   - The token is correctly set in your `.env.local` file as `SANITY_API_TOKEN`
   - Your project ID and dataset name are correctly configured

## Deployment

This project can be deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Ffintechtoronto)

This application is configured for deployment on AWS Amplify. For detailed deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT.md).

### AWS Amplify Deployment

1. Connect your GitHub repository to AWS Amplify
2. Set the required environment variables in the Amplify Console
3. The build process will automatically use the configuration in `amplify.yml`

### Environment Variables

Make sure to set the following environment variables in the Amplify Console:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
SANITY_API_TOKEN=your_sanity_token
NOVU_API_KEY=your_novu_api_key
```

### Verifying Environment Setup

You can verify your environment setup by running:

```bash
pnpm verify-env
```

This will check if your service role key is configured correctly.

## Features

- Blog posts with series categorization (Hashnode-style)
- Event listings with registration links
  - Calendar integration with Cal.com
  - Event reminder notifications through Novu
  - Registration management
  - Event countdown timers
- Newsletter subscription and management
- Modern UI with light/dark mode
- Sanity CMS integration
- Supabase for authentication and data storage
- Novu for notifications and newsletters

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- shadcn UI components
- Sanity CMS
- Supabase
- Novu
- Cal.com (for calendar integration)

## Prerequisites

- Node.js 18+
- npm
- Sanity account
- Supabase account
- Novu account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fintechToronto.com.git
cd fintechToronto.com
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables file and fill in your values:
```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Your Sanity project ID
- `SANITY_TOKEN`: Your Sanity API token
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NOVU_API_KEY`: Your Novu API key
- `CALCOM_API_KEY`: Your Cal.com API key (optional, for calendar integration)

4. Set up Sanity:
```bash
npm create sanity@latest
```
Choose the following options:
- Create a new project
- Use the default dataset configuration
- Use the provided schemas

5. Set up Supabase:
- Create a new project in Supabase
- Run the SQL from `supabase/setup.sql` in the SQL editor
- Run the events migration from `supabase/migrations/20240707_create_events_tables.sql`
- Enable Row Level Security (RLS)

6. Set up Novu:
- Create a new account at novu.co
- Create notification templates for newsletters and events
- Add the API key to your environment variables

7. Set up Cal.com (optional):
- Create an account at Cal.com
- Set up event types for your organization
- Generate an API key and add it to your environment variables

8. Run the development server:
```bash
npm run dev
```

## Deployment

The project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add your environment variables
4. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
