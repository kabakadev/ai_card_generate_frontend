// src/components/Study/StudyMode/useStudySession.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { getJSON, postJSON } from "../../../api"; // adjust if your api.js path differs

export const useStudySession = (deckId, startTimeRef, sessionStartTimeRef) => {
  const [flashcards, setFlashcards] = useState([]);
  const [progress, setProgress] = useState([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionStats, setSessionStats] = useState({
    totalCards: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    timeSpent: 0,
    cardsLearned: 0,
  });
  const [showSummary, setShowSummary] = useState(false);
  const [deck, setDeck] = useState(null);
  const [answeredCards, setAnsweredCards] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        // 1) Deck details
        const deckData = await getJSON(`/decks/${deckId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeck(deckData);

        // 2) Flashcards for this deck (supports array or {items})
        const flashcardsData = await getJSON(
          `/flashcards?deck_id=${deckId}&all=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const deckFlashcards = Array.isArray(flashcardsData?.items)
          ? flashcardsData.items
          : Array.isArray(flashcardsData)
          ? flashcardsData
          : [];
        setFlashcards(deckFlashcards);

        // 3) Progress for this deck
        const progressData = await getJSON(`/progress/deck/${deckId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProgress(Array.isArray(progressData) ? progressData : []);

        setSessionStats((prev) => ({
          ...prev,
          totalCards: deckFlashcards.length,
        }));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load study session. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (deckId) fetchData();
  }, [deckId]);

  const getCardProgress = useCallback(
    (flashcardId) =>
      progress.find((p) => p.flashcard_id === flashcardId) || {
        study_count: 0,
        correct_attempts: 0,
        incorrect_attempts: 0,
        is_learned: false,
      },
    [progress]
  );

  const handleFlashcardResponse = useCallback(
    async (wasCorrect) => {
      const currentFlashcard = flashcards[currentFlashcardIndex];
      if (!currentFlashcard) {
        console.error("No current flashcard found");
        return;
      }

      const timeSpent = (Date.now() - startTimeRef.current) / 60000; // minutes

      try {
        const token = localStorage.getItem("authToken");
        await postJSON(
          "/progress",
          {
            deck_id: Number.parseInt(deckId, 10),
            flashcard_id: currentFlashcard.id,
            was_correct: wasCorrect,
            time_spent: timeSpent,
          },
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Track answered card
        setAnsweredCards((prev) => new Set(prev).add(currentFlashcard.id));

        setSessionStats((prev) => ({
          ...prev,
          correctAnswers: prev.correctAnswers + (wasCorrect ? 1 : 0),
          incorrectAnswers: prev.incorrectAnswers + (wasCorrect ? 0 : 1),
          timeSpent: prev.timeSpent + timeSpent,
        }));
      } catch (err) {
        console.error("Error updating progress:", err);
        setError("Failed to save your progress. Please try again.");
      }
    },
    [deckId, currentFlashcardIndex, flashcards, startTimeRef]
  );

  const handleFinishSession = useCallback(() => {
    const totalTimeSpent = (Date.now() - sessionStartTimeRef.current) / 60000;
    setSessionStats((prev) => ({
      ...prev,
      timeSpent: totalTimeSpent,
    }));
    setShowSummary(true);
  }, [sessionStartTimeRef]);

  return {
    deck,
    flashcards,
    progress,
    currentFlashcardIndex,
    setCurrentFlashcardIndex,
    showAnswer,
    setShowAnswer,
    loading,
    error,
    sessionStats,
    setSessionStats,
    showSummary,
    setShowSummary,
    handleFlashcardResponse,
    getCardProgress,
    answeredCards,
    handleFinishSession,
  };
};
