import React, {  useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { client } from '../sanityClient';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';
import { portableTextToHtml } from './utils/portableTextHtml';
import { FaBold, FaItalic, FaListUl, FaListOl, FaQuoteLeft, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink } from 'react-icons/fa';
import Placeholder from '@tiptap/extension-placeholder';
import { debounce } from 'lodash'; // For debouncing the onUpdate callback

const TextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({
        placeholder: 'Start typing your article...',
      }),
    ],
    content: portableTextToHtml(value),
    onUpdate: debounce(({ editor }) => {
      const html = editor.getHTML();
      const portableText = convertHtmlToPortableText(html);
      onChange(portableText);
    }, 300),
  });

  // Memoize handleImageUpload
  const handleImageUpload = useCallback(async (file) => {
    try {
      const result = await client.assets.upload('image', file);
      const imageUrl = result.url;
      if (editor) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      }
    } catch (error) {
      console.error('Error uploading image to Sanity:', error);
    }
  }, [editor]);

  // Memoize addImage and include handleImageUpload in the dependency array
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


  const insertLink = useCallback(() => {
    const url = prompt('Enter the URL');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  return (
    <div style={{
      maxWidth: '100%',
      padding: '20px',
      backgroundColor: '#f4f6f9',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Add the CSS for the placeholder */}
      <style>
        {`
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
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '20px',
      }}>
        {/* Text Formatting Buttons with Icons */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} 
          style={{
            fontWeight: editor?.isActive('bold') ? 'bold' : 'normal',
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('bold') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('bold') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaBold />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} 
          style={{
            fontStyle: editor?.isActive('italic') ? 'italic' : 'normal',
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('italic') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('italic') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaItalic />
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('bulletList') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('bulletList') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaListUl />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('orderedList') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('orderedList') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaListOl />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('blockquote') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('blockquote') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaQuoteLeft />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('textAlign', 'left') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('textAlign', 'left') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaAlignLeft />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('textAlign', 'center') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('textAlign', 'center') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaAlignCenter />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: editor?.isActive('textAlign', 'right') ? '#007BFF' : '#f9f9f9',
            color: editor?.isActive('textAlign', 'right') ? '#fff' : '#333',
            transition: 'background-color 0.3s',
          }}>
          <FaAlignRight />
        </button>
        <button onClick={addImage} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: '#28a745',
            color: '#fff',
            transition: 'background-color 0.3s',
          }}>
          <img src="https://img.icons8.com/ios/50/000000/image.png" alt="Insert" />
        </button>
        <button onClick={insertLink} 
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: '#6f42c1',
            color: '#fff',
            transition: 'background-color 0.3s',
          }}>
          <FaLink />
        </button>
      </div>

      {/* Editor Content */}
      <div style={{
        height: '500px',
        width: '100%',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#fff',
        overflowY: 'auto',
        fontSize: '16px',
        lineHeight: '1.6',
      }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TextEditor;