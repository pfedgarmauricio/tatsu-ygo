# Tatsu YGO - Deployment Guide

## Overview

This guide covers deploying Tatsu YGO in two ways:
1. **Docker + Cloud Hosting** (recommended for full-stack deployment)
2. **GitHub Pages + External API** (static frontend only)

---

## Option 1: Docker Deployment (Recommended)

### Local Docker Testing

Build the image locally:

```bash
docker build -t tatsu-ygo:latest .
```

Run the container:

```bash
docker run -p 3001:3001 -v $(pwd)/data:/app/data tatsu-ygo:latest
```

Access the app at `http://localhost:3001`

The `-v` flag persists tournament data on your host machine.

### Deploy to Cloud Platforms

#### Railway (Recommended - Simplest)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Click "New Project" → "Deploy from GitHub"
4. Select the tatsu-ygo repository
5. Railway auto-detects the Dockerfile
6. Set environment variables if needed
7. Deploy with one click!

Railway gives you a public URL automatically.

#### Docker Hub + Cloud Run (Google Cloud)

**Build and push to Docker Hub:**

```bash
docker build -t yourusername/tatsu-ygo:latest .
docker push yourusername/tatsu-ygo:latest
```

**Deploy to Google Cloud Run:**

```bash
gcloud run deploy tatsu-ygo \
  --image yourusername/tatsu-ygo:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --port 3001
```

#### AWS ECS

1. Push image to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag tatsu-ygo:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tatsu-ygo:latest
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tatsu-ygo:latest
```

2. Create ECS task definition and service pointing to the image

#### Heroku (Classic - Note: Eco Dynos now require paid plans)

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Push to Heroku
git push heroku main

# View logs
heroku logs --tail
```

---

## Option 2: GitHub Pages + External API

### Overview

GitHub Pages only hosts **static content**. To use this approach:
- Frontend: Hosted on GitHub Pages (free)
- Backend API: Hosted separately (Netlify, Vercel, Railway, etc.)

### Step 1: Update Vite Config for GitHub Pages

In `vite.config.ts`, add the `base` configuration:

```typescript
export default defineConfig({
  base: '/tatsu-ygo/',  // Replace 'tatsu-ygo' with your repo name
  plugins: [preact()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

### Step 2: Build Frontend

```bash
npm run build
```

This creates a `dist/` folder with static files.

### Step 3: Deploy Frontend to GitHub Pages

#### Using GitHub Actions (Automatic)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Push to main, and GitHub Actions automatically deploys to GitHub Pages.

#### Manual Deployment

```bash
# Build
npm run build

# Deploy dist folder to gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
cp -r dist/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push -u origin gh-pages
```

Then enable GitHub Pages in repo settings → Pages → Source: `gh-pages` branch.

### Step 4: Deploy Backend API

Choose one of these serverless options:

#### Netlify Functions

1. Create `netlify/functions/api.js`:

```javascript
const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Your Express app code here
app.use(express.json());
app.get('/api/tournaments', (req, res) => {
  // Your logic
});

module.exports.handler = serverless(app);
```

2. Deploy: `netlify deploy --prod`

#### Vercel Functions

1. Move server code to `api/` directory
2. Create `api/tournaments.js`:

```javascript
export default function handler(req, res) {
  if (req.method === 'GET') {
    // Your logic
    res.status(200).json({ /* data */ });
  }
}
```

3. Deploy: `vercel deploy --prod`

#### Railway (Recommended)

Deploy just the backend API separately:

1. Create a new Railway project
2. Deploy the `server/` directory with Node.js
3. Railway provides an API URL
4. Update frontend to call `https://your-railway-api.up.railway.app/api`

### Step 5: Update Frontend API Endpoint

In your frontend code, update the API base URL:

Create `.env.production`:

```
VITE_API_URL=https://your-api-domain.com
```

In your fetch calls:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const response = await fetch(`${API_URL}/api/tournaments`);
```

---

## Environment Variables

### Docker Deployment

Create `.env` file or pass via Docker:

```bash
docker run -e PORT=3001 -p 3001:3001 tatsu-ygo:latest
```

### Platform-Specific Setup

#### Railway

Set environment variables in Railway dashboard:
- `NODE_ENV=production`
- `PORT=3001`

#### Google Cloud Run

```bash
gcloud run deploy tatsu-ygo \
  --set-env-vars NODE_ENV=production,PORT=3001
```

---

## Persistence & Data Storage

### Docker with Volumes

```bash
docker run -v /path/to/data:/app/data -p 3001:3001 tatsu-ygo:latest
```

### Cloud Deployment Options

**Railway/Heroku:** Data persists in ephemeral storage (resets on redeploy)

**Production Solutions:**
- PostgreSQL database
- MongoDB Atlas (cloud database)
- AWS S3 + RDS
- Google Cloud Firestore

Update `server/index.ts` to use a database instead of file system.

---

## Monitoring & Logs

### Docker

```bash
docker logs <container_id>
docker stats <container_id>
```

### Railway

Dashboard → Logs tab (real-time streaming)

### Google Cloud Run

```bash
gcloud run logs read tatsu-ygo --limit 50
```

### Heroku

```bash
heroku logs --tail
```

---

## Performance Tips

1. **Enable CORS caching:** Set appropriate cache headers in Express
2. **Compress responses:** Add compression middleware
3. **Database indexes:** If using DB, index `playerA` and `playerB` in matches
4. **Caching:** Implement Redis for tournament standings

---

## Troubleshooting

### Port already in use

```bash
docker run -p 3002:3001 tatsu-ygo:latest  # Use different host port
```

### Data not persisting

Ensure volume mount is correct:
```bash
docker run -v /full/path/to/data:/app/data tatsu-ygo:latest
```

### CORS errors in frontend

Update `server/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### GitHub Pages 404 on routes

This is expected! GitHub Pages doesn't support client-side routing. Use hash-based routing or add a `_redirects` file if using Netlify.

---

## Quick Start Commands

**Full Stack Docker:**
```bash
docker build -t tatsu-ygo .
docker run -p 3001:3001 -v $(pwd)/data:/app/data tatsu-ygo
```

**GitHub Pages + Railway:**
```bash
npm run build
# Push dist/ to gh-pages branch
# Deploy server/ to Railway separately
```

**Local Development:**
```bash
npm install
npm run dev  # Starts both frontend and backend
```

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Railway.app Docs](https://docs.railway.app/)
- [GitHub Pages Guide](https://pages.github.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vercel Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
