# 🛡️ HostelShield — Smart Hostel Visitor Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-003B57.svg?style=flat&logo=sqlite)](https://www.sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-06B6D4.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Build Status](https://img.shields.io/badge/Tests-11%2F11%20PASSED-brightgreen.svg)]()

**HostelShield** is an enterprise-grade, zero-queue hostel visitor management portal designed to eliminate gate delays, verify physical Govt IDs, prevent unapproved student access, track visitor overstays, and broadcast 1-click emergency alerts in real time.

---

## 🌟 Key Capabilities & Architectural Features

- **🏠 Responsive Home Portal & Quick Gateway Cards**:
  - Clean home cover page with responsive mobile dropdown menu (`☰` / `✕`) providing instant navigation across devices.
  - 4 interactive gateway cards: Resident Student Portal, Staff & Security Gateway, Apply for Visitor Pass, and Track Pass Key.

- **🎫 Visitor Pass Request & Pass Key Generator**:
  - Visitors apply without account registration by selecting host student, specifying visit purpose, entering Govt ID number, and submitting a valid 10-digit Indian mobile number (`^[6-9]\d{9}$`).
  - Upon host student approval, a unique 6-character **Pass Key Code** (e.g., `PASS-8921`) and visual **QR Code** are generated.

- **🔍 Public Pass Tracking & 404 Error Handling**:
  - Public lookup at `/visitor/track-pass` where visitors enter their Full Name & Phone number.
  - Displays real-time pass status badges (`PENDING`, `APPROVED`, `REJECTED`, `CHECKED_IN`, `OVERSTAYED`).
  - Handles non-existent requests with a clear 404 message: *"No visitor request found for the provided Name and Phone number. Please check details or submit a new request."*

- **🔐 Resident Student Signup & Warden Approval Workflow**:
  - Resident student registration defaults to `is_approved = False`.
  - Unapproved student login attempts return `403 Forbidden` (`"Registration pending Warden approval"`).
  - Wardens approve or reject student accounts directly from the Admin Dashboard.

- **📢 1-Click Emergency Broadcast Alert System**:
  - Prominent `🚨 Broadcast 1-Click Emergency Alert` button in the Warden field header and Active Visitors tab.
  - Opens a confirmation modal to dispatch emergency notifications (`POST /api/admin/broadcast-emergency`) to all registered resident students and gate security guards.

- **🚨 Overstay Warning & Alert Dispatch**:
  - Visitors exceeding host-specified duration are highlighted in glowing red rows (`overstay-row-highlight`).
  - Includes a `🚨 Send Overstay Alert` button on each overstay row to dispatch immediate notification alerts to the host student's device.

- **🛡️ Security Gate Check-In/Out & Duplicate Guard**:
  - Physical Govt ID verification checkbox `[x]` required before Check-In is enabled.
  - Prevents duplicate check-ins (`409 Conflict: Visitor already checked in`).
  - Displays Amber Alert banner if host student is unavailable (`is_available = False`), allowing security override check-in audit notes.

- **📶 Gate Offline Sync Resilience**:
  - Offline sync engine (`src/utils/offlineSync.js`) caches approved passes in browser `localStorage`.
  - Listens to connection status (`window.navigator.onLine`), displaying `🟢 Gate Online` or `🟠 Offline Mode (Cached)`, and automatically flushes queued check-ins when reconnected.

- **📊 Warden Analytics & CSV Report Export**:
  - Filter occupancy logs by `Daily`, `Monthly`, `All Time`, or `Custom Range`.
  - One-click export to structured `.csv` format.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Python 3.13, FastAPI |
| **Database & ORM** | SQLite, SQLAlchemy 2.0 |
| **Authentication & Hashing** | PyJWT (HS256), Passlib (Bcrypt) |
| **Validation Schemas** | Pydantic v2 (Regex & Gov ID Matchers) |
| **Frontend Framework** | React 18, Vite |
| **Styling & Aesthetics** | Tailwind CSS, Glassmorphism, HSL Tokens |
| **Icons & QR Generator** | Lucide React, qrcode.react / QRCode.js |

---

## 🚀 Getting Started & Run Commands

### 1. Single-Port Full Stack Execution (Recommended)
Runs FastAPI server which serves both the REST API endpoints and the full enterprise web interface on a single port:

```powershell
# Navigate to project root
cd c:\KeyValue

# Start uvicorn server
python -m uvicorn backend.app.main:app --reload --port 8000
```
- 🌐 **Web Portal**: [http://localhost:8000](http://localhost:8000)
- 📑 **Interactive OpenAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Separate Backend API + React Vite Dev Server

**Terminal 1 (Backend API):**
```powershell
cd c:\KeyValue
python -m uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 (React Vite Dev Server):**
```powershell
cd c:\KeyValue\frontend
npm run dev
```
- 🌐 **Vite Dev Server**: [http://localhost:5173](http://localhost:5173)

---

### 🧪 Running Automated Test Suite

Runs the 11-step backend verification test suite (covers auth, 10-digit phone validation, student approval 403 guard, pass lookup 404, security check-in/out, overstay alerts, emergency broadcast, and period reports):

```powershell
cd c:\KeyValue
python backend/test_api.py
```

---

### 🔄 Reset & Re-Seed Database

Resets SQLite database and populates demo accounts:

```powershell
cd c:\KeyValue
python backend/app/seed.py
```

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Status / Access |
|---|---|---|---|
| **Hostel Warden (Admin)** | `admin@hostel.com` | `password123` | Approved • Full Executive Field |
| **Security Guard (Gate 1)** | `security@hostel.com` | `password123` | Approved • Gate Check-In/Out Desk |
| **Resident Student 1** | `student1@hostel.com` | `password123` | Approved • Room 101-A (Aarav Sharma) |
| **Resident Student 2** | `student2@hostel.com` | `password123` | Approved • Room 102-B (Ananya Verma) |
| **Pending Student Account** | `student3@hostel.com` | `password123` | Unapproved (Triggers 403 Forbidden until Warden approves) |

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token |
| `POST` | `/api/auth/register-student` | Register new student (`is_approved=False`) |
| `GET` | `/api/students/public` | List available host students for public pass dropdown |
| `GET` | `/api/students/me/requests` | Fetch incoming visitor pass requests for host student |
| `PATCH` | `/api/requests/{id}/approve` | Host student approves pass request & generates passcode |
| `PATCH` | `/api/requests/{id}/reject` | Host student rejects visitor pass request |
| `PATCH` | `/api/students/me/availability` | Toggle student availability (`Available` / `Unavailable`) |
| `POST` | `/api/visitors/requests` | Submit new public visitor entry pass application |
| `POST` | `/api/visitor/track-pass` | Public lookup for pass status & passcode by Name & Phone |
| `GET` | `/api/visitor/public-stats` | Public live system metrics counter |
| `GET` | `/api/security/lookup/{code}` | Security gate passcode lookup & availability audit |
| `POST` | `/api/security/checkin` | Security gate check-in execution |
| `POST` | `/api/security/checkout` | Security gate check-out execution |
| `GET` | `/api/admin/active` | Active visitors emergency headcount |
| `GET` | `/api/admin/overstays` | Overstayed visitors list |
| `GET` | `/api/admin/pending-students` | Unapproved student registrations queue |
| `PATCH` | `/api/admin/approve-student/{id}` | Warden approves or rejects student account |
| `POST` | `/api/admin/broadcast-emergency` | Warden 1-click emergency alert broadcast |
| `POST` | `/api/notifications/trigger-overstay/{id}` | Dispatch overstay warning alert to host student |
| `GET` | `/api/admin/reports` | Period-filtered occupancy report logs (`daily`, `monthly`, `custom`) |

---

## 📁 Repository Structure

```
KeyValue/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint & 422 Exception Handler
│   │   ├── models.py            # SQLAlchemy database tables
│   │   ├── schemas.py           # Pydantic validation & Indian phone matcher
│   │   ├── auth.py              # Bcrypt hashing & JWT token engine
│   │   ├── database.py          # SQLite engine session management
│   │   ├── seed.py              # Demo database seeder
│   │   ├── routers/             # API Router Controllers
│   │   └── static/              # Embedded static React single-page app
│   ├── hostel_visitor.db        # SQLite database file
│   └── test_api.py              # Automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Responsive header with mobile hamburger menu
│   │   │   └── RoleRoute.jsx    # Protected role authorization guard
│   │   ├── routes/
│   │   │   ├── Landing.jsx      # Public Home Cover Page
│   │   │   ├── VisitorRequestForm.jsx # Public Pass Application
│   │   │   ├── VisitorTrackPass.jsx   # Public Pass Status Lookup
│   │   │   ├── StudentLogin.jsx # Resident Student Portal Login/Signup
│   │   │   ├── StaffLogin.jsx   # Staff Gateway (Security vs Warden)
│   │   │   ├── SecurityDesk.jsx # Gate Verification Desk
│   │   │   └── AdminDashboard.jsx # Warden Operations & Emergency Broadcast
│   │   └── utils/
│   │       └── offlineSync.js   # Gate LocalStorage offline sync engine
└── README.md                    # System Documentation
```

---

## 📄 License
This project is licensed under the MIT License.
