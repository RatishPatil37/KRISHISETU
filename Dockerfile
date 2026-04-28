# Use a lightweight Node.js image
FROM node:18-slim

# Install system dependencies for Tesseract OCR and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files
COPY LokSevaAI_MERN/backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install --production

# Copy the rest of the backend code
COPY LokSevaAI_MERN/backend ./backend

# Copy the static Landing Page (as server.js expects it at ../../LokSevaAI/LandingPage)
COPY LokSevaAI/LandingPage ./LokSevaAI/LandingPage

# --- FRONTEND BUILD STEP ---
# Note: In a professional setup, we build frontend on Vercel. 
# But since your server.js is configured to serve the frontend build from '../frontend/build',
# we will prepare the folder structure so the backend doesn't crash.
RUN mkdir -p frontend/build

# Expose the port your backend runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "backend/server.js"]
