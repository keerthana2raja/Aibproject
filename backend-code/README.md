# AIMPLIFY Backend API
### Node.js + Express + MongoDB Atlas → Firebase Cloud Functions

---

## 📁 Project Structure

```
functions/
└── src/
    ├── config/
    │   └── db.js                  # MongoDB Atlas connection
    ├── models/
    │   ├── User.js                # User schema (auth)
    │   ├── Family.js              # Platform family catalog
    │   ├── Asset.js               # AI accelerator assets
    │   ├── Registration.js        # Asset registration pipeline
    │   └── Activity.js            # Event activity log
    ├── middleware/
    │   ├── authMiddleware.js      # JWT protect + RBAC authorize
    │   ├── errorMiddleware.js     # Global error + 404 handler
    │   └── validateMiddleware.js  # Required field validator
    ├── services/
    │   ├── authService.js         # Login, token generation
    │   ├── familyService.js       # Family CRUD logic
    │   ├── assetService.js        # Asset filter, stats, search
    │   ├── registrationService.js # Registration + AI review
    │   └── activityService.js     # Activity feed, users list
    ├── controllers/
    │   ├── authController.js
    │   ├── familyController.js
    │   ├── assetController.js
    │   ├── registrationController.js
    │   └── activityController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── familyRoutes.js
    │   ├── assetRoutes.js
    │   ├── registrationRoutes.js
    │   └── activityRoutes.js
    ├── app.js                     # Express app setup
    └── index.js                   # Firebase function export + local server
```

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
cd functions
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

`.env` values:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/aimplify
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d
PORT=5000
```

### 3. Run Locally

```bash
npm run dev
# API available at http://localhost:5000/v1
```

### 4. Deploy to Firebase

```bash
# From project root
firebase login
firebase init functions   # if not already initialized
npm run deploy
```

---

## 📡 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/v1/auth/login` | ❌ | Sign in, returns JWT |
| GET | `/v1/auth/me` | ✅ | Current user profile |
| GET | `/v1/families` | ✅ | List all families |
| GET | `/v1/families/:key` | ✅ | Family detail (atlas/forge/relay/sentinel/nexus) |
| GET | `/v1/assets` | ✅ | List & filter assets |
| GET | `/v1/assets/stats` | ✅ | Dashboard aggregates |
| GET | `/v1/assets/:id` | ✅ | Asset full detail (e.g. ATL-001) |
| GET | `/v1/assets/family/:key` | ✅ | Assets by family |
| GET | `/v1/registrations` | ✅ | List registrations |
| POST | `/v1/registrations` | ✅ | Register new asset |
| GET | `/v1/registrations/:id` | ✅ | Registration detail |
| PATCH | `/v1/registrations/:id` | ✅ (governance/admin) | Update registration |
| GET | `/v1/activity` | ✅ | Recent activity feed |
| GET | `/v1/activity/users` | ✅ | List users |

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Roles
- `engineering` — read access
- `governance` — can patch registrations
- `admin` — full access

---

## 🌐 MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free **M0** cluster
3. Create a database user
4. Whitelist IP: `0.0.0.0/0` (required for Firebase dynamic IPs)
5. Copy the connection string into your `.env`

---

## 🔥 Firebase Setup

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Set env vars for production:
```bash
firebase functions:config:set mongo.uri="your_uri" jwt.secret="your_secret"
```
4. Deploy: `firebase deploy --only functions`

Your API will be live at:
`https://us-central1-<your-project>.cloudfunctions.net/api/v1`
