import { client } from '../../sanityClient';

const generateKey = () => Math.random().toString(36).substr(2, 9);

export const convertHtmlToPortableText = async (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const portableText = [];
  const markDefs = [];

  const uploadImage = async (src) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      const result = await client.assets.upload('image', file);
      return result._id;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image.');
    }
  };

  const processChildNodes = async (node) => {
    const children = [];
    const localMarkDefs = [];

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.replace(/\s+/g, ' '); // Preserve spaces
        if (text) {
          children.push({ _type: 'span', _key: generateKey(), text, marks: [] });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'BR') {
          children.push({ _type: 'span', _key: generateKey(), text: '\n', marks: [] });
          continue;
        }

        let markKey;

        if (child.tagName === 'STRONG' || child.tagName === 'B') markKey = 'strong';
        if (child.tagName === 'EM' || child.tagName === 'I') markKey = 'em';
        if (child.tagName === 'U') markKey = 'underline';

        if (child.tagName === 'A' && child.hasAttribute('href')) {
          const href = child.getAttribute('href');
          const linkId = `link-${Math.random().toString(36).substr(2, 9)}`;

          localMarkDefs.push({ _key: linkId, _type: 'link', href });

          const { children: innerChildren } = await processChildNodes(child);
          children.push(
            ...innerChildren.map((span) => ({
              ...span,
              marks: [...(span.marks || []), linkId],
            }))
          );
        } else if (markKey) {
          // Decorators (strong, em, underline) are simple strings in marks array
          const { children: innerChildren } = await processChildNodes(child);
          children.push(
            ...innerChildren.map((span) => ({
              ...span,
              marks: [...(span.marks || []), markKey],
            }))
          );
        } else {
          const { children: innerChildren } = await processChildNodes(child);
          children.push(...innerChildren);
        }
      }
    }

    markDefs.push(...localMarkDefs);
    return { children };
  };

  for (const node of doc.body.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === 'P' || node.nodeName.match(/^H[1-6]$/) || node.nodeName === 'BLOCKQUOTE') {
        const style = node.nodeName.toLowerCase() === 'blockquote' ? 'blockquote' : node.nodeName.toLowerCase();
        const { children } = await processChildNodes(node);
        
        // Get alignment from style attribute or class
        let alignment = null;
        if (node.hasAttribute('style')) {
          const styleText = node.getAttribute('style');
          const match = styleText.match(/text-align:\s*(left|center|right|justify)/);
          if (match) {
            alignment = match[1];
          }
        }
        
        // Check for alignment classes if not found in style
        if (!alignment && node.hasAttribute('class')) {
          const classes = node.getAttribute('class').split(' ');
          if (classes.includes('text-left')) alignment = 'left';
          else if (classes.includes('text-center')) alignment = 'center';
          else if (classes.includes('text-right')) alignment = 'right';
          else if (classes.includes('text-justify')) alignment = 'justify';
        }

        const block = {
          _type: 'block',
          _key: generateKey(),
          style,
          children,
          markDefs: markDefs.filter((def) => children.some((child) => child.marks?.includes(def._key))),
        };

        // Add alignment if specified
        if (alignment) {
          block.textAlign = alignment;
        }

        portableText.push(block);
      }

      if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const listType = node.nodeName === 'UL' ? 'bullet' : 'number';
        const listItems = [];

        for (const child of node.childNodes) {
          if (child.nodeName === 'LI') {
            const { children } = await processChildNodes(child);
            listItems.push({
              _type: 'block',
              _key: generateKey(),
              style: 'normal',
              listItem: listType,
              children,
              markDefs: markDefs.filter((def) => children.some((child) => child.marks?.includes(def._key))),
            });
          }
        }

        portableText.push(...listItems);
      }

      if (node.tagName === 'IMG' || node.tagName === 'FIGURE') {
        let imgElement = node;
        if (node.tagName === 'FIGURE') {
          imgElement = node.querySelector('img');
          if (!imgElement) continue;
        }

        const src = imgElement.getAttribute('src') || '';
        const alt = imgElement.getAttribute('alt') || '';
        const imageRef = await uploadImage(src);

        const imageBlock = {
          _type: 'image',
          _key: generateKey(),
          asset: { _type: 'reference', _ref: imageRef },
          alt,
        };

        // Handle image alignment — check the figure wrapper first, then the img
        const alignSource = node.tagName === 'FIGURE' ? node : imgElement;
        let alignment = null;
        if (alignSource.hasAttribute('style')) {
          const styleText = alignSource.getAttribute('style');
          const match = styleText.match(/float:\s*(left|right)/);
          if (match) {
            alignment = match[1];
          }
        }

        // Check for alignment classes if not found in style
        if (!alignment && alignSource.hasAttribute('class')) {
          const classes = alignSource.getAttribute('class').split(' ');
          if (classes.includes('float-left') || classes.includes('align-left')) alignment = 'left';
          else if (classes.includes('float-right') || classes.includes('align-right')) alignment = 'right';
          else if (classes.includes('align-center') || classes.includes('align-middle')) alignment = 'center';
        }

        if (alignment) {
          imageBlock.align = alignment;
        }

        portableText.push(imageBlock);
      }
    }
  }

  return portableText;
};