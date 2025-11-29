# Progrezz: Complete User Flow Diagram

## 🎯 Overview
This document outlines the complete user journey from project creation through all available features, designed with senior UX/UI best practices in mind.

---

## 📊 Main User Flow Diagram

```mermaid
flowchart TD
    Start([User Lands on Platform]) --> Auth{Authenticated?}
    Auth -->|No| Register[Register/Login]
    Auth -->|Yes| Dashboard[Dashboard]
    
    Register --> Dashboard
    
    Dashboard --> Nav{Choose Action}
    
    %% Navigation Options
    Nav -->|Student Hub| StudentHub[Student Hub Page]
    Nav -->|Quizzes| QuizzesPage[Quizzes Page]
    Nav -->|Flashcards| FlashcardsPage[Flashcards Page]
    Nav -->|Essays| EssaysPage[Essays Page]
    Nav -->|Analytics| AnalyticsPage[Analytics Dashboard]
    
    %% Student Hub Flow
    StudentHub --> ProjectList{Has Projects?}
    ProjectList -->|No| EmptyState[Empty State<br/>Show Benefits]
    ProjectList -->|Yes| ProjectGrid[Project Grid View]
    
    EmptyState --> CreateProject[Create Project Form]
    ProjectGrid --> CreateProject
    ProjectGrid --> SelectProject[Click Project]
    
    CreateProject --> ValidateName{Name Valid?}
    ValidateName -->|No| ShowError[Show Validation Error]
    ValidateName -->|Yes| CheckLimit{Under Limit?}
    CheckLimit -->|No Free| ShowUpgrade[Show Upgrade Banner]
    CheckLimit -->|Yes| CreateAPI[Create Project API]
    ShowError --> CreateProject
    ShowUpgrade --> PricingPage[Pricing Page]
    CreateAPI --> SuccessToast[Success Toast]
    SuccessToast --> ProjectGrid
    
    SelectProject --> ProjectDetail[Project Detail Page]
    
    %% Project Detail Flow
    ProjectDetail --> ProjectActions{Choose Action}
    
    ProjectActions -->|Upload PDF| UploadFlow[Upload PDF Flow]
    ProjectActions -->|Generate Content| GenerateFlow[Generate Content Flow]
    ProjectActions -->|Chat with PDF| ChatFlow[AI Chat Flow]
    ProjectActions -->|View Content| ViewContentFlow[View Content Flow]
    ProjectActions -->|Delete Project| DeleteConfirm[Delete Confirmation]
    
    %% Upload PDF Flow
    UploadFlow --> UploadMethod{Upload Method?}
    UploadMethod -->|Single File| SingleUpload[Single File Upload]
    UploadMethod -->|Multiple Files| MultiUpload[Multiple Files Upload]
    SingleUpload --> ValidateFile{File Valid?}
    MultiUpload --> ValidateFiles{All Files Valid?}
    ValidateFile -->|No| UploadError[Show Upload Error]
    ValidateFiles -->|No| UploadError
    ValidateFile -->|Yes| UploadAPI[Upload API Call]
    ValidateFiles -->|Yes| UploadAPI
    UploadError --> UploadFlow
    UploadAPI --> UploadSuccess[Upload Success]
    UploadSuccess --> ProjectDetail
    
    %% Generate Content Flow
    GenerateFlow --> SelectPDF[Select PDF from List]
    SelectPDF --> ContentType{Content Type?}
    ContentType -->|Quiz| QuizGen[Quiz Generation]
    ContentType -->|Flashcards| FlashcardGen[Flashcard Generation]
    ContentType -->|Essay| EssayGen[Essay Generation]
    
    QuizGen --> QuizSettings[Quiz Settings<br/>Difficulty, Count]
    FlashcardGen --> FlashcardSettings[Flashcard Settings<br/>Count]
    EssayGen --> EssaySettings[Essay Settings<br/>Difficulty, Count]
    
    QuizSettings --> GenerateAPI[Generate API Call]
    FlashcardSettings --> GenerateAPI
    EssaySettings --> GenerateAPI
    
    GenerateAPI --> JobStatus{Job Status?}
    JobStatus -->|Processing| ShowProgress[Show Progress Indicator]
    JobStatus -->|Complete| GenSuccess[Generation Success]
    JobStatus -->|Error| GenError[Show Error Message]
    ShowProgress --> PollStatus[Poll Job Status]
    PollStatus --> JobStatus
    GenError --> GenerateFlow
    GenSuccess --> ViewGenerated[View Generated Content]
    
    %% View Content Flow
    ViewContentFlow --> ContentList[Content List View]
    ContentList --> ExpandContent{Expand Content?}
    ExpandContent -->|Yes| ShowVersions[Show All Versions]
    ExpandContent -->|No| ContentList
    ShowVersions --> SelectVersion[Select Version]
    SelectVersion --> ViewContent[View Content Detail]
    
    %% Chat Flow
    ChatFlow --> ChatPage[AI Chat Page]
    ChatPage --> ChatInput[Chat Input]
    ChatInput --> SendMessage[Send Message]
    SendMessage --> ChatAPI[Chat API Call]
    ChatAPI --> ChatResponse[Display Response]
    ChatResponse --> ChatInput
    
    %% Content Usage Flows
    ViewGenerated --> UseContent{Use Content?}
    UseContent -->|Quiz| TakeQuiz[Take Quiz Flow]
    UseContent -->|Flashcards| StudyFlashcards[Study Flashcards Flow]
    UseContent -->|Essay| AnswerEssay[Answer Essay Flow]
    
    %% Take Quiz Flow
    TakeQuiz --> QuizPage[Quiz Page]
    QuizPage --> AnswerQuestions[Answer Questions]
    AnswerQuestions --> SubmitQuiz[Submit Quiz]
    SubmitQuiz --> QuizResults[Quiz Results<br/>Score + AI Feedback]
    QuizResults --> ViewAnalytics[View Analytics]
    
    %% Study Flashcards Flow
    StudyFlashcards --> FlashcardView[Flashcard View]
    FlashcardView --> FlipCard[Flip Card]
    FlipCard --> NextCard[Next Card]
    NextCard --> FlashcardView
    
    %% Answer Essay Flow
    AnswerEssay --> EssayPage[Essay Page]
    EssayPage --> WriteAnswers[Write Answers]
    WriteAnswers --> SubmitAll[Submit All Answers]
    SubmitAll --> EssayFeedback[Essay Feedback<br/>Score + AI Feedback]
    EssayFeedback --> ViewAnswers[View Correct Answers]
    
    %% Delete Flow
    DeleteConfirm --> ConfirmDelete{Confirm Delete?}
    ConfirmDelete -->|Yes| DeleteAPI[Delete API Call]
    ConfirmDelete -->|No| ProjectDetail
    DeleteAPI --> DeleteSuccess[Delete Success]
    DeleteSuccess --> StudentHub
    
    %% Analytics Flow
    AnalyticsPage --> ViewStats[View Statistics]
    ViewStats --> PerformanceTrends[Performance Trends]
    ViewStats --> RecentActivity[Recent Activity]
    ViewStats --> CategoryBreakdown[Category Breakdown]
    
    style Start fill:#e1f5ff
    style Dashboard fill:#c8e6c9
    style StudentHub fill:#fff3e0
    style ProjectDetail fill:#f3e5f5
    style UploadFlow fill:#e3f2fd
    style GenerateFlow fill:#fce4ec
    style ChatFlow fill:#e0f2f1
    style TakeQuiz fill:#fff9c4
    style StudyFlashcards fill:#f1f8e9
    style AnswerEssay fill:#fce4ec
    style AnalyticsPage fill:#e8eaf6
```

---

## 🔄 Detailed Sub-Flows

### 1. Project Creation Flow (Detailed)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Student Hub UI
    participant API as Backend API
    participant DB as Database
    
    U->>UI: Navigate to Student Hub
    UI->>API: GET /student-projects
    API->>DB: Query projects
    DB-->>API: Return projects
    API-->>UI: Projects list
    
    alt No projects exist
        UI->>U: Show empty state with benefits
    else Projects exist
        UI->>U: Display project grid
    end
    
    U->>UI: Click "Create Project"
    UI->>U: Show creation form
    
    U->>UI: Enter project name
    U->>UI: (Optional) Enter description
    
    U->>UI: Click "Create Project"
    UI->>UI: Validate name (required)
    
    alt Name invalid
        UI->>U: Show validation error
    else Name valid
        UI->>API: POST /student-projects
        API->>API: Check project limit
        
        alt At free tier limit
            API-->>UI: 403 Error
            UI->>U: Show upgrade banner
        else Under limit
            API->>DB: Create project
            DB-->>API: Project created
            API-->>UI: Success response
            UI->>U: Show success toast
            UI->>API: Refresh projects list
            UI->>U: Update project grid
        end
    end
```

### 2. PDF Upload Flow (Detailed)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Project Detail UI
    participant API as Backend API
    participant Storage as File Storage
    
    U->>UI: Navigate to project detail
    U->>UI: Click "Upload PDF"
    UI->>U: Show upload dialog
    
    U->>UI: Select file(s)
    UI->>UI: Validate file(s)
    
    alt Invalid file(s)
        UI->>U: Show error (size/type)
    else Valid file(s)
        UI->>U: Show upload progress
        UI->>API: POST /student-projects/{id}/content
        API->>Storage: Upload file(s)
        Storage-->>API: Upload success
        API->>API: Create content records
        API-->>UI: Success response
        UI->>U: Show success message
        UI->>API: Refresh content list
        UI->>U: Update PDF list
    end
```

### 3. Content Generation Flow (Detailed)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Project Detail UI
    participant API as Backend API
    participant AI as AI Service
    participant DB as Database
    
    U->>UI: Click "Generate" on PDF
    UI->>U: Show content type selector
    
    U->>UI: Select content type (Quiz/Flashcard/Essay)
    UI->>U: Show settings modal
    
    U->>UI: Configure settings
    U->>UI: Click "Generate"
    UI->>API: POST /quizzes or /flashcards or /essays
    
    API->>API: Create generation job
    API->>DB: Store job status
    API-->>UI: Return job ID
    
    UI->>U: Show progress indicator
    UI->>API: Poll job status
    
    API->>AI: Generate content
    AI-->>API: Generated content
    
    API->>DB: Store generated content
    API->>DB: Update job status
    API-->>UI: Job complete
    
    UI->>U: Show success message
    UI->>U: Display generated content
```

### 4. Quiz Taking Flow (Detailed)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Quiz Page
    participant API as Backend API
    participant AI as AI Feedback Service
    
    U->>UI: Navigate to quiz
    UI->>API: GET /quizzes/{id}
    API-->>UI: Quiz data
    
    UI->>U: Display questions
    U->>UI: Answer questions
    
    U->>UI: Click "Submit Quiz"
    UI->>API: POST /quizzes/{id}/attempts
    
    API->>API: Calculate score
    API->>AI: Generate feedback
    AI-->>API: Feedback text
    API->>API: Store attempt
    
    API-->>UI: Results (score + feedback)
    UI->>U: Display results page
    UI->>U: Show correct answers
    UI->>U: Show AI feedback
```

---

## 🎨 UX/UI Best Practices Applied

### 1. **Progressive Disclosure**
- ✅ Empty states guide users
- ✅ Settings hidden until needed
- ✅ Content versions collapsed by default

### 2. **Feedback & Status**
- ✅ Loading states for all async operations
- ✅ Success/error toasts
- ✅ Progress indicators for long operations
- ✅ Job status polling for generation

### 3. **Error Handling**
- ✅ Validation before submission
- ✅ Clear error messages
- ✅ Graceful degradation
- ✅ Retry mechanisms

### 4. **Accessibility**
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ ARIA labels

### 5. **Performance**
- ✅ Lazy loading
- ✅ Optimistic updates
- ✅ Caching strategies
- ✅ Pagination for large lists

### 6. **User Guidance**
- ✅ Tooltips for complex features
- ✅ Help text in forms
- ✅ Onboarding for first-time users
- ✅ Contextual help

---

## 📱 Key User Journeys

### Journey 1: First-Time User Creates Project
1. User registers/logs in
2. Navigates to Student Hub
3. Sees empty state with benefits
4. Creates first project
5. Uploads PDF
6. Generates quiz
7. Takes quiz
8. Views feedback

### Journey 2: Returning User Adds Content
1. User logs in
2. Navigates to existing project
3. Uploads new PDF
4. Generates flashcards
5. Studies flashcards
6. Generates essay
7. Answers essay questions

### Journey 3: Power User Manages Multiple Projects
1. User navigates to Student Hub
2. Views all projects
3. Switches between projects
4. Manages content across projects
5. Views analytics dashboard
6. Tracks progress

---

## 🔍 Key Decision Points

### Project Creation
- **Limit Check**: Free tier (3 projects) vs Pro (unlimited)
- **Validation**: Name required, description optional
- **Success**: Immediate feedback + list update

### Content Generation
- **Job Status**: Async processing with polling
- **Error Handling**: Retry or show error
- **Success**: Display in content list

### Content Usage
- **Quiz**: Immediate results + AI feedback
- **Flashcards**: Interactive study mode
- **Essays**: Submit all → get feedback → view answers

---

## 🚀 Future Enhancements (UX Recommendations)

1. **Onboarding Tour**: Interactive guide for first-time users
2. **Templates**: Pre-configured project templates
3. **Bulk Operations**: Select multiple items for actions
4. **Search & Filter**: Find content quickly
5. **Keyboard Shortcuts**: Power user features
6. **Export Options**: Download content in various formats
7. **Collaboration**: Share projects with others
8. **Notifications**: Alerts for completed generations
9. **Dark Mode**: Theme preference
10. **Mobile Optimization**: Better mobile experience

---

## 📊 User Flow Metrics to Track

1. **Project Creation**: Time to create, success rate
2. **PDF Upload**: Upload success rate, average time
3. **Content Generation**: Generation time, success rate
4. **Content Usage**: Completion rates, engagement
5. **Error Rates**: Where users encounter issues
6. **Drop-off Points**: Where users abandon flows

---

*Last Updated: 2025-01-15*
*Version: 1.0*

