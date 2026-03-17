import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  FacebookAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore, auth } from "../firebaseconfig";

const SITE_URL = process.env.REACT_APP_SITE_URL || "https://givebackjojo.org";


// Email and Password Authentication
const registerWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, {
      displayName: displayName,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
    });
    
    await sendEmailVerification(user, {
      url: `${SITE_URL}/profile`,
      handleCodeInApp: false,
    });
    await createUserDocument(user);
    
    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};

// Shared helper for Google (and any future non-Facebook provider)
const signInWithProvider = async (provider) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const isNewUser = result._tokenResponse?.isNewUser || false;
    try {
      await createUserDocument(result.user);
    } catch (firestoreError) {
      console.error("Failed to save user document:", firestoreError);
    }
    return { success: true, user: result.user, isNewUser };
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return { success: true, redirecting: true };
    }
    console.error("Social sign-in error:", error.code, error.message);
    return { success: false, error: error.message, code: error.code };
  }
};

const isMobile = () =>
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  navigator.maxTouchPoints > 0;

const signInWithFacebook = async () => {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');

  if (isMobile()) {
    // sessionStorage survives same-tab cross-origin navigation on iOS Safari,
    // unlike IndexedDB which Safari may clear during OAuth redirects.
    await setPersistence(auth, browserSessionPersistence);
    await signInWithRedirect(auth, provider);
    return { success: true, redirecting: true };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const isNewUser = result._tokenResponse?.isNewUser || false;

    const credential = FacebookAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/me/picture?redirect=false&width=400&height=400&access_token=${credential.accessToken}`
        );
        const data = await res.json();
        if (data?.data?.url) {
          await updateProfile(result.user, { photoURL: data.data.url });
        }
      } catch (photoError) {
        console.error("Failed to fetch Facebook photo:", photoError);
      }
    }

    try {
      await createUserDocument(result.user);
    } catch (firestoreError) {
      console.error("Failed to save user document:", firestoreError);
    }
    return { success: true, user: result.user, isNewUser };
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithRedirect(auth, provider);
      return { success: true, redirecting: true };
    }
    console.error("Facebook sign-in error:", error.code, error.message);
    return { success: false, error: error.message, code: error.code };
  }
};

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithProvider(provider);
};

// Picks up the result of a mobile redirect sign-in on app load
const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // If this was a Facebook redirect, fetch the real CDN photo URL
      const isFacebook = result.user.providerData?.[0]?.providerId === 'facebook.com';
      if (isFacebook) {
        const credential = FacebookAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          try {
            const res = await fetch(
              `https://graph.facebook.com/me/picture?redirect=false&width=400&height=400&access_token=${credential.accessToken}`
            );
            const data = await res.json();
            if (data?.data?.url) {
              await updateProfile(result.user, { photoURL: data.data.url });
            }
          } catch (photoError) {
            console.error("Failed to fetch Facebook photo:", photoError);
          }
        }
      }

      // Migrate from session persistence (used for the redirect) back to local
      // so the user stays logged in across browser sessions.
      await setPersistence(auth, browserLocalPersistence).catch(() => {});

      try {
        await createUserDocument(result.user);
      } catch (firestoreError) {
        console.error("Failed to save redirect user document:", firestoreError);
      }
      const isNewUser = result._tokenResponse?.isNewUser || false;
      return { success: true, user: result.user, isNewUser };
    }
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    return { success: false, error: error.message, code: error.code };
  }
};

// Called once on app load to pick up the result of a redirect sign-in

// Password Reset
const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${SITE_URL}/login`,
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// User Document Management
const createUserDocument = async (user) => {
  if (!user) return;
  
  const { uid, displayName, email, photoURL, providerData } = user;
  const userRef = doc(firestore, "users", uid);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        email: email || userDoc.data().email,
        photoURL: photoURL || userDoc.data().photoURL,
        displayName: displayName || userDoc.data().displayName,
        providers: providerData.map(provider => provider.providerId)
      });
    } else {
      await setDoc(userRef, {
        uid,
        displayName: displayName || email.split('@')[0],
        email: email || '',
        photoURL: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`,
        role: "user",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        notificationPrefs: {
          comments: true,
          likes: true
        },
        providers: providerData.map(provider => provider.providerId)
      });
    }
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

// Sign Out
const signOut = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message };
  }
};

// Single Export Statement
export {
  registerWithEmail,
  loginWithEmail,
  signInWithFacebook,
  signInWithGoogle,
  handleRedirectResult,
  resetPassword,
  signOut,
};