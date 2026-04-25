# VakilDesk Web ⚖️

A modern, high-performance practice management platform designed explicitly for advocates. VakilDesk integrates AI-powered OCR to seamlessly extract case details from uploaded documents, streamlining case vault building and management.

![VakilDesk Web UI](./src/assets/hero.png) *(Preview Placeholder)*

## ✨ Key Features
- **Smart Drop OCR:** Instantly parse case documents (images) via drag-and-drop. Automatically extracts Case Title, Case Number, and Hearing Dates using Google Cloud Vision API.
- **Sectioned Dashboard:** Cases are automatically grouped by Court type (Supreme Court, High Court, District Court, etc.).
- **Urgent UI System:** Automatically visualizes and emphasizes active cases with hearings scheduled within the next 48 hours using dynamic warning badges.
- **Financial Snapshot:** Tracks uncollected aggregate revenues dynamically to help you stay on top of pending dues.

## 🛠️ Tech Stack
- **Frontend Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Lucide React (Icons)
- **State Management:** Zustand
- **Database/Cloud:** Firebase Firestore
- **AI/Machine Learning:** Google Cloud Vision API Integrations

---

## 🚀 Getting Started

Follow these steps to establish your local development environment.

### 1. Prerequisites
- Node.js (v18+)
- A Firebase Project (for Firestore database)
- A Google Cloud Platform (GCP) Project with the **Cloud Vision API** enabled.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/Nibhendra/vakildesk_webapp.git
cd vakildesk_webapp
npm install
```

### 3. Environment Variables
You need to configure your API keys. Copy the `.env.example` file and create a new `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your Firebase configuration keys and your Google Cloud Vision API key:
```env
VITE_FIREBASE_API_KEY="your_firebase_api_key_here"
VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
VITE_GOOGLE_VISION_API_KEY="your_google_cloud_vision_api_key"
VITE_GOOGLE_GEMINI_API_KEY="your_google_gemini_api_key"
VITE_GOOGLE_GEMINI_MODEL="gemini-1.5-flash"
```

OCR supports both Google Vision and Gemini. If Vision key is missing or Vision fails, the app falls back to Gemini OCR automatically.

### 4. Running the Development Server
Start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### 5. v0 + MCP Integration

This project now includes:

- A local backend API (`backend/server.ts`) for v0 requests.
- A standalone MCP server (`backend/mcpServer.ts`) over stdio.
- A Settings panel section to test backend + v0 connection.

Run frontend + backend together:

```bash
npm run dev:full
```

Run MCP server separately:

```bash
npm run dev:mcp
```

Required environment variables for this integration:

```env
VITE_BACKEND_URL="http://localhost:8787"
V0_API_KEY="your_v0_api_key"
V0_BASE_URL="https://api.v0.dev/v1"
V0_MODEL="v0-1.5-md"
PORT="8787"
```

You can verify status in **Settings > AI Integrations (v0 + MCP)**.

## 📁 Project Structure
- `/src/components` - React visual components (`Sidebar`, `Dashboard`, `SmartDropZone`, etc.)
- `/src/services` - Interactions with external APIs (`caseService.ts` for Firestore, `ocrService.ts` for Google Cloud Vision API)
- `/src/store` - Local state machine logic (`useCaseStore.ts`)
- `/src/types` - TypeScript interfaces guaranteeing structural code safety.

---
*Built with ❤️ for Advocates & Lawyers.*
