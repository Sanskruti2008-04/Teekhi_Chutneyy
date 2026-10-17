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

### Using the app
1. Register as a citizen and sign in.
2. Open **Report issue**, fill in the form, click the map to choose a location, and add photos.
3. If the Duplicate Shield finds an active issue within 50 metres, choose **Upvote existing issue** to add support and optionally append the photos.
4. Admin users can open **Admin**, assign a team, mark a report in progress, upload an after-photo, then resolve it.
5. The report owner can open **My reports** and select **Verify Resolution** once resolved.
6. Open **Nearby** and allow browser location access to see nearby active reports; open **Stats** for charts.

## Team Name: Teekhi Chutney
Team member: Sanskruti Mahendra Thakur

## Live Link
https://teekhi-chutneyy.vercel.app

## Video Link
[Add demo video URL here]

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
