import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { submitArticle, uploadImageToSanity, ensureUserExistsInSanity } from '../sanityClient';
import { auth, onAuthStateChanged } from '../firestore';
import { db } from '../firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TextEditor from './TextEditor';
import { portableTextToHtml } from './utils/portableTextHtml';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';
import { FaArrowLeft } from 'react-icons/fa';

const ArticleForm = ({ onArticleSubmitted }) => {
  const [formData, setFormData] = useState({
    title: '',
    mainImage: '',
    htmlContent: '',
    portableContent: []
  });
  const editorRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');
  const navigate = useNavigate();

  // Handle auth state changes and user data fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsUserLoading(false);
        navigate('/login');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        const userData = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || 'https://via.placeholder.com/40',
          role: 'user'
        };

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          userData.displayName = firestoreData.name || userData.displayName;
          userData.photoURL = firestoreData.photoURL || userData.photoURL;
          userData.role = firestoreData.role || userData.role;
        }

        setUser(userData);
        await ensureUserExistsInSanity(userData.uid, userData.displayName, userData.photoURL);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const updateUserDisplayName = async () => {
    if (!tempDisplayName.trim()) return;
    
    try {
      // Update in Firebase
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: tempDisplayName
      });

      // Update in local state
      const updatedUser = {
        ...user,
        displayName: tempDisplayName
      };
      setUser(updatedUser);

      // Ensure Sanity has the updated info
      await ensureUserExistsInSanity(
        updatedUser.uid, 
        updatedUser.displayName, 
        updatedUser.photoURL
      );

      setShowNameDialog(false);
      setTempDisplayName('');
    } catch (error) {
      console.error('Error updating display name:', error);
      alert('Failed to update display name. Please try again.');
    }
  };

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
    setErrors(prev => ({ ...prev, title: null }));
  };

  const handleContentChange = useCallback((htmlContent) => {
    setFormData(prev => ({
      ...prev,
      htmlContent,
      portableContent: htmlContent === prev.htmlContent ? prev.portableContent : []
    }));
    setErrors(prev => ({ ...prev, content: null }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const htmlContent = editorRef.current?.getHTML() || formData.htmlContent;

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.mainImage) {
      newErrors.mainImage = 'Main image is required';
    }

    const isEmpty = !htmlContent ||
      htmlContent === '<p></p>' ||
      htmlContent === '<p><br></p>' ||
      editorRef.current?.isEmpty?.();

    if (isEmpty) {
      newErrors.content = 'Content is required';
    }

    return newErrors;
  }, [formData.title, formData.mainImage, formData.htmlContent]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setImageError('');
    setErrors(prev => ({ ...prev, mainImage: null }));

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Only JPEG, PNG, GIF, and WebP images are allowed.');
      setUploading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be smaller than 5MB');
      setUploading(false);
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);

      const imageAsset = await uploadImageToSanity(file);
      setFormData(prev => ({
        ...prev,
        mainImage: imageAsset.asset._ref
      }));
    } catch (error) {
      console.error('Image upload error:', error);
      setImageError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const prepareSubmission = async () => {
    // Check for display name first
    if (!user?.displayName) {
      setShowNameDialog(true);
      return;
    }

    const currentHtml = editorRef.current?.getHTML() || '';
    const currentPortableText = formData.portableContent.length > 0 && currentHtml === formData.htmlContent
      ? formData.portableContent
      : await convertHtmlToPortableText(currentHtml);

    setFormData(prev => ({
      ...prev,
      htmlContent: currentHtml,
      portableContent: currentPortableText
    }));

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setShowConfirmDialog(true);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const submittedArticle = await submitArticle(
        {
          title: formData.title,
          content: formData.portableContent,
          mainImage: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: formData.mainImage
            }
          },
          publishedDate: new Date().toISOString(),
          author: {
            _type: 'reference',
            _ref: user.uid,
          },
        },
        user
      );

      // Reset form
      setFormData({
        title: '',
        mainImage: '',
        htmlContent: '',
        portableContent: []
      });
      editorRef.current?.clearContent();
      setImagePreview(null);

      if (onArticleSubmitted) {
        onArticleSubmitted(submittedArticle);
      }
      navigate(`/article/${submittedArticle._id}`);
    } catch (error) {
      console.error('Submission error:', error);
      alert(error.message || 'Failed to submit article. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = uploading || isSubmitting || isUserLoading || !user;

  return (
    <PageContainer>
      <Container>
        <h2>Write Your Article</h2>
        {isUserLoading ? (
          <p>Loading user info...</p>
        ) : user ? (
          <AuthorSection>
            <AuthorPhoto src={user.photoURL} alt="Author" />
            <AuthorName>{user.displayName}</AuthorName>
          </AuthorSection>
        ) : (
          <p>Please sign in to submit an article.</p>
        )}

        <Form onSubmit={(e) => e.preventDefault()}>
          <TitleInput
            type="text"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Title"
            required
            aria-invalid={!!errors.title}
          />
          {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}

          <ImageInput
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            required
            aria-invalid={!!errors.mainImage}
          />
          {uploading && <p>Uploading image...</p>}
          {imagePreview && <PreviewImage src={imagePreview} alt="Uploaded Preview" />}
          {imageError && <ErrorMessage>{imageError}</ErrorMessage>}
          {errors.mainImage && <ErrorMessage>{errors.mainImage}</ErrorMessage>}

          <TextEditor
            ref={editorRef}
            value={portableTextToHtml(formData.portableContent)}
            onChange={handleContentChange}
            error={errors.content}
          />
          {errors.content && <ErrorMessage>{errors.content}</ErrorMessage>}

          <SubmitButton
            type="button"
            disabled={isSubmitDisabled}
            onClick={prepareSubmission}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Article'}
          </SubmitButton>
        </Form>

        {showConfirmDialog && (
          <DialogOverlay>
            <Dialog>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogContent>
                Are you sure you want to publish this article?
              </DialogContent>
              <DialogActions>
                <DialogButton onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </DialogButton>
                <DialogButton $primary onClick={handleSubmit}>
                  Publish
                </DialogButton>
              </DialogActions>
            </Dialog>
          </DialogOverlay>
        )}

        {showNameDialog && (
          <DialogOverlay>
            <Dialog>
              <DialogTitle>Display Name Required</DialogTitle>
              <DialogContent>
                <p>You need a display name to publish articles.</p>
                <NameInput
                  type="text"
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </DialogContent>
              <DialogActions>
                <DialogButton onClick={() => setShowNameDialog(false)}>
                  Cancel
                </DialogButton>
                <DialogButton 
                  $primary 
                  onClick={updateUserDisplayName}
                  disabled={!tempDisplayName.trim()}
                >
                  Save
                </DialogButton>
              </DialogActions>
            </Dialog>
          </DialogOverlay>
        )}

        <BackButton onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </BackButton>
      </Container>
    </PageContainer>
  );
};

// Styled components (same as before, with one addition)
const NameInput = styled.input`
  padding: 10px;
  width: 100%;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

// All styled components remain exactly the same as in your original code
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
  background-color: ${({ disabled }) => disabled ? '#ccc' : '#014a47'};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  font-size: 16px;
  width: 100%;
  max-width: 200px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ disabled }) => disabled ? '#ccc' : '#012f2d'};
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: none;
  border: none;
  color: #014a47;
  cursor: pointer;
  font-size: 18px;
  text-decoration: none;

  &:hover {
    color: #012f2d;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    top: 10px;
    left: 10px;
  }
`;

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const DialogTitle = styled.h3`
  margin-top: 0;
`;

const DialogContent = styled.div`
  margin: 20px 0;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const DialogButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: ${({ $primary }) => $primary ? '#007bff' : '#f0f0f0'};
  color: ${({ $primary }) => $primary ? 'white' : '#333'};
  cursor: pointer;
  
  &:hover {
    background-color: ${({ $primary }) => $primary ? '#0056b3' : '#e0e0e0'};
  }
`;

export default ArticleForm;