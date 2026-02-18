import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebaseconfig";
import * as authService from "../services/authService";

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isEmailVerified: false,
  authProvider: null,
  logout: () => {},
  refreshUser: () => {},
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

  const refreshUser = async () => {
    try {
      const auth = getAuth(app);
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setCurrentUser({ ...auth.currentUser });
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
      setError({
        message: err.message || "Failed to refresh user data",
        code: err.code || "refresh-failed",
        timestamp: new Date().toISOString()
      });
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError({
        message: err.message || "Failed to logout",
        code: err.code || "logout-failed",
        timestamp: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    const auth = getAuth(app);
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (isMounted) {
          try {
            if (user) {
              if (!user.emailVerified && user.providerData[0]?.providerId === 'password') {
                await user.reload();
                setCurrentUser(auth.currentUser);
              } else {
                setCurrentUser(user);
              }
            } else {
              setCurrentUser(null);
            }
            
            setLoading(false);
            setError({
              message: null,
              code: null,
              timestamp: null
            });
          } catch (err) {
            console.error("Error handling auth state:", err);
            setError({
              message: err.message || "Failed to process authentication",
              code: err.code || "auth-processing",
              timestamp: new Date().toISOString()
            });
            setLoading(false);
          }
        }
      },
      (err) => {
        if (isMounted) {
          console.error("Auth state error:", err);
          setError({
            message: err.message || "Failed to check authentication",
            code: err.code || "auth-check-failed",
            timestamp: new Date().toISOString()
          });
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    isEmailVerified: currentUser?.emailVerified || false,
    authProvider: currentUser?.providerData?.[0]?.providerId || null,
    logout,
    refreshUser,
    getUserName: () => currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
    getUserAvatar: () => currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(
      currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'
    )}&background=random`
  }), [currentUser, loading, error]);

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
        children
      )}
    </AuthContext.Provider>
  );
}