export const portableTextToHtml = (portableText) => {
  let html = '';

  portableText.forEach((block) => {
    if (block._type === 'block') {
      let blockHtml = '';

      block.children.forEach((child) => {
        if (child._type === 'span') {
          let spanText = child.text;
          if (child.marks) {
            child.marks.forEach((mark) => {
              if (mark === 'strong') {
                spanText = `<strong>${spanText}</strong>`;
              } else if (mark === 'em') {
                spanText = `<em>${spanText}</em>`;
              } else if (mark && typeof mark === 'string') {
                // Handle link marks
                const linkMark = block.markDefs?.find((def) => def._key === mark);
                if (linkMark && linkMark._type === 'link') {
                  spanText = `<a href="${linkMark.href}" target="_blank" rel="noopener noreferrer">${spanText}</a>`;
                }
              }
            });
          }
          blockHtml += spanText;
        }
      });

      if (block.style === 'blockquote') {
        html += `<blockquote>${blockHtml}</blockquote>`;
      } else if (block.style === 'normal') {
        html += `<p>${blockHtml}</p>`;
      } else {
        html += `<${block.style}>${blockHtml}</${block.style}>`;
      }
    }

    // Handle images
    if (block._type === 'image' && block.asset) {
      const imageUrl = block.asset.url || block.asset._ref;
      html += `<img src="${imageUrl}" alt="" />`;
    }
  });

  return html;
};