# Accountability App

A single-page accountability web app for tracking university attendance with location verification.

## Features

- Google Sign-In with email whitelist (2 users)
- Location-verified check-in/out (1km radius from university)
- Monthly progress tracking with expected vs actual hours
- Auto-close punishment for forgotten sign-outs
- Settings with high-friction unlock mechanism
- Responsive design for Mac laptop and iPhone

## Local Development

### Prerequisites

- Node.js 18+
- npm
- A Firebase project (see Firebase Setup below)

### Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in your Firebase credentials:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your Firebase config values (see Firebase Setup).

4. Enable dev mode (bypasses location checks):
   ```bash
   # In .env.local:
   VITE_DEV_BYPASS_LOCATION=true
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup (from scratch)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project (e.g., "accountability-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click **Google** provider
3. Toggle **Enable**
4. Set a project support email
5. Click **Save**

### 3. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Select **Start in production mode**
3. Choose a location (europe-west1 recommended for Netherlands)
4. Click **Create**

### 4. Deploy Firestore Security Rules

1. Go to **Firestore Database** > **Rules**
2. Replace the default rules with the contents of `firestore.rules` from this project
3. Click **Publish**

### 5. Register Web App

1. Go to **Project Settings** (gear icon) > **General**
2. Under "Your apps", click the web icon (`</>`)
3. Register app with a nickname (e.g., "accountability-web")
4. Copy the Firebase config object values to your `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### 6. Set Authorized Domains (after deployment)

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your GitHub Pages domain (e.g., `username.github.io`)

## Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Building for Production

```bash
npm run build
```

The output is in the `dist/` folder.

## Deploying to GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to GitHub Pages:
   - **Option A**: Push `dist/` to a `gh-pages` branch
   - **Option B**: Configure GitHub repo Settings > Pages > Source to deploy from `dist/`

3. After deploying, add your GitHub Pages domain to Firebase Auth Authorized Domains (see step 6 above).

## Development Mode

Set `VITE_DEV_BYPASS_LOCATION=true` in `.env.local` to skip geolocation checks during development. The app will show a yellow "DEV MODE" indicator and use the university coordinates for all location checks.

## Architecture

```
src/
├── lib/            # Core utilities
│   ├── firebase.ts     # Firebase config & constants
│   ├── firestore.ts    # Firestore CRUD operations
│   ├── geo.ts          # Haversine distance calculation
│   ├── time.ts         # Luxon timezone utilities
│   └── calculations.ts # Progress & session calculations
├── hooks/          # React hooks
│   ├── useAuth.ts       # Firebase auth state
│   ├── useGeolocation.ts # Browser geolocation
│   ├── useConfig.ts     # App config from Firestore
│   └── useSessions.ts   # Sessions from Firestore + auto-close
├── components/     # React components
│   ├── SignInGate.tsx    # Auth gate
│   ├── StartScreen.tsx   # Month initialization
│   ├── CheckInCard.tsx   # Sign in/out UI
│   ├── ErrorDisplay.tsx  # Location error messages
│   ├── ProgressStats.tsx # Hours progress bar
│   ├── SecondaryStats.tsx # Attendance & average
│   ├── SessionList.tsx   # Recent sessions
│   └── SettingsPanel.tsx # High-friction settings
├── App.tsx         # Main layout
└── main.tsx        # Entry point
```
