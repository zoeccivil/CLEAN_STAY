# CleanStay Pro

A cloud-based cleaning management platform for short-term rentals (Airbnb). Built with React + Vite + Tailwind CSS + Firebase.

## Features

- **Role-Based Access Control**: Admin, Supervisor, and Cleaning Staff roles
- **Real-time Dashboard**: Live task monitoring with Firestore onSnapshot
- **Property Management**: Full CRUD for rental properties
- **Task Management**: Create, assign, and track cleaning tasks
- **Client Reports**: Generate reports with photo evidence and checklists
- **Staff Management**: Create and manage users with Firebase Auth
- **Maintenance Tracking**: Log and resolve maintenance issues
- **PWA / Mobile Interface**: Optimized for cleaning staff in the field
- **Automated PDF Reports**: Cloud Functions generate PDFs when tasks complete
- **Email Delivery**: Automatic email to property owners via Nodemailer

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 + React Router 7 |
| Styling | Tailwind CSS v4 |
| Backend/BaaS | Firebase (Firestore, Auth, Storage, Functions) |
| PDF Generation | pdfkit (Cloud Functions) |
| Email | Nodemailer (Cloud Functions) |
| PWA | Service Worker + Web App Manifest |

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── layout/          # Sidebar, TitleBar, AppLayout
│   │   ├── auth/            # LoginView, ProtectedRoute
│   │   ├── dashboard/       # StatCard, TaskTable, DashboardView
│   │   ├── reports/         # ReportsView, PhotoEvidence, Checklist, ActionPanel
│   │   ├── properties/      # PropertiesView (CRUD)
│   │   ├── tasks/           # TasksView (full management)
│   │   ├── staff/           # StaffView (user management)
│   │   └── maintenance/     # MaintenanceView
│   ├── hooks/
│   │   ├── useAuth.js       # Firebase Auth context + hook
│   │   ├── useFirestore.js  # CRUD operations
│   │   ├── useRealtimeCollection.js  # Real-time listeners
│   │   └── useStorage.js    # File uploads
│   ├── firebase/
│   │   ├── config.js        # Firebase config (env vars)
│   │   └── index.js         # Initialized Firebase instances
│   ├── pwa/
│   │   └── MobileApp.jsx    # Mobile-optimized PWA interface
│   ├── App.jsx
│   └── main.jsx
├── functions/               # Firebase Cloud Functions
│   └── index.js             # PDF generation + email delivery
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
├── firebase.json            # Firebase project config
└── firestore.indexes.json   # Composite indexes
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore, Auth, Storage, and Functions enabled

### 1. Clone & Install

```bash
git clone https://github.com/zoeccivil/CLEAN_STAY.git
cd CLEAN_STAY
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database**
4. Enable **Cloud Storage**
5. Enable **Cloud Functions**

### 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase project values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firebase Rules & Indexes

```bash
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. Configure Cloud Functions

Set email credentials for Nodemailer:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
```

> **Note**: Use a Gmail App Password (not your regular password). Enable 2FA on your Google account, then create an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

### 6. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 8. Build for Production

```bash
npm run build
firebase deploy --only hosting
```

## Creating the First Admin User

1. Open the Firebase Console → Authentication → Add user
2. Note the UID of the created user
3. In Firestore, create a document at `users/{uid}`:
   ```json
   {
     "uid": "the-uid",
     "nombre": "Admin Name",
     "rol": "admin",
     "telefono": "+1 555 0000",
     "activo": true,
     "email": "admin@yourdomain.com"
   }
   ```
4. Log in with those credentials

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| `admin` | Full system access | All views, user management |
| `supervisor` | Operations management | Dashboard, Tasks, Properties, Reports, Maintenance |
| `limpieza` | Field staff | Mobile PWA only — today's tasks |

## Mobile PWA (Cleaning Staff)

The app is installable as a PWA. Cleaning staff access a mobile-optimized interface at the same URL that shows only their assigned tasks for today.

To install on mobile:
1. Open the app in Chrome/Safari on your phone
2. Tap "Add to Home Screen"

## Firebase Indexes

The `firestore.indexes.json` file includes composite indexes for:
- Tasks by cleaner + date
- Tasks by status + date  
- Reports by property + generation date

## Security

- All Firestore operations are protected by security rules
- Users can only access data appropriate for their role
- Cleaning staff can only read/update their own assigned tasks
- Reports are publicly readable via direct link (for client sharing)
- Environment variables are never committed to the repository

## License

MIT
