// hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
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

            // Fetch the corresponding Sanity user document (read-only, no token needed)
            const sanityUser = await client.fetch(
              `*[_type == "user" && uid == $firebaseUid][0]`,
              { firebaseUid: firebaseUser.uid }
            );

            // Sync user to Sanity via Cloud Function — write token stays server-side
            const functions = getFunctions(getApp(), 'us-central1');
            const api = httpsCallable(functions, 'api');
            await api({
              endpoint: 'sanity/user.sync',
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              authProvider: firebaseUser.providerData[0]?.providerId || 'password',
              emailVerified: firebaseUser.emailVerified || false,
            });

            if (!sanityUser) {
              // User was just created — fetch the new document so we have the full profile
              const createdUser = await client.fetch(
                `*[_type == "user" && uid == $firebaseUid][0]`,
                { firebaseUid: firebaseUser.uid }
              );
              setCurrentUser({
                ...firebaseUser,
                ...(createdUser || {}),
                sanityId: (createdUser || {})._id || firebaseUser.uid,
              });
            } else {
              const updates = {};
              if (firebaseUser.displayName !== sanityUser.name) {
                updates.name = firebaseUser.displayName;
              }
              if (firebaseUser.photoURL !== sanityUser.photoURL) {
                updates.photoURL = firebaseUser.photoURL;
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
