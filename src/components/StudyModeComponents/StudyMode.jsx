// src/components/Study/StudyMode.jsx
"use client";

import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Alert, Button } from "@mui/material";
import NavBar from "../NavBar";
import StudyHeader from "./StudyMode/StudyHeader";
import StudyProgress from "./StudyMode/StudyProgress";
import FlashcardDisplay from "./StudyMode/FlashcardDisplay";
import StudyActions from "./StudyMode/StudyActions";
import StudySummary from "./StudyMode/StudySummary";
import { useStudySession } from "./StudyMode/useStudySession";
import LoadingState from "./LoadingState";
import EmptyDeckState from "./StudyMode/EmptyDeckState";

const StudyMode = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const sessionStartTimeRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  const {
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
  } = useStudySession(deckId, startTimeRef, sessionStartTimeRef);

  // Helper function to check if current card is answered
  const isCurrentCardAnswered = () => {
    if (!flashcards[currentFlashcardIndex]) return false;
    return answeredCards.has(flashcards[currentFlashcardIndex].id);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      const currentCard = flashcards[currentFlashcardIndex];
      if (!currentCard) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setShowAnswer(!showAnswer);
      } else if (e.key === "ArrowRight") {
        // Right arrow - move to next card or submit correct answer
        if (showAnswer && !isCurrentCardAnswered()) {
          handleFlashcardResponse(true);
        } else if (currentFlashcardIndex < flashcards.length - 1) {
          setCurrentFlashcardIndex(currentFlashcardIndex + 1);
          setShowAnswer(false);
          startTimeRef.current = Date.now();
        }
      } else if (e.key === "ArrowLeft") {
        // Left arrow - move to previous card or submit incorrect answer
        if (showAnswer && !isCurrentCardAnswered()) {
          handleFlashcardResponse(false);
        } else if (currentFlashcardIndex > 0) {
          setCurrentFlashcardIndex(currentFlashcardIndex - 1);
          setShowAnswer(false);
          startTimeRef.current = Date.now();
        }
      } else if (showAnswer && !isCurrentCardAnswered()) {
        // Number keys for direct response
        if (e.key === "1") {
          handleFlashcardResponse(true);
        } else if (e.key === "0") {
          handleFlashcardResponse(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    showAnswer,
    currentFlashcardIndex,
    flashcards,
    handleFlashcardResponse,
    setCurrentFlashcardIndex,
    setShowAnswer,
    answeredCards,
  ]);

  const handleExitStudy = () => {
    navigate("/study");
  };

  const handleRestartStudy = () => {
    setShowSummary(false);
    setCurrentFlashcardIndex(0);
    setShowAnswer(false);
    startTimeRef.current = Date.now();
    setSessionStats({
      totalCards: flashcards.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      timeSpent: 0,
      cardsLearned: 0,
    });
  };

  if (loading) {
    return <LoadingState message="Loading study session..." />;
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/study")}
            >
              Go Back
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (flashcards.length === 0) {
    return <EmptyDeckState deckId={deckId} />;
  }

  const currentFlashcard = flashcards[currentFlashcardIndex];
  const cardProgress = getCardProgress(currentFlashcard.id);
  const progressPercentage =
    ((currentFlashcardIndex + 1) / flashcards.length) * 100;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <NavBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <StudyHeader deck={deck} handleExitStudy={handleExitStudy} />

        <StudyProgress
          currentIndex={currentFlashcardIndex}
          totalCards={flashcards.length}
          progressPercentage={progressPercentage}
        />

        <FlashcardDisplay
          currentFlashcard={currentFlashcard}
          showAnswer={showAnswer}
          setShowAnswer={setShowAnswer}
          cardProgress={cardProgress}
        />

        <StudyActions
          showAnswer={showAnswer}
          setShowAnswer={setShowAnswer}
          currentFlashcardIndex={currentFlashcardIndex}
          flashcardsLength={flashcards.length}
          setCurrentFlashcardIndex={setCurrentFlashcardIndex}
          startTimeRef={startTimeRef}
          handleFlashcardResponse={handleFlashcardResponse}
          cardProgress={cardProgress}
          handleFinishSession={handleFinishSession}
          isCurrentCardAnswered={isCurrentCardAnswered()}
        />

        <StudySummary
          showSummary={showSummary}
          sessionStats={sessionStats}
          handleExitStudy={handleExitStudy}
        />
      </Container>
    </Box>
  );
};

export default StudyMode;
