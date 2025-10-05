'use client'

import { useState, useRef, useCallback } from 'react'

interface WordSearchGridProps {
  grid: string[][]
  onWordFound: (word: string) => void
}

interface Position {
  row: number
  col: number
}

interface Selection {
  start: Position | null
  end: Position | null
  current: Position | null
}

export default function WordSearchGrid({ grid, onWordFound }: WordSearchGridProps) {
  const [selection, setSelection] = useState<Selection>({ start: null, end: null, current: null })
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const isInSelection = useCallback((row: number, col: number): boolean => {
    if (!selection.start || !selection.current) return false

    const startRow = selection.start.row
    const startCol = selection.start.col
    const endRow = selection.current.row
    const endCol = selection.current.col

    // Calculate direction
    const rowDiff = endRow - startRow
    const colDiff = endCol - startCol

    // Check if it's a valid line (horizontal, vertical, or diagonal)
    if (rowDiff === 0) {
      // Horizontal line
      const minCol = Math.min(startCol, endCol)
      const maxCol = Math.max(startCol, endCol)
      return row === startRow && col >= minCol && col <= maxCol
    } else if (colDiff === 0) {
      // Vertical line
      const minRow = Math.min(startRow, endRow)
      const maxRow = Math.max(startRow, endRow)
      return col === startCol && row >= minRow && row <= maxRow
    } else if (Math.abs(rowDiff) === Math.abs(colDiff)) {
      // Diagonal line
      const steps = Math.abs(rowDiff)
      const rowStep = rowDiff > 0 ? 1 : -1
      const colStep = colDiff > 0 ? 1 : -1

      for (let i = 0; i <= steps; i++) {
        const checkRow = startRow + (i * rowStep)
        const checkCol = startCol + (i * colStep)
        if (checkRow === row && checkCol === col) {
          return true
        }
      }
    }

    return false
  }, [selection])

  const getSelectedWord = useCallback((start: Position, end: Position): string => {
    const rowDiff = end.row - start.row
    const colDiff = end.col - start.col

    let word = ''

    if (rowDiff === 0) {
      // Horizontal
      const minCol = Math.min(start.col, end.col)
      const maxCol = Math.max(start.col, end.col)
      const step = start.col <= end.col ? 1 : -1

      for (let col = start.col; step > 0 ? col <= end.col : col >= end.col; col += step) {
        word += grid[start.row][col]
      }
    } else if (colDiff === 0) {
      // Vertical
      const step = start.row <= end.row ? 1 : -1

      for (let row = start.row; step > 0 ? row <= end.row : row >= end.row; row += step) {
        word += grid[row][start.col]
      }
    } else if (Math.abs(rowDiff) === Math.abs(colDiff)) {
      // Diagonal
      const steps = Math.abs(rowDiff)
      const rowStep = rowDiff > 0 ? 1 : -1
      const colStep = colDiff > 0 ? 1 : -1

      for (let i = 0; i <= steps; i++) {
        const row = start.row + (i * rowStep)
        const col = start.col + (i * colStep)
        word += grid[row][col]
      }
    }

    return word.toUpperCase()
  }, [grid])

  const handleMouseDown = (row: number, col: number) => {
    setIsSelecting(true)
    setSelection({
      start: { row, col },
      end: null,
      current: { row, col }
    })
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isSelecting && selection.start) {
      setSelection(prev => ({
        ...prev,
        current: { row, col }
      }))
    }
  }

  const handleMouseUp = () => {
    if (isSelecting && selection.start && selection.current) {
      const word = getSelectedWord(selection.start, selection.current)

      if (word.length >= 3) {
        const wordKey = word.toUpperCase()
        if (!foundWords.has(wordKey)) {
          setFoundWords(prev => new Set([...prev, wordKey]))
          onWordFound(word)
        }
      }
    }

    setIsSelecting(false)
    setSelection({ start: null, end: null, current: null })
  }

  const getCellClassName = (row: number, col: number): string => {
    let className = 'word-search-cell select-none'

    if (isInSelection(row, col)) {
      className += ' selected'
    }

    return className
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div
        ref={gridRef}
        className="inline-block border-2 border-gray-200 rounded-lg p-2 bg-gray-50"
        onMouseLeave={() => {
          if (isSelecting) {
            setIsSelecting(false)
            setSelection({ start: null, end: null, current: null })
          }
        }}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClassName(rowIndex, colIndex)}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                onMouseUp={handleMouseUp}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 <strong>How to play:</strong></p>
        <p>• Click and drag to select words horizontally, vertically, or diagonally</p>
        <p>• Words must be at least 3 letters long</p>
        <p>• Found words will appear in the sidebar</p>
      </div>
    </div>
  )
}