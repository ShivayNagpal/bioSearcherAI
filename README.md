# Biology Word Search Game 🧬

An interactive biology word search game powered by sophisticated LangGraph AI agents and a beautiful Next.js frontend.

## Architecture

- **Python Backend**: LangGraph agents with sophisticated Wikipedia research and Claude integration
- **Next.js Frontend**: Modern React interface for gameplay and results
- **Flask API**: RESTful communication between frontend and backend

## Features

- **🤖 LangGraph AI Agents**: Multi-node workflow for sophisticated topic research
- **📚 Smart Research**: Wikipedia integration with content analysis
- **🧠 Intelligent Word Selection**: Extracts relevant terms + adds strategic distractors
- **🎲 Dynamic Puzzles**: Claude Sonnet 4.5 generates custom 15x15 grids
- **🎮 Interactive Gameplay**: Drag-to-select words in any direction
- **📊 Educational Results**: Detailed scoring with missed word reveals
- **💻 Modern Interface**: Responsive Next.js app with Tailwind CSS

## How It Works

1. **Topic Input**: User enters any biology topic via Next.js frontend
2. **LangGraph Research**: Multi-agent workflow researches Wikipedia content
3. **Term Extraction**: AI identifies 8-12 relevant biological terms
4. **Distractor Selection**: Finds 6-8 terms from different biological areas
5. **Grid Generation**: Claude creates optimized word search puzzle
6. **Interactive Play**: Users find words without knowing the target list
7. **Smart Scoring**: Shows results, missed words, and educational content

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
ANTHROPIC_API_KEY=your_claude_api_key_here
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
├── app/
│   ├── api/game/           # API routes for game logic
│   │   ├── create/         # Create new game endpoint
│   │   └── submit/         # Submit game results endpoint
│   ├── game/               # Game play page
│   ├── results/            # Results and reveal page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # App layout
│   └── page.tsx            # Home page
├── components/
│   └── WordSearchGrid.tsx  # Interactive word search component
├── lib/
│   └── game-engine.ts      # Core game logic and AI integration
└── types/
    └── global.d.ts         # TypeScript type definitions
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI Integration**:
  - Claude Sonnet 4.5 for puzzle generation
  - LangChain for AI orchestration
  - Wikipedia API for content research
- **Styling**: Tailwind CSS with custom biology theme
- **Icons**: Lucide React

## Game Flow

1. **Home Page**: Enter biology topic
2. **Loading**: AI researches topic and generates puzzle
3. **Game Page**: Interactive word search grid with sidebar
4. **Results Page**: Score breakdown and educational content

## API Endpoints

- `POST /api/game/create` - Creates new game from topic
- `POST /api/game/submit` - Submits found words and returns results

## Key Features

### 🔍 AI Research Agent
- Uses LangGraph workflow to search Wikipedia
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

## Customization

### Changing the Grid Size
Edit `lib/game-engine.ts` and modify the `size` parameter in `generateWordSearchGrid()`.

### Adding More Distractor Topics
Extend the `distractorTopics` array in `game-engine.ts` with more biological areas.

### Styling
Customize the appearance by editing:
- `tailwind.config.js` for colors and themes
- `app/globals.css` for component styles
- Individual component files for specific styling

## Deployment

The app can be deployed to any platform that supports Next.js:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect your repository
- **Railway/Render**: Deploy from GitHub

Remember to set your `ANTHROPIC_API_KEY` environment variable in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Claude, Next.js, and AI for education!