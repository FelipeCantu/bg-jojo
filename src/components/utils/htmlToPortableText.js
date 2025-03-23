import { client } from '../../sanityClient'

export const convertHtmlToPortableText = async (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const portableText = [];
  const markDefs = []; // Define markDefs in the outer scope

  // Helper function to upload an image to Sanity
  const uploadImage = async (src) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      const result = await client.assets.upload('image', file);
      return result._id; // Return the image reference
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image.');
    }
  };

  // Helper function to process child nodes
  const processChildNodes = async (node) => {
    const children = [];
    const localMarkDefs = []; // Local markDefs for this node

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim();
        if (text) {
          children.push({
            _type: 'span',
            text,
          });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Handle text formatting (bold, italic, underline)
        let markKey;
        if (child.tagName === 'STRONG' || child.tagName === 'B') markKey = 'strong';
        if (child.tagName === 'EM' || child.tagName === 'I') markKey = 'em';
        if (child.tagName === 'U') markKey = 'underline';

        // Handle links
        if (child.tagName === 'A' && child.hasAttribute('href')) {
          const href = child.getAttribute('href');
          const linkId = `link-${Math.random().toString(36).substr(2, 9)}`;

          localMarkDefs.push({
            _key: linkId,
            _type: 'link',
            href,
          });

          const { children: innerChildren } = await processChildNodes(child);
          children.push(
            ...innerChildren.map((span) => ({
              ...span,
              marks: [...(span.marks || []), linkId],
            }))
          );
        } else if (markKey) {
          // Handle text marks (bold, italic, underline)
          const markId = `${markKey}-${Math.random().toString(36).substr(2, 9)}`;
          localMarkDefs.push({ _key: markId, _type: markKey });

          const { children: innerChildren } = await processChildNodes(child);
          children.push(
            ...innerChildren.map((span) => ({
              ...span,
              marks: [...(span.marks || []), markId],
            }))
          );
        } else if (child.tagName === 'IMG') {
          // Handle images
          const src = child.getAttribute('src') || '';
          const alt = child.getAttribute('alt') || '';

          // Upload the image to Sanity and get the reference
          const imageRef = await uploadImage(src);

          portableText.push({
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: imageRef, // Use the Sanity image reference
            },
            alt,
          });
        } else {
          // Handle other elements (e.g., spans, divs)
          const { children: innerChildren } = await processChildNodes(child);
          children.push(...innerChildren);
        }
      }
    }

    // Add local markDefs to the global markDefs array
    markDefs.push(...localMarkDefs);
    return { children };
  };

  // Process the document body
  for (const node of doc.body.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Handle paragraphs, headings, and blockquotes
      if (node.nodeName === 'P' || node.nodeName.match(/^H[1-6]$/) || node.nodeName === 'BLOCKQUOTE') {
        const style = node.nodeName.toLowerCase() === 'blockquote' ? 'blockquote' : node.nodeName.toLowerCase();
        const { children } = await processChildNodes(node);

        portableText.push({
          _type: 'block',
          style,
          children,
          markDefs: markDefs.filter((def) => children.some((child) => child.marks?.includes(def._key))),
        });
      }

      // Handle lists (unordered and ordered)
      if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const listType = node.nodeName === 'UL' ? 'bullet' : 'number';
        const listItems = [];

        for (const child of node.childNodes) {
          if (child.nodeName === 'LI') {
            const { children } = await processChildNodes(child);
            listItems.push({
              _type: 'block',
              style: 'normal',
              listItem: listType,
              children,
              markDefs: markDefs.filter((def) => children.some((child) => child.marks?.includes(def._key))),
            });
          }
        }

        portableText.push(...listItems);
      }

      // Handle top-level images
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';

        // Upload the image to Sanity and get the reference
        const imageRef = await uploadImage(src);

        portableText.push({
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageRef, // Use the Sanity image reference
          },
          alt,
        });
      }
    }
  }

  return portableText;
};