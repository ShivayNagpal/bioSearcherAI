#!/bin/bash

echo "🧬 Setting up Biology Word Search Game..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and add your Anthropic API key"
echo "2. Run: source venv/bin/activate"
echo "3. Run: python biology_game.py"