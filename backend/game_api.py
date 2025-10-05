#!/usr/bin/env python3
"""
Flask API wrapper for the Biology Word Search Game
"""

import os
import asyncio
import json
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from biology_game import BiologyGame

app = Flask(__name__)
CORS(app)

# In-memory storage for games (use Redis/database in production)
game_store = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Biology Game API is running"})

@app.route('/api/game/create', methods=['POST'])
def create_game():
    """Create a new game from a biology topic"""
    try:
        print("📝 Received game creation request")

        data = request.get_json()
        topic = data.get('topic') if data else None

        print(f"🔍 Topic: {topic}")

        if not topic:
            return jsonify({"error": "Topic is required"}), 400

        # Get API key from environment
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("❌ No API key found")
            return jsonify({"error": "API key not configured"}), 500

        print("✅ API key found")

        # Create game instance
        print("🎮 Creating game instance...")
        game = BiologyGame(api_key)
        print("✅ Game instance created")

        # Run the async game creation
        print("⚡ Running async game creation...")

        try:
            # Use asyncio.run for better event loop management
            game_data = asyncio.run(create_game_async(game, topic))
            print("✅ Game data created successfully")

            # Store the full game data
            game_store[game_data['gameId']] = {
                'topic': game_data['topic'],
                'targetWords': game_data['targetWords'],
                'distractorWords': game_data['distractorWords'],
                'grid': game_data['grid']
            }

            print(f"💾 Game stored with ID: {game_data['gameId']}")

            # Return only what the frontend needs (no target words revealed)
            return jsonify({
                'gameId': game_data['gameId'],
                'topic': game_data['topic'],
                'grid': game_data['grid'],
                'totalTargetWords': len(game_data['targetWords'])
            })

        except Exception as async_error:
            print(f"❌ Error in async game creation: {async_error}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise async_error

    except Exception as e:
        print(f"❌ Error creating game: {e}")
        print(f"📋 Full traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to create game", "details": str(e)}), 500

async def create_game_async(game, topic):
    """Async wrapper for sophisticated LangGraph game creation"""
    import random

    print(f"🧬 Starting sophisticated LangGraph biology word search for topic: {topic}")

    # Research phase using the sophisticated LangGraph agent workflow
    initial_state = {
        'messages': [],
        'topic': topic,
        'target_terms': [],
        'distractor_terms': [],
        'research_complete': False
    }

    print("🔍 Running LangGraph multi-agent research workflow...")
    result_state = await game.agent.graph.ainvoke(initial_state)

    print(f"🔍 LangGraph result state: {result_state}")

    target_words = result_state.get("target_terms", [])
    distractor_words = result_state.get("distractor_terms", [])

    print(f"🎯 Extracted target_words: {target_words}")
    print(f"🔀 Extracted distractor_words: {distractor_words}")

    if not target_words:
        print("❌ LangGraph workflow completed but no target terms found")
        print(f"📋 Full result state: {result_state}")
        raise Exception("LangGraph agents failed to find terms for the topic")

    print(f"✅ LangGraph agents found {len(target_words)} target terms and {len(distractor_words)} distractor terms")
    print(f"🎯 Target words: {target_words}")
    print(f"🔀 Distractor words: {distractor_words}")

    # Generate word search grid using Claude via the sophisticated WordSearchGenerator
    print("🎲 Generating sophisticated word search grid...")
    grid = await game.grid_generator.generate_grid(target_words, distractor_words)

    game_id = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=12))

    print(f"✅ Sophisticated game created with ID: {game_id}")

    return {
        'gameId': game_id,
        'topic': topic,
        'targetWords': target_words,
        'distractorWords': distractor_words,
        'grid': grid
    }

@app.route('/api/game/submit', methods=['POST'])
def submit_game():
    """Submit game results and get score"""
    try:
        data = request.get_json()
        game_id = data.get('gameId')
        found_words = data.get('foundWords', [])

        if not game_id:
            return jsonify({"error": "Game ID is required"}), 400

        if game_id not in game_store:
            return jsonify({"error": "Game not found"}), 404

        game_data = game_store[game_id]

        # Calculate results
        target_words = game_data['targetWords']
        normalized_target = [w.upper() for w in target_words]
        normalized_found = [w.upper() for w in found_words]

        correct_found = [word for word in normalized_found if word in normalized_target]
        missed_words = [word for word in target_words if word.upper() not in normalized_found]

        score = round((len(correct_found) / len(target_words)) * 100) if target_words else 0

        result = {
            'topic': game_data['topic'],
            'targetWords': target_words,
            'foundWords': correct_found,
            'missedWords': missed_words,
            'score': score,
            'totalWords': len(target_words)
        }

        # Clean up the game data
        del game_store[game_id]

        return jsonify(result)

    except Exception as e:
        print(f"Error submitting game: {e}")
        return jsonify({"error": "Failed to submit game", "details": str(e)}), 500

@app.route('/api/games/active', methods=['GET'])
def get_active_games():
    """Get list of active games (for debugging)"""
    return jsonify({
        "active_games": len(game_store),
        "games": list(game_store.keys())
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'

    print("🧬 Starting Biology Game API Server...")
    print(f"📡 Server will run on http://localhost:{port}")
    print("🔗 Next.js app should run on http://localhost:3000")

    app.run(host='0.0.0.0', port=port, debug=debug)