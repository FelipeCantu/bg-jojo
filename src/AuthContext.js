import React, { createContext, useState, useEffect, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebaseconfig"; // Ensure Firebase is initialized

const auth = getAuth(app);
const AuthContext = createContext();

// Custom hook to access auth context
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Optional error state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Error in onAuthStateChanged:", error);
        setError(error.message); // Set error if occurs
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Customize as needed (add spinner or message)
  }

  if (error) {
    return <div>Error: {error}</div>; // Display error message if exists
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
