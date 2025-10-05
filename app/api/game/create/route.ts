import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Forward request to Python backend
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/game/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    })

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json()
      return NextResponse.json(
        { error: errorData.error || 'Failed to create game' },
        { status: pythonResponse.status }
      )
    }

    const gameData = await pythonResponse.json()
    return NextResponse.json(gameData)

  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Failed to connect to game service' },
      { status: 500 }
    )
  }
}