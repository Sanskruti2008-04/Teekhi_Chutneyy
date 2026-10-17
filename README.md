# CivicFix Sentinel

A civic issue reporting and resolution platform for potholes, water leaks, garbage, broken streetlights, and other local issues.

## Problem
Civic issues are often reported repeatedly, difficult to prioritize transparently, and hard for residents to track after submission.

## Solution
CivicFix Sentinel combines geospatial duplicate detection, an explainable priority score, an admin workflow, and a citizen verification loop so reports move from `reported` to `verified`.

## Features
- JWT registration/login with citizen/admin roles.
- Create reports with category, severity, photos, and a Leaflet map pin.
- Duplicate Shield: active reports of the same category within 50 metres are suggested instead of creating a duplicate; citizens can upvote and append photos.
- Server-computed priority: `severity × 10 + upvotes × 2 + days unresolved × 3`.
- Admin priority queue with score breakdown, team assignment, in-progress status, after-photo requirement, and resolution timestamp.
- Citizen dashboard with five-stage progress and before/after photos; citizens can verify resolved work.
- Nearby map/list using browser geolocation.
- Stats page with totals, average resolution time, category/status breakdown, and Recharts chart.
- Responsive interface, toast feedback, empty/loading states, keyboard focus styles.
- Cloudinary unsigned upload when configured; data-URL fallback when Cloudinary is not configured.
- Vercel and Render deployment configuration included.

## Tech Stack
- React + Vite: quick, component-driven SPA development.
- Tailwind CSS: consistent responsive styling without a large component framework.
- React Leaflet + OpenStreetMap: free, open map tiles and easy marker interaction; unlike Google Maps, no API key/billing setup is needed for the demo (respect tile usage policies).
- Recharts: straightforward React charts for civic statistics.
- react-hot-toast: clear action feedback.
- Node.js + Express: small, familiar JSON API with separated routes/controllers/models.
- JWT + bcryptjs: stateless API sessions and password hashing.
- MongoDB Atlas: managed database; GeoJSON `Point` and a `2dsphere` index support efficient `$near` searches in metres. A relational database can model geography too, but MongoDB makes the document + GeoJSON workflow concise for this prototype.
- Cloudinary: managed image hosting via unsigned upload preset; local data-URL fallback keeps the app demonstrable without cloud credentials.
- Vercel + Render: simple Git-based deployments for a Vite frontend and Node API. Alternatives such as a single VPS offer more control but require more server maintenance.

## Setup / Usage

Requirements: Node.js 18+, npm, and a MongoDB database. Run two terminals.

### 1. Configure server
```bash
cd server
cp .env.example .env
npm install
```
Set `MONGODB_URI`, a long random `JWT_SECRET`, and optionally `CLIENT_URL`, `CLOUDINARY_CLOUD_NAME`, and `CLOUDINARY_UPLOAD_PRESET`.

Create an admin account by registering normally, then promote that user in MongoDB Atlas:
```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```
Never expose the database credentials or JWT secret in the browser.

### 2. Configure client
```bash
cd ../client
cp .env.example .env
npm install
npm run dev
```
Set `VITE_API_URL=http://localhost:5000/api`. Open the URL printed by Vite.

### 3. Run API
In another terminal:
```bash
cd server
npm run dev
```
API health check: `http://localhost:5000/api/health`.

### Using the app
1. Register as a citizen and sign in.
2. Open **Report issue**, fill in the form, click the map to choose a location, and add photos.
3. If the Duplicate Shield finds an active issue within 50 metres, choose **Upvote existing issue** to add support and optionally append the photos.
4. Admin users can open **Admin**, assign a team, mark a report in progress, upload an after-photo, then resolve it.
5. The report owner can open **My reports** and select **Verify Resolution** once resolved.
6. Open **Nearby** and allow browser location access to see nearby active reports; open **Stats** for charts.

## Environment variables

See `server/.env.example` and `client/.env.example`. Base64 photo fallback is useful for demos but should not be treated as a production image CDN; configure Cloudinary for public deployments.

## Deployment

### MongoDB Atlas
1. Create a free/shared cluster in MongoDB Atlas.
2. Create a database user with a strong password.
3. In **Network Access**, allow your deployment environment. For a hackathon demo, `0.0.0.0/0` works but is less restrictive; use tighter IP rules where practical.
4. Copy the Node.js connection string, replace the password, and set the database name, e.g. `civicfix`.

### Render (server)
1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository; Render reads `render.yaml`.
3. Set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` in the Render service environment. Add Cloudinary values if available.
4. Deploy. Verify `https://YOUR-API.onrender.com/api/health`.
5. Copy the API base URL ending in `/api`.

### Vercel (client)
1. Import the same GitHub repository into Vercel.
2. Set the **Root Directory** to `client`.
3. Vercel detects Vite; build command `npm run build`, output directory `dist`.
4. Add `VITE_API_URL=https://YOUR-API.onrender.com/api`.
5. Deploy, then set the Render `CLIENT_URL` to the Vercel origin and redeploy the API if needed.
6. Test registration, report submission, duplicate detection, admin workflow, and verification on the deployed domain.

The included `client/vercel.json` supports SPA route fallback. Render's free instances may sleep when idle, so the first API request can take longer.

## Team Members
- Team Member 1 — Name / role (replace before submission)
- Team Member 2 — Name / role (replace before submission)
- Team Member 3 — Name / role (replace before submission)

## Live Link
[Add deployed frontend URL here]

## Video Link
[Add demo video URL here]

## 3–5 minute demo script (target runtime: 4:00)

- **0:00–0:20 — Problem and opening:** “Civic complaints are duplicated, priorities are opaque, and residents often cannot tell whether work was completed. CivicFix Sentinel makes the process traceable.”
- **0:20–0:55 — Submit a report:** Sign in as a citizen. Create “Deep pothole near bus stop”, choose Pothole, severity 5, attach a photo, and click the map to set the pin. Submit.
- **0:55–1:20 — Duplicate Shield:** Create another report in the same category at the same pin. The API searches active reports within 50 metres. Show the duplicate prompt and choose **Upvote existing issue**; explain that the count increases and any attached photos are appended rather than creating another record.
- **1:20–1:55 — Admin priority and explanation:** Sign in as an admin and open Admin. Point to the report's priority score and “Why this rank?” breakdown: severity contributes 50, each upvote contributes 2, and unresolved age adds 3 per day.
- **1:55–2:25 — Assign and start work:** Assign “Road Maintenance Team” and mark the report In progress. Show the status change in the admin queue and citizen report.
- **2:25–3:05 — Resolution evidence:** Upload an after-photo. Attempting to resolve without it is blocked. Resolve the report and show the resolution timestamp/status.
- **3:05–3:35 — Citizen verification:** Return to the report owner's dashboard. Show the five-stage progress bar, before/after evidence, and press **Verify Resolution**. Status becomes Verified.
- **3:35–4:00 — Stats and close:** Open Stats to show total reports, resolved count, average resolution time, and category/status chart. Close: “CivicFix Sentinel turns complaints into accountable, measurable civic action.”

## Suggested 15-commit sequence
1. `chore: scaffold client and server workspaces`
2. `feat(api): add Express app and health endpoint`
3. `feat(auth): add user model and password hashing`
4. `feat(auth): add JWT registration and login`
5. `feat(reports): add GeoJSON report model and indexes`
6. `feat(reports): add report creation and validation`
7. `feat(reports): add 50m duplicate shield and upvotes`
8. `feat(priority): calculate explainable priority server-side`
9. `feat(admin): add assignment and status workflow`
10. `feat(media): add Cloudinary and data URL uploads`
11. `feat(client): add responsive app shell and auth`
12. `feat(client): add report form and map pin drop`
13. `feat(client): add citizen and admin dashboards`
14. `feat(client): add nearby map and statistics charts`
15. `docs: add deployment guide and demo script`

## Accountability workflow updates

- Admins can sign in from **Administrator sign in** and access `/admin`. Seed the first admin from the `server` directory with `npm run seed:admin` after setting `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `server/.env`.
- The admin dashboard lists all reports in priority order, shows a breakdown tooltip for the priority formula, SLA deadlines/breaches, reopen count, and assignment / progress / resolution actions. Resolution requires an after-photo.
- Citizens can close a resolved report or reopen it with a required explanation. Reopened reports are active, increment `reopenedCount`, retain the reason, and receive a +15 priority bonus per reopening.
- SLA deadlines are category-specific: pothole 7 days, water leak 2, garbage 3, streetlight 5, and other 7. Reports past deadline are flagged unless resolved or closed.
- Civic Stats now includes a satisfaction rate calculated as citizen-closed reports divided by closed plus currently-resolved reports (the reports awaiting citizen decision).

### Admin setup

1. Copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
2. Run `cd server && npm install && npm run seed:admin` once to create/update the admin account.
3. Run the backend and frontend as usual. Open `/admin-login` (or choose **Administrator sign in**) and use the seeded credentials.
