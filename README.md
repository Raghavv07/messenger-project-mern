# 💬 Full-Stack Real-Time Messenger (MERN) 🚀

A modern, production-grade real-time messaging web application inspired by Apple iMessage, built with **React 19, Vite 8, Express 5, Node.js, MongoDB Atlas, Socket.IO, Clerk, and ImageKit**.

![Messenger Demo Screenshot](/frontend/public/screenshot-for-readme.png)

---

## ✨ Features

- 💬 **Real-Time 1-on-1 Chat**: Ultra-low latency messaging powered by Socket.IO with connection state recovery.
- 🟢 **Live Online Presence**: Multi-tab and multi-device aware user presence detection.
- 🖼️ **Image & Video Sharing**: High-speed media uploads up to 25MB via ImageKit CDN with on-the-fly transformations and automatic video poster extraction (`/ik-thumbnail.jpg`).
- 🔐 **Clerk Authentication**: Seamless sign-in and sign-up with Clerk, secure Bearer token request interceptor, and automatic profile sync fallback in backend.
- 🎨 **11 Themes & 13 Wallpapers**: Fully customizable UI with Light/Dark mode and wallpaper presets.
- ⌨️ **Keystroke Sound Effects**: Realistic typing feedback audio with sound toggle.
- 🛡️ **Production-Ready Security**: Helmet headers (CORP enabled), Gzip/Brotli compression, rate limiting, and raw buffer webhook verification.
- 🏥 **Health Check & Keep-Alive**: `/health` liveness/readiness probe with keep-alive cron job to prevent free tier cold starts.
- 🧹 **Graceful Server Shutdown**: Handles `SIGTERM` and `SIGINT` to safely drain HTTP connections and close MongoDB connections.

---

## 🚀 Tech Stack

### Frontend
| Technology | Description |
| :--- | :--- |
| **React 19** | Modern UI library with Concurrent Mode & React Compiler |
| **Vite 8** | Next-generation fast frontend build tool & dev server |
| **HeroUI & Tailwind CSS v4** | Accessible component system with modern styling |
| **Zustand v5** | Lightweight state management with selective local persistence |
| **Socket.IO Client v4** | WebSocket connection with automatic exponential reconnection |
| **Clerk React SDK** | Secure authentication and user session management |
| **React Router v8** | Declarative client-side routing |
| **Lucide React** | Clean, modern iconography |
| **React Hot Toast** | Theme-aware, throttled toast notifications |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js (ESM)** | Modern JavaScript runtime with native ES Modules |
| **Express 5** | High-performance HTTP server with async route handlers |
| **MongoDB & Mongoose 9** | Scalable NoSQL database with compound indexing & aggregation |
| **Socket.IO v4** | WebSocket server with handshake auth and room-based routing |
| **ImageKit SDK v7** | Cloud media storage with real-time optimization |
| **Clerk Express SDK** | Webhook cryptographic verification and token authentication |
| **Helmet & Compression** | HTTP security headers and response compression |
| **Express Rate Limit** | Protection against brute-force and DDoS attacks |
| **Multer** | Memory-buffered multipart file upload handling |

---

## 📁 Project Structure

```
messenger-project-mern/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route controllers (auth, messages)
│   │   ├── lib/              # DB, Socket, ImageKit, Cron, Env helpers
│   │   ├── middleware/       # Auth, error, rate-limit, upload middlewares
│   │   ├── models/           # Mongoose schemas (User, Message)
│   │   ├── routes/           # Express API routes
│   │   ├── seeds/            # Database seed script for dummy users
│   │   ├── webhooks/         # Clerk user sync webhook handler
│   │   └── index.js          # Express app entry & server initialization
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/               # Static assets, sounds, wallpaper backgrounds
│   ├── src/
│   │   ├── components/       # UI components (chat, headers, pickers, loaders)
│   │   ├── context/          # Theme & Wallpaper Context providers
│   │   ├── hooks/            # Custom hooks (sound, responsive, chat helpers)
│   │   ├── lib/              # Axios instance & ImageKit transformations
│   │   ├── pages/            # AuthPage & ChatPage (lazy loaded)
│   │   ├── store/            # Zustand stores (useAuthStore, useChatStore)
│   │   ├── App.jsx           # Root routes & app shell
│   │   └── main.jsx          # Entry point with ClerkProvider & BrowserRouter
│   ├── vite.config.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance
- [Clerk](https://clerk.com/) account for authentication keys
- [ImageKit](https://imagekit.io/) account for image and video uploads

---

### 2. Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/messenger-project-mern.git
   cd messenger-project-mern
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

### 3. Environment Variables Configuration

#### Backend (`/backend/.env`)
Create a `.env` file inside the `backend` folder:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# ImageKit Media Uploads
IMAGEKIT_PRIVATE_KEY=private_...

# Frontend URL (For CORS and WebSocket origins)
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`/frontend/.env`)
Create a `.env` file inside the `frontend` folder:

```env
# Clerk Publishable Key (Matches backend CLERK_PUBLISHABLE_KEY)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API & WebSocket Server URL
VITE_API_URL=http://localhost:5001
```

---

### 4. Seed Dummy Users (Optional)
To populate MongoDB with sample chat users for testing:
```bash
cd backend
npm run db:seed
```

---

### 5. Running Locally

Start the backend and frontend in separate terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
> Server runs on `http://localhost:5001`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
> Frontend runs on `http://localhost:5173`

---

## 🔌 API & Socket Reference

### REST Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health, uptime, and database readiness | No |
| `GET` | `/api/auth/check` | Validate session token & return profile | Yes (Bearer) |
| `GET` | `/api/messages/users` | List all users for chat discovery | Yes (Bearer) |
| `GET` | `/api/messages/conversations` | List conversation threads with latest message | Yes (Bearer) |
| `GET` | `/api/messages/:id` | Get message history with a specific user | Yes (Bearer) |
| `POST` | `/api/messages/send/:id` | Send text or multipart image/video message | Yes (Bearer) |
| `POST` | `/api/webhooks/clerk` | Clerk webhook sync for user create/update/delete | Webhook Secret |

### Socket.IO Events
| Event | Direction | Description |
| :--- | :--- | :--- |
| `connection` | Client ➔ Server | Establishes WebSocket with handshake `userId` |
| `getOnlineUsers` | Server ➔ Client | Broadcasts list of active online user IDs |
| `newMessage` | Server ➔ Client | Delivers new chat message to recipient room in real-time |
| `typing` | Client ➔ Server | (Optional) Signals that user is typing |
| `stopTyping` | Client ➔ Server | (Optional) Signals that user stopped typing |

---

## 🚀 Deployment

- **Frontend**: Can be deployed to [Vercel](https://vercel.com/) or [Render](https://render.com/) with build command `npm run build` and output directory `dist`.
- **Backend**: Can be deployed to [Render](https://render.com/) or [Railway](https://railway.app/) with start command `npm start`.
- **Database**: Hosted on [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
