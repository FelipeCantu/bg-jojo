import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { client } from '../sanityClient';
import { urlFor } from '../sanityClient';
import { FaBold, FaItalic, FaListUl, FaListOl, FaQuoteLeft, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaUndo, FaRedo, FaImage } from 'react-icons/fa';

const TextEditor = ({ value, onChange, editable = true }) => {
  // Simplified conversion from Portable Text to TipTap JSON
  const portableTextToTiptap = (content) => {
    if (!content || !Array.isArray(content)) {
      return {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: []
        }]
      };
    }

    return {
      type: 'doc',
      content: content.map((block) => {
        // Handle images
        if (block._type === 'image') {
          return {
            type: 'image',
            attrs: {
              src: urlFor(block).url(),
              alt: block.alt || ''
            }
          };
        }

        // Handle text blocks
        return {
          type: 'paragraph',
          content: block.children.map(child => ({
            type: 'text',
            text: child.text,
            marks: child.marks?.map(mark => {
              if (mark === 'strong') return { type: 'bold' };
              if (mark === 'em') return { type: 'italic' };
              if (mark === 'code') return { type: 'code' };
              if (mark._type === 'link') {
                return {
                  type: 'link',
                  attrs: {
                    href: mark.href,
                    target: '_blank'
                  }
                };
              }
              return null;
            }).filter(Boolean)
          }))
        };
      })
    };
  };

  // Convert TipTap JSON back to Portable Text
  const tiptapToPortableText = (doc) => {
    if (!doc.content) return [];

    return doc.content.map(node => {
      // Handle images
      if (node.type === 'image') {
        return {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: node.attrs.src.split('-')[1] // Extract Sanity asset ID
          },
          alt: node.attrs.alt || ''
        };
      }

      // Handle text content
      return {
        _type: 'block',
        style: 'normal',
        children: node.content?.map(textNode => ({
          _type: 'span',
          text: textNode.text,
          marks: textNode.marks?.map(mark => {
            if (mark.type === 'bold') return 'strong';
            if (mark.type === 'italic') return 'em';
            if (mark.type === 'code') return 'code';
            if (mark.type === 'link') {
              return {
                _type: 'link',
                href: mark.attrs.href
              };
            }
            return null;
          }).filter(Boolean) || []
        })) || []
      };
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'editor-image',
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
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({
        placeholder: 'Start typing your article...',
      }),
    ],
    content: portableTextToTiptap(value),
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const portableText = tiptapToPortableText(json);
      onChange(portableText);
    },
  });

  // Update editor content when value changes
  useEffect(() => {
    if (editor && value) {
      const tiptapContent = portableTextToTiptap(value);
      editor.commands.setContent(tiptapContent);
    }
  }, [value, editor]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    try {
      const result = await client.assets.upload('image', file);
      const imageUrl = urlFor(result).url();

      if (editor) {
        editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: ''
        }).run();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.[0]) {
        await handleImageUpload(input.files[0]);
      }
    };
    input.click();
  }, [handleImageUpload]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="editor-container">
      <style>
        {`
          .editor-container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
          .editor-toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
          }
          .editor-content {
            min-height: 300px;
            padding: 16px;
            border: 1px solid #eee;
            border-radius: 4px;
          }
          .toolbar-button {
            padding: 8px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
          }
          .toolbar-button.active {
            background: #007BFF;
            color: white;
          }
          .tiptap img {
            max-width: 100%;
            height: auto;
          }
          .tiptap a {
            color: #007BFF;
            text-decoration: underline;
          }
        `}
      </style>

      <div className="editor-toolbar">
        <button
          className={`toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FaBold />
        </button>
        <button
          className={`toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FaItalic />
        </button>
        <button
          className={`toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FaListUl />
        </button>
        <button
          className={`toolbar-button ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FaListOl />
        </button>
        <button
          className={`toolbar-button ${editor.isActive('blockquote') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FaQuoteLeft />
        </button>
        <button
          className={`toolbar-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <FaAlignLeft />
        </button>
        <button
          className={`toolbar-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <FaAlignCenter />
        </button>
        <button
          className={`toolbar-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <FaAlignRight />
        </button>
        <button
          className="toolbar-button"
          onClick={addImage}
        >
          <FaImage />
        </button>
        <button
          className={`toolbar-button ${editor.isActive('link') ? 'active' : ''}`}
          onClick={insertLink}
        >
          <FaLink />
        </button>
        <button
          className="toolbar-button"
          onClick={removeLink}
        >
          Remove Link
        </button>
        <button
          className="toolbar-button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <FaUndo />
        </button>
        <button
          className="toolbar-button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <FaRedo />
        </button>
      </div>

      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TextEditor;