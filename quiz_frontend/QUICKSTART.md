# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm/yarn installed
- Backend API running at `http://localhost:8000` (or configure in `.env.local`)

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure environment:**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
quiz_frontend/
├── app/                    # Next.js App Router
│   ├── quizzes/           # Quiz generation and taking
│   ├── flashcards/        # Flashcard creation and viewing
│   ├── essays/            # Essay Q&A generation
│   └── dashboard/         # User analytics and history
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── Layout.tsx         # Main layout wrapper
│   └── Navigation.tsx      # Navigation bar
├── lib/                    # Utilities and API
│   ├── api/               # API client functions
│   └── types/             # TypeScript definitions
└── public/                 # Static assets
```

## Features

### ✅ Quiz Generation

- Generate from URL or PDF
- Configure difficulty and number of questions
- Take quizzes with progress tracking
- View detailed results

### ✅ Flashcards

- Create from URL or PDF
- Interactive flip animation
- Navigate through cards
- View all cards in a set

### ✅ Essay Q&A

- Generate essay questions with full answers
- View key information points
- Navigate through questions

### ✅ Dashboard

- Performance statistics
- Category breakdown
- Recent quiz history
- Strengths and weaknesses analysis

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## API Integration

The frontend connects to the FastAPI backend. Make sure:

1. Backend is running on the configured URL
2. CORS is properly configured in the backend
3. API endpoints match the expected structure

## Troubleshooting

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run build`
- Verify environment variables are set

### API Connection Issues

- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### Suspense Boundary Errors

- All pages using `useSearchParams()` are wrapped in Suspense
- This is required by Next.js 14+ for proper SSR
