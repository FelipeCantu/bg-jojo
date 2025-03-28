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
  const [formSlug, setFormSlug] = useState('');
  const [readingTime, setReadingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [htmlContent, setHtmlContent] = useState(''); // New state for HTML content

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      const query = `*[_type == "article" && _id == $articleId][0]{
        _id,
        title,
        content,
        mainImage,
        readingTime,
        slug,
        publishedDate,
        author->{
          _id,
          name,
          photoURL
        }
      }`;
      const result = await client.fetch(query, { articleId });

      if (!result) throw new Error('Article not found');

      setArticle(result);
      setFormTitle(result.title || '');
      setHtmlContent(portableTextToHtml(result.content || '')); // Fixed syntax error here
      setFormMainImage(result.mainImage || null);
      setFormSlug(result.slug?.current || '');
      setReadingTime(result.readingTime || 0);
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

  const handleImageUpload = useCallback(async (file) => {
    try {
      if (!file) return null;
      setImageUploadProgress(0);

      const result = await client.assets.upload('image', file, {
        contentType: file.type,
        filename: file.name,
        onProgress: (event) => {
          setImageUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      if (!result?._id) throw new Error('Image upload failed');

      const newImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: result._id,
        },
      };

      setFormMainImage(newImage);
      setImageUploadProgress(0);
      toast.success('Image uploaded successfully');
      return newImage;
    } catch (error) {
      console.error('Upload error:', error);
      setImageUploadProgress(0);
      toast.error(error.message || 'Failed to upload image');
      return null;
    }
  }, []);

  const calculateReadingTime = useCallback(async (content) => {
    if (!content) return 0;

    // If content is Portable Text array
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

    // If content is HTML string (fallback)
    return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Basic validation
    if (!formTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!htmlContent || htmlContent === '<p></p>') {
      toast.error('Please add some content');
      return;
    }

    // Add confirmation dialog
    const shouldSubmit = window.confirm('Are you sure you want to publish these changes?');
    if (!shouldSubmit) return;

    setIsSubmitting(true);

    try {
      const portableContent = await convertHtmlToPortableText(htmlContent);
      const updatedReadingTime = await calculateReadingTime(portableContent);
      const updatedAt = new Date().toISOString();

      const updateData = {
        title: formTitle,
        content: portableContent,
        readingTime: updatedReadingTime,
        updatedAt,
        ...(formMainImage && { mainImage: formMainImage }),
      };

      await client.patch(articleId).set(updateData).commit();

      toast.success('Article updated successfully');
      setTimeout(() => {
        navigate(`/article/${formSlug || articleId}`);
      }, 1000);
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = useCallback((newHtmlContent) => {
    setHtmlContent(newHtmlContent);
  }, []);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .substring(0, 100);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setFormTitle(newTitle);

    if (!formSlug || formSlug === generateSlug(formTitle)) {
      setFormSlug(generateSlug(newTitle));
    }
  };

  if (loading) return <LoadingMessage>Loading article data...</LoadingMessage>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!article) return <ErrorMessage>Article not found</ErrorMessage>;

  return (
    <EditContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Profile
        </BackButton>
        <Title>Edit Article</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
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
          <Label htmlFor="slug">Slug (URL)</Label>
          <SlugContainer>
            <SlugPrefix>/article/</SlugPrefix>
            <SlugInput
              type="text"
              id="slug"
              value={formSlug}
              onChange={(e) => setFormSlug(generateSlug(e.target.value))}
              placeholder="article-slug"
              readOnly
            />
          </SlugContainer>
        </FormGroup>

        <FormGroup>
          <Label>Featured Image</Label>
          <ImageUploader
            image={formMainImage}
            onUpload={handleImageUpload}
            onRemove={() => setFormMainImage(null)}
            uploadProgress={imageUploadProgress}
          />
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

        <MetaInfo>
          <div>
            <strong>Reading Time:</strong> {readingTime} min
          </div>
          <div>
            <strong>Last Updated:</strong> {new Date(article.updatedAt || article.publishedDate).toLocaleString()}
          </div>
          <div>
            <strong>Author:</strong> {article.author?.name || 'Unknown'}
          </div>
        </MetaInfo>

        <ButtonGroup>
          <CancelButton type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
            <FaTimes /> Cancel
          </CancelButton>
          <SaveButton
            type="submit"
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
      </Form>
    </EditContainer>
  );
};
// Image Uploader Component with progress indicator
const ImageUploader = ({ image, onUpload, onRemove, uploadProgress }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await onUpload(file);
  };

  return (
    <ImageUploadContainer>
      {image?.asset ? (
        <ImagePreview>
          <img
            src={urlFor(image).width(400).url()}
            alt="Featured preview"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x225?text=Image+not+found';
            }}
          />
          <RemoveButton onClick={onRemove}>
            <FaTimes /> Remove
          </RemoveButton>
        </ImagePreview>
      ) : (
        <>
          <UploadButton>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Choose Image'}
            </label>
          </UploadButton>
          {uploadProgress > 0 && (
            <ProgressBar>
              <ProgressFill style={{ width: `${uploadProgress}%` }} />
            </ProgressBar>
          )}
        </>
      )}
    </ImageUploadContainer>
  );
};

const EditContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

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

const Form = styled.form`
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 20px;
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

const SlugContainer = styled.div`
  display: flex;
  align-items: center;
  background: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SlugPrefix = styled.span`
  padding: 12px 15px;
  background: #eee;
  color: #666;
  font-size: 16px;

  @media (max-width: 768px) {
    padding: 10px;
    font-size: 14px;
  }
`;

const SlugInput = styled(Input)`
  flex: 1;
  border: none;
  background: #f9f9f9;
  border-radius: 0;
  padding-left: 10px;

  @media (max-width: 768px) {
    padding: 10px;
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
  justify-content: center;  /* Add this line */
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

const MetaInfo = styled.div`
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

const ImageUploadContainer = styled.div`
  margin-top: 5px;
`;

const ImagePreview = styled.div`
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
`;

const RemoveButton = styled.button`
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
`;

const UploadButton = styled.div`
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
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #007BFF;
  transition: width 0.3s ease;
`;

export default EditArticle;