const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const firecrawlRoutes = require("./routes/firecrawl");
const profileRoutes = require("./routes/users");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/api/firecrawl", firecrawlRoutes);
app.use("/api/profile", profileRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Atlas connected"))
.catch(err => console.log(err));

// API Routes Status Check (moved from root to /api)
app.get('/api', (req, res) => {
  res.json({ message: 'KRISHISETU Backend API' });
});

// Import routes
const schemeRoutes = require('./routes/schemes');
const userRoutes = require('./routes/users');
const ocrRoutes = require('./routes/ocr');
const cropDoctorRoutes = require('./routes/cropDoctor');
app.use('/api/schemes', schemeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/crop-doctor', cropDoctorRoutes);

app.use(express.static(path.join(__dirname, '../../LokSevaAI/LandingPage')));

app.use('/app', express.static(path.join(__dirname, '../frontend/build')));

// Handle auth callback - serve the React app so React Router can handle it
// Both URLs serve the same build/index.html (basename="/app" handles the rest)
app.get('/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.get('/app/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

//catch all `/app` 
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`available at http://localhost:${PORT}`);
});