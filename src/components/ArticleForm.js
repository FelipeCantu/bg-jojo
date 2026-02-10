import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { articleAPI, mediaAPI, client } from '../sanityClient';
import { db } from '../firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TextEditor from './TextEditor';
import { portableTextToHtml } from './utils/portableTextHtml';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';
import { FaArrowLeft, FaCloudUploadAlt, FaImage, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { auth, onAuthStateChanged } from '../firestore';
import AuthForm from './AuthForm';

const DEFAULT_ANONYMOUS_AVATAR = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';
const TITLE_MAX_LENGTH = 150;

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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  const handleContentChange = useCallback((htmlContent) => {
    setFormData(prev => ({
      ...prev,
      htmlContent,
      portableContent: htmlContent === prev.htmlContent ? prev.portableContent : []
    }));
    setErrors(prev => ({ ...prev, content: null }));
    setHasUnsavedChanges(true);
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
        // Sync user to Sanity first
        await syncUserToSanity(currentUser);

        // Then get Firestore data
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
        console.error('Error handling user state:', error);
      } finally {
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const getWordCount = useCallback((html) => {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, []);

  const calculateReadingTime = useCallback((html) => {
    const words = getWordCount(html);
    return Math.max(1, Math.ceil(words / 200));
  }, [getWordCount]);

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
      toast.error('Failed to update display name. Please try again.');
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length > TITLE_MAX_LENGTH) return;
    setFormData({ ...formData, title: value });
    setErrors(prev => ({ ...prev, title: null }));
    setHasUnsavedChanges(true);
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

      const imageAsset = await mediaAPI.upload(file);
      setFormData(prev => ({
        ...prev,
        mainImage: imageAsset.asset._ref
      }));
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Image upload error:', error);
      setImageError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, mainImage: '' }));
    setImagePreview(null);
    setHasUnsavedChanges(true);
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
      const currentHtml = editorRef.current?.getHTML() || formData.htmlContent;
      const articleData = {
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
        author: { _type: 'reference', _ref: user.uid },
        isAnonymous: isAnonymous,
        readingTime: calculateReadingTime(currentHtml)
      };

      const submittedArticle = await articleAPI.create(articleData, user.uid);

      // Reset form and navigate
      setFormData({ title: '', mainImage: '', htmlContent: '', portableContent: [] });
      editorRef.current?.clearContent();
      setImagePreview(null);
      setIsAnonymous(false);
      setHasUnsavedChanges(false);

      toast.success('Article published successfully!');
      navigate(`/article/${submittedArticle._id}`);

    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit article. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const syncUserToSanity = async (user) => {
    if (!user) return;

    try {
      let imageAsset;
      if (user.photoURL) {
        const response = await fetch(user.photoURL);
        const blob = await response.blob();
        const file = new File([blob], 'profile.jpg', { type: blob.type });
        const result = await mediaAPI.upload(file);
        imageAsset = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: result.asset._ref
          }
        };
      }

      await client.createOrReplace({
        _type: 'user',
        _id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || DEFAULT_ANONYMOUS_AVATAR,
        image: imageAsset,
        role: 'user',
        providerData: user.providerData?.map(p => p.providerId) || [],
        lastLogin: new Date().toISOString()
      });
    } catch (error) {
      console.error('User sync error:', error);
    }
  };

  if (isUserLoading) {
    return (
      <PageContainer>
        <Container>
          <LoadingWrapper>
            <LoadingSpinner />
            <LoadingMessage>Checking authentication...</LoadingMessage>
          </LoadingWrapper>
        </Container>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <AuthForm
        title="Sign in to Create an Article"
        subtitle="Share your story and resources with the community"
        redirectTo="/create-article"
      />
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
          <TitleInputWrapper>
            <TitleInput
              type="text"
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Title"
              required
              aria-invalid={!!errors.title}
            />
            <CharCount $near={formData.title.length > TITLE_MAX_LENGTH * 0.8}>
              {formData.title.length}/{TITLE_MAX_LENGTH}
            </CharCount>
          </TitleInputWrapper>
          {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}

          <ImageUploadContainer>
            <UploadBox
              onClick={() => document.getElementById('imageInput').click()}
              $hasImage={!!imagePreview}
              $error={!!errors.mainImage}
            >
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {uploading ? (
                <UploadPlaceholder>
                  <LoadingSpinner small />
                  <span>Uploading...</span>
                </UploadPlaceholder>
              ) : imagePreview ? (
                <PreviewWrapper>
                  <PreviewImage src={imagePreview} alt="Uploaded Preview" />
                  <ChangeOverlay>
                    <FaCloudUploadAlt />
                    <span>Change Cover Image</span>
                  </ChangeOverlay>
                  <RemoveImageButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    title="Remove image"
                  >
                    <FaTimes />
                  </RemoveImageButton>
                </PreviewWrapper>
              ) : (
                <UploadPlaceholder>
                  <FaImage size={40} color="var(--text-muted)" />
                  <span className="primary">Click to upload cover image</span>
                  <span className="secondary">Recommended size: 1200x630px</span>
                </UploadPlaceholder>
              )}
            </UploadBox>

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
                <div>
                  <ToggleText>Post Anonymously</ToggleText>
                  {isAnonymous && (
                    <AnonymousNote>
                      Your name and profile picture will be hidden
                    </AnonymousNote>
                  )}
                </div>
              </ToggleLabel>
            </ToggleContainer>
          </ImageUploadContainer>

          <TextEditor
            ref={editorRef}
            value={portableTextToHtml(formData.portableContent)}
            onChange={handleContentChange}
            error={errors.content}
          />
          <EditorFooter>
            <WordCount>
              {getWordCount(formData.htmlContent)} words &middot; {calculateReadingTime(formData.htmlContent)} min read
            </WordCount>
          </EditorFooter>
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

        <BackButton onClick={() => {
          if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
          window.history.back();
        }}>
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
  padding: 50px;
  width: 100%;
  max-width: 900px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);

  h2 {
    font-size: 2.5rem;
    color: var(--text-color);
    margin-bottom: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  @media (max-width: 768px) {
    padding: 30px 20px;
    margin: 20px auto;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  @media (max-width: 480px) {
    padding: 15px;
    width: 100%;
    margin: 0;
  }
`;



const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 15px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-light);
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
  gap: 25px;
  width: 100%;
  max-width: 700px;
  justify-content: center;
  align-items: stretch;

  @media (max-width: 768px) {
    width: 90%;
  }

  @media (max-width: 480px) {
    width: 100%;
    margin: 0;
  }
`;

const TitleInput = styled.input`
  padding: 15px 20px;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #f8fafc;
  width: 100%;
  transition: all 0.3s ease;
  color: var(--text-color);

  &::placeholder {
    color: var(--text-muted);
    font-weight: 400;
  }

  &:focus {
    outline: none;
    background: #ffffff;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(254, 165, 0, 0.1);
  }
`;

const ImageUploadContainer = styled.div`
  width: 100%;
  margin-bottom: 24px;
`;

const UploadBox = styled.div`
  width: 100%;
  min-height: 200px;
  border: 2px dashed ${props => props.$error ? 'var(--error-color)' : props.$hasImage ? 'transparent' : '#cbd5e1'};
  border-radius: 12px;
  background: ${props => props.$hasImage ? 'transparent' : '#f8fafc'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;

  &:hover {
    border-color: ${props => props.$error ? 'var(--error-color)' : 'var(--primary-color)'};
    background: ${props => props.$hasImage ? 'transparent' : '#f1f5f9'};
  }
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  text-align: center;

  .primary {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .secondary {
    font-size: 0.9rem;
    color: var(--text-muted);
  }
`;

const PreviewWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  
  &:hover > div {
    opacity: 1;
  }
`;

const ChangeOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-weight: 600;
`;

const UploadStatus = styled.p`
  font-size: 14px;
  color: var(--text-light);
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
  color: var(--error-color);
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 10px;

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;



const ToggleContainer = styled.div`
  width: 100%;
  padding: 15px 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  gap: 15px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: var(--secondary-color);
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
  background-color: var(--border-color);
  border-radius: 24px;
  transition: 0.4s;
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
    transition: 0.4s;
  }
`;

const ToggleText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const AnonymousNote = styled.p`
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-light);
`;



const SubmitButton = styled.button`
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--secondary-color), var(--secondary-color-dark));
  color: white;
  border: none;
  border-radius: 50px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  font-size: 1.1rem;
  font-weight: 600;
  width: auto;
  min-width: 200px;
  align-self: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(2, 73, 71, 0.2);
  margin-top: 10px;
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(2, 73, 71, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: none;
  border: none;
  color: var(--secondary-color);
  cursor: pointer;
  font-size: 18px;
  text-decoration: none;

  &:hover {
    color: var(--secondary-color-dark);
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
  background-color: ${({ $primary }) => $primary ? 'var(--info-color)' : '#f0f0f0'};
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
  border: 1px solid var(--border-color);
  border-radius: 4px;
`;

const TitleInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const CharCount = styled.span`
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 0.75rem;
  color: ${({ $near }) => $near ? 'var(--error-color)' : 'var(--text-muted)'};
  pointer-events: none;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s;

  &:hover {
    background: rgba(200, 35, 51, 1);
  }
`;

const EditorFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
`;

const WordCount = styled.span`
  font-size: 0.85rem;
  color: var(--text-muted);
`;

export default ArticleForm;