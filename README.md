# ResuSync - AI-Powered Resume Customization Tool

## Live Demo
🌐 **Visit**: [resusync.me](https://resusync.me)

## Features
- AI-powered resume analysis and optimization
- Custom resume generation with exact template compliance
- PDF generation and preview functionality
- Google OAuth authentication
- Local NLP model for data privacy

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **AI Engine**: Custom local NLP model
- **PDF Generation**: Puppeteer
- **Authentication**: Google OAuth 2.0

## Deployment
- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Railway
- **Database**: MongoDB Atlas

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB
- Git

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. Environment Variables:
   ```bash
   # Backend (.env)
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001
   
   # Frontend (.env)
   VITE_API_URL=http://localhost:5001
   ```

4. Run the application:
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

## Author
Built with ❤️ for efficient resume customization

