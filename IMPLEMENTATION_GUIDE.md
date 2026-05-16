# PM Copilot — Auth, Notifications & Email: Implementation Guide

## Table of Contents
1. [What Was Added](#what-was-added)
2. [New Folder Structure](#new-folder-structure)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Google OAuth Configuration](#google-oauth-configuration)
5. [Gmail App Password Setup](#gmail-app-password-setup)
6. [Backend — How It Works](#backend--how-it-works)
7. [Frontend — How It Works](#frontend--how-it-works)
8. [API Reference](#api-reference)
9. [Making a User an Admin](#making-a-user-an-admin)
10. [Flow Examples](#flow-examples)
11. [Troubleshooting](#troubleshooting)

---

## What Was Added

| Feature | Files |
|---|---|
| Google OAuth 2.0 | `routes/auth.js`, `config/passport.js`, `models/User.js` |
| JWT Middleware | `middleware/auth.js` |
| In-App Notifications | `models/Notification.js`, `routes/notifications.js`, `services/notificationService.js` |
| Email Service (Gmail SMTP) | `services/emailService.js`, `models/EmailLog.js` |
| Admin Panel + Updates | `routes/updates.js`, `models/Update.js` |
| React Auth Gate | `context/AuthContext.js`, `pages/LoginPage.js` |
| Notification Bell + Dropdown | `context/NotificationContext.js`, `components/NotificationBell.js` |
| Toast Alerts | `components/Toast.js` |
| User Avatar + Logout | `components/UserAvatar.js` |
| Admin UI | `pages/AdminPanel.js` |

---

## New Folder Structure

```
ai-pm-copilot/
├── backend/
│   ├── config/
│   │   └── passport.js           ← Google OAuth strategy
│   ├── middleware/
│   │   └── auth.js               ← JWT protect + adminOnly guards
│   ├── models/
│   │   ├── User.js               ← NEW
│   │   ├── Notification.js       ← NEW
│   │   ├── Update.js             ← NEW
│   │   ├── EmailLog.js           ← NEW
│   │   ├── Project.js            (existing)
│   │   └── Session.js            (existing)
│   ├── routes/
│   │   ├── auth.js               ← NEW
│   │   ├── notifications.js      ← NEW
│   │   ├── updates.js            ← NEW
│   │   ├── chat.js               (existing)
│   │   ├── projects.js           (existing)
│   │   ├── sessions.js           (existing)
│   │   └── upload.js             (existing)
│   ├── services/
│   │   ├── emailService.js       ← NEW
│   │   └── notificationService.js← NEW
│   ├── .env.example              ← NEW (copy to .env)
│   ├── package.json              ← UPDATED
│   └── server.js                 ← UPDATED
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.js        ← NEW
    │   │   ├── NotificationContext.js← NEW
    │   │   └── ThemeContext.js       (existing)
    │   ├── components/
    │   │   ├── NotificationBell.js   ← NEW
    │   │   ├── Toast.js              ← NEW
    │   │   ├── UserAvatar.js         ← NEW
    │   │   ├── Header.js             ← UPDATED
    │   │   ├── ChatPanel.js          (existing)
    │   │   ├── Dashboard.js          (existing)
    │   │   ├── SessionsPanel.js      (existing)
    │   │   └── Sidebar.js            (existing)
    │   ├── pages/
    │   │   ├── LoginPage.js          ← NEW
    │   │   └── AdminPanel.js         ← NEW
    │   ├── api/
    │   │   └── index.js              (existing)
    │   ├── App.js                    ← UPDATED
    │   └── index.js                  (existing)
    ├── .env.example                  ← NEW
    └── package.json                  ← UPDATED
```

---

## Step-by-Step Setup

### 1. Install backend dependencies

```bash
cd backend
npm install passport passport-google-oauth20 google-auth-library jsonwebtoken nodemailer
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install @react-oauth/google
```

### 3. Configure environment variables

**Backend** — copy `.env.example` → `.env` and fill in all values:

```bash
cp .env.example .env
```

**Frontend** — copy `.env.example` → `.env`:

```bash
cp .env.example .env
```

### 4. Copy new files into your project

Place all new backend files in the correct directories as shown in the folder structure above.

Replace `backend/server.js`, `frontend/src/App.js`, and `frontend/src/components/Header.js`
with the updated versions provided.

### 5. Start the servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start
```

---

## Google OAuth Configuration

### Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"New Project"** → give it a name → **Create**
3. Select your new project from the top dropdown

### Step 2: Enable the Google+ API

1. Go to **APIs & Services → Library**
2. Search **"Google+ API"** → Enable it
3. Also enable **"Google Identity"** if listed

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials" → "OAuth client ID"**
3. Application type: **Web application**
4. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
5. **Authorized redirect URIs:**
   ```
   http://localhost:5000/api/auth/google/callback
   ```
6. Click **Create** — copy your **Client ID** and **Client Secret**

### Step 4: Configure OAuth consent screen

1. Go to **OAuth consent screen**
2. User Type: **External**
3. Fill in App name, Support email, Developer email
4. Add scopes: `email`, `profile`
5. Add your email as a **Test user** (until the app is published)

### Step 5: Add credentials to .env files

**backend/.env:**
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
JWT_SECRET=a_very_long_random_string_at_least_32_chars
```

**frontend/.env:**
```
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

---

## Gmail App Password Setup

> **Important:** Never use your real Gmail password. Use a 16-character App Password.

### Step 1: Enable 2-Step Verification

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Under **"How you sign in to Google"** → **2-Step Verification** → Turn on

### Step 2: Generate an App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select app: **"Mail"**
3. Select device: **"Other (Custom name)"** → type `PM Copilot`
4. Click **Generate**
5. Copy the 16-character password shown (e.g., `abcd efgh ijkl mnop`)

### Step 3: Add to backend/.env

```
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcdefghijklmnop    # 16 chars, NO spaces
```

---

## Backend — How It Works

### Authentication Flow (SPA / React)

```
User clicks "Sign in with Google"
    ↓
Google Identity Services shows popup
    ↓
User approves → Google returns a signed ID token (JWT)
    ↓
Frontend POSTs { credential } to POST /api/auth/google/token
    ↓
Backend verifies token with Google (google-auth-library)
    ↓
MongoDB: find existing user or create new one
    ↓
If new user: send welcome email (async, non-blocking)
    ↓
Backend issues our own JWT (7-day expiry)
    ↓
Frontend stores token in localStorage, sets user state
    ↓
All subsequent API calls: Authorization: Bearer <token>
```

### Notification Flow (Admin posts an update)

```
Admin POSTs to POST /api/updates
    ↓
Update saved to MongoDB
    ↓
notificationService.broadcastNotification()
  → insertMany() one Notification doc per user
    ↓
emailService.sendBulkEmail()
  → Promise.allSettled() — emails sent in parallel
  → EmailLog.create() per email (fire & forget)
    ↓
Frontend polls GET /api/notifications every 30s
  → Bell badge updates
  → User clicks bell → sees new notification
  → Click to mark read → PUT /api/notifications/:id
```

### JWT Middleware Usage

Protect any route by adding the `protect` middleware:

```js
const { protect, adminOnly } = require('../middleware/auth');

// Any logged-in user
router.get('/my-data', protect, myController);

// Admin only
router.post('/admin-action', protect, adminOnly, adminController);
```

---

## Frontend — How It Works

### Auth Gate

`App.js` checks `user` from `AuthContext`. If null → shows `LoginPage`. If set → shows the full app.
The stored JWT is validated on every page load via `GET /api/auth/me`.

### Notification Polling

`NotificationContext` polls `GET /api/notifications` every 30 seconds when a user is logged in.
The `NotificationBell` component reads from this context — no prop drilling.

### Using `authFetch`

`AuthContext` exposes `authFetch`, a wrapper around `fetch` that auto-attaches the Bearer token:

```js
const { authFetch } = useAuth();
const res = await authFetch('http://localhost:5000/api/updates', {
  method: 'POST',
  body: JSON.stringify({ title, description, type }),
});
```

### Using Toasts

```js
import { useToast } from '../components/Toast';

const toast = useToast();
toast.show('Action completed!', 'success');  // success | error | info | warning
toast.show('Something went wrong', 'error', 6000); // custom duration (ms)
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/google/token` | None | Exchange Google credential for JWT |
| GET | `/api/auth/google` | None | Start redirect OAuth flow |
| GET | `/api/auth/google/callback` | None | OAuth callback |
| GET | `/api/auth/me` | Bearer | Get current user |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Bearer | Get notifications (+ unreadCount) |
| PUT | `/api/notifications/read-all` | Bearer | Mark all as read |
| PUT | `/api/notifications/:id` | Bearer | Mark one as read |
| DELETE | `/api/notifications/:id` | Bearer | Delete one |

**Query params for GET:** `?limit=20&skip=0`

### Updates (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/updates` | None | List all updates |
| POST | `/api/updates` | Bearer + Admin | Create update, trigger notifs + emails |
| DELETE | `/api/updates/:id` | Bearer + Admin | Delete update |

**POST body:**
```json
{
  "title": "New Dashboard Released",
  "description": "We've completely redesigned the dashboard...",
  "type": "feature"
}
```

---

## Making a User an Admin

Run this in your MongoDB shell or MongoDB Compass:

```js
// In mongosh
use ai-pm-copilot
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

Or via a one-off script (`scripts/makeAdmin.js`):

```js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.updateOne({ email: 'your@email.com' }, { $set: { role: 'admin' } });
  console.log('Done');
  process.exit(0);
});
```

```bash
node scripts/makeAdmin.js
```

---

## Flow Examples

### Example 1: User completes an action (order placed)

In your existing order/action handler, add:

```js
const { createNotification } = require('../services/notificationService');
const { sendEmail }          = require('../services/emailService');

// After saving the order:
await createNotification({
  userId:  req.user._id,
  message: `✅ Your order #${order.id} was placed successfully.`,
  type:    'order',
});

await sendEmail({
  to:       req.user.email,
  subject:  'Order Confirmation — PM Copilot',
  userName: req.user.name,
  bodyHtml: `
    <h2>Order Confirmed ✅</h2>
    <p>Your order <strong>#${order.id}</strong> has been placed.</p>
    <p><strong>Items:</strong> ${order.items.join(', ')}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  `,
  dashboardUrl: process.env.CLIENT_URL,
});
```

### Example 2: Admin posts a project update (via API)

```bash
curl -X POST http://localhost:5000/api/updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "v2.1 — Risk Detection Improved",
    "description": "AI risk detection now supports multi-document analysis.",
    "type": "feature"
  }'
```

**Result:**
- Update saved in MongoDB
- All users get an in-app notification (🔔 bell shows badge)
- All users get an HTML email from Gmail SMTP
- `EmailLog` records every attempt

---

## Troubleshooting

### "Invalid Google credential"
- Ensure `REACT_APP_GOOGLE_CLIENT_ID` matches `GOOGLE_CLIENT_ID` in backend
- The Google Cloud project must have your domain in Authorized JS Origins
- App must be in "Testing" mode with your email added as a test user

### "No token provided" on protected routes
- Frontend must pass `Authorization: Bearer <token>` header
- Use the `authFetch` helper from `AuthContext` — it does this automatically

### Emails not sending
- Confirm `EMAIL_PASS` is the App Password (16 chars, no spaces), NOT your Gmail password
- 2-Step Verification must be enabled on your Google account
- Check `EmailLog` collection for `status: "failed"` entries with error messages
- Gmail daily sending limit is ~500 emails/day on free accounts

### Notifications not appearing
- `NotificationContext` only polls when `user` is set (logged in)
- Check browser Network tab for `GET /api/notifications` — should return 200
- Ensure `protect` middleware is not blocking the route (check JWT validity)

### Bell count not updating in real-time
- Polling interval is 30 seconds by default
- For instant updates, consider adding Server-Sent Events or WebSocket (future enhancement)
- You can call `refresh()` from `NotificationContext` after any user action
