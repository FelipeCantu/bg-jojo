// src/hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);  // Store user data (e.g., UID, display name)
      } else {
        setCurrentUser(null);  // Clear user data if logged out
      }
    });

    return () => unsubscribe();  // Clean up the subscription on unmount
  }, []);

  return currentUser;
};

export default useCurrentUser;
