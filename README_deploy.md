# Deployment Guide for AI Code Analyzer

## Frontend (Vite + React) – Vercel
1. Install Vercel CLI (once): `npm i -g vercel`
2. Login: `vercel login`
3. From the `client` folder run:
```bash
cd client
vercel
```
   * Accept defaults, set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. After the first deploy, add an environment variable in Vercel:
   - **Key:** `VITE_API_URL`
   - **Value:** `<YOUR_RENDER_BACKEND_URL>`
5. Redeploy with `vercel --prod`.

## Backend (Express) – Render
1. Go to the Render dashboard → **New** → **Web Service**.
2. Connect the GitHub repo `pranita5406/Ai-code-analyzer` and set **Root Directory** to `server`.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add required environment variables (Supabase keys, Gemini API key, Redis URL, `CLIENT_URL` = the Vercel URL) via the Render UI.
6. Click **Create Web Service** – Render will give you a URL like `https://ai-code-analyzer.onrender.com`.

## CORS Configuration (already in `server/src/index.js`)
```js
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
```
Make sure `CLIENT_URL` matches the Vercel URL.

## Final Steps
1. Verify the frontend can successfully call the backend (check Network tab in browser).
2. If any errors appear, inspect the logs:
   - Vercel → **Deployments** → **View Build Logs**
   - Render → **Service** → **Logs**
3. Commit any further changes and push; Render will auto‑redeploy.
