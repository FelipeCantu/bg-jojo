// hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import client from '../sanityClient';

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Fetch or create the corresponding Sanity user document
            const sanityUser = await client.fetch(
              `*[_type == "user" && uid == $firebaseUid][0]`,
              { firebaseUid: firebaseUser.uid }
            );

            if (!sanityUser) {
              // Create a new user document if it doesn't exist
              const newUser = {
                _type: 'user',
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User', // Default to 'New User'
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL || 'https://via.placeholder.com/40', // Fallback image URL
                role: 'user',
              };

              const createdUser = await client.create(newUser);
              // Combine Firebase and Sanity user data
              setCurrentUser({
                ...firebaseUser,
                ...createdUser,
                sanityId: createdUser._id, // Add this critical field
              });
            } else {
              // Combine Firebase and Sanity user data
              setCurrentUser({
                ...firebaseUser,
                ...sanityUser,
                sanityId: sanityUser._id, // Add this critical field
              });
            }
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Failed to sync user:", err);
          setError("Failed to load user profile");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Auth error:", error);
        setError("Failed to authenticate");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { currentUser, loading, error };
};

export default useCurrentUser;
