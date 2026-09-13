# 🎥 YouTube Watch Party System

A real-time, synchronized YouTube Watch Party web application built with **React (Vite)**, **Node.js (Express)**, and **Socket.IO**. Users can create or join watch rooms, stream YouTube videos in sync, chat, react with emojis, and manage role-based permissions in real-time.

---

## 🌟 Key Features

- **⚡ Real-Time Playback Synchronization**: Play, pause, seek, and video changes are instantly synchronized across all participants via WebSockets.
- **🛡️ Role-Based Access Control (RBAC)**:
  - 👑 **Host**: Full control (play/pause, seek, change video, assign roles, kick users, transfer host).
  - 🛡️ **Moderator**: Playback control (play/pause, seek, change video).
  - 👤 **Participant / Viewer**: Watch-only access (controls automatically disabled).
- **🏗️ OOP WebSocket Architecture**: Backend logic cleanly separated into `RoomManager`, `Room`, and `Participant` classes.
- **💬 Real-Time Chat & Floating Reactions**: Built-in room chat and live floating emoji reaction bursts.
- **🔗 Room Link & Code Sharing**: Easy room creation and joining via 6-character room codes.

---

## 🏗️ Architecture Overview

```
[ Frontend: React + Vite ]  <--- WebSockets (Socket.IO) --->  [ Backend: Node.js + Express ]
       |                                                                  |
   Components:                                                        OOP Classes:
   - YouTubePlayer (IFrame API)                                       - RoomManager
   - ControlsBar (Role Restricted)                                    - Room
   - RoomSidebar (Chat & Roles)                                       - Participant
```

### WebSocket Events & Permissions

| Event | Direction | Requires Role | Description |
| :--- | :--- | :--- | :--- |
| `create_room` | Client ➔ Server | Any | Creates room & assigns creator as **Host** |
| `join_room` | Client ➔ Server | Any | Joins room as **Participant** |
| `play` / `pause` | Client ➔ Server | Host / Moderator | Broadcasts play/pause state & current time |
| `seek` | Client ➔ Server | Host / Moderator | Broadcasts target seek position |
| `change_video` | Client ➔ Server | Host / Moderator | Changes YouTube video ID for all members |
| `assign_role` | Client ➔ Server | Host Only | Promotes/demotes participant role |
| `remove_participant` | Client ➔ Server | Host Only | Kicks user from watch party |
| `transfer_host` | Client ➔ Server | Host Only | Transfers host authority to another member |
| `send_message` | Client ➔ Server | Any | Broadcasts chat message to room |
| `send_reaction` | Client ➔ Server | Any | Triggers floating emoji burst |

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v16+ installed on your machine.
- **npm**: v8+

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
The WebSocket backend server will run on `http://localhost:5000`.

### 2. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The React Vite app will run on `http://localhost:5173`.

---

## 🌐 Deployment Guidelines

### Backend (Render / Railway)
1. Deploy the `backend/` folder as a Web Service.
2. Set Build Command: `npm install`
3. Set Start Command: `node server.js`
4. Set Environment Variable: `PORT=5000`

### Frontend (Vercel / Netlify)
1. Deploy the `frontend/` folder.
2. Set Framework Preset: **Vite**
3. Set Environment Variable for backend URL if needed (`VITE_BACKEND_URL`).

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Lucide Icons, Vanilla CSS (Glassmorphism design).
- **Backend**: Node.js, Express, Socket.IO.
- **Video API**: YouTube Iframe API.
