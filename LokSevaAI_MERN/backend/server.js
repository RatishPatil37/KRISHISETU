// Force Google DNS — fixes querySrv ECONNREFUSED on restrictive networks
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const firecrawlRoutes = require("./routes/firecrawl");
const profileRoutes = require("./routes/users");
const { initCronJobs } = require("./services/cronService");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  // Allow CRA dev server (3000), Express itself (5000), and production domain
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/api/firecrawl", firecrawlRoutes);

// MongoDB connection with retry logic
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
};

let mongoRetries = 0;
const MAX_RETRIES = 5;

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTIONS);
    console.log('✅ MongoDB Atlas connected');
    mongoRetries = 0;
    // Start background jobs only after DB is ready and IF not already started
    if (!global.isCronStarted) {
      initCronJobs();
      global.isCronStarted = true;
    }
  } catch (err) {
    mongoRetries++;
    console.error(`❌ MongoDB connection failed (attempt ${mongoRetries}/${MAX_RETRIES}):`, err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error('   ⚠️  DNS/Network issue detected. Check:');
      console.error('   1. MongoDB Atlas IP Whitelist (add 0.0.0.0/0 for dev).');
      console.error('   2. Cluster is not paused in Atlas dashboard.');
      console.error('   3. MONGODB_URI in .env is correct.');
    }
    if (mongoRetries < MAX_RETRIES) {
      console.log(`   Retrying in 5s...`);
      setTimeout(connectMongo, 5000);
    } else {
      console.error('   ❌ Max retries reached. Server running without DB.');
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
  setTimeout(connectMongo, 5000);
});

connectMongo();

// API Routes Status Check (moved from root to /api)
app.get('/api', (req, res) => {
  res.json({ message: 'KRISHISETU Backend API' });
});

// Import routes
const schemeRoutes = require('./routes/schemes');
const userRoutes = require('./routes/users');
const ocrRoutes = require('./routes/ocr');
const cropDoctorRoutes = require('./routes/cropDoctor');
const mspRoutes = require('./routes/msp');
const marketplaceRoutes = require('./routes/marketplace');
const ivrRoutes = require('./routes/ivrRoutes');
const smsRoutes = require('./routes/smsWebhooks');
const whatsappRoutes = require('./routes/whatsappRoutes');

app.use('/api/schemes', schemeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/crop-doctor', cropDoctorRoutes);
app.use('/api/msp', mspRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/voice', ivrRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/whatsapp', whatsappRoutes);

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