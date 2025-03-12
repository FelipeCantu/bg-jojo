import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { submitArticle, urlFor, uploadImageToSanity, ensureUserExistsInSanity } from '../sanityClient';
import { auth, onAuthStateChanged } from '../firestore';
import { db } from '../firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const ArticleForm = ({ onArticleSubmitted }) => {
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

            alert('Article submitted successfully!');
            setFormData({ title: '', mainImage: '', content: '' });

            // Trigger onArticleSubmitted callback to refresh the article list
            onArticleSubmitted();
        } catch (error) {
            console.error('Error submitting article:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageContainer>
            <Container>
                <h2>Write Your Article</h2>
                {isUserLoading ? (
                    <p>Loading user info...</p>
                ) : user ? (
                    <AuthorSection>
                        <AuthorPhoto src={user?.photo} alt="Author" />
                        <AuthorName>{user?.name}</AuthorName>
                    </AuthorSection>
                ) : (
                    <p>Please sign in to submit an article.</p>
                )}
                <Form onSubmit={handleSubmit}>
                    <TitleInput
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Title"
                        required
                    />
                    {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}

                    <ImageInput
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        required
                    />
                    {uploading && <p>Uploading image...</p>}
                    {formData.mainImage && <PreviewImage src={urlFor({ asset: { _ref: formData.mainImage } }).url()} alt="Uploaded Preview" />}
                    {imageError && <ErrorMessage>{imageError}</ErrorMessage>}

                    <ContentTextArea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Content"
                        rows="10"
                        required
                    />
                    {errors.content && <ErrorMessage>{errors.content}</ErrorMessage>}

                    <SubmitButton type="submit" disabled={uploading || isSubmitting || isUserLoading || Object.keys(errors).length > 0}>
                        {isSubmitting ? 'Publishing...' : 'Publish Article'}
                    </SubmitButton>
                </Form>

                <Link to="/articles">
                    <BackButton>{'←'}</BackButton> 
                </Link>
            </Container>
        </PageContainer>
    );
};

const PageContainer = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Top-aligned by default */
    align-items: center; /* Center horizontally by default */
    overflow-x: hidden; /* Prevent horizontal scrolling */
`;

const Container = styled.div`
    padding: 40px;
    width: 100%;
    max-width: 800px; /* Adjust max-width for mobile responsiveness */
    margin: 0 auto;
    background: #f4f4f4;
    border-radius: 10px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center vertically */
    align-items: center; /* Center horizontally */
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 20px;
    }

    @media (max-width: 480px) {
        padding: 15px;
        width: 100%;
        margin: 0 10px; /* Ensure no overflow */
    }
`;

const AuthorSection = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap; /* Allows wrapping if space is tight */
    justify-content: center; /* Center author info */
`;

const AuthorPhoto = styled.img`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-right: 15px;
    object-fit: cover;

    @media (max-width: 480px) {
        width: 40px;
        height: 40px;
    }
`;

const AuthorName = styled.p`
    font-weight: bold;
    font-size: 18px;

    @media (max-width: 480px) {
        font-size: 14px;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%; /* Ensure form takes full width */
    max-width: 600px; /* Limit the form width to 600px */
    justify-content: center; /* Center content vertically inside form */
    align-items: center; /* Center content horizontally inside form */

    @media (max-width: 768px) {
        width: 90%; /* Allow form to take up more space on tablets */
    }

    @media (max-width: 480px) {
        width: 100%; /* Full width on mobile screens */
        margin: 0; /* Remove margins */
    }
`;

const TitleInput = styled.input`
    padding: 12px;
    font-size: 18px;
    border: none;
    border-bottom: 2px solid #ddd;
    margin-bottom: 20px;
    background: transparent;
    width: 100%;
    &::placeholder {
        color: #aaa;
    }

    &:focus {
        outline: none;
        border-bottom: 2px solid #007bff;
    }

    @media (max-width: 480px) {
        font-size: 16px;
    }
`;

const ImageInput = styled.input`
    padding: 10px;
    border: none;
    border-bottom: 2px solid #ddd;
    margin-bottom: 20px;
    background: transparent;
    width: 100%;
`;

const ContentTextArea = styled.textarea`
    padding: 12px;
    font-size: 16px;
    border: none;
    border-bottom: 2px solid #ddd;
    min-height: 200px;
    margin-bottom: 20px;
    background: transparent;
    width: 100%;
    &::placeholder {
        color: #aaa;
    }

    &:focus {
        outline: none;
        border-bottom: 2px solid #007bff;
    }

    @media (max-width: 480px) {
        font-size: 14px;
    }
`;

const PreviewImage = styled.img`
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 5px;
    margin-top: 10px;

    @media (max-width: 768px) {
        width: 80px;
        height: 80px;
    }

    @media (max-width: 480px) {
        width: 60px;
        height: 60px;
    }
`;

const ErrorMessage = styled.p`
    color: red;
    font-size: 12px;
    margin-top: -10px;

    @media (max-width: 480px) {
        font-size: 10px;
    }
`;

const SubmitButton = styled.button`
    background-color: #fe592a; /* Updated color */
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 18px;
    width: 100%;

    &:hover {
        background-color: #d94a1f; /* Darker shade for hover */
    }

    &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    @media (max-width: 480px) {
        font-size: 16px;
        padding: 12px 25px;
    }
`;

const BackButton = styled.button`
    position: absolute;
    top: 20px;
    left: 20px;
    background-color: transparent;
    color: #fe592a; /* Updated color */
    font-size: 30px;
    border: none;
    cursor: pointer;

    &:hover {
        color: #d94a1f; /* Darker shade for hover */
    }

    @media (max-width: 480px) {
        font-size: 25px;
    }
`;

export default ArticleForm;