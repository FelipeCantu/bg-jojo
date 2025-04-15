import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebaseconfig";
import { motion, AnimatePresence } from "framer-motion";

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  error: null,
  isAuthenticated: false,
});

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
  const [error, setError] = useState({
    message: null,
    code: null,
    timestamp: null
  });

  useEffect(() => {
    const auth = getAuth(app);
    let isMounted = true;

    // Check for localStorage availability
    if (typeof window !== 'undefined' && !window.localStorage) {
      console.warn("LocalStorage not available - auth state won't persist");
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (isMounted) {
          setCurrentUser(user);
          setLoading(false);
          setError({
            message: null,
            code: null,
            timestamp: null
          });
        }
      },
      (err) => {
        if (isMounted) {
          console.error("Auth state error:", err);
          setError({
            message: err.message || "Failed to check authentication",
            code: err.code || "unknown",
            timestamp: new Date().toISOString()
          });
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      try {
        unsubscribe();
      } catch (cleanupError) {
        console.error("Error during auth cleanup:", cleanupError);
      }
    };
  }, []);

  const value = useMemo(() => ({
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    // Add helper methods
    isEmailVerified: currentUser?.emailVerified || false,
    authProvider: currentUser?.providerData?.[0]?.providerId || null
  }), [currentUser, loading, error]);

  const pageVariants = {
    initial: { 
      y: 50, 
      opacity: 0 
    },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        duration: 0.5
      }
    },
    exit: { 
      y: 50, 
      opacity: 0 
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && error.message ? (
        <div className="auth-error">
          <h3>Authentication Error ({error.code})</h3>
          <p>{error.message}</p>
          <p>Occurred at: {new Date(error.timestamp).toLocaleString()}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : (
        typeof window !== 'undefined' ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div>{children}</div>
        )
      )}
    </AuthContext.Provider>
  );
}