# 🚀 ResuSync - AI Resume Builder

## Quick Start

### Option 1: Automatic Startup (Recommended)
Double-click one of these files to start both servers automatically:

- **`start-resusync.bat`** - Batch file startup
- **`start-resusync.ps1`** - PowerShell startup (more features)

### Option 2: Manual Startup
Open two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend  
npm run dev
```

### Option 3: From Root Directory
```bash
# Start backend only
npm run start:backend

# Start frontend only  
npm run start:frontend

# Quick start with batch file
npm run quick-start
```

## URLs
- **Website:** http://localhost:5173
- **API:** http://localhost:5001
- **Health Check:** http://localhost:5001/api/health

## Troubleshooting

### If you see "This site can't be reached"
1. Run `troubleshoot.ps1` to check system status
2. Make sure both servers are running
3. Check if ports 5001 and 5173 are available
4. Try the automatic startup scripts

### If ports are in use
```bash
taskkill /F /IM node.exe
```

### Common Issues
- **Connection Refused:** Run startup scripts instead of manual commands
- **Port in Use:** Kill existing processes first
- **Scripts Won't Run:** Right-click → "Run as Administrator"

## Features
- ✅ AI-powered resume analysis
- ✅ Job description matching
- ✅ Resume optimization suggestions
- ✅ Cover letter generation  
- ✅ PDF downloads (client-side)
- ✅ History tracking
- ✅ Professional UI

## Development
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite + Tailwind CSS
- **AI:** Custom local model (no external APIs)
- **PDF:** Client-side generation with jsPDF

---
*For technical issues, check the troubleshoot.ps1 script output*