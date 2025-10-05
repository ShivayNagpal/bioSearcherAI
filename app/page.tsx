'use client'

import { useState } from 'react'
import { Search, Dna, BookOpen } from 'lucide-react'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStartGame = async () => {
    if (!topic.trim()) {
      setError('Please enter a biology topic')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to create game')
      }

      const gameData = await response.json()

      // Store game data in session storage and navigate to game page
      sessionStorage.setItem(`game_${gameData.gameId}`, JSON.stringify(gameData))
      window.location.href = `/game?id=${gameData.gameId}`

    } catch (err) {
      setError('Failed to create game. Please try again.')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartGame()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-biology-accent p-4 rounded-full">
              <Dna className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-biology-green mb-4">
            Biology Word Search
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Enter any biology topic and challenge yourself to find hidden words!
          </p>
          <p className="text-sm text-gray-500">
            Powered by AI research from Wikipedia and Claude
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="topic" className="block text-left text-sm font-medium text-gray-700 mb-2">
              What biology topic would you like to explore?
            </label>
            <div className="relative">
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., parts of kidney, photosynthesis, cell division..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-biology-accent focus:border-transparent text-lg"
                disabled={loading}
              />
              <Search className="absolute right-3 top-3 w-6 h-6 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleStartGame}
            disabled={loading || !topic.trim()}
            className="game-button w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating your word search...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Start Game
              </>
            )}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/50 p-6 rounded-lg backdrop-blur">
            <h3 className="font-semibold text-biology-green mb-2">🔍 AI Research</h3>
            <p className="text-sm text-gray-600">
              Our AI agent searches Wikipedia to find relevant terms about your topic
            </p>
          </div>
          <div className="bg-white/50 p-6 rounded-lg backdrop-blur">
            <h3 className="font-semibold text-biology-green mb-2">🧩 Smart Puzzles</h3>
            <p className="text-sm text-gray-600">
              Claude generates custom word search grids with topic-related and distractor words
            </p>
          </div>
          <div className="bg-white/50 p-6 rounded-lg backdrop-blur">
            <h3 className="font-semibold text-biology-green mb-2">🏆 Learn & Score</h3>
            <p className="text-sm text-gray-600">
              Find hidden words and see your results with detailed explanations
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}