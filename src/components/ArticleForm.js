import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { submitArticle, uploadImageToSanity, ensureUserExistsInSanity } from '../sanityClient';
import { auth, onAuthStateChanged } from '../firestore';
import { db } from '../firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import TextEditor from './TextEditor';

const ArticleForm = ({ onArticleSubmitted }) => {
  const [formData, setFormData] = useState({
    title: '',
    mainImage: '', // Store the main image reference
    content: [], // Default as an array for Portable Text
  });
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null); // State for image preview
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsUserLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const fetchedUser = userDoc.exists()
          ? {
              name: userDoc.data().name || currentUser.displayName,
              photo: userDoc.data().photo || currentUser.photoURL || 'https://via.placeholder.com/40',
              uid: currentUser.uid,
              role: userDoc.data().role || 'user',
            }
          : {
              name: currentUser.displayName,
              photo: currentUser.photoURL || 'https://via.placeholder.com/40',
              uid: currentUser.uid,
            };

        setUser(fetchedUser);
        await ensureUserExistsInSanity(fetchedUser.uid, fetchedUser.name, fetchedUser.photo);
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      } finally {
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTitleChange = (e) => setFormData({ ...formData, title: e.target.value });
  const handleContentChange = (value) => setFormData({ ...formData, content: value });

  const validateForm = () => {
    const newErrors = {};
  
    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
  
    // Validate content
    if (!Array.isArray(formData.content) || formData.content.length === 0) {
      newErrors.content = 'Content is required';
    } else {
      // Check if blocks have any text
      const hasText = formData.content.some(
        (block) =>
          block._type === 'block' &&
          block.children &&
          block.children.some((child) => child.text && child.text.trim() !== '')
      );
      if (!hasText) {
        newErrors.content = 'Content is required';
      }
    }
  
    // Validate main image (if required)
    if (!formData.mainImage) {
      newErrors.mainImage = 'Main image is required';
    }
  
    return newErrors;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setImageError(null);

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setImageError('Only JPEG, PNG, and GIF images are allowed.');
      setUploading(false);
      return;
    }

    try {
      // Upload the image to Sanity
      const imageAsset = await uploadImageToSanity(file);

      // Set the image preview URL
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);

      // Store the image reference in formData
      setFormData((prev) => ({ ...prev, mainImage: imageAsset.asset._ref }));
    } catch (error) {
      setImageError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);
    console.log('Form Data Before Submission:', formData); // Debugging log
  
    if (Object.keys(validationErrors).length > 0) return;
  
    if (!user || !user.uid) {
      alert('You must be signed in to submit an article.');
      return;
    }
  
    setIsSubmitting(true);
    try {
      // No need to convert, formData.content is already in Portable Text format
      const portableTextContent = formData.content;
  
      const submittedArticle = await submitArticle(
        {
          title: formData.title,
          content: portableTextContent, // Use the existing Portable Text
          mainImage: formData.mainImage ? { asset: { _ref: formData.mainImage } } : null,
          publishedDate: new Date().toISOString(),
          readingTime: Math.ceil(formData.content.length / 5), // Rough estimate
          author: {
            _type: 'reference',
            _ref: user.uid,
          },
        },
        user
      );
  
      console.log('Submitted Article:', submittedArticle); // Debugging log
      alert('Article submitted successfully!');
      setFormData({ title: '', mainImage: '', content: [] }); // Reset form
      navigate(`/article/${submittedArticle._id}`);
    } catch (error) {
      console.error('Error submitting article:', error);
      alert('Failed to submit article. Please try again later.');
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
            onChange={handleTitleChange}
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
          {imagePreview && ( // Show image preview if available
            <PreviewImage src={imagePreview} alt="Uploaded Preview" />
          )}
          {imageError && <ErrorMessage>{imageError}</ErrorMessage>}

          <TextEditor value={formData.content} onChange={handleContentChange} />
          {errors.content && <ErrorMessage>{errors.content}</ErrorMessage>}

          <SubmitButton type="submit" disabled={uploading || isSubmitting || isUserLoading}>
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

// Styled Components (unchanged)
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow-x: hidden;
`;

const Container = styled.div`
  padding: 40px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #f4f4f4;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
    width: 100%;
    margin: 0 10px;
  }
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
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
  width: 100%;
  max-width: 600px;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    width: 90%;
  }

  @media (max-width: 480px) {
    width: 100%;
    margin: 0;
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
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  max-width: 200px;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 18px;
  padding: 10px;

  &:hover {
    color: #0056b3;
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

export default ArticleForm;