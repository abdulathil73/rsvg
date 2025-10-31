# Muscle Gain Coach (local)

This is a lightweight Express + SQLite app that delivers a dark-themed muscle gain coach site with a calorie calculator, progressive 4-month plan, diet sample, and ability to log previous workout max weight/reps.

Assumptions
- User: male, 60 kg, 184 cm, age assumed 25 (change age in the calculator)
- Goal: gain ~5 kg in 3-4 months with progressive overload and +300-500 kcal surplus

Run locally (Windows PowerShell):

1. Open PowerShell in this folder (C:\Users\User\Desktop\rsvg1\webapp)
2. Install dependencies: npm install
3. Start server: npm start
4. Open http://localhost:3000 in your browser

Notes:
- The SQLite DB file `db/coach.db` is created automatically when server starts.
- Use the "Log previous workout max" form to store your lifts; they are saved in the DB and visible in the table.

Hosting this site
------------------

There are a few practical hosting options. The server supports either SQLite (local file) or Postgres when a `DATABASE_URL` is provided. For production reliability use a managed Postgres database (Render, Railway, Heroku add-on, Supabase).

1) Host on Render (recommended for ease)
	- Create a GitHub repository and push this project.
	- Sign up at https://render.com and connect your GitHub account.
	- Create a new Web Service, choose your repository and branch.
	- Build command: `npm install`
	- Start command: `npm start`
	- Add a Postgres database on Render and copy the DATABASE_URL into the Environment section of the Web Service.
	- Render will build and start the app. The app uses Postgres (when `DATABASE_URL` is present) for persistent logs.

2) Host on Railway / Supabase / Vercel
	- Railway: similar to Render; add a Postgres plugin and set `DATABASE_URL`.
	- Vercel is for static sites only; you'd need to split the frontend (static) and backend (deploy elsewhere).

3) Host on a VPS (DigitalOcean, Linode, AWS EC2)
	- Create a small droplet (1GB+) and SSH in.
	- Install Node.js and Docker if you prefer containers.
	- Option A: clone repo, `npm install`, run `npm start` (ensure firewall allows port 3000 or use a reverse proxy like nginx on port 80).
	- Option B: build the provided `Dockerfile` and run `docker run -p 80:3000 -v $(pwd)/db:/app/db your-image` to persist SQLite DB in host volume.

Notes about SQLite vs Postgres
- SQLite stores data in a file (`db/coach.db`) and is fine for single-user or low-traffic uses and when you host on a VPS with a persistent disk.
- Many PaaS providers use ephemeral filesystems (they reset between deploys) so prefer Postgres on those platforms for persistence.

Quick steps to deploy to Render with Postgres
1. Push repo to GitHub.
2. On Render: New -> Web Service -> Connect repo -> set build/start commands above.
3. On Render: New -> Postgres -> create DB -> copy `DATABASE_URL`.
4. In your Web Service's Environment, add `DATABASE_URL` with the value from the Postgres service and deploy.

Docker
- A `Dockerfile` is included for container-based deploys. The image exposes port 3000.

If you want, I can:
- Prepare a ready-to-push Git repo and show the exact git commands to create and push it, or
- Create Render/Railway deployment config files (render.yaml) to make one-click deploy easier.
I prepared deployment automation files to make hosting simple:

- `render.yaml` — Render one-file deploy config (service + Postgres DB).
- `deploy_to_github.ps1` — PowerShell script to initialize git, commit, and push to a GitHub remote you provide.

Automated push steps (PowerShell)
1. Open PowerShell in this folder (C:\Users\User\Desktop\rsvg1\webapp)
2. Run the deploy script with your repository URL:

```powershell
.\deploy_to_github.ps1 -RemoteUrl "https://github.com/<username>/<repo>.git"
```

3. Log in to your GitHub account, verify the repo now has the code, then follow Render steps below to create a web service and a Postgres database. The `render.yaml` file allows Render to auto-detect the service and DB if you enable spec-based deploys.

Materials included:
- `server.js` Express server
- `public/` frontend files (dark theme)
- `db/` DB folder

If you want more polish (authentication, downloadable PDFs, export of plan) I can add that next.
