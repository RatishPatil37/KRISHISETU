# 🚀 KrishiSetu Deployment Guide — Docker + Render (Free Tier)

This guide deploys your **entire** KrishiSetu application (Landing Page + React Frontend + Node.js Backend) as a **single Docker container** on Render's free tier.

---

## Prerequisites

Before you begin, make sure you have:
- [x] A **GitHub** account (to host your code)
- [x] A **Render.com** account (free signup at https://render.com)
- [x] A **MongoDB Atlas** database (free M0 cluster at https://cloud.mongodb.com)
- [x] **Git** installed on your machine
- [x] Your `.env` values ready (see Step 3 below)

---

## Step 1: Push Your Code to GitHub

If you already have a GitHub repo, skip to the `git add` command.

### Create a new GitHub repository
1. Go to https://github.com/new
2. Name it something like `krishisetu`
3. Set it to **Public** or **Private** (your choice)
4. Do NOT initialize with README (you already have one)
5. Click **Create repository**

### Push your local code
Open a terminal in your project root folder and run:

```powershell
cd "c:\Users\patil\Downloads\KRISHISETU(1)\krishisetu"

# If git is not initialized yet:
git init

# Add your GitHub repo as the remote origin
git remote add origin https://github.com/YOUR_USERNAME/krishisetu.git

# Stage all files
git add .

# Commit
git commit -m "Production-ready: Docker + auth guards + URL fixes"

# Push to GitHub
git push -u origin main
```

> **Note:** If your default branch is `master` instead of `main`, use `git push -u origin master`.

---

## Step 2: Deploy on Render

### 2a. Create a New Web Service
1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your **GitHub account** if you haven't already
4. Find and select your `krishisetu` repository
5. Configure the service:

| Setting | Value |
| :--- | :--- |
| **Name** | `krishisetu` (or any name you like) |
| **Region** | Oregon (US West) or Singapore (closest to India) |
| **Root Directory** | *(leave blank — Dockerfile is in the root)* |
| **Environment** | **Docker** |
| **Plan** | **Free** |

6. Click **Create Web Service**

### 2b. Wait for Initial Build
- Render will detect your `Dockerfile` and start building.
- The first build takes **5–10 minutes** (it installs Node.js, Tesseract OCR, builds React, etc.).
- Subsequent builds (after code pushes) are much faster thanks to Docker layer caching.

---

## Step 3: Set Environment Variables on Render

This is the **most important step**. Your `.env` file is NOT included in the Docker image (for security). You must add each key manually in Render's dashboard.

1. In your Render Web Service, go to **Environment** tab
2. Click **Add Environment Variable** for each of the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API Key |
| `GOOGLE_VISION_API_KEY` | `AIzaSy...` | Google Cloud Vision Key |
| `FIRECRAWL_API_KEY` | `fc-...` | Firecrawl scraping key |
| `TWILIO_ACCOUNT_SID` | `AC...` | Twilio SID (for SMS/WhatsApp) |
| `TWILIO_AUTH_TOKEN` | `b2bb...` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | `+1XXXXXXXXXX` | Your Twilio number |
| `PORT` | `5000` | Must match Dockerfile EXPOSE |
| `NODE_ENV` | `production` | Ensures production optimizations |
| `FRONTEND_URL` | `https://krishisetu.onrender.com` | Your Render URL (update after first deploy) |

3. Click **Save Changes** — Render will automatically re-deploy with the new variables.

---

## Step 4: Update Supabase Auth Redirect URL

Your Google Login uses Supabase OAuth, and Supabase needs to know your new production URL.

1. Go to https://supabase.com → Your Project → **Authentication** → **URL Configuration**
2. Add your Render URL to the **Redirect URLs** list:
   ```
   https://krishisetu.onrender.com/app/auth/callback
   ```
3. Also update **Site URL** to:
   ```
   https://krishisetu.onrender.com
   ```

> ⚠️ **If you skip this step**, Google Login will fail with a "redirect_uri_mismatch" error on the live site!

---

## Step 5: Update MongoDB Atlas Network Access

1. Go to https://cloud.mongodb.com → Your Cluster → **Network Access**
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Click **Confirm**

> This is necessary because Render's free tier uses dynamic IP addresses.

---

## Step 6: Verify Your Deployment

Once Render finishes building, your site will be live at:
```
https://krishisetu.onrender.com
```

### What to test:
- [ ] Landing page loads with animations
- [ ] "Login with Google" button works and redirects correctly
- [ ] After login, the React dashboard loads at `/app`
- [ ] Scheme browsing and filtering works
- [ ] PDF upload + OCR analysis works
- [ ] AI Crop Doctor works
- [ ] MSP Tracker loads data

---

## How Auto-Updates Work

After the initial deploy, updating your live site is automatic:

1. Make changes in VS Code
2. Run `git add .` → `git commit -m "your message"` → `git push`
3. Render detects the push and rebuilds the Docker container automatically
4. Your site is updated with zero downtime!

---

## Troubleshooting

### "Application error" on first visit
The free tier "sleeps" after 15 minutes of inactivity. The first visit after sleep takes ~30 seconds to wake up. This is normal.

### Google Login fails
- Check that Supabase Redirect URLs include your Render domain (Step 4).
- Check that `FRONTEND_URL` env var on Render matches your actual URL.

### MongoDB connection fails
- Ensure `0.0.0.0/0` is whitelisted in Atlas Network Access (Step 5).
- Verify `MONGODB_URI` is correctly pasted in Render env vars.

### OCR/PDF upload fails
- Tesseract is installed by the Dockerfile. If it fails, check Render build logs for errors.
