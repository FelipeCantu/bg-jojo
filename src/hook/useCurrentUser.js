import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase auth instance once
    setLoading(true); // Ensure loading is set before subscribing

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false); // Finished loading
      },
      (error) => {
        console.error("🔥 Auth error:", error);
        setError(error); // Set error
        setLoading(false); // Finished loading
      }
    );

    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);

  if (loading) {
    return { currentUser: null, loading: true, error: null }; // Prevent rendering before loading is complete
  }

  return { currentUser, loading, error };
};

export default useCurrentUser;
