import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebaseconfig";

// Create the AuthContext with a default value
const AuthContext = createContext({
  currentUser: null,
  loading: true,
  error: null,
  isAuthenticated: false,
});

// Custom hook to access auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);
    
    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Auth state error:", err);
        setError(err.message || "Failed to check authentication");
        setLoading(false);
      }
    );

    // Cleanup the listener on unmount
    return () => {
      try {
        unsubscribe();
      } catch (cleanupError) {
        console.error("Error during auth cleanup:", cleanupError);
      }
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
  }), [currentUser, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && error ? (
        <div className="auth-error">
          Authentication error: {error}. Please refresh the page.
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}