# 🏥 LiveMap Emergency

A real-time medical emergency response platform connecting patients with nearby doctors, nurses, and paramedics. Built with Next.js 14, MongoDB, Google Maps, Google Gemini AI, and a persistent notification system.

Patients send SOS requests with their live location. Medical staff within 5km receive alerts, accept emergencies, navigate to patients via Google Maps, and communicate through real-time chat — all with DB-backed notifications tracking every status change.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google)

---

## Features

### For Patients

- **AI Health Assistant (MediBot)** — Gemini-powered floating chatbot on the dashboard. Answers health questions, suggests first aid, and can trigger SOS, doctor search, or pharmacy search directly from the conversation via action buttons.
- **Emergency SOS** — One-tap emergency request that broadcasts your live GPS location to all medical staff within 8km.
- **Real-time Doctor Tracking** — Once a doctor accepts, see their live route on an embedded Google Map with ETA, specialization, and phone number.
- **Live Status Updates** — See the doctor's progress in real time: Accepted → En Route → Arrived → Resolved. Each status change creates a DB notification with a sound alert.
- **Specialist Search** — Find cardiologists, neurologists, dentists, hospitals, and 10+ specialties using Google Places API, sorted by distance.
- **Pharmacy Search** — Locate nearby pharmacies with open/closed status, ratings, and one-tap directions.
- **Directions** — Embedded Google Maps with driving, walking, and transit mode toggle. Status badge visible when tracking an emergency.
- **Emergency Chat** — Real-time polling-based chat with the assigned doctor. Each message creates a DB notification for the other party.
- **Persistent Notifications** — Bell icon with unread count (red badge with pulse animation). Slide-out sidebar shows all notifications split into "Unread" and "Earlier" sections. Notifications persist across page reloads (stored in MongoDB). Mark as read individually or all at once.
- **Profile Management** — Update name, phone, blood group, allergies, and emergency contacts.

### For Doctors, Nurses & Paramedics

- **Medical Dashboard** — Live feed of active SOS requests within 5km. Dashboard title adapts to role ("Doctor Dashboard", "Nurse Dashboard", "Paramedic Dashboard").
- **Case Management** — Accept emergencies and view full patient medical info: name, age, phone, blood group, allergies, medical conditions, and emergency description.
- **Status Stepper** — Visual 4-step progression (Accepted → En Route → Arrived → Resolved). Each button is sequentially locked — can't mark "Arrived" before "En Route". Each status change persists to MongoDB and creates a notification for the patient.
- **Navigation** — One-tap directions to the patient's live location via Google Maps embed or native Maps app.
- **Patient Chat** — Real-time messaging with the patient. Clicking a chat notification navigates to the emergency response screen with the chat auto-opened.
- **Resolved Cases** — Collapsible section on the dashboard showing completed cases with patient name, description, and relative timestamps.
- **Persistent Notifications** — Same DB-backed notification system. Bell shows unread count. Sidebar shows chat messages and status updates.

### General

- **Multi-Role Auth** — Registration as Patient, Doctor, Paramedic, or Nurse with role-specific fields. Doctors have specialization, license number, hospital, and experience fields.
- **Email Verification** — SMTP-based 6-digit email verification (no phone numbers required). Password reset via email code.
- **Emergency Access** — Instant access without registration for life-threatening situations (role: `emergency-patient`).
- **Responsive Design** — Works on desktop, tablet, and mobile. Safe area support for notched devices.
- **Light Theme UI** — Clean design with frosted glass navbars, gradient accents, smooth transitions, and the DM Sans / Outfit / JetBrains Mono font stack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| Fonts | DM Sans (body), Outfit (headings), JetBrains Mono (code) |
| State | Zustand |
| Database | MongoDB with Mongoose |
| Auth | Firebase Authentication + SMTP email verification |
| Maps | Google Maps Embed API + Google Places API |
| Email | Nodemailer (SMTP) |
| AI Chat | Google Gemini API (gemini-2.0-flash-001) |
| Notifications | MongoDB Notification model + polling |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, metadata, fonts
│   ├── page.tsx                      # Screen router + auth guards
│   └── globals.css                   # Design tokens, animations, fonts
│
├── components/
│   ├── screens/
│   │   ├── index.ts                  # Barrel export
│   │   ├── WelcomeScreen.tsx         # Onboarding splash
│   │   ├── AuthScreen.tsx            # Sign in / sign up + emergency access
│   │   ├── PatientDashboard.tsx      # Patient home — cards, SOS list, AI chatbot, notifications
│   │   ├── DoctorDashboard.tsx       # Medical staff home — emergencies, accepted, resolved
│   │   ├── SpecialistSearch.tsx      # Google Places specialist search
│   │   ├── PharmacySearch.tsx        # Google Places pharmacy search
│   │   ├── DirectionsMap.tsx         # Google Maps directions + status badge
│   │   ├── EmergencySOS.tsx          # SOS form → waiting → live doctor tracking
│   │   ├── EmergencyResponse.tsx     # Medical staff: patient info, status stepper, chat
│   │   └── ProfileScreen.tsx         # Edit profile + logout
│   │
│   └── ui/
│       ├── AuthModal.tsx             # Login/register modal with role selector
│       ├── AIChatbot.tsx             # Gemini-powered floating health assistant
│       ├── EmergencyChat.tsx         # Polling-based chat + sends DB notifications
│       └── NotificationSidebar.tsx   # DB-backed notification panel + bell icon
│
├── lib/
│   ├── store.ts                      # Zustand store — user, location, state
│   ├── helpers.ts                    # Haversine distance, formatting utilities
│   ├── useNotifications.ts           # Hook — polls DB notifications, mark read, sound alerts
│   ├── useChatNotifications.ts       # Legacy chat polling hook
│   ├── mongodb.ts                    # Mongoose connection with caching
│   └── firebase.ts                   # Firebase init + SMTP email sending
│
├── models/
│   ├── User.ts                       # User/Doctor schema with 2dsphere index
│   ├── Emergency.ts                  # Emergency schema with status tracking
│   ├── Chat.ts                       # Chat room schema
│   ├── Message.ts                    # Message schema
│   └── Notification.ts               # Persistent notification schema
│
├── types/
│   └── index.ts                      # All shared TypeScript interfaces + helpers
│
└── api/                              # Next.js API routes
    ├── ai/chat/                      # POST — Gemini AI health assistant
    ├── auth/
    │   ├── login/                    # POST — email + password login
    │   ├── register/                 # POST — create account
    │   ├── validate/                 # POST — validate JWT token
    │   ├── logout/                   # POST — clear session
    │   ├── verify-otp/              # POST — verify email code
    │   ├── resend-otp/              # POST — resend verification email
    │   ├── reset-password-request/  # POST — send reset code
    │   └── reset-password/          # POST — reset with code
    ├── places/search/                # POST — proxy to Google Places API
    ├── emergency/
    │   ├── create/                   # POST — create SOS request
    │   ├── status/[id]/             # GET status + doctors, POST cancel
    │   └── update-status/           # POST — en-route/arrived/resolved + creates notification
    ├── doctor/
    │   ├── emergencies/             # GET nearby active, POST accept/decline + creates notification
    │   ├── accepted-emergencies/    # GET doctor's accepted cases with patient data
    │   └── resolved-emergencies/    # GET doctor's resolved cases
    ├── patient/
    │   └── accepted-sos/            # GET patient's accepted SOS with doctor info
    ├── notifications/               # GET list, POST create, PUT mark read
    ├── chat/
    │   ├── route.ts                 # GET list, POST create, PUT send message
    │   └── [id]/                    # GET messages for a chat
    └── users/
        └── route.ts                 # PUT update profile
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/livemap

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# SMTP Email (for verification codes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# JWT
JWT_SECRET=your_jwt_secret_here

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-001
```

### Google Maps API Setup

Enable these APIs in the [Google Cloud Console](https://console.cloud.google.com/apis/library):
- Maps Embed API
- Maps JavaScript API
- Places API
- Directions API

Restrict the API key to your domain in production.

### Google Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Add it as `GEMINI_API_KEY` in `.env.local`
4. Default model is `gemini-2.0-flash-001` — change via `GEMINI_MODEL` if needed

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud project with Maps APIs enabled
- Firebase project (for authentication)
- Gmail account with App Password (for SMTP)

### Installation

```bash
git clone https://github.com/your-username/livemap-emergency.git
cd livemap-emergency
npm install
```

### Development

```bash
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## How It Works

### Emergency Flow

```
Patient taps SOS
    ↓
Emergency created in MongoDB with GPS location
    ↓
All medical staff within 5km see the alert (polled every 10s)
    ↓
Doctor/Nurse/Paramedic taps "Accept"
    ↓  → DB notification created for patient: "Dr. Smith accepted your emergency"
    ↓  → Patient's bell badge increments, notification appears in sidebar
    ↓
Patient sees doctor's name, ETA, specialization, and live map route
    ↓
Doctor marks "En Route"
    ↓  → DB notification: "Dr. Smith is on the way to your location"
    ↓  → Patient sees live status badge change: ✅ Accepted → 🚗 En Route
    ↓
Doctor marks "Arrived"
    ↓  → DB notification: "Dr. Smith has arrived at your location!"
    ↓
Doctor marks "Resolved"
    ↓  → DB notification: "Dr. Smith marked your case as resolved"
    ↓  → Case moves to Resolved section on doctor dashboard
    ↓  → Patient's tracking screen shows "Case Resolved" and redirects
```

### Emergency Status Stepper

The EmergencyResponse screen shows a visual 4-step progression:

```
  ✅ Accepted  →  🚗 En Route  →  📍 Arrived  →  🏁 Resolved
```

- Buttons are **sequentially locked** — can't skip steps
- Each status change calls `POST /api/emergency/update-status`
- The API updates the emergency document and creates a `Notification` document for the patient
- "Resolved" requires confirmation dialog

### Notification System (DB-Backed)

Notifications are real MongoDB documents, not browser-only state:

**Model** (`models/Notification.ts`):
- Fields: `userId`, `type` (status/chat/system), `title`, `message`, `icon`, `color`, `read`, `emergencyId`, `chatId`, `fromUserId`, `fromUserName`, `status`
- Indexed on `userId + read + createdAt` for fast unread queries

**When notifications are created:**
- Doctor accepts emergency → notification for patient
- Doctor changes status (en-route, arrived, resolved) → notification for patient
- Either party sends a chat message → notification for the other party

**Frontend** (`lib/useNotifications.ts`):
- Polls `GET /api/notifications?userId=X` every 5 seconds
- Plays double-beep sound (660Hz → 880Hz) when unread count increases
- `markRead(id)` → optimistic UI + `PUT /api/notifications` to persist
- `markAllRead()` → marks all as read in one API call

**Sidebar** (`components/ui/NotificationSidebar.tsx`):
- Split into **"Unread"** and **"Earlier"** sections
- Each notification shows: colored icon, unread dot, title, message, type tag, relative timestamp
- Clicking marks as read via API, then routes appropriately:
  - Chat notification on patient dashboard → opens chat popup
  - Chat notification on doctor dashboard → navigates to EmergencyResponse with chat auto-opened
  - Status notification → opens tracking/response screen

**Bell** (`NotificationBell`):
- Red badge with exact unread count from DB
- Pulse animation when count > 0

### AI Health Assistant (MediBot)

Floating chatbot on the patient dashboard powered by Google Gemini:

- **Quick prompts**: "Find a doctor", "Emergency help", "Find pharmacy", "Fever advice"
- **Action tags**: Gemini's system prompt instructs it to include `[ACTION:SOS]`, `[ACTION:FIND_DOCTORS]`, or `[ACTION:FIND_PHARMACY]` tags. The frontend strips these and renders colored action buttons below the AI response.
- **Safety**: Every response includes a disclaimer. For life-threatening symptoms, the AI immediately recommends SOS.
- **Context-aware**: User's GPS coordinates are passed to the AI for location-relevant answers.

### Chat System

Polling-based real-time chat (no WebSockets needed):

- `EmergencyChat` polls `/api/chat/[id]` every 3 seconds
- Each sent message also calls `POST /api/notifications` to create a DB notification for the recipient
- Chat rooms are created per-emergency with both participants
- Clicking a chat notification in the sidebar opens the chat popup (patient) or navigates to the response screen with chat auto-opened (doctor)

---

## API Routes Reference

| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/chat` | Gemini AI health assistant |
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/register` | Create account with role |
| POST | `/api/auth/validate` | Validate JWT, return user |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/verify-otp` | Verify email code |
| POST | `/api/auth/resend-otp` | Resend verification email |
| POST | `/api/auth/reset-password-request` | Send password reset code |
| POST | `/api/auth/reset-password` | Reset password with code |
| POST | `/api/places/search` | Proxy to Google Places API |
| POST | `/api/emergency/create` | Create SOS request with location |
| GET | `/api/emergency/status/[id]` | Get emergency status + responding doctors + patient info |
| POST | `/api/emergency/status/[id]` | Cancel emergency |
| POST | `/api/emergency/update-status` | Update status (en-route/arrived/resolved) + create notification |
| GET | `/api/doctor/emergencies` | List nearby active emergencies within 5km |
| POST | `/api/doctor/emergencies` | Accept/decline emergency + create notification |
| GET | `/api/doctor/accepted-emergencies` | List accepted cases with full patient data |
| GET | `/api/doctor/resolved-emergencies` | List resolved cases |
| GET | `/api/patient/accepted-sos` | List patient's accepted SOS with doctor info |
| GET | `/api/notifications` | Get notifications for user (with unread count) |
| POST | `/api/notifications` | Create notification (with 30s dedup) |
| PUT | `/api/notifications` | Mark read (single or all) |
| GET | `/api/chat` | List user's emergency chats |
| POST | `/api/chat` | Create chat room |
| PUT | `/api/chat` | Send message |
| GET | `/api/chat/[id]` | Get messages for a chat |
| PUT | `/api/users` | Update user profile |

---

## Roles

| Role | Dashboard | Emergency Access |
|---|---|---|
| `user` (Patient) | PatientDashboard — search, SOS, AI chatbot, track doctor, chat | Sends SOS, receives notifications |
| `doctor` | DoctorDashboard — receive alerts, accept, status stepper, chat, resolved cases | Accepts and responds to SOS |
| `nurse` | DoctorDashboard (labeled "Nurse Dashboard") — same capabilities as doctor | Accepts and responds to SOS |
| `paramedic` | DoctorDashboard (labeled "Paramedic Dashboard") — same capabilities as doctor | Accepts and responds to SOS |
| `emergency-patient` | EmergencySOS screen directly (no dashboard) | Quick access without registration |

---

## Design System

Light theme with frosted glass navbars and gradient accents:

| Token | Hex | Usage |
|---|---|---|
| Background | `#f8fafc` | Page backgrounds |
| Surface | `#ffffff` | Cards, navbars, modals |
| Input | `#f1f5f9` | Input fields, hover states |
| Border | `#e2e8f0` | Dividers, card borders |
| Text Primary | `#1e293b` | Headings, body text |
| Text Secondary | `#475569` | Descriptions, labels |
| Text Muted | `#94a3b8` | Timestamps, hints |
| Red | `#ef4444` | Emergency, SOS, alerts |
| Blue | `#3b82f6` | Specialists, directions, primary |
| Green | `#10b981` | Pharmacies, success, accepted |
| Purple | `#8b5cf6` | Chat, notifications |
| Yellow | `#f59e0b` | Warnings, en-route, medical info |

---

## MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | All users (patients, doctors, nurses, paramedics) with 2dsphere location index |
| `emergencies` | SOS requests with location, status, acceptedBy, respondedDoctors, timestamps |
| `chats` | Chat rooms (emergency type) with participants and emergency reference |
| `messages` | Individual chat messages with sender info |
| `notifications` | Persistent notifications with read/unread state, indexed for fast queries |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Standard Next.js 14 project — works on any Node.js host:
- Railway
- Render
- AWS Amplify
- Docker (`next build && next start`)

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT