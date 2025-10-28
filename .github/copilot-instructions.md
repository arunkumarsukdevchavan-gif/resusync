# Resume GenAI - AI Coding Assistant Instructions

## Project Overview
This is a MERN stack application that analyzes resumes against job descriptions using a **custom local AI model** (not OpenAI). The app processes resumes (PDF/text), generates improvement suggestions, creates tailored resumes, and generates cover letters.

## Architecture & Data Flow
- **Backend**: Express.js server (`backend/server.js`) with MongoDB (Resume model in `models/Resume.js`)
- **Frontend**: React SPA with Vite (`frontend/src/App.jsx`) and Tailwind CSS
- **AI Engine**: Custom local model (`backend/ai/localModel.js`) with pure JavaScript NLP processing
- **File Processing**: Multer for uploads, pdf-parse for PDF extraction (route: `/api/resume/analyze`)

## Key Development Patterns

### AI Integration Architecture
- The app uses a **local AI model** (`LocalResumeAI` class), NOT external APIs like OpenAI
- AI logic is in `backend/ai/` with `localModel.js` as the core engine
- Training data in `trainingData.js` provides resume-job matching examples
- Three main AI functions: `analyzeSuggestions()`, `generateResume()`, `generateCover()`

### File Upload & Processing Pattern
```javascript
// Standard upload flow in routes/resume.js
upload.single('resume') // Multer middleware
await extractText(req.file) // PDF parsing with pdf-parse
originalText = (resumeText||'') + '\n' + fileText // Combine text inputs
```

### Frontend Communication
- API endpoint: `http://localhost:5001/api/resume/analyze` (hardcoded, not env var)
- FormData submission with file/text fields: `name`, `email`, `jobDescription`, `resume`/`resumeText`
- Response format: `{success: boolean, data: {suggestions, generated_resume, cover_letter}}`

### Database Schema (Resume model)
Key fields: `name`, `email`, `originalText`, `jobDescription`, `suggestions`, `generatedResume`, `coverLetter`, `createdAt`

## Development Workflow

### Backend Setup
```bash
cd backend
npm install
npm run dev  # Uses nodemon for hot reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Vite dev server on localhost:5173
```

### Environment Configuration
- Backend `.env`: `MONGODB_URI`, `PORT` (defaults to 5001)
- Frontend `.env`: `VITE_API_URL` (optional, defaults to localhost:5000 but backend runs on 5001)

## Project-Specific Conventions

### AI Model Customization
- Extend skill keywords in `localModel.js` constructor: `skillKeywords.technical`, `skillKeywords.soft`, etc.
- Add industry terms in `industryTerms` object for better job matching
- Training data follows specific format in `trainingData.js` with `resume`, `jobDescription`, `suggestions`, `optimizedResume` pairs

### Error Handling Pattern
- Backend returns `{success: false, message: string}` for errors
- Frontend shows alerts for error states
- File processing gracefully falls back if PDF parsing fails

### File Storage
- Uploaded files stored in `backend/uploads/` with random hash names
- No cleanup mechanism implemented - files accumulate
- PDF extraction uses `pdf-parse` library, fallback to UTF-8 text

### State Management (Frontend)
- Single-component state management with React hooks
- Tab-based UI: `suggestions`, `generated_resume`, `cover_letter`
- History feature loads previous analyses by email

## Critical Integration Points
- **Port mismatch**: Frontend expects 5000, backend defaults to 5001
- **CORS setup**: Limited to localhost:5173 and 127.0.0.1:5173
- **MongoDB**: Uses Mongoose with simple connection in `server.js`
- **File processing**: Synchronous file reading in route handlers

When adding features, follow the existing AI model structure and ensure the local NLP processing capabilities are extended rather than introducing external AI dependencies.