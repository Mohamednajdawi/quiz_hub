# Quiz Frontend

A modern, responsive frontend for the Quiz Maker API built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Quiz Generation**: Create quizzes from URLs or PDFs
- 📚 **Flashcards**: Generate interactive flashcards for studying
- ✍️ **Essay Q&A**: Create essay questions with detailed answers
- 📊 **Dashboard**: Track your performance and analytics
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- ⚡ **Fast**: Built with Next.js 14+ App Router
- 🔒 **Type Safe**: Full TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (see `quiz_backend` directory)

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your backend API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
quiz_frontend/
├── app/                    # Next.js App Router pages
│   ├── quizzes/           # Quiz pages
│   ├── flashcards/        # Flashcard pages
│   ├── essays/            # Essay Q&A pages
│   └── dashboard/         # Dashboard page
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── Layout.tsx         # Main layout wrapper
│   └── Navigation.tsx     # Navigation component
├── lib/                    # Utilities and API clients
│   ├── api/               # API client functions
│   └── types/             # TypeScript type definitions
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **date-fns** - Date formatting

## Features in Detail

### Quiz Generation

- Generate quizzes from URLs or PDF uploads
- Configure difficulty level (easy, medium, hard)
- Set number of questions
- Take quizzes with real-time progress tracking
- View detailed results with correct/incorrect answers

### Flashcards

- Create flashcard sets from URLs or PDFs
- Interactive flip animation
- Navigate through cards
- View all cards in a set

### Essay Q&A

- Generate essay questions with full answers
- View key information points
- Navigate through questions
- Store essay answers (when user authentication is implemented)

### Dashboard

- View quiz statistics (total quizzes, average score, best score)
- Performance trend visualization
- Category performance breakdown
- Strengths and weaknesses analysis
- Recent quiz history

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: http://localhost:8000)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
