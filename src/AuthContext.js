import React, { createContext, useState, useEffect, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebaseconfig"; // Ensure Firebase is initialized

const auth = getAuth(app);

// Create the AuthContext with a default value
const AuthContext = createContext({
  currentUser: null,
  loading: true,
  error: null,
});

// Custom hook to access auth context
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
        setError(null); // Reset error on successful auth state change
      },
      (error) => {
        console.error("Error in onAuthStateChanged:", error);
        setError(error.message); // Set error if auth state change fails
        setLoading(false);
      }
    );

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Provide the auth context value
  const value = {
    currentUser,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}