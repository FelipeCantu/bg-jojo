import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { client } from '../sanityClient';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';
import {
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaLink,
  FaUndo,
  FaRedo,
  FaImage,
  FaUnderline,
  FaHeading,
  FaSave
} from 'react-icons/fa';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const TextEditor = forwardRef(({
  value,
  onChange,
  placeholder = 'Start typing your article...',
  error
}, ref) => {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);
  const lastContentRef = useRef(value || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.extend({
        addOptions() {
          return {
            inline: false,
            allowBase64: false,
            HTMLAttributes: {
              class: 'editor-image',
              style: 'max-width: 100%; height: auto; display: block; margin: 1em auto;',
            },
          };
        },
        addAttributes() {
          return {
            src: {
              default: null,
            },
            alt: {
              default: null,
            },
            title: {
              default: null,
            },
            width: {
              default: null,
            },
            height: {
              default: null,
            },
            style: {
              default: null,
            },
          };
        },
      }),
      Link.configure({
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'external-link',
        },
        validate: (href) => /^https?:\/\//.test(href),
      }),
      TextAlign.configure({ types: ['paragraph', 'heading'], alignments: ['left', 'center', 'right'] }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: false,
        showOnlyCurrent: false,
        includeChildren: true,
      }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastContentRef.current = html;
      setHasUnsavedChanges(true);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `tiptap-editor ${error ? 'error' : ''}`,
        'data-empty': value ? 'false' : 'true',
      },
    },
  });

  useEffect(() => {
    if (editor && value && !isInitialized.current) {
      editor.commands.setContent(value);
      isInitialized.current = true;
      editorRef.current = editor;
      lastContentRef.current = value;
      setHasUnsavedChanges(false);
    }
  }, [editor, value]);

  useImperativeHandle(ref, () => ({
    saveContent: async () => {
      if (!editor) return null;
      setIsSaving(true);
      try {
        const html = editor.getHTML();
        const portableText = await convertHtmlToPortableText(html);
        onChange(portableText);
        setHasUnsavedChanges(false);
        return portableText;
      } catch (error) {
        console.error('Error saving content:', error);
        toast.error('Failed to save content');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    getHTML: () => editor?.getHTML() || '',
    getJSON: () => editor?.getJSON() || null,
    isEmpty: () => {
      if (!editor) return true;
      return editor.isEmpty;
    },
    clearContent: () => {
      if (editor) {
        editor.commands.clearContent();
        setHasUnsavedChanges(true);
        return true;
      }
      return false;
    },
    getEditorInstance: () => editor,
    setContent: (content) => {
      if (editor) {
        editor.commands.setContent(content);
        setHasUnsavedChanges(false);
        return true;
      }
      return false;
    }
  }));

  const handleImageUpload = useCallback(async (file) => {
    try {
      if (!file.type.match('image.*')) {
        toast.error('Please upload an image file (JPEG, PNG, GIF)');
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return null;
      }

      toast('Uploading image...');
      const result = await client.assets.upload('image', file);
      toast.success('Image uploaded successfully');
      return {
        url: result.url,
        alt: file.name.split('.')[0] || 'Uploaded image',
        title: file.name.split('.')[0] || 'Uploaded image'
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  }, []);

  const addImage = useCallback(async () => {
    if (!editor) return;

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const imageData = await handleImageUpload(file);
      if (imageData) {
        editor.chain().focus().setImage({
          src: imageData.url,
          alt: imageData.alt,
          title: imageData.title
        }).run();
        setHasUnsavedChanges(true);
      }
    };

    input.click();
  }, [editor, handleImageUpload]);

  const insertLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('Enter the URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setHasUnsavedChanges(true);
      return;
    }

    if (url && /^https?:\/\//.test(url)) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      setHasUnsavedChanges(true);
    } else if (url) {
      toast.error('Please enter a valid URL starting with http:// or https://');
    }
  }, [editor]);

  const setHeading = useCallback((level) => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
    setHasUnsavedChanges(true);
  }, [editor]);

  const handleSaveClick = useCallback(async () => {
    if (!editor || isSaving) return;

    const html = editor.getHTML();

    if (html === lastContentRef.current && !hasUnsavedChanges) {
      toast('No changes to save');
      return;
    }

    const savingToast = toast.loading('Saving changes...');

    try {
      setIsSaving(true);

      const portableText = await convertHtmlToPortableText(html);

      if (!portableText || portableText.length === 0) {
        throw new Error('Content conversion failed');
      }

      await onChange(portableText);
      lastContentRef.current = html;
      setHasUnsavedChanges(false);

      toast.success('Changes saved successfully', { id: savingToast });
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save changes', { id: savingToast });
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, onChange, hasUnsavedChanges]);

  // ... imports remain the same, but remove `EditorStyles` and `EditorContentWrapper` usages in the render
  // We will replace the styled components at the bottom of the file with the new implementation.

  // ... (keep lines 1-290 as they are desirable logic)

  return (
    <EditorContainer>
      <Toolbar>
        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={handleSaveClick}
            title="Save Changes"
            disabled={!hasUnsavedChanges ? 'true' : undefined}
          >
            <FaSave />
          </ToolbarButton>
        </ToolbarGroup>

        {/* ... (keep other ToolbarGroups exactly as they are) */}

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            data-active={editor?.isActive('bold') ? 'true' : 'false'}
            title="Bold"
          >
            <FaBold />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            data-active={editor?.isActive('italic') ? 'true' : 'false'}
            title="Italic"
          >
            <FaItalic />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            data-active={editor?.isActive('underline') ? 'true' : 'false'}
            title="Underline"
          >
            <FaUnderline />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => setHeading(1)}
            data-active={editor?.isActive('heading', { level: 1 }) ? 'true' : 'false'}
            title="Heading 1"
          >
            <FaHeading size={14} />1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setHeading(2)}
            data-active={editor?.isActive('heading', { level: 2 }) ? 'true' : 'false'}
            title="Heading 2"
          >
            <FaHeading size={14} />2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setHeading(3)}
            data-active={editor?.isActive('heading', { level: 3 }) ? 'true' : 'false'}
            title="Heading 3"
          >
            <FaHeading size={14} />3
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            data-active={editor?.isActive('bulletList') ? 'true' : 'false'}
            title="Bullet List"
          >
            <FaListUl />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            data-active={editor?.isActive('orderedList') ? 'true' : 'false'}
            title="Numbered List"
          >
            <FaListOl />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            data-active={editor?.isActive('blockquote') ? 'true' : 'false'}
            title="Blockquote"
          >
            <FaQuoteLeft />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            data-active={editor?.isActive({ textAlign: 'left' }) ? 'true' : 'false'}
            title="Align Left"
          >
            <FaAlignLeft />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            data-active={editor?.isActive({ textAlign: 'center' }) ? 'true' : 'false'}
            title="Align Center"
          >
            <FaAlignCenter />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            data-active={editor?.isActive({ textAlign: 'right' }) ? 'true' : 'false'}
            title="Align Right"
          >
            <FaAlignRight />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={insertLink}
            data-active={editor?.isActive('link') ? 'true' : 'false'}
            title="Insert Link"
          >
            <FaLink />
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            title="Insert Image"
          >
            <FaImage />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo() ? 'true' : undefined}
            title="Undo"
          >
            <FaUndo />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo() ? 'true' : undefined}
            title="Redo"
          >
            <FaRedo />
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>

      <StyledEditorContent editor={editor} $error={error} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </EditorContainer>
  );
});

const EditorContainer = styled.div`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(254, 165, 0, 0.1);
  }

  @media (max-width: 768px) {
    border-radius: 8px;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const ToolbarGroup = styled.div`
  display: flex;
  gap: 2px;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid #e2e8f0;

  &:last-child {
    border-right: none;
    margin-right: 0;
    padding-right: 0;
  }
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: ${props => props['data-active'] === 'true' ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props['data-active'] === 'true' ? 'white' : 'var(--text-light)'};
  cursor: ${props => props.disabled === 'true' ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled === 'true' ? 0.5 : 1};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not([disabled]) {
    background: ${props => props['data-active'] === 'true' ? 'var(--primary-color)' : '#edf2f7'};
    transform: translateY(-1px);
  }

  &:active:not([disabled]) {
    transform: translateY(0);
  }
`;

const StyledEditorContent = styled(EditorContent)`
  .ProseMirror {
    min-height: 300px;
    max-height: 600px;
    overflow-y: auto;
    padding: 16px;
    outline: none;
    
    &.error {
      background-color: rgba(220, 38, 38, 0.05);
    }

    > * + * {
      margin-top: 0.75em;
    }
  
    ul, ol {
      padding: 0 1rem;
    }
  
    h1, h2, h3, h4, h5, h6 {
      line-height: 1.1;
    }
  
    code {
      background-color: rgba(97, 97, 97, 0.1);
      color: #616161;
    }
  
    pre {
      background: #0d0d0d;
      color: #fff;
      font-family: 'JetBrainsMono', monospace;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
  
      code {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.8rem;
      }
    }
  
    img {
      max-width: 100%;
      height: auto;
      
      &.ProseMirror-selectednode {
        outline: 3px solid #68CEF8;
      }
    }
  
    blockquote {
      padding-left: 1rem;
      border-left: 2px solid rgba(13, 13, 13, 0.1);
    }
  
    hr {
      border: none;
      border-top: 2px solid rgba(13, 13, 13, 0.1);
      margin: 2rem 0;
    }

    a {
      color: var(--info-color);
      cursor: pointer;
      text-decoration: underline;

      &:hover {
        text-decoration: none;
      }
    }

    /* Minimal placeholder styling */
    p.is-editor-empty:first-child::before {
      color: #adb5bd;
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0 1rem 1rem;
`;

export default TextEditor;