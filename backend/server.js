const express=require('express');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const cors=require('cors');
const resumeRouter=require('./routes/resume');
const authRouter=require('./routes/auth');

const app=express();
dotenv.config();

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:5174', 
    'http://127.0.0.1:5175',
    'https://resusync.me',
    'https://www.resusync.me',
    'https://resusync-*.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/resume',resumeRouter);
app.use('/api/auth',authRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'ResuSync API is running with Enhanced AI'
  });
});

const PORT=process.env.PORT||5001;
const HOST = process.env.HOST || '0.0.0.0';

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true,useUnifiedTopology:true})
  .then(async () => {
    console.log('MongoDB connected');
    console.log('🚀 Server ready - Enhanced AI will initialize on first request');
  })
  .catch(e => console.error(e));

const server = app.listen(PORT, HOST, () => {
  console.log('Server running on', PORT);
  console.log('Bound host:', HOST);
  console.log('Server listening on:', server.address());
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack trace:', reason?.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});