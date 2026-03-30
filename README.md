# Roz 🛡️🥗⚡

Roz is a premium, AI-powered calorie tracking application that understands your food in real-time. Built with a high-end **Balanced Dark Theme**, it focuses on precision, speed, and community.

## 🚀 Features

- **AI Log**: Just take a photo or type, and Roz handles the nutrient breakdown.
- **Real-Time Community**: Join or create squads, chat in real-time, and compete on leaderboard streaks.
- **Premium UI**: Minimalist, responsive design with high-contrast typography and subtle micro-animations.
- **Analytics**: Beautiful charts to track your progress and macro hits.

## 🛠️ Technology Stack

### Mobile (Expo / React Native)
- **Canvas-based UI**: `@shopify/react-native-skia` for smooth, high-fidelity graphics.
- **Animations**: `lottie-react-native` and `react-native-reanimated`.
- **State management**: `Zustand`.
- **Real-time**: `socket.io-client` for community chat.

### Backend (Node.js / Express)
- **Database**: `PostgreSQL` for persistence and `Redis` for caching.
- **Socket.io**: Real-time room broadcasting for squads.
- **JWT Auth**: Secure Google OAuth integration.

---

## 🏗️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Postgres & Redis
- Expo Go (for mobile preview)
- EAS CLI (for builds)

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

## 📜 License
MIT License
