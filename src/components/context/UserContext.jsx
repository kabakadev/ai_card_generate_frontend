// src/components/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { getJSON, postJSON, setToken, getBase, getToken } from "../../api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      if (!getToken(getBase())) {
        setLoading(false);
        return;
      }
      const data = await getJSON("/user");
      setUser(data);
      setIsAuthenticated(true);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signup = async (email, username, password) => {
    // Removed Idempotency-Key header to avoid CORS preflight block
    const data = await postJSON(
      "/signup",
      { email, username, password },
      { preferLocal: true, noAuth: true }
    );
    if (data?.error === "username_exists" || data?.error === "email_exists") {
      throw new Error(data.message || data.error);
    }
    return await login(email, password);
  };

  const login = async (email, password) => {
    const data = await postJSON(
      "/login",
      { email, password },
      { preferLocal: true, noAuth: true }
    );
    if (!data?.token) throw new Error("Login failed: missing token");
    setToken(data.token, getBase());
    await fetchUser();
    return true;
  };

  const logout = () => {
    try {
      setToken(null, getBase());
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider
      value={{ user, isAuthenticated, signup, login, logout, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
