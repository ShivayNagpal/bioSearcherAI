#!/bin/bash

echo "⚛️  Starting Next.js Frontend..."

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found. Copying from .env.example..."
    cp .env.example .env.local
    echo "🔑 Please edit .env.local and add your ANTHROPIC_API_KEY"
fi

# Start the Next.js development server
echo "🚀 Starting Next.js server on http://localhost:3000"
npm run dev