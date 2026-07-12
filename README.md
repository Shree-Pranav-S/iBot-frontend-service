# iBot Web Application (Frontend)

The Frontend is a React Single Page Application (SPA) designed to serve two primary user experiences: a management dashboard for **recruiters** to orchestrate assessments and review candidate evaluations, and a real-time voice interface for **candidates** to take AI-led interviews.

---

## Technical Stack
- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 8](https://vite.dev/)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [TailwindCSS 3](https://tailwindcss.com/)
- **State Management & Querying:** [TanStack React Query v5](https://tanstack.com/query/latest)
- **Audio Streaming (WebRTC):** [LiveKit Client & React Components](https://docs.livekit.io/components/react/)
- **Routing:** [React Router Dom v7](https://reactrouter.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)

---

## Architecture & Features

The interface split caters to two distinct workflows:

### 1. Recruiter Workspace
- **Dashboard:** Performance metrics, overview stats, and recent assessment actions.
- **Assessments Manager (`AssessmentsPage.tsx`):** Create new assessment criteria, configure questions parameters, and generate invitations.
- **Candidate Database (`CandidatesPage.tsx`):** Parse resume PDFs, register candidates, and manage invitiations pipelines.
- **Holistic Evaluation Hub (`EvaluationReportPage.tsx`):** Dive deep into candidate interview transcripts, listen to recordings, review category grades (technical knowledge, communications, behavioral), and print reports.

### 2. Candidate Interview Suite
- **Waiting Room (`WaitingRoom.tsx`):** Device verification setup where candidates test microphone inputs, speaker outputs, and check connections before the session begins.
- **Interview Room (`InterviewRoom.tsx`):** Core WebRTC client interface utilizing LiveKit, letting candidates have a natural, real-time voice discussion with the AI agent.

---

## Directory Structure
```text
Frontend/
├── public/                    # Static public assets (icons, images)
├── src/
│   ├── app/                   # Root App component and application routers
│   ├── components/            # Shared reusable UI elements (buttons, inputs, tables, modals)
│   ├── config/                # Environment variables configurations
│   ├── context/               # Global contexts (Recruiter Auth Context)
│   ├── features/              # Feature modules
│   │   ├── auth/              # Login, register, and password forms
│   │   └── dashboard/         # Main workspace (Assessments, Candidates, Evaluation views, rooms)
│   ├── hooks/                 # Custom React hooks (useAuth, useLocalStorage, etc.)
│   ├── lib/                   # API HTTP and socket clients configurations
│   ├── styles/                # CSS templates and configurations
│   ├── types/                 # TypeScript type definitions and interfaces
│   └── utils/                 # General-purpose utility helpers
├── index.html                 # App entry markup
├── tailwind.config.js         # Tailwind styling rules configurations
├── tsconfig.json              # TypeScript compilation rules
└── vite.config.ts             # Vite server and build plugins configurations
```

---

## Local Development & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `yarn` package manager.

### 2. Environment Setup
Create a `.env` file in the root of the `Frontend` folder:
```bash
VITE_API_BASE_URL=http://localhost:8002
VITE_LIVEKIT_FORCE_RELAY=false
```
*Note: `VITE_API_BASE_URL` points to the Gateway Service (port 8002) which forwards authenticated calls to internal APIs.*

### 3. Install Dependencies
```bash
npm install
```

### 4. Running the Development Server
Start the local Vite dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
Generate optimized production static files inside the `dist/` directory:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## Code Styling & Formatting
We follow standard TypeScript rules and keep code clean using ESLint:
```bash
# Run linting check
npm run lint
```
