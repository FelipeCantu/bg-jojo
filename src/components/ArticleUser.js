import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseconfig';  // Correct import
import ArticleList from './components/ArticleList';

function ArticleUser() {
    const [user, setUser] = useState(null);

    const [isUserLoading, setIsUserLoading] = useState(true); // Add this line

    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Fetch user data from Firestore if needed
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({
                        name: userDoc.data().name || currentUser.displayName,
                        photo: userDoc.data().photo || currentUser.photoURL || 'https://via.placeholder.com/40',
                        uid: currentUser.uid,
                    });
                } else {
                    setUser({
                        name: currentUser.displayName,
                        photo: currentUser.photoURL || 'https://via.placeholder.com/40',
                        uid: currentUser.uid,
                    });
                }
            } else {
                setUser(null);
            }
            setIsUserLoading(false); // Stop loading after user data is fetched
        });
    }, []);
    

    return <ArticleList user={user} />;
}

export default ArticleUser;
