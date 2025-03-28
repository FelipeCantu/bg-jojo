import { urlFor } from '../../sanityClient';

export const portableTextToHtml = (portableText) => {
  // Handle null/undefined input
  if (!portableText || !Array.isArray(portableText)) {
    console.warn('Invalid portableText input:', portableText);
    return '';
  }

  let html = '';
  let currentListType = null;
  let listOpen = false;

  const closeCurrentList = () => {
    if (listOpen) {
      html += currentListType === 'bullet' ? '</ul>' : '</ol>';
      listOpen = false;
      currentListType = null;
    }
  };

  const openList = (listType) => {
    if (!listOpen || currentListType !== listType) {
      closeCurrentList();
      html += listType === 'bullet' ? '<ul>' : '<ol>';
      listOpen = true;
      currentListType = listType;
    }
  };

  const processSpan = (span, markDefs = []) => {
    let spanText = span.text || '';

    // Handle line breaks
    spanText = spanText.replace(/\n/g, '<br>');

    // Apply marks (bold, italic, links, etc.)
    if (span.marks?.length > 0) {
      // Sort marks to apply them in consistent order
      const sortedMarks = [...span.marks].sort();
      
      sortedMarks.forEach((mark) => {
        if (mark === 'strong') {
          spanText = `<strong>${spanText}</strong>`;
        } else if (mark === 'em') {
          spanText = `<em>${spanText}</em>`;
        } else if (mark === 'underline') {
          spanText = `<u>${spanText}</u>`;
        } else if (mark === 'code') {
          spanText = `<code>${spanText}</code>`;
        } else if (typeof mark === 'string') {
          // Handle custom marks (links, etc.)
          const markDef = markDefs.find(def => def._key === mark);
          if (markDef) {
            if (markDef._type === 'link') {
              const target = markDef.blank ? ' target="_blank" rel="noopener noreferrer"' : '';
              spanText = `<a href="${markDef.href}"${target}>${spanText}</a>`;
            }
            // Add other mark types here
          }
        }
      });
    }

    return spanText;
  };

  portableText.forEach((block, index) => {
    try {
      // Handle block content
      if (block._type === 'block' && block.children?.length > 0) {
        let blockHtml = block.children
          .filter(child => child._type === 'span')
          .map(span => processSpan(span, block.markDefs))
          .join('');

        // Handle lists
        if (block.listItem) {
          openList(block.listItem);
          html += `<li>${blockHtml}</li>`;
          return;
        }

        // Close any open lists before regular blocks
        closeCurrentList();

        // Handle block styles
        switch (block.style) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            html += `<${block.style}>${blockHtml}</${block.style}>`;
            break;
          case 'blockquote':
            html += `<blockquote>${blockHtml}</blockquote>`;
            break;
          case 'normal':
          default:
            html += `<p>${blockHtml}</p>`;
        }
      }

      // Handle images
      else if (block._type === 'image' && block.asset?._ref) {
        closeCurrentList();
        try {
          const imageUrl = urlFor(block).width(800).url();
          const altText = block.alt || '';
          const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : '';
          html += `<figure><img src="${imageUrl}" alt="${altText}" />${caption}</figure>`;
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }

      // Handle custom types
      else if (block._type === 'videoEmbed') {
        closeCurrentList();
        html += `<div class="video-embed">${block.url}</div>`;
      }

      // Handle code blocks
      else if (block._type === 'code') {
        closeCurrentList();
        const language = block.language || 'text';
        html += `<pre><code class="language-${language}">${block.code}</code></pre>`;
      }

    } catch (error) {
      console.error('Error processing block:', block, error);
    }
  });

  // Close any remaining open lists
  closeCurrentList();

  return html;
};