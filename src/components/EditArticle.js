import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client, urlFor } from '../sanityClient';
import TextEditor from '../components/TextEditor';
import styled from 'styled-components';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { portableTextToHtml } from './utils/portableTextHtml';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';

const EditArticle = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMainImage, setFormMainImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      const query = `*[_type == "article" && _id == $articleId][0]{
        _id, title, content, mainImage, isAnonymous,
        publishedDate, updatedAt, author->{ _id, name, photoURL }
      }`;
      const result = await client.fetch(query, { articleId });

      if (!result) {
        throw new Error('Article not found');
      }

      setArticle(result);
      setFormTitle(result.title || '');
      setHtmlContent(portableTextToHtml(result.content || ''));
      setFormMainImage(result.mainImage || null);
      setIsAnonymous(result.isAnonymous || false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch article');
      toast.error(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

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

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return null;

    try {
      const result = await client.assets.upload('image', file, {
        contentType: file.type,
        filename: file.name,
      });

      if (!result?._id) {
        throw new Error('Image upload failed');
      }

      const newImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: result._id,
        },
      };

      setFormMainImage(newImage);
      setHasUnsavedChanges(true);
      toast.success('Image uploaded successfully');
      return newImage;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      return null;
    }
  }, []);

  const calculateReadingTime = useCallback((content) => {
    if (!content) return 0;
  
    if (Array.isArray(content)) {
      let wordCount = 0;
      content.forEach((block) => {
        if (block._type === 'block' && block.children) {
          block.children.forEach((child) => {
            if (child.text) {
              wordCount += child.text.split(/\s+/).length;
            }
          });
        }
      });
      return Math.max(1, Math.ceil(wordCount / 200));
    }
  
    if (typeof content === 'string') {
      const textContent = content.replace(/<[^>]*>/g, ' ');
      return Math.max(1, Math.ceil(textContent.split(/\s+/).length / 200));
    }
  
    return 5;
  }, []);

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const trimmedContent = htmlContent.replace(/<[^>]*>/g, '').trim();
    if (!trimmedContent) {
      toast.error('Please add some content');
      return;
    }

    const shouldSubmit = window.confirm('Are you sure you want to publish these changes?');
    if (!shouldSubmit) return;

    setIsSubmitting(true);

    try {
      const portableContent = await convertHtmlToPortableText(htmlContent);
      const updatedReadingTime = calculateReadingTime(portableContent);

      const patch = client.patch(articleId)
        .set({
          title: formTitle,
          content: portableContent,
          readingTime: updatedReadingTime,
          updatedAt: new Date().toISOString(),
          isAnonymous: isAnonymous,
          ...(formMainImage && { mainImage: formMainImage }),
        });

      await patch.commit();

      toast.success('Article updated successfully');
      setHasUnsavedChanges(false);
      setTimeout(() => navigate(`/article/${articleId}`), 1000);
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = useCallback((newHtmlContent) => {
    setHtmlContent(newHtmlContent);
    setHasUnsavedChanges(true);
  }, []);

  const handleTitleChange = (e) => {
    setFormTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  if (loading) return <LoadingMessage>Loading article data...</LoadingMessage>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!article) return <ErrorMessage>Article not found</ErrorMessage>;

  return (
    <EditContainer>
      <Header>
        <BackButton onClick={() => {
          if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
          navigate(-1);
        }}>
          <FaArrowLeft /> Back to Profile
        </BackButton>
        <Title>Edit Article</Title>
      </Header>

      <FormContainer>
        <FormGroup>
          <Label htmlFor="title">Title *</Label>
          <Input
            type="text"
            id="title"
            value={formTitle}
            onChange={handleTitleChange}
            required
            placeholder="Enter article title"
          />
        </FormGroup>

        <FormGroup>
          <Label>Featured Image</Label>
          <ImageUploadContainer>
            {formMainImage?.asset ? (
              <div className="image-preview">
                <img
                  src={urlFor(formMainImage).width(400).url()}
                  alt="Featured preview"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x225?text=Image+not+found';
                  }}
                />
                <button 
                  className="remove-button"
                  onClick={() => {
                    setFormMainImage(null);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <FaTimes /> Remove
                </button>
              </div>
            ) : (
              <div className="upload-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => await handleImageUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  Choose Image
                </label>
              </div>
            )}
          </ImageUploadContainer>
        </FormGroup>

        <FormGroup>
          <Label>Content *</Label>
          <div>
            <TextEditor
              key={articleId}
              value={htmlContent}
              onChange={handleContentChange}
              placeholder="Write your article content here..."
            />
            <p style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
              Word count: {htmlContent.split(/\s+/).length}
            </p>
          </div>
        </FormGroup>

        <div className="meta-info">
          <div>
            <strong>Author:</strong> {article.author?.name || 'Unknown'}
          </div>
          <div>
            <strong>Last Updated:</strong> {new Date(article.updatedAt || article.publishedDate).toLocaleString()}
          </div>
        </div>

        <FormGroup>
          <Label>Privacy Settings</Label>
          <ToggleContainer>
            <ToggleLabel>
              <ToggleInput
                type="checkbox"
                checked={isAnonymous}
                onChange={() => {
                  setIsAnonymous(!isAnonymous);
                  setHasUnsavedChanges(true);
                }}
              />
              <ToggleSlider />
              <ToggleText>Publish anonymously</ToggleText>
            </ToggleLabel>
            <ToggleDescription>
              When enabled, your name and profile picture won't be shown with this article.
            </ToggleDescription>
          </ToggleContainer>
        </FormGroup>
      </FormContainer>

      <ButtonGroup>
        <CancelButton
          type="button"
          onClick={() => {
            if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
            navigate(-1);
          }}
          disabled={isSubmitting}
        >
          <FaTimes /> Cancel
        </CancelButton>
        <SaveButton
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !formTitle.trim() || !htmlContent || htmlContent === '<p></p>'}
        >
          {isSubmitting ? (
            <>
              <Spinner /> Saving...
            </>
          ) : (
            <>
              <FaSave /> Save Changes
            </>
          )}
        </SaveButton>
      </ButtonGroup>
    </EditContainer>
  );
};

// Styled components (add these to your existing styles)
const ToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
`;

const ToggleInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleSlider = styled.span`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background-color: #ddd;
  border-radius: 24px;
  transition: all 0.3s;

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    border-radius: 50%;
    transition: all 0.3s;
  }

  ${ToggleInput}:checked + & {
    background-color: #014a47;
  }

  ${ToggleInput}:checked + &:before {
    transform: translateX(26px);
  }
`;

const ToggleText = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #333;
`;

const ToggleDescription = styled.p`
  font-size: 13px;
  color: #666;
  margin: 0;
  padding-left: 60px;
`;

// Keep all your existing styled components below
const EditContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #014a47;
  cursor: pointer;
  font-size: 16px;
  margin-right: 20px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f0f7ff;
    text-decoration: none;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    margin-right: 0;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  margin: 0;
  color: #333;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const FormContainer = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 20px;
  }

  .meta-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 25px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 14px;
    color: #495057;

    @media (max-width: 768px) {
      font-size: 13px;
      gap: 10px;
    }

    div {
      display: flex;
      gap: 5px;
    }

    strong {
      font-weight: 600;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 30px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #444;
  font-size: 15px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.2s;

  &:focus {
    border-color: #007BFF;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  @media (max-width: 768px) {
    padding: 10px;
    font-size: 14px;
  }
`;

const ImageUploadContainer = styled.div`
  margin-top: 5px;

  .image-preview {
    position: relative;
    max-width: 100%;
    margin-bottom: 15px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #eee;

    img {
      width: 100%;
      height: auto;
      max-height: 300px;
      object-fit: contain;
      display: block;
    }
  }

  .remove-button {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(220, 53, 69, 0.9);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background: rgba(200, 35, 51, 0.9);
    }
  }

  .upload-button {
    label {
      display: inline-block;
      padding: 12px 20px;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 15px;
      color: #495057;

      &:hover {
        background: #e9ecef;
        border-color: #adb5bd;
      }
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const SaveButton = styled.button`
  padding: 12px 20px;
  background-color: ${({ disabled }) => (disabled ? '#ccc' : '#014a47')};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#ccc' : '#012f2d')};
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 15px;
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
    border-color: #ced4da;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 15px;
  }
`;

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  font-size: 18px;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  padding: 40px;
  text-align: center;
  font-size: 18px;
  color: #dc3545;
  background: #fff8f8;
  border-radius: 8px;
  max-width: 800px;
  margin: 0 auto;
`;

const Spinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default EditArticle;