import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase Auth instance

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Auth error:", error);
        setError("Failed to authenticate. Please try again."); // user-friendly error message
        setLoading(false);
      }
    );

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  return { currentUser, loading, error };
};

export default useCurrentUser;
