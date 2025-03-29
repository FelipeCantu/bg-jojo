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
import { toast } from 'react-toastify';

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
      Image.configure({
        inline: true,
        HTMLAttributes: { class: 'editor-image' },
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
      // Immediately notify parent of HTML changes
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

      toast.info('Uploading image...');
      const result = await client.assets.upload('image', file);
      toast.success('Image uploaded successfully');
      return result.url;
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

      const imageUrl = await handleImageUpload(file);
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
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
    // Early return if editor isn't ready or already saving
    if (!editor || isSaving) return;
    
    // Get current HTML content
    const html = editor.getHTML();
    
    // Skip saving if content hasn't changed
    if (html === lastContentRef.current && !hasUnsavedChanges) {
      toast.info('No changes to save');
      return;
    }
  
    try {
      setIsSaving(true);
      toast.info('Saving changes...', { autoClose: false, toastId: 'saving-toast' });
  
      // Convert to PortableText
      const portableText = await convertHtmlToPortableText(html);
      
      // Validate the converted content
      if (!portableText || portableText.length === 0) {
        throw new Error('Content conversion failed');
      }
  
      // Update parent component and local state
      await onChange(portableText);
      lastContentRef.current = html;
      setHasUnsavedChanges(false);
      
      // Update success notification
      toast.update('saving-toast', {
        render: 'Changes saved successfully',
        type: toast.TYPE.SUCCESS,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Save error:', error);
      
      // Update error notification
      toast.update('saving-toast', {
        render: error.message || 'Failed to save changes',
        type: toast.TYPE.ERROR,
        autoClose: 5000
      });
      
      // Preserve unsaved changes state if save failed
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, onChange, hasUnsavedChanges]);

  return (
    <EditorContainer>
      <EditorStyles>
        {`
          .tiptap-editor {
            min-height: 300px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            outline: none;
          }
          
          .tiptap-editor:focus {
            border-color: #3182ce;
            box-shadow: 0 0 0 1px #3182ce;
          }
          
          .tiptap-editor.error {
            border-color: #e53e3e;
          }
          
          .tiptap-editor p {
            margin: 1em 0;
            line-height: 1.5;
          }
          
          .tiptap-editor h1 {
            font-size: 2em;
            margin: 0.67em 0;
            font-weight: bold;
          }
          
          .tiptap-editor h2 {
            font-size: 1.5em;
            margin: 0.75em 0;
            font-weight: bold;
          }
          
          .tiptap-editor h3 {
            font-size: 1.17em;
            margin: 0.83em 0;
            font-weight: bold;
          }
          
          .tiptap-editor ul,
          .tiptap-editor ol {
            padding: 0 1rem;
            margin: 1em 0;
          }
          
          .tiptap-editor blockquote {
            padding-left: 1rem;
            border-left: 3px solid #ddd;
            margin: 1em 0;
          }
          
          .tiptap-editor a {
            color: #3182ce;
            text-decoration: underline;
          }
          
          .tiptap-editor img {
            max-width: 100%;
            height: auto;
            margin: 1em 0;
            border-radius: 4px;
          }
          
          .tiptap-editor .text-align-left {
            text-align: left;
          }
          
          .tiptap-editor .text-align-center {
            text-align: center;
          }
          
          .tiptap-editor .text-align-right {
            text-align: right;
          }
          
          .tiptap-editor p.is-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
            font-style: italic;
          }
        `}
      </EditorStyles>

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

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive('bold') ? 'true' : 'false'}
            title="Bold"
          >
            <FaBold />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive('italic') ? 'true' : 'false'}
            title="Italic"
          >
            <FaItalic />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            data-active={editor.isActive('underline') ? 'true' : 'false'}
            title="Underline"
          >
            <FaUnderline />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => setHeading(1)}
            data-active={editor.isActive('heading', { level: 1 }) ? 'true' : 'false'}
            title="Heading 1"
          >
            <FaHeading size={14} />1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setHeading(2)}
            data-active={editor.isActive('heading', { level: 2 }) ? 'true' : 'false'}
            title="Heading 2"
          >
            <FaHeading size={14} />2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setHeading(3)}
            data-active={editor.isActive('heading', { level: 3 }) ? 'true' : 'false'}
            title="Heading 3"
          >
            <FaHeading size={14} />3
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive('bulletList') ? 'true' : 'false'}
            title="Bullet List"
          >
            <FaListUl />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive('orderedList') ? 'true' : 'false'}
            title="Numbered List"
          >
            <FaListOl />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            data-active={editor.isActive('blockquote') ? 'true' : 'false'}
            title="Blockquote"
          >
            <FaQuoteLeft />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            data-active={editor.isActive({ textAlign: 'left' }) ? 'true' : 'false'}
            title="Align Left"
          >
            <FaAlignLeft />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            data-active={editor.isActive({ textAlign: 'center' }) ? 'true' : 'false'}
            title="Align Center"
          >
            <FaAlignCenter />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            data-active={editor.isActive({ textAlign: 'right' }) ? 'true' : 'false'}
            title="Align Right"
          >
            <FaAlignRight />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={insertLink}
            data-active={editor.isActive('link') ? 'true' : 'false'}
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
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() ? 'true' : undefined}
            title="Undo"
          >
            <FaUndo />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() ? 'true' : undefined}
            title="Redo"
          >
            <FaRedo />
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>

      <EditorContentWrapper>
        <EditorContent editor={editor} />
      </EditorContentWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </EditorContainer>
  );
});

const EditorContainer = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const EditorStyles = styled.style``;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const ToolbarGroup = styled.div`
  display: flex;
  gap: 2px;
  margin-right: 8px;
  padding-right: 8px;
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
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: ${props => props['data-active'] === 'true' ? '#3182ce' : 'transparent'};
  color: ${props => props['data-active'] === 'true' ? 'white' : '#4a5568'};
  cursor: ${props => props.disabled === 'true' ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled === 'true' ? 0.5 : 1};
  transition: all 0.2s;
  type: "button"; // Add this line

  &:hover:not([disabled]) {
    background: ${props => props['data-active'] === 'true' ? '#2c5282' : '#edf2f7'};
  }
`;

const EditorContentWrapper = styled.div`
  padding: 0;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0 1rem 1rem;
`;

export default TextEditor;