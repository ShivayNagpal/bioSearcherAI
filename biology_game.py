#!/usr/bin/env python3
"""
Biology Word Search Game using LangGraph and Claude
"""

import os
import asyncio
import random
import re
from typing import List, Dict, Tuple, Set
from dataclasses import dataclass
from dotenv import load_dotenv

import wikipedia
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, END
from langgraph.graph.message import AnyMessage, add_messages
from typing_extensions import Annotated, TypedDict

# Load environment variables
load_dotenv()

@dataclass
class GameResult:
    """Represents the result of a game"""
    topic: str
    target_words: List[str]
    distractor_words: List[str]
    grid: List[List[str]]
    found_words: List[str]
    score: float

class ResearchState(TypedDict):
    """State for the research agent"""
    messages: Annotated[list[AnyMessage], add_messages]
    topic: str
    target_terms: List[str]
    distractor_terms: List[str]
    research_complete: bool

class BiologyGameAgent:
    """Main game agent using LangGraph"""

    def __init__(self, api_key: str):
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            api_key=api_key,
            temperature=0.7
        )
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(ResearchState)

        # Add nodes
        workflow.add_node("research_topic", self._research_topic)
        workflow.add_node("find_distractors", self._find_distractors)
        workflow.add_node("finalize", self._finalize_research)

        # Add edges
        workflow.set_entry_point("research_topic")
        workflow.add_edge("research_topic", "find_distractors")
        workflow.add_edge("find_distractors", "finalize")
        workflow.add_edge("finalize", END)

        return workflow.compile()

    async def _research_topic(self, state: ResearchState) -> ResearchState:
        """Research the main topic on Wikipedia"""
        topic = state["topic"]

        try:
            # Search Wikipedia for the topic
            search_results = wikipedia.search(topic, results=3)
            if not search_results:
                raise Exception(f"No Wikipedia results found for '{topic}'")

            # Get the page content
            page = wikipedia.page(search_results[0])
            content = page.content[:2000]  # Limit content length

            # Use Claude to extract relevant biological terms
            prompt = f"""
            Analyze this Wikipedia content about "{topic}" and extract 8-12 specific biological terms, concepts, or parts related to this topic.
            Focus on technical terms that would be good for a word search game.

            Content: {content}

            Return only a comma-separated list of terms, no explanations:
            """

            response = await self.llm.ainvoke(prompt)
            terms = [term.strip() for term in response.content.split(",")]
            terms = [term for term in terms if len(term) > 3 and len(term) < 15][:10]

            return {
                **state,
                "target_terms": terms,
                "messages": state["messages"] + [{"role": "assistant", "content": f"Found {len(terms)} terms for {topic}"}]
            }

        except Exception as e:
            return {
                **state,
                "target_terms": [],
                "messages": state["messages"] + [{"role": "assistant", "content": f"Error researching topic: {str(e)}"}]
            }

    async def _find_distractors(self, state: ResearchState) -> ResearchState:
        """Find distractor terms from related but different biological topics"""
        topic = state["topic"]

        # Define some related biological areas that are different from common topics
        distractor_topics = [
            "plant photosynthesis", "bacterial reproduction", "insect anatomy",
            "marine biology", "cellular respiration", "genetic mutation",
            "viral structure", "fungal growth", "bird migration", "reptile metabolism"
        ]

        # Remove any that might be too similar to the main topic
        filtered_topics = [t for t in distractor_topics if not any(word in t.lower() for word in topic.lower().split())]
        selected_topic = random.choice(filtered_topics[:3])

        try:
            # Research the distractor topic
            search_results = wikipedia.search(selected_topic, results=2)
            if search_results:
                page = wikipedia.page(search_results[0])
                content = page.content[:1500]

                prompt = f"""
                Extract 6-8 biological terms from this content about "{selected_topic}".
                These should be distinctly different from terms related to "{topic}".

                Content: {content}

                Return only a comma-separated list of terms:
                """

                response = await self.llm.ainvoke(prompt)
                distractor_terms = [term.strip() for term in response.content.split(",")]
                distractor_terms = [term for term in distractor_terms if len(term) > 3 and len(term) < 15][:8]
            else:
                distractor_terms = []

        except Exception:
            # Fallback distractor terms
            distractor_terms = ["chloroplast", "ribosome", "mitochondria", "enzyme", "protein", "molecule"]

        return {
            **state,
            "distractor_terms": distractor_terms,
            "messages": state["messages"] + [{"role": "assistant", "content": f"Found {len(distractor_terms)} distractor terms"}]
        }

    async def _finalize_research(self, state: ResearchState) -> ResearchState:
        """Finalize the research process"""
        return {
            **state,
            "research_complete": True,
            "messages": state["messages"] + [{"role": "assistant", "content": "Research completed successfully"}]
        }

class WordSearchGenerator:
    """Generates word search grids using Claude"""

    def __init__(self, api_key: str):
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            api_key=api_key,
            temperature=0.3
        )

    async def generate_grid(self, target_words: List[str], distractor_words: List[str], size: int = 15) -> List[List[str]]:
        """Generate a word search grid with the given words"""
        all_words = target_words + distractor_words

        prompt = f"""
        Create a {size}x{size} word search grid containing these words: {', '.join(all_words)}

        Rules:
        1. Place words horizontally (left-to-right), vertically (top-to-bottom), or diagonally
        2. Words can overlap at common letters
        3. Fill empty spaces with random letters
        4. Return the grid as {size} lines, each with {size} letters separated by spaces
        5. Use only uppercase letters

        Words to place: {', '.join(all_words)}

        Return only the grid, no explanations:
        """

        response = await self.llm.ainvoke(prompt)

        # Parse the response into a 2D grid
        lines = response.content.strip().split('\n')
        grid = []

        for line in lines:
            if len(grid) >= size:
                break
            row = [c.upper() for c in line.replace(' ', '') if c.isalpha()]
            if len(row) >= size:
                grid.append(row[:size])

        # Fill any missing rows with random letters
        while len(grid) < size:
            row = [chr(random.randint(65, 90)) for _ in range(size)]
            grid.append(row)

        # Ensure all rows have the correct length
        for i, row in enumerate(grid):
            while len(row) < size:
                row.append(chr(random.randint(65, 90)))
            grid[i] = row[:size]

        return grid

class BiologyGame:
    """Main game class"""

    def __init__(self, api_key: str):
        self.agent = BiologyGameAgent(api_key)
        self.grid_generator = WordSearchGenerator(api_key)

    async def play_game(self, topic: str) -> GameResult:
        """Play a complete game"""
        print(f"🧬 Starting biology word search for topic: {topic}")

        # Research phase
        initial_state = ResearchState(
            messages=[],
            topic=topic,
            target_terms=[],
            distractor_terms=[],
            research_complete=False
        )

        print("🔍 Researching topic and finding terms...")
        result_state = await self.agent.graph.ainvoke(initial_state)

        target_words = result_state["target_terms"]
        distractor_words = result_state["distractor_terms"]

        if not target_words:
            raise Exception("Failed to find terms for the topic")

        print(f"✅ Found {len(target_words)} target terms and {len(distractor_words)} distractor terms")

        # Generate word search grid
        print("🎲 Generating word search grid...")
        grid = await self.grid_generator.generate_grid(target_words, distractor_words)

        # Display the game
        self._display_grid(grid)
        print(f"\n🎯 Find these words related to '{topic}':")
        for i, word in enumerate(target_words, 1):
            print(f"{i:2}. {word.upper()}")

        # Get user input
        print("\n" + "="*50)
        print("Enter the words you found (one per line, or 'done' to finish):")
        found_words = []

        while True:
            user_input = input("> ").strip().upper()
            if user_input.lower() == 'done':
                break
            if user_input and user_input not in found_words:
                found_words.append(user_input)
                print(f"Added: {user_input}")

        # Calculate score
        correct_found = [word for word in found_words if word.upper() in [t.upper() for t in target_words]]
        score = len(correct_found) / len(target_words) * 100 if target_words else 0

        # Display results
        print("\n" + "="*50)
        print("🏆 GAME RESULTS")
        print(f"Topic: {topic}")
        print(f"Words found: {len(correct_found)}/{len(target_words)}")
        print(f"Score: {score:.1f}%")

        print(f"\n✅ Correct words you found:")
        for word in correct_found:
            print(f"  • {word}")

        missed_words = [word for word in target_words if word.upper() not in [w.upper() for w in found_words]]
        if missed_words:
            print(f"\n❌ Words you missed:")
            for word in missed_words:
                print(f"  • {word.upper()}")

        return GameResult(
            topic=topic,
            target_words=target_words,
            distractor_words=distractor_words,
            grid=grid,
            found_words=found_words,
            score=score
        )

    def _display_grid(self, grid: List[List[str]]):
        """Display the word search grid"""
        print("\n" + "="*50)
        print("🔤 WORD SEARCH GRID")
        print("="*50)

        # Print column numbers
        print("   ", end="")
        for i in range(len(grid[0])):
            print(f"{i%10:2}", end="")
        print()

        # Print grid with row numbers
        for i, row in enumerate(grid):
            print(f"{i:2} ", end="")
            for cell in row:
                print(f"{cell:2}", end="")
            print()

async def main():
    """Main game loop"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Error: Please set your ANTHROPIC_API_KEY in a .env file")
        print("Create a .env file with: ANTHROPIC_API_KEY=your_key_here")
        return

    game = BiologyGame(api_key)

    print("🧬 Welcome to the Biology Word Search Game!")
    print("This game will research any biology topic and create a word search puzzle.")
    print()

    while True:
        topic = input("Enter a biology topic (or 'quit' to exit): ").strip()
        if topic.lower() == 'quit':
            break

        if not topic:
            continue

        try:
            await game.play_game(topic)
        except Exception as e:
            print(f"❌ Error: {e}")

        print("\n" + "="*50)
        play_again = input("Play again? (y/n): ").strip().lower()
        if play_again != 'y':
            break

    print("Thanks for playing! 🎮")

if __name__ == "__main__":
    asyncio.run(main())