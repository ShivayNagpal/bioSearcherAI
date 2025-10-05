#!/usr/bin/env python3
"""
Biology Word Search Game using LangGraph and Claude - API Version
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
            model="claude-3-5-sonnet-20241022",  # Note: LangChain may need different model ID
            anthropic_api_key=api_key,
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
        print(f"🔬 LangGraph Node: _research_topic starting for topic: {topic}")

        try:
            # Search Wikipedia for the topic
            print(f"📚 Searching Wikipedia for: {topic}")
            search_results = wikipedia.search(topic, results=3)
            print(f"📚 Wikipedia search results: {search_results}")

            if not search_results:
                raise Exception(f"No Wikipedia results found for '{topic}'")

            # Get the page content
            print(f"📄 Getting Wikipedia page: {search_results[0]}")
            try:
                page = wikipedia.page(search_results[0])
                content = page.content[:2000]  # Limit content length
            except wikipedia.exceptions.DisambiguationError as e:
                # If there's ambiguity, use the first option
                print(f"📄 Disambiguation found, using: {e.options[0]}")
                page = wikipedia.page(e.options[0])
                content = page.content[:2000]
            except wikipedia.exceptions.PageError:
                # If page doesn't exist, raise error
                print(f"📄 Page not found for {search_results[0]}")
                raise Exception(f"Wikipedia page not found for {search_results[0]}")

            print(f"📄 Got {len(content)} characters of content")

            # Use Claude to extract relevant biological terms
            prompt = f"""
            Analyze this Wikipedia content about "{topic}" and extract 8-12 specific biological terms, concepts, or parts related to this topic.
            Focus on technical terms that would be good for a word search game.

            Content: {content}

            Return only a comma-separated list of terms, no explanations:
            """

            print("🤖 Calling Claude to extract terms...")
            response = await self.llm.ainvoke(prompt)
            print(f"🤖 Claude response: {response.content}")

            terms = [term.strip() for term in response.content.split(",")]
            terms = [term for term in terms if len(term) > 3 and len(term) < 15][:10]
            print(f"🎯 Extracted and filtered terms: {terms}")

            return {
                **state,
                "target_terms": terms,
                "messages": state["messages"] + [{"role": "assistant", "content": f"Found {len(terms)} terms for {topic}"}]
            }

        except Exception as e:
            print(f"❌ Error in _research_topic: {e}")
            return {
                **state,
                "target_terms": [],
                "messages": state["messages"] + [{"role": "assistant", "content": f"Error researching topic: {str(e)}"}]
            }

    async def _find_distractors(self, state: ResearchState) -> ResearchState:
        """Find distractor terms from related but different biological topics"""
        topic = state["topic"]
        print(f"🎭 LangGraph Node: _find_distractors starting for topic: {topic}")

        # Define some related biological areas that are different from common topics
        distractor_topics = [
            "plant photosynthesis", "bacterial reproduction", "insect anatomy",
            "marine biology", "cellular respiration", "genetic mutation",
            "viral structure", "fungal growth", "bird migration", "reptile metabolism"
        ]

        # Remove any that might be too similar to the main topic
        filtered_topics = [t for t in distractor_topics if not any(word in t.lower() for word in topic.lower().split())]
        selected_topic = random.choice(filtered_topics[:3])
        print(f"🎭 Selected distractor topic: {selected_topic}")

        try:
            # Research the distractor topic
            print(f"📚 Searching Wikipedia for distractor: {selected_topic}")
            search_results = wikipedia.search(selected_topic, results=2)
            if search_results:
                print(f"📄 Getting distractor page: {search_results[0]}")
                try:
                    page = wikipedia.page(search_results[0])
                    content = page.content[:1500]
                except wikipedia.exceptions.DisambiguationError as e:
                    # If there's ambiguity, use the first option
                    print(f"📄 Disambiguation found, using: {e.options[0]}")
                    page = wikipedia.page(e.options[0])
                    content = page.content[:1500]
                except wikipedia.exceptions.PageError:
                    # If page doesn't exist, skip to fallback
                    print(f"📄 Page not found for {search_results[0]}")
                    raise Exception("Page not found")

                prompt = f"""
                Extract 6-8 biological terms from this content about "{selected_topic}".
                These should be distinctly different from terms related to "{topic}".

                Content: {content}

                Return only a comma-separated list of terms:
                """

                print("🤖 Calling Claude for distractor terms...")
                response = await self.llm.ainvoke(prompt)
                print(f"🤖 Claude distractor response: {response.content}")

                distractor_terms = [term.strip() for term in response.content.split(",")]
                distractor_terms = [term for term in distractor_terms if len(term) > 3 and len(term) < 15][:8]
                print(f"🎭 Extracted distractor terms: {distractor_terms}")
            else:
                distractor_terms = []
                print("⚠️ No Wikipedia results for distractor topic")

        except Exception as e:
            print(f"⚠️ Error finding distractors: {e}")
            # Fallback distractor terms
            distractor_terms = ["chloroplast", "ribosome", "mitochondria", "enzyme", "protein", "molecule"]
            print(f"🎭 Using fallback distractor terms: {distractor_terms}")

        return {
            **state,
            "distractor_terms": distractor_terms,
            "messages": state["messages"] + [{"role": "assistant", "content": f"Found {len(distractor_terms)} distractor terms"}]
        }

    async def _finalize_research(self, state: ResearchState) -> ResearchState:
        """Finalize the research process"""
        print(f"✅ LangGraph Node: _finalize_research")
        print(f"✅ Final target_terms: {state.get('target_terms', [])}")
        print(f"✅ Final distractor_terms: {state.get('distractor_terms', [])}")

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
            anthropic_api_key=api_key,
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
    """Main game class for API usage"""

    def __init__(self, api_key: str):
        self.agent = BiologyGameAgent(api_key)
        self.grid_generator = WordSearchGenerator(api_key)

    def calculate_results(self, target_words: List[str], found_words: List[str]) -> Dict:
        """Calculate game results"""
        target_upper = [word.upper() for word in target_words]
        found_upper = [word.upper() for word in found_words]

        correct_found = [word for word in found_upper if word in target_upper]
        missed_words = [word for word in target_words if word.upper() not in found_upper]

        score = len(correct_found) / len(target_words) * 100 if target_words else 0

        return {
            'correct_found': correct_found,
            'missed_words': missed_words,
            'score': round(score, 1),
            'total_words': len(target_words)
        }