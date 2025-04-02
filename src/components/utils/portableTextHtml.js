import { urlFor } from '../../sanityClient';

export const portableTextToHtml = (portableText) => {
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
    spanText = spanText.replace(/\n/g, '<br>');

    if (span.marks?.length > 0) {
      const sortedMarks = [...span.marks].sort();
      
      sortedMarks.forEach((mark) => {
        if (mark === 'strong') spanText = `<strong>${spanText}</strong>`;
        else if (mark === 'em') spanText = `<em>${spanText}</em>`;
        else if (mark === 'underline') spanText = `<u>${spanText}</u>`;
        else if (mark === 'code') spanText = `<code>${spanText}</code>`;
        else if (typeof mark === 'string') {
          const markDef = markDefs.find(def => def._key === mark);
          if (markDef) {
            if (markDef._type === 'link') {
              const target = markDef.blank ? ' target="_blank" rel="noopener noreferrer"' : '';
              spanText = `<a href="${markDef.href}"${target}>${spanText}</a>`;
            }
          }
        }
      });
    }

    return spanText;
  };

  const processImage = (block) => {
    try {
      let imageUrl, imageWidth, imageHeight;
      const asset = block.asset;

      // Handle both reference and direct asset objects
      if (asset?._ref) {
        const imgBuilder = urlFor(block);
        if (block.width) imgBuilder.width(block.width);
        if (block.height) imgBuilder.height(block.height);
        imageUrl = imgBuilder.url();
        
        // Extract dimensions from reference if available
        const refParts = asset._ref.split('-');
        if (refParts.length >= 3) {
          const dimensions = refParts[refParts.length - 2];
          const [width, height] = dimensions.split('x').map(Number);
          if (!isNaN(width)) imageWidth = width;
          if (!isNaN(height)) imageHeight = height;
        }
      } else if (asset?.url) {
        imageUrl = asset.url;
        imageWidth = asset.metadata?.dimensions?.width;
        imageHeight = asset.metadata?.dimensions?.height;
      }

      if (!imageUrl) {
        console.warn('No valid image URL found for block:', block);
        return '';
      }

      const altText = block.alt || '';
      const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : '';
      
      // Handle alignment
      const alignment = block.align || block.alignment || 'center';
      const alignmentClass = `image-align-${alignment}`;
      
      // Handle custom classes
      const customClasses = block.customClass ? ` ${block.customClass}` : '';
      
      // Handle hotspot/crop if available
      const hotspot = block.hotspot;
      const crop = block.crop;
      let objectPosition = '';
      
      if (hotspot) {
        const x = Math.round(hotspot.x * 100);
        const y = Math.round(hotspot.y * 100);
        objectPosition = `object-position: ${x}% ${y}%;`;
      }

      // Build image attributes
      const imgAttributes = [
        `src="${imageUrl}"`,
        `alt="${altText}"`,
        imageWidth ? `width="${imageWidth}"` : '',
        imageHeight ? `height="${imageHeight}"` : '',
        `class="portable-text-image${customClasses}"`,
        `style="${objectPosition}"`,
        'loading="lazy"'
      ].filter(Boolean).join(' ');

      return `
        <figure class="portable-text-figure ${alignmentClass}">
          <img ${imgAttributes} />
          ${caption}
        </figure>
      `;
    } catch (error) {
      console.error('Error processing image:', error);
      return '';
    }
  };

  portableText.forEach((block) => {
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
        const alignment = block.textAlign ? ` style="text-align: ${block.textAlign}"` : '';
        
        switch (block.style) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            html += `<${block.style}${alignment}>${blockHtml}</${block.style}>`;
            break;
          case 'blockquote':
            html += `<blockquote${alignment}>${blockHtml}</blockquote>`;
            break;
          case 'normal':
          default:
            html += `<p${alignment}>${blockHtml}</p>`;
        }
      }
      // Handle images
      else if (block._type === 'image') {
        closeCurrentList();
        html += processImage(block);
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