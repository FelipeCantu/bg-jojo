import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { client } from '../sanityClient';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';
import { portableTextToHtml } from './utils/portableTextHtml';
import { FaBold, FaItalic, FaListUl, FaListOl, FaQuoteLeft, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaUndo, FaRedo } from 'react-icons/fa';
import debounce from 'lodash/debounce';

const TextEditor = ({ value, onChange }) => {
  const debouncedOnChangeRef = useRef();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'external-link',
        },
        validate: (href) => /^https?:\/\//.test(href), // Validate URLs
      }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({
        placeholder: 'Start typing your article...',
      }),
    ],
    content: portableTextToHtml(value),
    onUpdate: ({ editor }) => {
      if (!debouncedOnChangeRef.current) {
        debouncedOnChangeRef.current = debounce((html) => {
          const portableText = convertHtmlToPortableText(html);
          onChange(portableText);
        }, 300);
      }
      const html = editor.getHTML();
      debouncedOnChangeRef.current(html);
    },
  });

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debouncedOnChangeRef.current) {
        debouncedOnChangeRef.current.cancel(); // Cancel the debounced function
      }
    };
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    try {
      const result = await client.assets.upload('image', file);
      const imageUrl = result.url;
      if (editor) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      }
    } catch (error) {
      console.error('Error uploading image to Sanity:', error);
      alert('Failed to upload image. Please try again.');
    }
  }, [editor]);

  // Add image button handler
  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        await handleImageUpload(file);
      }
    };
  }, [handleImageUpload]);

  // Insert link button handler
  const insertLink = useCallback(() => {
    const url = prompt('Enter the URL');
    if (url && /^(https?:\/\/)/.test(url)) {
      editor.chain().focus().setLink({ href: url }).run();
    } else if (url) {
      alert('Please enter a valid URL starting with http:// or https://');
    }
  }, [editor]);

  // Remove link button handler
  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  return (
    <div
      style={{
        maxWidth: '100%',
        padding: '20px',
        backgroundColor: '#f4f6f9',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Add CSS for links and placeholder */}
      <style>
        {`
          .tiptap a.external-link {
            color: #007BFF;
            text-decoration: underline;
          }
          .tiptap a.external-link:hover {
            text-decoration: none;
          }
          .tiptap p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
            font-style: italic;
          }
        `}
      </style>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {/* Formatting Buttons */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          icon={<FaBold />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          icon={<FaItalic />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          icon={<FaListUl />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          icon={<FaListOl />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote')}
          icon={<FaQuoteLeft />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor?.isActive('textAlign', 'left')}
          icon={<FaAlignLeft />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor?.isActive('textAlign', 'center')}
          icon={<FaAlignCenter />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor?.isActive('textAlign', 'right')}
          icon={<FaAlignRight />}
        />
        <ToolbarButton
          onClick={addImage}
          icon={<img src="https://img.icons8.com/ios/50/000000/image.png" alt="Insert" />}
          style={{ background: '#28a745', color: '#fff' }}
        />
        <ToolbarButton
          onClick={insertLink}
          icon={<FaLink />}
          style={{ background: '#6f42c1', color: '#fff' }}
        />
        <ToolbarButton
          onClick={removeLink}
          icon={<FaLink />}
          style={{ background: '#dc3545', color: '#fff' }}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={<FaUndo />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={<FaRedo />}
        />
      </div>

      {/* Editor Content */}
      <div
        style={{
          height: '500px',
          width: '100%',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#fff',
          overflowY: 'auto',
          fontSize: '16px',
          lineHeight: '1.6',
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// Toolbar Button Component
const ToolbarButton = ({ onClick, active, icon, style }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      cursor: 'pointer',
      background: active ? '#007BFF' : '#f9f9f9',
      color: active ? '#fff' : '#333',
      transition: 'background-color 0.3s',
      ...style,
    }}
  >
    {icon}
  </button>
);

export default TextEditor;