'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import WordSearchGrid from '@/components/WordSearchGrid'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'

interface GameData {
  gameId: string
  topic: string
  grid: string[][]
  totalTargetWords: number
}

function GamePageContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('id')

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        setError('No game ID provided')
        setLoading(false)
        return
      }

      try {
        // Get from session storage
        const storedData = sessionStorage.getItem(`game_${gameId}`)
        if (storedData) {
          setGameData(JSON.parse(storedData))
          setLoading(false)
          return
        }

        setError('Game session expired. Please start a new game.')
        setLoading(false)
      } catch (err) {
        setError('Failed to load game')
        setLoading(false)
      }
    }

    fetchGameData()
  }, [gameId])

  const handleWordFound = (word: string) => {
    const upperWord = word.toUpperCase()
    if (!foundWords.includes(upperWord)) {
      setFoundWords(prev => [...prev, upperWord])
    }
  }

  const handleSubmitGame = async () => {
    if (!gameData) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/game/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: gameData.gameId,
          foundWords: foundWords,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit game')
      }

      const results = await response.json()

      // Store results and navigate to results page
      sessionStorage.setItem(`results_${gameData.gameId}`, JSON.stringify(results))
      window.location.href = `/results?id=${gameData.gameId}`

    } catch (err) {
      alert('Failed to submit game. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-biology-accent mx-auto mb-4"></div>
          <p>Loading your word search...</p>
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/" className="game-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <a href="/" className="flex items-center text-biology-green hover:text-biology-accent transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              New Game
            </a>
            <div className="text-right">
              <div className="text-sm text-gray-500">Words Found</div>
              <div className="text-2xl font-bold text-biology-accent">
                {foundWords.length} / {gameData.totalTargetWords}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold text-biology-green mb-2">
              Topic: {gameData.topic}
            </h1>
            <p className="text-gray-600">
              Find words hidden in the grid below. Click and drag to select words horizontally, vertically, or diagonally.
            </p>
          </div>
        </div>

        {/* Game Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <WordSearchGrid
              grid={gameData.grid}
              onWordFound={handleWordFound}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="font-bold text-biology-green mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Words Found ({foundWords.length})
              </h3>

              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {foundWords.length === 0 ? (
                  <p className="text-gray-500 text-sm">No words found yet...</p>
                ) : (
                  foundWords.map((word, index) => (
                    <div key={index} className="bg-green-100 p-2 rounded flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-mono text-sm">{word}</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleSubmitGame}
                disabled={submitting}
                className="game-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Finish Game
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Submit anytime to see your results and missed words
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-biology-accent mx-auto mb-4"></div>
          <p>Loading your word search...</p>
        </div>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  )
}