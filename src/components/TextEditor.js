import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { convertHtmlToPortableText } from './utils/htmlToPortableText';

const TextEditor = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState(value || '');

  const handleChange = (newValue) => {
    setEditorValue(newValue);
    const portableText = convertHtmlToPortableText(newValue);
    onChange(portableText); // Send Portable Text format to parent
  };

  return (
    <ReactQuill
      theme="snow"
      value={editorValue}
      onChange={handleChange}
      modules={{
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['link', 'image'],
          ['clean'],
        ],
      }}
      formats={[
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'blockquote', 
        'bullet',
        'link',
        'image',
      ]}
    />
  );
};

export default TextEditor;
