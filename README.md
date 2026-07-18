# Stratos Hub — Real Estate AI Monorepo

Stratos Hub is an AI-powered co-pilot for real estate agencies, helping them manage listings, qualify leads, and automate client communication across multiple channels (Web, WhatsApp, Messenger, Instagram, TikTok).

## Project Structure

This is a monorepo containing:
- `/frontend`: React application built with TanStack Start, Vite, and Tailwind CSS.
- `/backend`: Bun-based HTTP server using `postgres.js` for database access and Google Gemini for AI.
- `package.json` (root): Orchestrates both frontend and backend development.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.2 or higher)
- [Node.js](https://nodejs.org) (v20 or higher)
- A PostgreSQL database (e.g., Supabase)

### Installation
1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Set up environment variables:
   - Create a `.env` file in `/backend` based on `/backend/.env.example` (if it exists) or ensure the following are set:
     ```env
     DATABASE_URL=your_postgres_uri
     JWT_SECRET=your_random_secret
     GEMINI_API_KEY=your_google_ai_key
     ```
   - (Optional) Create a `.env` in `/frontend`:
     ```env
     VITE_API_BASE_URL=http://localhost:3001
     ```

3. Run migrations:
   The backend auto-migrates the database on startup.

### Development
Start both frontend and backend in development mode:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Production
Build the frontend and start the Bun server:
```bash
npm run build:frontend
cd backend
bun run start
```
In production, the backend serves the built frontend assets from the `/dist` directory.

## Core Features
- **AI Chat Widget**: Embeddable widget for agency websites.
- **Lead Management**: Automated lead capture and scoring.
- **Multilingual Support**: Built-in support for English and Arabic (RTL).
- **Omnichannel**: Integration with Meta (WhatsApp/FB/IG) and TikTok.
- **RAG (Retrieval Augmented Generation)**: Index and search uploaded property PDFs and CSVs.
