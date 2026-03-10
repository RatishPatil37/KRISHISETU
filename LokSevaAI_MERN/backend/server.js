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
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());
app.use(express.json());
app.use("/api/firecrawl", firecrawlRoutes);
app.use("/api/profile", profileRoutes);

// MongoDB connection
mongoose.connect(
  "mongodb+srv://Atharva:Chakravyuh@chakravyuhtwilio.jqd9vn0.mongodb.net/?appName=ChakravyuhTwilio"
)
.then(() => console.log("MongoDB Atlas connected"))
.catch(err => console.log(err));

// API Routes Status Check (moved from root to /api)
app.get('/api', (req, res) => {
  res.json({ message: 'LOKSEVA Backend API' });
});

// Import routes
const schemeRoutes = require('./routes/schemes');
const userRoutes = require('./routes/users');
const ocrRoutes = require('./routes/ocr');
app.use('/api/schemes', schemeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ocr', ocrRoutes);

app.use(express.static(path.join(__dirname, '../../lp')));

app.use('/app', express.static(path.join(__dirname, '../frontend/build')));

// Handle auth callback - serve the React app so React Router can handle /auth/callback
app.get('/auth/callback', (req, res) => {
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