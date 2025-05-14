import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { uploadImageToSanity, client } from '../sanityClient';
import { db } from '../firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TextEditor from './TextEditor';
import { portableTextToHtml } from './utils/portableTextHtml';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';
import { FaArrowLeft } from 'react-icons/fa';
import { auth, onAuthStateChanged } from '../firestore';

const DEFAULT_ANONYMOUS_AVATAR = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';

const ArticleForm = ({ onArticleSubmitted }) => {
  // All hooks properly ordered at the top
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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = require('../firebaseconfig');

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

    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.mainImage) newErrors.mainImage = 'Main image is required';
    
    const isEmpty = !htmlContent || htmlContent === '<p></p>' || 
                   htmlContent === '<p><br></p>' || editorRef.current?.isEmpty?.();
    if (isEmpty) newErrors.content = 'Content is required';

    return newErrors;
  }, [formData.title, formData.mainImage, formData.htmlContent]);

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
        
        const userData = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || DEFAULT_ANONYMOUS_AVATAR,
          role: 'user'
        };

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          userData.displayName = firestoreData.name || userData.displayName;
          userData.photoURL = firestoreData.photoURL || userData.photoURL;
          userData.role = firestoreData.role || userData.role;
        }

        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Regular functions after hooks
  const updateUserDisplayName = async () => {
    if (!tempDisplayName.trim()) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { name: tempDisplayName });

      setUser(prev => ({
        ...prev,
        displayName: tempDisplayName
      }));

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
    const articleData = {
      _type: 'article',
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
        _ref: user.uid
      },
      isAnonymous: isAnonymous
    };

    const submittedArticle = await client.create(articleData);

    setFormData({
      title: '',
      mainImage: '',
      htmlContent: '',
      portableContent: []
    });
    editorRef.current?.clearContent();
    setImagePreview(null);
    setIsAnonymous(false);

    if (onArticleSubmitted) {
      onArticleSubmitted(submittedArticle);
    }
    
    // Navigate to the new article page after successful submission
    navigate(`/article/${submittedArticle._id}`);
    
  } catch (error) {
    console.error('Submission error:', error);
    alert(error.message || 'Failed to submit article. Please try again later.');
  } finally {
    setIsSubmitting(false);
  }
};
  // Conditional rendering after all hooks
  if (isUserLoading) {
    return (
      <PageContainer>
        <Container>
          <LoadingMessage>Checking authentication...</LoadingMessage>
        </Container>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <Container>
          <LoginPrompt>
            <p>You need to be logged in to create an article.</p>
            <LoginButton onClick={signInWithGoogle}>
              Login with Google
            </LoginButton>
            <BackToListingButton onClick={() => window.history.back()}>
              Back to Articles
            </BackToListingButton>
          </LoginPrompt>
        </Container>
      </PageContainer>
    );
  }

  const isSubmitDisabled = uploading || isSubmitting || isUserLoading || !user;

  return (
    <PageContainer>
      <Container>
        <h2>Write Your Article</h2>
        
        <AuthorSection>
          <AuthorPhoto 
            src={isAnonymous ? DEFAULT_ANONYMOUS_AVATAR : (user?.photoURL || DEFAULT_ANONYMOUS_AVATAR)} 
            alt={isAnonymous ? 'Anonymous' : (user?.displayName || 'User')} 
          />
          <AuthorName>{isAnonymous ? 'Anonymous' : (user?.displayName || 'Loading...')}</AuthorName>
        </AuthorSection>

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

          <ImageUploadContainer>
            <ImageInput
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              required
              aria-invalid={!!errors.mainImage}
            />
            {uploading && <UploadStatus>Uploading image...</UploadStatus>}
            {imagePreview && <PreviewImage src={imagePreview} alt="Uploaded Preview" />}
            {imageError && <ErrorMessage>{imageError}</ErrorMessage>}
            {errors.mainImage && <ErrorMessage>{errors.mainImage}</ErrorMessage>}

            <ToggleContainer>
              <ToggleLabel>
                <ToggleInput
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(!isAnonymous)}
                />
                <ToggleSlider />
                <ToggleText>Post Anonymously</ToggleText>
              </ToggleLabel>
              {isAnonymous && (
                <AnonymousNote>
                  Your name and profile picture will be hidden everywhere this article appears
                </AnonymousNote>
              )}
            </ToggleContainer>
          </ImageUploadContainer>

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
                <p>Are you sure you want to publish this article?</p>
                {isAnonymous && (
                  <p><strong>Note:</strong> This article will show as anonymous everywhere.</p>
                )}
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

        <BackButton onClick={() => window.history.back()}>
          <FaArrowLeft />
        </BackButton>
      </Container>
    </PageContainer>
  );
};

// Styled components remain exactly the same as before
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

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  font-size: 18px;
`;

const LoginPrompt = styled.div`
  padding: 40px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
`;

const LoginButton = styled.button`
  padding: 12px 20px;
  background-color: #014a47;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #012f2d;
  }
`;

const BackToListingButton = styled.button`
  padding: 12px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  margin-left: 10px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a6268;
  }

  @media (max-width: 480px) {
    margin-top: 10px;
    margin-left: 0;
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

const ImageUploadContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;
`;

const ImageInput = styled.input`
  padding: 10px;
  border: none;
  border-bottom: 2px solid #ddd;
  margin-bottom: 10px;
  background: transparent;
  width: 100%;
`;

const UploadStatus = styled.p`
  font-size: 14px;
  color: #666;
  margin: 5px 0;
`;

const PreviewImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: 5px;
  margin-top: 10px;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    max-width: 250px;
  }

  @media (max-width: 480px) {
    max-width: 200px;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 10px;

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const ToggleContainer = styled.div`
  width: 100%;
  margin: 15px 0;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 8px;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #014a47;
  }

  &:checked + span:before {
    transform: translateX(20px);
  }
`;

const ToggleSlider = styled.span`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background-color: #ccc;
  border-radius: 24px;
  transition: .4s;
  margin-right: 10px;

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    border-radius: 50%;
    transition: .4s;
  }
`;

const ToggleText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const AnonymousNote = styled.p`
  margin-top: 10px;
  font-size: 13px;
  color: #666;
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
  margin-top: 20px;

  &:hover {
    background-color: ${({ disabled }) => disabled ? '#ccc' : '#012f2d'};
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

const NameInput = styled.input`
  padding: 10px;
  width: 100%;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

export default ArticleForm;