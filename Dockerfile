# ============================================
# STAGE 1: Build React Frontend
# ============================================
FROM node:20-slim AS frontend-builder

WORKDIR /build

# Copy frontend package files and install deps
COPY LokSevaAI_MERN/frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY LokSevaAI_MERN/frontend/ ./

# Build the production React app (with memory limit to prevent OOM in Docker)
ENV NODE_OPTIONS="--max-old-space-size=1024"

# React bakes REACT_APP_* vars into the JS bundle at compile time.
# These are PUBLIC keys (visible in browser anyway), safe to include here.
ENV REACT_APP_SUPABASE_URL=https://ofvvofbpxwkrnowhzmoh.supabase.co
ENV REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdnZvZmJweHdrcm5vd2h6bW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjc1NzEsImV4cCI6MjA4ODY0MzU3MX0.sscHTe1AqEdqP1e80kx1yX5wzSZNQufueYrjda2gzZU
ENV REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCLRF3A-DDEcERrmi1jItH6rgyGpTYxw-0
ENV REACT_APP_VAPI_PUBLIC_KEY=332d2014-a377-4efd-9787-3daaca164acf
ENV REACT_APP_VAPI_ASSISTANT_ID=77ae3d95-2311-432d-b601-85f52a568ded
ENV REACT_APP_BASE_URL=https://krishisetu-4b5y.onrender.com
ENV GENERATE_SOURCEMAP=false

RUN npm run build


# ============================================
# STAGE 2: Production Server
# ============================================
FROM node:20-slim

# Install system dependencies for Tesseract OCR and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory — mirrors the original project structure
WORKDIR /app

# Copy backend package files and install production deps
COPY LokSevaAI_MERN/backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy the rest of the backend code
COPY LokSevaAI_MERN/backend ./backend

# Copy the static Landing Page
# server.js expects: path.join(__dirname, '../../LokSevaAI/LandingPage')
# __dirname = /app/backend → ../../LokSevaAI/LandingPage = /LokSevaAI/LandingPage
COPY LokSevaAI/LandingPage /LokSevaAI/LandingPage

# Copy the built React app from Stage 1
# server.js expects: path.join(__dirname, '../frontend/build')
# __dirname = /app/backend → ../frontend/build = /app/frontend/build
COPY --from=frontend-builder /build/build ./frontend/build

# Create uploads directory for multer (temporary file storage)
RUN mkdir -p backend/uploads

# Expose the port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "backend/server.js"]
