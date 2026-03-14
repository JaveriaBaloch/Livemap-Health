# LiveMap Emergency

A real-time medical emergency response platform that connects patients with nearby doctors. Built with Next.js 14, MongoDB, Firebase Auth, and Google Maps.

Patients can search for specialists and pharmacies, send SOS requests with live location, and chat with responding doctors in real time. Doctors receive emergency alerts within a configurable radius, accept cases, navigate to patients, and communicate through built-in messaging.

---

## Features

### For Patients
- **AI Health Assistant (MediBot)** — Gemini-powered chatbot on the home screen that answers health questions, provides first-aid guidance, and can trigger SOS, doctor search, or pharmacy search directly from the conversation
- **Emergency SOS** — one-tap emergency request broadcasts your location to all doctors within 8km
- **Doctor Tracking** — live map showing the accepted doctor's route to your location with ETA
- **Specialist Search** — find cardiologists, neurologists, dentists, hospitals, and more using Google Places
- **Pharmacy Search** — locate nearby pharmacies sorted by distance with open/closed status
- **Directions** — Google Maps embedded directions with driving, walking, and transit modes
- **Emergency Chat** — real-time messaging with the assigned doctor during an active emergency
- **Notification Bell** — unread message count badge with a slide-out notification sidebar
- **Profile Management** — update name, phone, blood group, and allergies

### For Doctors
- **Emergency Dashboard** — live feed of active SOS requests within 5km radius
- **Case Management** — accept emergencies, view patient medical info (blood group, allergies, conditions)
- **Navigation** — one-tap directions to the patient's live location via Google Maps
- **Patient Chat** — real-time messaging with the patient during response
- **Status Updates** — mark yourself as en route, arrived, or mark the case resolved
- **Notification System** — bell icon with sidebar showing new patient messages across all active cases

### General
- **Email Verification** — SMTP-based email verification with 6-digit codes (no phone numbers required)
- **Emergency Access** — instant access without full registration for life-threatening situations
- **Responsive Design** — works on desktop, tablet, and mobile with safe area support for notched devices
- **Real-time Polling** — chat messages and emergency status update every 3-5 seconds
- **Frosted Glass UI** — light theme with backdrop-blur navbars, gradient accents, and smooth transitions

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
| AI Chat | Google Gemini API (gemini-2.0-flash) |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout with metadata + fonts
│   ├── page.tsx                    # Main orchestrator — screen routing + auth guards
│   └── globals.css                 # Design tokens, animations, scrollbar, fonts
│
├── components/
│   ├── screens/
│   │   ├── index.ts                # Barrel export for all screens
│   │   ├── WelcomeScreen.tsx       # Onboarding splash
│   │   ├── AuthScreen.tsx          # Sign in / sign up + emergency access
│   │   ├── PatientDashboard.tsx    # Patient home — cards, SOS list, chat popup
│   │   ├── DoctorDashboard.tsx     # Doctor home — active/accepted emergencies
│   │   ├── SpecialistSearch.tsx    # Find nearby doctors by specialty
│   │   ├── PharmacySearch.tsx      # Find nearby pharmacies
│   │   ├── DirectionsMap.tsx       # Google Maps directions with mode selector
│   │   ├── EmergencySOS.tsx        # SOS form → waiting → doctor tracking
│   │   ├── EmergencyResponse.tsx   # Doctor: patient info + chat + navigation
│   │   └── ProfileScreen.tsx       # Edit profile + logout
│   │
│   └── ui/
│       ├── AuthModal.tsx           # Login/signup modal (your existing component)
│       ├── AIChatbot.tsx           # Gemini-powered floating health assistant
│       ├── EmergencyChat.tsx       # Reusable chat widget (polling-based)
│       └── NotificationSidebar.tsx # Slide-out notification panel + bell icon
│
├── lib/
│   ├── store.ts                    # Zustand store — user, location, emergency state
│   ├── helpers.ts                  # Haversine distance, formatting, enrichWithDistance
│   ├── useChatNotifications.ts     # Hook — polls emergency chats, detects new messages, plays sound
│   ├── mongodb.ts                  # Mongoose connection with caching
│   └── firebase.ts                 # Firebase init + SMTP email sending
│
├── models/
│   ├── User.ts                     # User/Doctor schema with 2dsphere index
│   ├── Emergency.ts                # Emergency schema with location + acceptance tracking
│   ├── Chat.ts                     # Chat room schema (public/private/emergency)
│   └── Message.ts                  # Message schema with metadata support
│
├── types/
│   └── index.ts                    # Shared TypeScript interfaces
│
└── api/                            # Next.js API routes
    ├── ai/
    │   └── chat/                   # POST — Gemini AI health assistant
    ├── auth/
    │   ├── validate/               # POST — validate JWT token
    │   └── logout/                 # POST — clear session
    ├── places/
    │   └── search/                 # POST — proxy to Google Places API
    ├── emergency/
    │   ├── create/                 # POST — create SOS request
    │   └── status/[id]/            # GET status, POST cancel
    ├── doctor/
    │   ├── emergencies/            # GET nearby, POST accept/decline
    │   └── accepted-emergencies/   # GET doctor's accepted cases
    ├── patient/
    │   └── accepted-sos/           # GET patient's accepted SOS with doctor info
    ├── chat/
    │   ├── route.ts                # GET list, POST create, PUT send message
    │   └── [id]/                   # GET messages for a chat
    └── users/
        └── route.ts                # PUT update profile
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
GEMINI_MODEL=gemini-2.0-flash
```

### Google Maps API Setup

Enable these APIs in the Google Cloud Console:
- Maps Embed API
- Maps JavaScript API
- Places API
- Directions API

Restrict the API key to your domain in production.

### Google Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Add it as `GEMINI_API_KEY` in `.env.local`
4. The default model is `gemini-2.0-flash` — change via `GEMINI_MODEL` if needed

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

### AI Health Assistant (MediBot)

The patient dashboard includes a floating AI chatbot powered by Google Gemini:

- **Floating bubble** — a gradient button on the bottom-left of the patient home screen. Tap to expand.
- **Contextual responses** — the AI receives the user's location and conversation history for relevant answers.
- **Quick prompts** — pre-built buttons ("Find a doctor", "Emergency help", "Find pharmacy", "Fever advice") for common queries.
- **Action tags** — the AI system prompt instructs Gemini to include special tags like `[ACTION:SOS]`, `[ACTION:FIND_DOCTORS]`, or `[ACTION:FIND_PHARMACY]` when appropriate. The frontend strips these tags and renders corresponding action buttons below the message.
- **Safety** — every response includes a disclaimer that MediBot is not a doctor. For emergencies, the AI immediately recommends SOS and surfaces the button.
- **Model** — uses `gemini-2.0-flash` by default (configurable via `GEMINI_MODEL` env var). Low latency, good for conversational medical Q&A.

```
User: "I have severe chest pain and can't breathe"
    ↓
Gemini responds with emergency guidance + [ACTION:SOS] tag
    ↓
App renders red "🚨 Send Emergency SOS" button below the message
    ↓
Tapping it navigates directly to the EmergencySOS screen
```

### Emergency Flow

```
Patient taps SOS
    ↓
Emergency created in MongoDB with patient location
    ↓
All doctors within 8km see the alert on their dashboard (polled every 10s)
    ↓
Doctor taps "Accept Emergency"
    ↓
Patient sees doctor's name, ETA, and live location on map
    ↓
Both can chat in real-time via the emergency chat
    ↓
Doctor navigates to patient using embedded Google Maps directions
    ↓
Doctor marks case as "Arrived" → "Resolved"
```

### Chat System

The chat uses polling rather than WebSockets for simplicity:
- `EmergencyChat` component polls `/api/chat/[id]` every 3 seconds for new messages
- `useChatNotifications` hook polls all emergency chats every 5 seconds to detect new messages from the other party
- New messages trigger a notification sound and increment the bell badge count
- Clicking a notification in the sidebar opens the chat popup for that conversation

### Notification System

- **NotificationBell** — renders in the navbar with a red badge showing unread count and a ping animation
- **NotificationSidebar** — slides in from the right, groups messages by chat, shows sender avatar, message preview, and relative timestamps
- Clicking a notification closes the sidebar and opens the relevant chat (popup for patients, emergency response screen for doctors)

---

## Design System

The app uses a light theme with the following color palette:

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
| Blue | `#3b82f6` | Specialists, directions, primary actions |
| Green | `#10b981` | Pharmacies, success, doctor status |
| Purple | `#8b5cf6` | Chat, notifications |
| Yellow | `#f59e0b` | Warnings, medical info |

Navbars use `bg-white/80 backdrop-blur-xl` for a frosted glass effect. Buttons with colored backgrounds always use white text. Cards have `shadow-sm` with subtle border hover transitions.

---

## API Routes Reference

| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/chat` | Gemini AI health assistant (returns message + action tags) |
| POST | `/api/auth/validate` | Validate JWT, return user |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/places/search` | Proxy Google Places search |
| POST | `/api/emergency/create` | Create emergency SOS |
| GET | `/api/emergency/status/[id]` | Get emergency status + responding doctors |
| POST | `/api/emergency/status/[id]` | Cancel emergency |
| GET | `/api/doctor/emergencies` | List nearby active emergencies |
| POST | `/api/doctor/emergencies` | Accept or decline emergency |
| GET | `/api/doctor/accepted-emergencies` | List doctor's accepted cases |
| GET | `/api/patient/accepted-sos` | List patient's accepted SOS with doctor info |
| GET | `/api/chat` | List user's chats |
| POST | `/api/chat` | Create chat room |
| PUT | `/api/chat` | Send message |
| GET | `/api/chat/[id]` | Get messages for chat |
| PUT | `/api/users` | Update user profile |

---

## Roles

| Role | Description | Dashboard |
|---|---|---|
| `user` | Patient | PatientDashboard — search, SOS, track doctor |
| `doctor` | Verified doctor | DoctorDashboard — receive alerts, accept cases, navigate |
| `emergency-patient` | Quick access (no signup) | Redirected straight to EmergencySOS |
| `paramedic` | Paramedic (future) | — |
| `nurse` | Nurse (future) | — |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app is a standard Next.js 14 project and works on any platform that supports Node.js:
- Railway
- Render
- AWS Amplify
- Docker (`next build && next start`)

---

## License

MIT# Livemap-Health
