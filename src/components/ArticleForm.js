import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { submitArticle, urlFor, uploadImageToSanity, ensureUserExistsInSanity  } from '../sanityClient';
import { auth, onAuthStateChanged } from '../firestore'; 
import { db } from '../firestore';
import { doc, getDoc } from 'firebase/firestore';

const ArticleForm = ({ onArticleSubmitted }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        mainImage: '',
        content: '',
    });
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const [user, setUser] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!currentUser) {
            setUser(null);
            setIsUserLoading(false);
            return;
          }
      
          setIsUserLoading(true);
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
      
            const fetchedUser = userDoc.exists() ? {
              name: userDoc.data().name || currentUser.displayName,
              photo: userDoc.data().photo || currentUser.photoURL || 'https://via.placeholder.com/40',
              uid: currentUser.uid,
              role: userDoc.data().role || 'user',
            } : {
              name: currentUser.displayName,
              photo: currentUser.photoURL || 'https://via.placeholder.com/40',
              uid: currentUser.uid,
            };
      
            setUser(fetchedUser);
      
            // Ensure the user exists in Sanity
            await ensureUserExistsInSanity(fetchedUser.uid, fetchedUser.name, fetchedUser.photo);
      
          } catch (error) {
            console.error("❌ Error fetching user data:", error);
          } finally {
            setIsUserLoading(false);
          }
        });
      
        return () => unsubscribe();
      }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title) errors.title = 'Title is required';
        if (!formData.content) errors.content = 'Content is required';
        if (imageError) errors.image = imageError;
        return errors;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setImageError(null);

        // Validate image type
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            setImageError('Only JPEG, PNG, and GIF images are allowed.');
            setUploading(false);
            return;
        }

        try {
            const imageAsset = await uploadImageToSanity(file);
            setFormData((prev) => ({ ...prev, mainImage: imageAsset.asset._ref }));
        } catch (error) {
            setImageError('Failed to upload image. Please try again later.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        if (!user || !user.uid) {
            alert('You must be signed in to submit an article.');
            return;
        }

        setIsSubmitting(true);
        try {
            await submitArticle({
                title: formData.title,
                content: [{ _type: 'block', children: [{ _type: 'span', text: formData.content }], style: 'normal' }],
                mainImage: formData.mainImage ? { asset: { _ref: formData.mainImage } } : null,
                publishedDate: new Date().toISOString(),
                readingTime: Math.ceil(formData.content.split(' ').length / 200),
                author: {
                    _type: 'reference',
                    _ref: user.uid, // Pass the Firebase UID here
                },
            }, user);

            if (onArticleSubmitted) onArticleSubmitted();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error submitting article:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', mainImage: '', content: '' });
        setErrors({});
        setImageError(null);
    };

    const getImageUrl = () => {
        if (!formData.mainImage) return 'https://via.placeholder.com/150';
        try {
            return urlFor({ asset: { _ref: formData.mainImage } }).url() || 'https://via.placeholder.com/150';
        } catch {
            return 'https://via.placeholder.com/150';
        }
    };

    return (
        <Container>
            <AddButton onClick={() => setIsModalOpen(true)}>+</AddButton>
            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <CloseButton onClick={() => {
                            setIsModalOpen(false);
                            resetForm();
                        }}>&times;</CloseButton>
                        {user ? (
                            <>
                                <h2>Submit an Article</h2>
                                <AuthorSection>
                                    <AuthorPhoto src={user.photo} alt="Author" />
                                    <AuthorName>{user.name}</AuthorName>
                                </AuthorSection>
                                <Form onSubmit={handleSubmit}>
                                    <label>Title:</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                                    {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}
                                    <label>Upload Image:</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} required />
                                    {uploading && <p>Uploading image...</p>}
                                    {formData.mainImage && <PreviewImage src={getImageUrl()} alt="Uploaded Preview" />}
                                    {imageError && <ErrorMessage>{imageError}</ErrorMessage>}
                                    <label>Content:</label>
                                    <textarea name="content" value={formData.content} onChange={handleChange} rows="6" required />
                                    {errors.content && <ErrorMessage>{errors.content}</ErrorMessage>}
                                    <SubmitButton type="submit" disabled={uploading || isSubmitting || isUserLoading || Object.keys(errors).length > 0}>
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </SubmitButton>
                                </Form>
                            </>
                        ) : (
                            <h2>You must be signed in to submit an article.</h2>
                        )}
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
};

const Container = styled.div`
    position: relative;
`;

const AddButton = styled.button`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;  /* Increase size for mobile */
    height: 60px;  /* Increase size for mobile */
    border-radius: 50%;
    background: #ff5733;
    color: white;
    font-size: 32px;  /* Larger icon for mobile */
    border: none;
    cursor: pointer;

    @media (max-width: 600px) {
        width: 50px;  /* Slightly smaller on mobile */
        height: 50px;  /* Slightly smaller on mobile */
        font-size: 28px;  /* Adjust icon size on mobile */
    }

    @media (max-width: 375px) {
        width: 45px;  /* Even smaller on smaller screens */
        height: 45px;  /* Even smaller on smaller screens */
        font-size: 24px;  /* Adjust icon size on small screens */
    }
`;


const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ModalContent = styled.div`
    background: white;
    padding: 20px;
    border-radius: 10px;
    width: 400px;
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const PreviewImage = styled.img`
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 5px;
    margin-top: 10px;
`;

const AuthorSection = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 10px;
`;

const AuthorPhoto = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
    object-fit: cover; 
`;

const AuthorName = styled.p`
    font-weight: bold;
    font-size: 16px;
`;

const ErrorMessage = styled.p`
    color: red;
    font-size: 12px;
    margin-top: -5px;
`;

const SubmitButton = styled.button`
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;

    &:hover {
        background-color: #45a049;
    }

    &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
`;

export default ArticleForm;
