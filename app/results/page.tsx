'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Trophy, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface GameResult {
  topic: string
  targetWords: string[]
  foundWords: string[]
  missedWords: string[]
  score: number
  totalWords: number
}

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('id')

  const [results, setResults] = useState<GameResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!gameId) {
      setError('No game ID provided')
      setLoading(false)
      return
    }

    // Get results from session storage
    const storedResults = sessionStorage.getItem(`results_${gameId}`)
    if (storedResults) {
      setResults(JSON.parse(storedResults))
      setLoading(false)
    } else {
      setError('Results not found')
      setLoading(false)
    }
  }, [gameId])

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '🏆'
    if (score >= 70) return '🥉'
    if (score >= 50) return '📈'
    return '💪'
  }

  const getEncouragementMessage = (score: number): string => {
    if (score === 100) return 'Perfect score! You\'re a biology master!'
    if (score >= 90) return 'Excellent work! You have great biology knowledge!'
    if (score >= 70) return 'Great job! You found most of the words!'
    if (score >= 50) return 'Good effort! Keep learning and you\'ll improve!'
    return 'Don\'t give up! Biology is challenging but rewarding!'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-biology-accent mx-auto mb-4"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <a href="/" className="flex items-center text-biology-green hover:text-biology-accent transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              New Game
            </a>
            <a href="/" className="game-button">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </a>
          </div>
        </div>

        {/* Results Header */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-6 text-center">
          <div className="text-6xl mb-4">{getScoreEmoji(results.score)}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-biology-green mb-2">
            Game Complete!
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-600 mb-4">
            Topic: {results.topic}
          </h2>
          <div className={`text-5xl font-bold mb-2 ${getScoreColor(results.score)}`}>
            {results.score}%
          </div>
          <p className="text-lg text-gray-600 mb-4">
            You found {results.foundWords.length} out of {results.totalWords} words
          </p>
          <p className="text-biology-accent font-medium">
            {getEncouragementMessage(results.score)}
          </p>
        </div>

        {/* Detailed Results */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Words Found */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="font-bold text-green-600 mb-4 flex items-center text-xl">
              <CheckCircle className="w-6 h-6 mr-2" />
              Words You Found ({results.foundWords.length})
            </h3>

            <div className="space-y-2">
              {results.foundWords.length === 0 ? (
                <p className="text-gray-500">No words found</p>
              ) : (
                results.foundWords.map((word, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-mono text-lg">{word}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Words Missed */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="font-bold text-red-600 mb-4 flex items-center text-xl">
              <XCircle className="w-6 h-6 mr-2" />
              Words You Missed ({results.missedWords.length})
            </h3>

            <div className="space-y-2">
              {results.missedWords.length === 0 ? (
                <p className="text-green-600">Perfect! You found all words! 🎉</p>
              ) : (
                results.missedWords.map((word, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded flex items-center">
                    <XCircle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-mono text-lg">{word}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* All Target Words (for learning) */}
        <div className="bg-white rounded-lg p-6 shadow-lg mt-6">
          <h3 className="font-bold text-biology-green mb-4 flex items-center text-xl">
            <Trophy className="w-6 h-6 mr-2" />
            All Words Related to "{results.topic}"
          </h3>
          <p className="text-gray-600 mb-4">
            Here are all the biology terms that were hidden in the word search:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.targetWords.map((word, index) => {
              const wasFound = results.foundWords.some(found => found.toUpperCase() === word.toUpperCase())
              return (
                <div
                  key={index}
                  className={`p-3 rounded border-2 ${
                    wasFound
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    {wasFound ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span className="font-mono">{word}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Play Again CTA */}
        <div className="text-center mt-8">
          <a href="/" className="game-button text-lg px-8 py-4">
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Another Topic
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-biology-accent mx-auto mb-4"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}