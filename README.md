# SilverHands — Unified Elder Livelihood & Artisanal Marketplace Platform

A unified, resilient full-stack platform combining traditional home services, handmade goods e-commerce, real-time geospatial opportunity radar, AI-powered conversational matching, voice-guided accessibility, and trust & safety protections for elderly artisans and homemakers across India.

---

## 🌟 Key Unified Features

1. **Dual Marketplace**:
   - **Services**: Traditional Tamil cooking, bespoke saree blouse tailoring & Aari embroidery, school tutoring, terrace organic gardening.
   - **Handmade Goods**: Homemade pickles, traditional snacks, handmade cotton shopping bags, vermicompost.

2. **Dual Database Architecture (Cloud PostgreSQL with Local SQLite Failsafe)**:
   - Supports production PostgreSQL / Supabase databases via standard `DATABASE_URL`.
   - Seamless offline fallback to zero-latency SQLite when running locally or during network disconnects.

3. **Centralized Gemini AI Microservices (`backend/ai_engine/services`)**:
   - **Conversational Matching (`/api/ai/match/`)**: Natural language query matching against real providers with explainable reasoning.
   - **Voice Skill Extraction (`/api/ai/extract-skills/`)**: Extracts practical experience and skills from speech transcripts.
   - **Skill & Adjacent Livelihood Suggestions (`/api/ai/suggest-skills/`)**.
   - **Service Package Generator (`/api/ai/suggest-services/`)**.
   - **Bio & Profile Description Generator (`/api/ai/generate-description/`)**.
   - **Fair Pricing Advisor (`/api/ai/suggest-price/`)**.
   - **Business Advisor Chatbot (`/api/ai/business-assistant/`)**.
   - **Anti-Scam & Safety Guardian (`/api/ai/detect-scam/`)**.

4. **Senior Mode & Accessibility**:
   - **Senior Mode Switch**: Instant +25% enlarged typography, high-contrast palette, and 56px touch targets.
   - **Voice Guided Registration & Voice Search**: In-browser speech recognition supporting English, Tamil, and Hindi.
   - **Multi-language i18n**: English, தமிழ், and हिंदी.

5. **Opportunity Radar**:
   - Reverse-marketplace geospatial feed allowing local customers to post gig requirements and nearby elders to accept them within a Haversine radius.

6. **Trust, Safety & Moderation**:
   - Verified **Skill Passports** (ID verified + experience certified).
   - Real-time **Scam Warning** detection in booking requests and direct messages.
   - Community Safety Reporting & Admin moderation portal.

---

## 🚀 How to Run

### Quick Start (One Click):
Double-click `start-unified.bat` or run:
```powershell
.\start-unified.ps1
```

### Manual Start:

#### 1. Backend (Django REST API):
```powershell
cd c:\mavericks\SilverHands_Unified\backend
& "c:\mavericks\.venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
```
- API Base: `http://127.0.0.1:8000/api/`
- Admin Portal: `http://127.0.0.1:8000/admin/`

#### 2. Frontend (React + Vite + Tailwind):
```powershell
cd c:\mavericks\SilverHands_Unified\frontend
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm.cmd run dev
```
- App URL: `http://localhost:5173/`

---

## 🔐 Default Demo Accounts

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full admin & moderation dashboard |
| **Customer** | `demo_customer` | `demo1234` | Ravi Kumar (Adyar, Chennai) |
| **Elder Provider** | `lakshmi` | `demo1234` | Lakshmi Venkatesan (Traditional Cook, 27 yrs exp) |
| **Elder Provider** | `meena` | `demo1234` | Meena Rajaram (Master Tailor, 20 yrs exp) |
| **Elder Provider** | `saraswathi` | `demo1234` | Saraswathi Krishnan (Senior Teacher, 35 yrs exp) |
| **Elder Provider** | `kamala` | `demo1234` | Kamala Subramanian (Terrace Gardener, 15 yrs exp) |
