# Biology Word Search Game 🧬

An interactive biology word search game powered by sophisticated LangGraph AI agents and a beautiful Next.js frontend.

## Architecture

- **Python Backend**: LangGraph agents with sophisticated Wikipedia research and Claude integration
- **Next.js Frontend**: Modern React interface for gameplay and results
- **Flask API**: RESTful communication between frontend and backend

## Features

- **🤖 LangGraph AI Agents**: Multi-node workflow for sophisticated topic research
- **📚 Smart Research**: Wikipedia integration with content analysis
- **🧠 Intelligent Word Selection**: Extracts relevant terms + dynamically generates contextual distractors
- **🎲 Dynamic Puzzles**: Claude Sonnet 4.5 generates custom 15x15 grids
- **🎮 Interactive Gameplay**: Drag-to-select words in any direction
- **📊 Educational Results**: Detailed scoring with missed word reveals
- **💻 Modern Interface**: Responsive Next.js app with Tailwind CSS

## How It Works

1. **Topic Input**: User enters any biology topic via Next.js frontend
2. **Topic Normalization**: AI extracts core biological entity from user queries (e.g., "parts of kidney" → "kidney")
3. **LangGraph Research**: Multi-agent workflow researches Wikipedia with robust fallback strategies
4. **Term Extraction**: AI identifies 8-12 relevant biological terms from Wikipedia content
5. **Dynamic Distractor Generation**: AI generates contextually relevant distractor topics based on the main topic
6. **Distractor Research**: Finds 6-8 terms from the dynamically selected distractor topic
7. **Grid Generation**: Claude creates optimized word search puzzle
8. **Interactive Play**: Users find words without knowing the target list
9. **Smart Scoring**: Shows results, missed words, and educational content

## Quick Start

### Option 1: Automated Setup

```bash
# Start Python backend (Terminal 1)
./start-backend.sh

# Start Next.js frontend (Terminal 2)
./start-frontend.sh
```

### Option 2: Manual Setup

**Backend Setup:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit backend/.env with your ANTHROPIC_API_KEY
python game_api.py
```

**Frontend Setup:**

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY
npm run dev
```

## Environment Variables

**Frontend (.env.local):**

```
PYTHON_API_URL=http://localhost:8000
```

**Backend (backend/.env):**

```
ANTHROPIC_API_KEY=your_claude_api_key_here
DEBUG=false
PORT=8000
```

## Project Structure

```
├── backend/                    # Python LangGraph Backend
│   ├── biology_game.py        # Sophisticated LangGraph AI agents
│   ├── game_api.py           # Flask API server
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Backend environment variables
├── app/                       # Next.js Frontend
│   ├── api/game/             # API proxy routes (forwards to Python)
│   │   ├── create/           # Create game proxy
│   │   └── submit/           # Submit results proxy
│   ├── game/                 # Game play page
│   ├── results/              # Results and reveal page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # App layout
│   └── page.tsx              # Home page
├── components/
│   └── WordSearchGrid.tsx    # Interactive word search component
├── start-backend.sh          # Python backend startup script
└── start-frontend.sh         # Next.js frontend startup script
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS (UI only)
- **Backend**: Python Flask + LangGraph (AI logic)
- **AI Integration**:
  - **LangGraph**: Multi-agent workflow orchestration
  - **Claude Sonnet 4.5**: Advanced term extraction and puzzle generation
  - **LangChain Anthropic**: Claude API integration
  - **Wikipedia API**: Content research and analysis
- **Styling**: Tailwind CSS with custom biology theme
- **Icons**: Lucide React

## Game Flow

1. **Home Page**: Enter biology topic
2. **Loading**: AI researches topic and generates puzzle
3. **Game Page**: Interactive word search grid with sidebar
4. **Results Page**: Score breakdown and educational content

## API Architecture

### Python Backend (Port 8000)

- `POST /api/game/create` - LangGraph agents create sophisticated games
- `POST /api/game/submit` - Calculate results and reveal missed words
- `GET /health` - Health check endpoint

### Next.js Frontend (Port 3000)

- `POST /api/game/create` - Proxy to Python backend
- `POST /api/game/submit` - Proxy to Python backend

## Key Features

### 🔍 AI Research Agent

- Uses LangGraph workflow with multi-node architecture
- Intelligent topic normalization for conversational queries
- Robust Wikipedia search with multiple fallback strategies
- Dynamic distractor topic generation tailored to the main subject
- Extracts relevant biological terms automatically
- Ensures educational accuracy and relevance

### 🧩 Smart Puzzle Generation

- Claude generates balanced word search grids
- Includes both target words and challenging distractors
- Supports horizontal, vertical, and diagonal word placement

### 🎮 Interactive Gameplay

- Intuitive click-and-drag word selection
- Real-time feedback on found words
- No word list shown beforehand to increase difficulty

### 📊 Educational Results

- Detailed score breakdown
- Shows all target words (found and missed)
- Encourages learning through discovery

---

Built with ❤️ using Claude, Next.js, and AI for education!
