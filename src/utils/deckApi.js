// src/utils/deckApi.js
import { getJSON, postJSON, fetchWithFallback } from "../api"; // adjust path if needed

export const fetchDeckAndFlashcards = async (
  deckId,
  page = 1,
  perPage = 10
) => {
  const token = localStorage.getItem("authToken");
  if (!deckId) throw new Error("Deck ID is required");

  const deckData = await getJSON(`/decks/${deckId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const cardsData = await getJSON(
    `/flashcards?deck_id=${deckId}&page=${page}&per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (cardsData?.message === "No flashcards found.") {
    return {
      deckData,
      flashcardsData: [],
      pagination: {
        page: 1,
        per_page: perPage,
        total_pages: 1,
        total_items: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }

  if (!Array.isArray(cardsData?.items)) {
    return {
      deckData,
      flashcardsData: [],
      pagination: cardsData?.pagination,
    };
  }

  const flashcardsData = Array.isArray(cardsData.items) ? cardsData.items : [];

  return {
    deckData,
    flashcardsData,
    pagination: cardsData.pagination,
  };
};

export const addFlashcard = async (deckId, newFlashcard) => {
  const token = localStorage.getItem("authToken");
  return postJSON(
    "/flashcards",
    {
      deck_id: Number.parseInt(deckId, 10),
      front_text: newFlashcard.front_text,
      back_text: newFlashcard.back_text,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

export const updateFlashcard = async (flashcard) => {
  const token = localStorage.getItem("authToken");
  return postJSON(
    `/flashcards/${flashcard.id}`,
    { front_text: flashcard.front_text, back_text: flashcard.back_text },
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

export const deleteFlashcard = async (flashcardId) => {
  const token = localStorage.getItem("authToken");
  const res = await fetchWithFallback(`/flashcards/${flashcardId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete flashcard");
};

export const createOrUpdateDeck = async (deck, isEditing) => {
  const token = localStorage.getItem("authToken");
  const endpoint = isEditing ? `/decks/${deck.id}` : "/decks";
  return postJSON(endpoint, deck, {
    method: isEditing ? "PUT" : "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchDecks = async (token, page = 1, perPage = 10) => {
  try {
    const data = await getJSON(`/decks?page=${page}&per_page=${perPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      decks: Array.isArray(data?.items) ? data.items : [],
      pagination: data?.pagination || {
        page,
        per_page: perPage,
        total_pages: 1,
        total_items: 0,
        has_next: false,
        has_prev: false,
      },
    };
  } catch (error) {
    console.error("Failed to fetch decks:", error);
    return {
      decks: [],
      pagination: {
        page: 1,
        per_page: perPage,
        total_pages: 1,
        total_items: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }
};

export const deleteDeck = async (deckId) => {
  const token = localStorage.getItem("authToken");
  const res = await fetchWithFallback(`/decks/${deckId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete deck");
};
