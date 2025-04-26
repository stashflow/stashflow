# Stash - Class Notes Sharing Platform

Stash is a modern web application that allows students to share and discover class notes. Built with React, TypeScript, and Supabase, it features a beautiful UI powered by Tailwind CSS and Shadcn/UI components.

## Features

- 📚 Browse and search class notes
- 📤 Upload and share your notes
- 🔒 Secure Google authentication
- 💾 File storage with Supabase Storage
- 🎨 Beautiful and responsive UI
- 🌙 Dark mode by default

## Tech Stack

- React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/UI for components
- Supabase for backend (Auth, Database, Storage)
- React Router for navigation
- React Query for data fetching
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stash.git
   cd stash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the Supabase database:
   - Go to your Supabase project's SQL editor
   - Run the SQL commands from `supabase/migrations/20240320000000_initial_schema.sql`

5. Configure Google Auth in Supabase:
   - Go to your Supabase project settings
   - Navigate to Authentication > Providers
   - Enable and configure Google OAuth
   - Add your domain to the allowed redirect URLs

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── integrations/    # External service integrations
├── lib/            # Utility functions and constants
├── pages/          # Page components
└── App.tsx         # Root component
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
