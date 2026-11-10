# 🤝 SilverHands Unified — Setup & Run Guide

Welcome to **SilverHands** — an AI-powered community marketplace & traditional services platform empowering **Homemakers & Elders**.

---

## 📋 Prerequisites
Before running, make sure your computer has the following installed:
1. **Python (version 3.10, 3.11, or 3.12)**: [Download Python](https://www.python.org/downloads/) *(Ensure "Add Python to PATH" is checked during installation)*
2. **Node.js (version 18, 20, or higher)**: [Download Node.js](https://nodejs.org/)

---

## ⚡ Option 1: 1-Click Automated Setup (Windows)

### Step 1: Initial Setup & Installation
Double-click `setup.bat` (or open terminal in this folder and run `.\setup.bat`).
This will automatically:
- Create a Python virtual environment (`.venv`)
- Install all backend dependencies (`requirements.txt`)
- Initialize the database and load seeded data (`db.sqlite3`)
- Install all frontend packages (`npm install`)

### Step 2: Start the Application
Double-click `start.bat` (or run `.\start.bat`).
This opens two windows running:
- **Backend**: `http://127.0.0.1:8000/api/`
- **Frontend**: `http://127.0.0.1:5173/`

Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)** in your browser!

---

## 🛠️ Option 2: Manual Step-by-Step Setup (Windows / macOS / Linux)

### 1. Backend Setup
Open a terminal in the `backend/` folder:

```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Apply database migrations
python manage.py migrate

# 4. Start the Django backend server
python manage.py runserver 127.0.0.1:8000
```
Backend API will be live at: `http://127.0.0.1:8000/api/`

---

### 2. Frontend Setup
Open a **new** terminal window in the `frontend/` folder:

```bash
# 1. Install frontend packages
npm install

# 2. Start the Vite development server
npm run dev
```
Frontend web app will be live at: `http://127.0.0.1:5173/`

---

## 🔑 Demo Login Credentials

You can test different user roles using these pre-seeded accounts:

| Role | Username | Password | Features Available |
| :--- | :--- | :--- | :--- |
| **👩🏽‍🍳 Provider / Homemaker (Cook)** | `lakshmi` | `demo1234` | Full AI Wizard (Service Card, Product Card, Growth Advisor, Skill Extractor), List Services & Products, Manage Bookings/Orders |
| **🧵 Provider / Homemaker (Tailor)** | `meena` | `demo1234` | Full Provider Hub, List Crafts, Manage Customer Requests |
| **🛍️ Customer / Buyer** | `demo_customer` | `demo1234` | Book Services, Order Handmade Delicacies, Fair Price Advisory, Smart Recommendations *(Card generation restricted)* |
| **🛡️ Administrator** | `admin` | `admin123` | Full Access & Admin Control Panel (`/admin-panel`) |

---

## 🤖 Optional: Adding Your Own Gemini AI API Key
The project includes an intelligent, deterministic local fail-safe knowledge engine so it **works 100% offline out-of-the-box without needing any API key**.

If you'd like to enable live Google neural model inference:
1. Open `backend/.env`
2. Add your Gemini key:
   ```env
   AI_API_KEY=your_gemini_api_key_here
   AI_MODEL=gemini-2.5-flash
   ```
