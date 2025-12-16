# Teacher Frontend

A Next.js application for teachers/instructors to manage courses, upload PDFs, generate quizzes/flashcards/essays, and monitor student quiz results.

## Features

- **Authentication**: Sign up and login system
- **Course Management**: Create, view, edit, and delete courses
- **PDF Management**: Upload and manage PDFs within courses
- **3-Column Layout**:
  - Left (20%): PDF list and upload
  - Middle (60%): Chat with PDFs or PDF viewer
  - Right (20%): Generate quizzes/flashcards/essays, export, and share
- **Quiz Results Monitoring**: View detailed analytics including:
  - Time spent on quizzes
  - Where students failed
  - Overall statistics and performance metrics

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Query (@tanstack/react-query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Date Formatting**: date-fns

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set your API URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com/
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
teacher_frontend/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── courses/           # Course management
│   │   └── [id]/         # Course detail page
│   ├── results/           # Quiz results dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── course/           # Course-specific components
│   │   ├── PdfSidebar.tsx
│   │   ├── ChatViewer.tsx
│   │   └── GenerationPanel.tsx
│   └── results/          # Results components
│       └── QuizResultsCard.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utility libraries
│   └── api/             # API client functions
│       ├── client.ts
│       ├── auth.ts
│       ├── courses.ts
│       ├── generation.ts
│       └── quiz.ts
└── public/               # Static assets
```

## Design System

Following the "Enterprise AI" aesthetic:
- **Primary Background**: Deep Navy/Black (#0B1221)
- **Secondary Background**: Lighter Navy (#161F32)
- **Text**: White (Headings), Light Gray (#94A3B8 for body)
- **Accents**: Electric Cyan/Blue (#38BDF8) for buttons and highlights
- **Typography**: Inter/Manrope fonts

## API Integration

The frontend integrates with the FastAPI backend:
- Authentication endpoints (`/auth/*`)
- Course/Project endpoints (`/student-projects/*`)
- Generation endpoints (`/generate-*`)
- Quiz results endpoints (`/quiz/*`, `/quiz-statistics/*`)

## Building for Production

```bash
npm run build
npm start
```

## License

Private project - All rights reserved
