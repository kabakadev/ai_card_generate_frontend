// src/components/Study/Study.jsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import NavBar from "../NavBar";
import StudyContent from "./StudyContent";
import StudySkeleton from "./StudySkeleton";
import useStudyData from "./useStudyData";
import WeeklyGoalDialog from "./WeeklyGoalDialog";
import NotificationSnackbar from "./NotificationSnackbar";
import { getJSON, putJSON } from "../../api"; // uses local -> prod fallback and attaches auth automatically

const DASHBOARD_TIMEOUT_MS = 15000;
const UPDATE_GOAL_TIMEOUT_MS = 10000;

const Study = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: userLoading } = useUser();
  const decksPerPage = 6;

  const {
    decks,
    pagination,
    isLoading: dataLoading,
    error,
    handlePageChange,
    refreshData,
  } = useStudyData(decksPerPage);

  const [userStats, setUserStats] = useState({
    weekly_goal: 50,
    mastery_level: 0,
    study_streak: 0,
    retention_rate: 0,
    cards_mastered: 0,
  });

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newWeeklyGoal, setNewWeeklyGoal] = useState(50);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Authentication redirect
  useEffect(() => {
    if (!userLoading && !isAuthenticated) navigate("/login");
  }, [userLoading, isAuthenticated, navigate]);

  // Fetch user stats (longer timeout)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserStats = async () => {
      try {
        const data = await getJSON("/dashboard", {
          timeoutMs: DASHBOARD_TIMEOUT_MS,
        });

        setUserStats({
          weekly_goal: data?.weekly_goal ?? 50,
          mastery_level: data?.mastery_level ?? 0,
          study_streak: data?.study_streak ?? 0,
          retention_rate: data?.retention_rate ?? 0,
          cards_mastered: data?.cards_mastered ?? 0,
        });
        setNewWeeklyGoal(data?.weekly_goal ?? 50);
      } catch (err) {
        console.error("Error fetching user stats:", err);
      }
    };

    fetchUserStats();
  }, [isAuthenticated]);

  // Handle data errors
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: "Failed to load decks. Please try again later.",
        severity: "error",
      });
      console.error("Deck loading error:", error);
    }
  }, [error]);

  const updateWeeklyGoal = async () => {
    try {
      await putJSON(
        "/user/stats",
        { weekly_goal: newWeeklyGoal },
        { timeoutMs: UPDATE_GOAL_TIMEOUT_MS }
      );

      setUserStats((prev) => ({ ...prev, weekly_goal: newWeeklyGoal }));
      setGoalDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Weekly goal updated successfully!",
        severity: "success",
      });
      // Refresh data after updating goal
      refreshData(pagination.currentPage);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.message || "Error updating weekly goal",
        severity: "error",
      });
    }
  };

  const handleDeckClick = (deckId) => {
    navigate(`/study/${deckId}`);
  };

  if (userLoading || dataLoading) {
    return <StudySkeleton />;
  }

  return (
    <>
      <NavBar />
      <StudyContent
        userStats={userStats}
        decks={decks}
        pagination={pagination}
        handlePageChange={handlePageChange}
        onUpdateGoalClick={() => setGoalDialogOpen(true)}
        onDeckClick={handleDeckClick}
        onCreateDeckClick={() => navigate("/mydecks")}
      />

      <WeeklyGoalDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        weeklyGoal={newWeeklyGoal}
        onWeeklyGoalChange={setNewWeeklyGoal}
        onSave={updateWeeklyGoal}
      />

      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </>
  );
};

export default Study;
