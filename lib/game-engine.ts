import { ChatAnthropic } from '@langchain/anthropic'

const wikipedia = require('wikipedia')

export interface GameData {
  topic: string
  targetWords: string[]
  distractorWords: string[]
  grid: string[][]
  gameId: string
}

export interface GameResult {
  topic: string
  targetWords: string[]
  foundWords: string[]
  missedWords: string[]
  score: number
  totalWords: number
}

class BiologyGameEngine {
  private llm: ChatAnthropic

  constructor(apiKey: string) {
    this.llm = new ChatAnthropic({
      model: 'claude-3-5-sonnet-20241022',
      anthropicApiKey: apiKey,
      temperature: 0.7
    })
  }

  async researchTopic(topic: string): Promise<{ targetWords: string[], distractorWords: string[] }> {
    try {
      // Search Wikipedia for the topic
      const searchResults = await wikipedia.search(topic, { results: 3 })
      if (!searchResults.results || searchResults.results.length === 0) {
        throw new Error(`No Wikipedia results found for '${topic}'`)
      }

      // Get the page content
      const page = await wikipedia.page(searchResults.results[0].title)
      const content = await page.content()
      const limitedContent = content.substring(0, 2000)

      // Extract target terms
      const targetPrompt = `
        Analyze this Wikipedia content about "${topic}" and extract 8-12 specific biological terms, concepts, or parts related to this topic.
        Focus on technical terms that would be good for a word search game. Terms should be 4-14 characters long.

        Content: ${limitedContent}

        Return only a comma-separated list of terms, no explanations:
      `

      const targetResponse = await this.llm.invoke(targetPrompt)
      let targetWords = targetResponse.content.toString().split(',').map(term => term.trim())
      targetWords = targetWords.filter(term => term.length >= 4 && term.length <= 14).slice(0, 10)

      // Find distractor terms from a different biological area
      const distractorTopics = [
        'plant photosynthesis', 'bacterial reproduction', 'insect anatomy',
        'marine biology', 'cellular respiration', 'genetic mutation',
        'viral structure', 'fungal growth', 'bird migration', 'reptile metabolism',
        'enzyme function', 'protein synthesis', 'DNA replication'
      ]

      const filteredTopics = distractorTopics.filter(t =>
        !t.toLowerCase().split(' ').some(word => topic.toLowerCase().includes(word))
      )
      const selectedTopic = filteredTopics[Math.floor(Math.random() * Math.min(3, filteredTopics.length))]

      let distractorWords: string[] = []
      try {
        const distractorSearch = await wikipedia.search(selectedTopic, { results: 2 })
        if (distractorSearch.results && distractorSearch.results.length > 0) {
          const distractorPage = await wikipedia.page(distractorSearch.results[0].title)
          const distractorContent = await distractorPage.content()
          const limitedDistractorContent = distractorContent.substring(0, 1500)

          const distractorPrompt = `
            Extract 6-8 biological terms from this content about "${selectedTopic}".
            These should be distinctly different from terms related to "${topic}".
            Terms should be 4-14 characters long.

            Content: ${limitedDistractorContent}

            Return only a comma-separated list of terms:
          `

          const distractorResponse = await this.llm.invoke(distractorPrompt)
          distractorWords = distractorResponse.content.toString().split(',').map(term => term.trim())
          distractorWords = distractorWords.filter(term => term.length >= 4 && term.length <= 14).slice(0, 8)
        }
      } catch (error) {
        console.warn('Error getting distractor terms:', error)
      }

      // Fallback distractor terms if needed
      if (distractorWords.length < 4) {
        const fallbackTerms = ['chloroplast', 'ribosome', 'mitochondria', 'enzyme', 'protein', 'molecule', 'nucleus', 'membrane']
        distractorWords = [...distractorWords, ...fallbackTerms].slice(0, 8)
      }

      return { targetWords, distractorWords }

    } catch (error) {
      console.error('Error researching topic:', error)
      throw new Error(`Failed to research topic: ${error}`)
    }
  }

  async generateWordSearchGrid(targetWords: string[], distractorWords: string[], size: number = 15): Promise<string[][]> {
    const allWords = [...targetWords, ...distractorWords]

    const prompt = `
      Create a ${size}x${size} word search grid containing these words: ${allWords.join(', ')}

      Rules:
      1. Place words horizontally (left-to-right), vertically (top-to-bottom), or diagonally
      2. Words can overlap at common letters
      3. Fill empty spaces with random letters A-Z
      4. Return the grid as ${size} lines, each with ${size} letters separated by spaces
      5. Use only uppercase letters
      6. Make sure all words can actually fit and are placed in the grid

      Words to place: ${allWords.join(', ')}

      Return only the grid, no explanations:
    `

    const response = await this.llm.invoke(prompt)
    const lines = response.content.toString().trim().split('\n')
    const grid: string[][] = []

    for (const line of lines) {
      if (grid.length >= size) break
      const row = line.replace(/\s+/g, '').split('').filter(c => /[A-Z]/.test(c))
      if (row.length >= size) {
        grid.push(row.slice(0, size))
      }
    }

    // Fill any missing rows with random letters
    while (grid.length < size) {
      const row = Array.from({ length: size }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      grid.push(row)
    }

    // Ensure all rows have the correct length
    for (let i = 0; i < grid.length; i++) {
      while (grid[i].length < size) {
        grid[i].push(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      }
      grid[i] = grid[i].slice(0, size)
    }

    return grid
  }

  async createGame(topic: string): Promise<GameData> {
    const { targetWords, distractorWords } = await this.researchTopic(topic)
    const grid = await this.generateWordSearchGrid(targetWords, distractorWords)

    const gameId = Math.random().toString(36).substring(2, 15)

    return {
      topic,
      targetWords,
      distractorWords,
      grid,
      gameId
    }
  }

  calculateResults(gameData: GameData, userFoundWords: string[]): GameResult {
    const normalizedTargetWords = gameData.targetWords.map(w => w.toUpperCase())
    const normalizedUserWords = userFoundWords.map(w => w.toUpperCase())

    const foundWords = normalizedUserWords.filter(word =>
      normalizedTargetWords.includes(word)
    )

    const missedWords = gameData.targetWords.filter(word =>
      !normalizedUserWords.includes(word.toUpperCase())
    )

    const score = Math.round((foundWords.length / gameData.targetWords.length) * 100)

    return {
      topic: gameData.topic,
      targetWords: gameData.targetWords,
      foundWords: foundWords,
      missedWords: missedWords,
      score: score,
      totalWords: gameData.targetWords.length
    }
  }
}

export default BiologyGameEngine