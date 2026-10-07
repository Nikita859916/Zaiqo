# Zaiqo 🥗✨

> Personalized AI-Powered Food and Wellness Platform

Zaiqo is built using a clean, fully decoupled client-server architecture designed for independent development and deployment to **Vercel** (frontend) and **Render** (backend).

---

## 🏗️ Architecture

```text
zaiqo/
├── frontend/               # React + Vite + JavaScript
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page views (React Router)
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx         # App routes
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                # Node.js + Express.js + JavaScript
│   ├── src/
│   │   ├── config/         # MongoDB Atlas connection
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & error handling middleware
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express REST API routes
│   │   └── app.js          # Express app & middleware configuration
│   ├── server.js           # Server entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Language**: JavaScript (ES Modules)
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Animation & Icons**: Framer Motion & Lucide React
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Architecture**: RESTful APIs
- **Authentication**: JWT & bcrypt
- **Database ODM**: Mongoose
- **Deployment**: Render

### Database & AI
- **Database**: MongoDB Atlas
- **AI Engine**: Google Gemini API

---

## 🚀 Getting Started

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env    # Configure your PORT, MONGODB_URI, JWT_SECRET, and GEMINI_API_KEY
npm run dev             # Starts server on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev             # Starts Vite dev server on http://localhost:5173
```
