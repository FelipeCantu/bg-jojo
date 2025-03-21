export const portableTextToHtml = (portableText) => {
  let html = '';
  let currentListType = null;
  let listOpen = false;

  portableText.forEach((block, index) => {
    if (block._type === 'block' && block.children?.length > 0) {
      let blockHtml = '';

      // Process block children (spans, links, etc.)
      block.children.forEach((child) => {
        if (child._type === 'span') {
          let spanText = child.text;

          // Apply marks (bold, italic, links, etc.)
          if (child.marks?.length > 0) {
            child.marks.forEach((mark) => {
              if (mark === 'strong') {
                spanText = `<strong>${spanText}</strong>`;
              } else if (mark === 'em') {
                spanText = `<em>${spanText}</em>`;
              } else if (mark && typeof mark === 'string') {
                // Handle links
                const linkMark = block.markDefs?.find((def) => def._key === mark);
                if (linkMark && linkMark._type === 'link') {
                  spanText = `<a href="${linkMark.href}" target="_blank" rel="noopener noreferrer" class="external-link">${spanText}</a>`;
                }
              }
            });
          }

          blockHtml += spanText;
        }
      });

      // Handle lists
      if (block.listItem) {
        // Close previous list if type changes
        if (currentListType && currentListType !== block.listItem) {
          html += currentListType === 'bullet' ? '</ul>' : '</ol>';
          listOpen = false;
        }

        // Open a new list if not already open
        if (!listOpen) {
          html += block.listItem === 'bullet' ? '<ul>' : '<ol>';
          listOpen = true;
          currentListType = block.listItem;
        }

        // Add list item
        html += `<li>${blockHtml}</li>`;
      } else {
        // Close any open lists before switching to paragraphs or headings
        if (listOpen) {
          html += currentListType === 'bullet' ? '</ul>' : '</ol>';
          listOpen = false;
          currentListType = null;
        }

        // Handle block styles (headings, paragraphs, blockquotes)
        switch (block.style) {
          case 'blockquote':
            html += `<blockquote>${blockHtml}</blockquote>`;
            break;
          case 'normal':
            html += `<p>${blockHtml}</p>`;
            break;
          default:
            // Handle headings (h1, h2, h3, etc.)
            if (block.style?.startsWith('h')) {
              html += `<${block.style}>${blockHtml}</${block.style}>`;
            } else {
              html += `<p>${blockHtml}</p>`;
            }
        }
      }
    }

    // Handle images
    if (block._type === 'image' && block.asset) {
      const imageUrl = block.asset.url || block.asset._ref;
      const altText = block.alt || '';
      html += `<img src="${imageUrl}" alt="${altText}" />`;
    }

    // Handle embedded videos
    if (block._type === 'video' && block.url) {
      html += `<iframe width="560" height="315" src="${block.url}" frameborder="0" allowfullscreen></iframe>`;
    }

    // Close any open lists at the end of the loop
    if (listOpen && index === portableText.length - 1) {
      html += currentListType === 'bullet' ? '</ul>' : '</ol>';
      listOpen = false;
      currentListType = null;
    }
  });

  return html;
};