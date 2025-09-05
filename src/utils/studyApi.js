// src/utils/studyApi.js
import { getJSON, postJSON } from "../api"; // adjust the path if needed

export const fetchUserData = async (user) => {
  const token = localStorage.getItem("authToken");

  // Fetch decks (supports either array or { items, pagination } shape)
  const decksData = await getJSON("/decks", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const decks = Array.isArray(decksData)
    ? decksData
    : Array.isArray(decksData?.items)
    ? decksData.items
    : [];

  // Fetch progress (array expected; fall back to empty array)
  const progressData = await getJSON("/progress", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const progress = Array.isArray(progressData) ? progressData : [];

  // Fetch dashboard (stats + weekly goal)
  let weeklyGoal = 10;
  let stats = {
    mastery_level: 0,
    study_streak: 0,
    focus_score: 0,
    retention_rate: 0,
    cards_mastered: 0,
    minutes_per_day: 0,
    accuracy: 0,
  };

  try {
    const dashboardData = await getJSON("/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (dashboardData?.weekly_goal) {
      weeklyGoal = dashboardData.weekly_goal;
    }

    stats = {
      mastery_level: Math.round(dashboardData?.mastery_level ?? 0),
      study_streak: Math.round(dashboardData?.study_streak ?? 0),
      focus_score: Math.round(dashboardData?.focus_score ?? 0),
      retention_rate: Math.round(dashboardData?.retention_rate ?? 0),
      cards_mastered: Math.round(dashboardData?.cards_mastered ?? 0),
      minutes_per_day: Math.round(dashboardData?.minutes_per_day ?? 0),
      accuracy: Math.round(dashboardData?.accuracy ?? 0),
    };
  } catch (e) {
    // Keep defaults on failure; logging is fine here
    console.error("Failed to load dashboard stats:", e);
  }

  return { decks, progress, weeklyGoal, stats };
};

export const updateWeeklyGoal = async (newWeeklyGoal) => {
  const token = localStorage.getItem("authToken");
  const data = await postJSON(
    "/user/stats",
    { weekly_goal: newWeeklyGoal },
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    }
  );
  return data?.weekly_goal ?? newWeeklyGoal;
};
