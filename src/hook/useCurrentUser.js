// hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import client from '../sanityClient';
import * as authService from '../services/authService';

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
          setLoading(true);
          if (firebaseUser) {
            // Refresh user data to ensure email verification status is current
            await firebaseUser.reload();
            
            // Fetch or create the corresponding Sanity user document
            const sanityUser = await client.fetch(
              `*[_type == "user" && uid == $firebaseUid][0]`,
              { firebaseUid: firebaseUser.uid }
            );

            if (!sanityUser) {
              // Create a new user document with _id matching Firebase UID for consistency
              const newUser = {
                _id: firebaseUser.uid,
                _type: 'user',
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
                )}&background=random`,
                role: 'user',
                authProvider: firebaseUser.providerData[0]?.providerId || 'password',
                emailVerified: firebaseUser.emailVerified || false
              };

              const createdUser = await client.createOrReplace(newUser);
              setCurrentUser({
                ...firebaseUser,
                ...createdUser,
                sanityId: createdUser._id,
              });
            } else {
              // Update existing user document if needed
              const updates = {};
              if (firebaseUser.displayName !== sanityUser.name) {
                updates.name = firebaseUser.displayName;
              }
              if (firebaseUser.photoURL !== sanityUser.photoURL) {
                updates.photoURL = firebaseUser.photoURL;
              }
              if (Object.keys(updates).length > 0) {
                await client.patch(sanityUser._id).set(updates).commit();
              }

              setCurrentUser({
                ...firebaseUser,
                ...sanityUser,
                ...updates,
                sanityId: sanityUser._id,
              });
            }
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Failed to sync user:", err);
          setError(err.message || "Failed to load user profile");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Auth error:", error);
        setError(error.message || "Failed to authenticate");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add methods that mirror authService for convenience
  const enhancedMethods = {
    register: authService.registerWithEmail,
    login: authService.loginWithEmail,
    socialLogin: (provider) => 
      provider === 'google' 
        ? authService.signInWithGoogle() 
        : authService.signInWithFacebook(),
    logout: authService.signOut,
    resetPassword: authService.resetPassword
  };

  return { 
    currentUser, 
    loading, 
    error,
    ...enhancedMethods
  };
};

export default useCurrentUser;