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
const PORT=process.env.PORT||5001;
mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true,useUnifiedTopology:true}).then(()=>{console.log('MongoDB connected')}).catch(e=>console.error(e));
app.listen(PORT,()=>console.log('Server running on',PORT));