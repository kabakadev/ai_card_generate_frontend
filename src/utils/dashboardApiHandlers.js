// src/utils/dashboardApiHandlers.js
import { getJSON, getToken, getBase } from "../api";

// Use a longer timeout for heavier dashboard queries
const DASHBOARD_TIMEOUT_MS = 15000;
const PROGRESS_TIMEOUT_MS = 12000;

const DEFAULT_STATS = {
  weekly_goal: 0,
  mastery_level: 0,
  study_streak: 0,
  focus_score: 0,
  retention_rate: 0,
  cards_mastered: 0,
  minutes_per_day: 0,
  accuracy: 0,
};

// Coerce potentially undefined/null/NaN to numbers (or 0)
function n(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Fetch dashboard/user stats.
 * If a token is provided, it will be used explicitly.
 * Otherwise, getJSON will attach the token from the active base automatically.
 */
export async function fetchUserStats(explicitToken) {
  try {
    const opts = { timeoutMs: DASHBOARD_TIMEOUT_MS };
    if (explicitToken) {
      // If you pass a token, we’ll use it; otherwise api.js attaches the auth header itself.
      opts.headers = { Authorization: `Bearer ${explicitToken}` };
    }

    const data = await getJSON("/dashboard", opts);

    return {
      weekly_goal: n(data?.weekly_goal),
      mastery_level: n(data?.mastery_level),
      study_streak: n(data?.study_streak),
      focus_score: n(data?.focus_score),
      retention_rate: n(data?.retention_rate),
      cards_mastered: n(data?.cards_mastered),
      minutes_per_day: n(data?.minutes_per_day),
      accuracy: n(data?.accuracy),
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { ...DEFAULT_STATS };
  }
}

/**
 * Fetch user progress entries (array).
 */
export async function fetchProgress(explicitToken) {
  const opts = { timeoutMs: PROGRESS_TIMEOUT_MS };
  if (explicitToken) {
    opts.headers = { Authorization: `Bearer ${explicitToken}` };
  }

  try {
    const data = await getJSON("/progress", opts);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching progress:", error);
    return [];
  }
}

/**
 * Convenience combo if you ever need both at once.
 */
export async function fetchDashboardBundle(explicitToken) {
  const [stats, progress] = await Promise.all([
    fetchUserStats(explicitToken),
    fetchProgress(explicitToken),
  ]);
  return { stats, progress };
}
