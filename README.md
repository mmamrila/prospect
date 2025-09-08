# ProspectAI

A professional AI-powered prospecting and sales intelligence platform that helps sales teams find, organize, and engage with high-quality prospects.

## Features

- **Advanced Search**: Find contacts by industry, position, company size, and more
- **AI-Powered Insights**: Get intelligent recommendations and contact scoring
- **List Management**: Create, organize, and manage prospect lists efficiently
- **Export Capabilities**: Export lists to CSV for use in other tools
- **User Management**: Secure authentication and profile management
- **Professional Dashboard**: Analytics and performance tracking

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, JWT Authentication
- **Database**: SQLite (development), PostgreSQL (production)
- **AI Integration**: OpenAI API for enhanced prospecting insights

## Getting Started

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 to view the application

## Project Structure

```
prospectai/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── shared/          # Shared types and utilities
└── docs/           # Documentation
```

## Development

- Frontend runs on http://localhost:3000
- Backend API runs on http://localhost:5000
- Database admin interface available at http://localhost:5000/admin

## License

MIT License - see LICENSE file for details