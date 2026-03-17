import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  FacebookAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebaseconfig";

const auth = getAuth();

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

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

// Social Authentication
// Desktop uses popup (fast, no page reload needed).
// Mobile uses redirect — iOS Safari opens OAuth in the same tab, not a true
// popup, so signInWithPopup never resolves and throws popup-closed-by-user.
const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');

    if (isMobile()) {
      await signInWithRedirect(auth, provider);
      return { success: true, redirecting: true };
    }

    const result = await signInWithPopup(auth, provider);
    const isNewUser = result._tokenResponse?.isNewUser || false;
    await createUserDocument(result.user);
    return { success: true, user: result.user, isNewUser };
  } catch (error) {
    console.error("Facebook sign-in error:", error);
    return { success: false, error: error.message, code: error.code };
  }
};

const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    if (isMobile()) {
      await signInWithRedirect(auth, provider);
      return { success: true, redirecting: true };
    }

    const result = await signInWithPopup(auth, provider);
    const isNewUser = result._tokenResponse?.isNewUser || false;
    await createUserDocument(result.user);
    return { success: true, user: result.user, isNewUser };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { success: false, error: error.message, code: error.code };
  }
};

// Picks up the result of a mobile redirect sign-in on app load
const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await createUserDocument(result.user);
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