import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; 

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

const defaultContextValue = {
  user: null,
  setUser: () => {},
  loading: true,
  activeCoachId: undefined,
  isCoachStatusLoading: true,
  getIdToken: async () => null,
  refreshCoachingStatus: async () => {},
  setActiveCoachInContext: (coachId) => {},
};

export const AuthContext = createContext(defaultContextValue);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [activeCoachId, setActiveCoachId] = useState(undefined);
  const [isCoachStatusLoading, setIsCoachStatusLoading] = useState(true);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        return await currentUser.getIdToken(forceRefresh);
      } catch (error) {
        console.error("AuthContext: Error getting ID token:", error);
        return null;
      }
    }
    return null;
  }, []);



  const fetchCoachingStatus = useCallback(async () => {
    console.log("AuthContext: fetchCoachingStatus STARTING...");
    if (activeCoachId === undefined || activeCoachId !== null) {
      setIsCoachStatusLoading(true);
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("AuthContext: No currentUser in fetchCoachingStatus. Setting state null/false.");
      setActiveCoachId(null);
      setIsCoachStatusLoading(false);
      return;
    }
    let token = null;
    try {
      console.log(`AuthContext: Getting ID token for fetch (User ${currentUser.uid})...`);
      token = await getIdToken();
      if (!token) { throw new Error("Auth token could not be retrieved."); }
      console.log("AuthContext: Fetching /coaching/status...");
      const response = await fetch(`${API_BASE_URL}/coaching/status`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("AuthContext: Fetch status:", response.status);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Non-JSON: ${text.substring(0,100)}`);
      }
      const data = await response.json();
      console.log("AuthContext: Parsed response:", data);
      if (!response.ok) { throw new Error(data.message || `Fetch failed (${response.status})`); }
      console.log("AuthContext: Setting activeCoachId from fetch:", data.activeCoachId || null);
      setActiveCoachId(data.activeCoachId || null);
      console.log("AuthContext: Fetch successful. Setting isCoachStatusLoading to FALSE.");
      setIsCoachStatusLoading(false);
    } catch (error) {
      console.error("AuthContext: Error during fetchCoachingStatus:", error);
      setActiveCoachId(null);
      console.log("AuthContext: Fetch errored. Setting isCoachStatusLoading to FALSE.");
      setIsCoachStatusLoading(false);
    }
  }, [getIdToken, activeCoachId]);

  const setActiveCoachInContext = useCallback((coachId) => {
    const newCoachId = coachId || null;
    console.log(`AuthContext: Manually setting activeCoachId in context to: ${newCoachId}`);
    setActiveCoachId(newCoachId);
    if (isCoachStatusLoading) {
      console.log("AuthContext: Setting isCoachStatusLoading FALSE due to direct set.");
      setIsCoachStatusLoading(false);
    }
  }, [isCoachStatusLoading]);

 
  useEffect(() => {
    console.log("AuthContext: Setting up auth listener.");
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      console.log("################ AUTH LISTENER FIRED ################");
      console.log("AuthContext Listener: FB User:", firebaseUser?.uid || "null");

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);

          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ idToken: token })
          });
          if (response.ok) {
            const data = await response.json();
            console.log("AuthContext Listener: Full user data received:", data.user);
            setUser(data.user);
          } else {
            console.warn("AuthContext Listener: Backend user fetch failed, using Firebase user instead");
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("AuthContext: Error fetching full user data:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      if (loading) { setLoading(false); }
      if (firebaseUser) {
        if (activeCoachId === undefined || (user && user.uid !== firebaseUser.uid)) {
          console.log("AuthContext Listener: User detected/changed or status unknown, calling fetchCoachingStatus.");
          fetchCoachingStatus();
        } else if (isCoachStatusLoading) {
          setIsCoachStatusLoading(false);
        }
      } else {
        setActiveCoachId(null);
        setIsCoachStatusLoading(false);
      }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [loading, fetchCoachingStatus, activeCoachId, isCoachStatusLoading]);

  const refreshCoachingStatus = useCallback(async () => {
    console.log("AuthContext: Manual refresh called.");
    await fetchCoachingStatus();
  }, [fetchCoachingStatus]);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    loading,
    activeCoachId,
    isCoachStatusLoading,
    getIdToken,
    refreshCoachingStatus,
    setActiveCoachInContext
  }), [
    user, loading, activeCoachId, isCoachStatusLoading,
    getIdToken, refreshCoachingStatus, setUser,
    setActiveCoachInContext
  ]);

  if (loading) { return null; }

  console.log("AuthContext: Rendering Provider. InitialLoading:", loading, "CoachStatusLoading:", isCoachStatusLoading, "activeCoachId:", activeCoachId);
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
