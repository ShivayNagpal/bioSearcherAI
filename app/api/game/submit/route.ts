import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { gameId, foundWords } = await request.json()

    if (!gameId || !Array.isArray(foundWords)) {
      return NextResponse.json({ error: 'Game ID and found words are required' }, { status: 400 })
    }

    // Forward to Python LangGraph backend
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/game/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, foundWords }),
    })

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json()
      return NextResponse.json(
        { error: errorData.error || 'Failed to submit game' },
        { status: pythonResponse.status }
      )
    }

    return NextResponse.json(await pythonResponse.json())

  } catch (error) {
    console.error('Error submitting game:', error)
    return NextResponse.json({ error: 'Failed to connect to LangGraph backend' }, { status: 500 })
  }
}