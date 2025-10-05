#!/bin/bash

echo "🐍 Starting Python Backend Server..."

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "🔑 Please edit backend/.env and add your ANTHROPIC_API_KEY"
fi

# Start the Flask server
echo "🚀 Starting Flask API server on http://localhost:8000"
python game_api.py