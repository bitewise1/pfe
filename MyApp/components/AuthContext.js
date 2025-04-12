// components/AuthContext.js
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import JS SDK auth instance

// --- API Base URL ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'; // Adjust if needed

// Define the shape of the context value
const defaultContextValue = {
    user: null, // Stores the Firebase user object or your backend user object
    setUser: () => {}, // Kept for compatibility if LoginScreen uses it
    loading: true, // Initial auth loading flag
    activeCoachId: undefined, // Coach status: undefined=unknown, null=known_no_coach, string=coach_id
    isCoachStatusLoading: true, // Loading state specifically for the coach status API call
    getIdToken: async () => null, // Function to get Firebase Auth ID token
    refreshCoachingStatus: async () => {}, // Function to manually trigger a refresh
    setActiveCoachInContext: (coachId) => {}, // <<<--- Function added
};

export const AuthContext = createContext(defaultContextValue);

export const AuthProvider = ({ children }) => {
    // --- State ---
    const [user, setUser] = useState(null); // Can store Firebase user or backend user object
    const [loading, setLoading] = useState(true);
    const [activeCoachId, setActiveCoachId] = useState(undefined);
    const [isCoachStatusLoading, setIsCoachStatusLoading] = useState(true); // Starts true

    // --- Get Firebase Auth ID Token ---
    const getIdToken = useCallback(async (forceRefresh = false) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try { return await currentUser.getIdToken(forceRefresh); }
            catch (error) { console.error("AuthContext: Error getting ID token:", error); return null; }
        }
        return null;
    }, []);

    // --- Fetch Coaching Status (Used on load/refresh) ---
    const fetchCoachingStatus = useCallback(async () => {
        console.log("AuthContext: fetchCoachingStatus STARTING...");
        // Only set loading true if status is not already definitively known to be null
        // or if we are forcing a refresh
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
            const response = await fetch(`${API_BASE_URL}/coaching/status`, { headers: { 'Authorization': `Bearer ${token}` } });
            console.log("AuthContext: Fetch status:", response.status);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) { const text = await response.text(); throw new Error(`Non-JSON: ${text.substring(0,100)}`); }
            const data = await response.json();
            console.log("AuthContext: Parsed response:", data);

            if (!response.ok) { throw new Error(data.message || `Fetch failed (${response.status})`); }

            console.log("AuthContext: Setting activeCoachId from fetch:", data.activeCoachId || null);
            setActiveCoachId(data.activeCoachId || null);
            console.log("AuthContext: Fetch successful. Setting isCoachStatusLoading to FALSE.");
            setIsCoachStatusLoading(false); // Set false on SUCCESS

        } catch (error) {
            console.error("AuthContext: Error during fetchCoachingStatus:", error);
            setActiveCoachId(null);
            console.log("AuthContext: Fetch errored. Setting isCoachStatusLoading to FALSE.");
            setIsCoachStatusLoading(false); // Set false on ERROR
        }
    }, [getIdToken, activeCoachId]); // Dependencies


    // --- V V V --- FUNCTION TO SET COACH ID DIRECTLY --- V V V ---
    const setActiveCoachInContext = useCallback((coachId) => {
        const newCoachId = coachId || null; // Ensure it's null or a string ID
        console.log(`AuthContext: Manually setting activeCoachId in context to: ${newCoachId}`);
        setActiveCoachId(newCoachId);
        // We definitively know the status now, stop loading indicator
        if (isCoachStatusLoading) {
             console.log("AuthContext: Setting isCoachStatusLoading FALSE due to direct set.");
             setIsCoachStatusLoading(false);
        }
    }, [isCoachStatusLoading]); // Dependency
    // --- ^ ^ ^ --- END NEW FUNCTION --- ^ ^ ^ ---


    // --- Firebase Auth State Listener ---
    useEffect(() => {
        console.log("AuthContext: Setting up auth listener.");
        let isMounted = true;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
             if (!isMounted) return;
             console.log("################ AUTH LISTENER FIRED ################");
             console.log("AuthContext Listener: FB User:", firebaseUser?.uid || "null");

             const previousUser = user;
             setUser(firebaseUser || null); // Update user state (Firebase object)

             if (loading) { setLoading(false); } // Initial load done

            if (firebaseUser) {
                 // Fetch status only if context doesn't know yet (undefined) OR user changed
                 if (activeCoachId === undefined || (!previousUser || previousUser.uid !== firebaseUser.uid)) {
                     console.log("AuthContext Listener: User detected/changed or status unknown, calling fetchCoachingStatus.");
                     fetchCoachingStatus(); // Call async, don't await
                 } else {
                      console.log("AuthContext Listener: User unchanged & status known. Ensuring coach loading is false.");
                      if(isCoachStatusLoading) setIsCoachStatusLoading(false); // Correctly stop loading if fetch isn't needed
                 }
            } else {
                // User logged out
                console.log("AuthContext Listener: No FB user, clearing coach status.");
                setActiveCoachId(null);
                setIsCoachStatusLoading(false);
            }
        });
        return () => { isMounted = false; unsubscribe(); };
    // Adjusted dependencies
    }, [loading, user, fetchCoachingStatus, activeCoachId, isCoachStatusLoading]); // Still need these to react correctly


    // --- Manual Refresh Function ---
    const refreshCoachingStatus = useCallback(async () => {
        console.log("AuthContext: Manual refresh called.");
        await fetchCoachingStatus();
    }, [fetchCoachingStatus]);


    // --- Memoized Context Value ---
    const contextValue = useMemo(() => ({
        user,
        setUser, // Kept original setUser
        loading,
        activeCoachId,
        isCoachStatusLoading,
        getIdToken,
        refreshCoachingStatus,
        setActiveCoachInContext // <<<--- EXPOSE THE NEW FUNCTION
    }), [
        user, loading, activeCoachId, isCoachStatusLoading,
        getIdToken, refreshCoachingStatus, setUser,
        setActiveCoachInContext // <<<--- ADD DEPENDENCY
    ]);


    // --- Initial Render Protection ---
    if (loading) { return null; } // Wait for initial Firebase check

    console.log("AuthContext: Rendering Provider. InitialLoading:", loading, "CoachStatusLoading:", isCoachStatusLoading, "activeCoachId:", activeCoachId);
    return ( <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider> );
};